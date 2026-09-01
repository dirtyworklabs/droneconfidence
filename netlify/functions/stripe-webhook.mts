/**
 * Stripe webhook — the only authority on payment.
 *
 * POST /.netlify/functions/stripe-webhook
 *
 * A booking becomes `confirmed` here and nowhere else. The browser returning from
 * Checkout is a hint, not proof. Every event is verified against the raw request
 * body and claimed by id before it is processed, so redelivery is safe.
 *
 * Handled events:
 *   checkout.session.completed  → confirm the booking, send the emails
 *   checkout.session.expired    → release the hold
 *   charge.refunded             → record a refund made in the Stripe dashboard
 */

import type { Config, Context } from '@netlify/functions'
import type Stripe from 'stripe'
import { ENV_NAMES, env, siteOrigin } from '../lib/env'
import { jsonResponse, logFailure, methodNotAllowed } from '../lib/http'
import { confirmationEmail, ownerNotificationEmail } from '../lib/email/templates'
import { ownerAddress, sendOnce } from '../lib/email/send'
import {
  claimStripeEvent,
  findBookingByCheckoutSession,
  findBookingById,
  recordEvent,
} from '../lib/store'
import { constructWebhookEvent } from '../lib/stripe'
import { ConfigurationError, bookingBackendConfigured, serviceClient } from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Stripe expects 2xx for anything it should stop retrying. */
const acknowledge = (note: string): Response => jsonResponse({ received: true, note })

const bookingIdFrom = (session: Stripe.Checkout.Session): string | null => {
  const value = session.metadata?.booking_id
  return typeof value === 'string' && value.length > 0 ? value : null
}

const paymentIntentId = (session: Stripe.Checkout.Session): string | null => {
  const intent = session.payment_intent
  if (typeof intent === 'string') return intent
  return intent?.id ?? null
}

const handleCompleted = async (
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const bookingId = bookingIdFrom(session)
  const booking = bookingId
    ? await findBookingById(client, bookingId)
    : await findBookingByCheckoutSession(client, session.id)

  if (!booking) {
    logFailure('webhook-completed', new Error('no booking matched the checkout session'))
    return
  }

  const { data, error } = await client.rpc('confirm_booking_payment', {
    p_booking_id: booking.id,
    p_payment_intent_id: paymentIntentId(session),
    p_amount_paid_cents: session.amount_total ?? booking.price_cents,
    p_currency: (session.currency ?? booking.currency).toLowerCase(),
  })
  if (error) throw new Error(error.message)

  const result = (Array.isArray(data) ? data[0] : data) as { outcome: string } | undefined
  const outcome = result?.outcome ?? 'unknown'

  if (outcome === 'conflict') {
    // The hold lapsed and the slot was taken in the meantime. The payment is real,
    // so it is flagged for the owner to refund or rebook rather than silently lost.
    await recordEvent(client, booking.id, 'payment_conflict', { checkout_session: session.id }, 'stripe')
    logFailure('webhook-completed', new Error(`slot conflict after payment for ${booking.reference}`))
    return
  }
  if (outcome === 'already_confirmed') return

  // Re-read so the emails quote the amount actually paid, not the quoted price.
  const confirmed = (await findBookingById(client, booking.id)) ?? booking

  // Email is best-effort: a delivery failure must never undo a paid booking.
  const customer = await sendOnce(
    client,
    confirmed.id,
    'customer_confirmation',
    confirmed.email,
    confirmationEmail(confirmed),
  )
  if (customer.skipped) {
    logFailure('webhook-email-customer', new Error(customer.skipped))
  }

  const owner = ownerAddress()
  if (owner.length > 0) {
    const notified = await sendOnce(
      client,
      confirmed.id,
      'owner_notification',
      owner,
      ownerNotificationEmail(confirmed, `${siteOrigin()}/admin`),
    )
    if (notified.skipped) logFailure('webhook-email-owner', new Error(notified.skipped))
  }
}

const handleExpired = async (
  client: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const bookingId = bookingIdFrom(session)
  const booking = bookingId
    ? await findBookingById(client, bookingId)
    : await findBookingByCheckoutSession(client, session.id)
  if (!booking) return

  // Only an unpaid hold is released. A booking that was paid moments before the
  // expiry event is left alone — the grace window in the reservation logic exists
  // for exactly this overlap.
  if (booking.status !== 'pending_payment') return

  const { error } = await client
    .from('bookings')
    .update({ status: 'expired', is_active: false, hold_expires_at: null })
    .eq('id', booking.id)
    .eq('status', 'pending_payment')
  if (error) throw new Error(error.message)

  await recordEvent(client, booking.id, 'hold_released', { cause: 'checkout_expired' }, 'stripe')
}

const handleChargeRefunded = async (client: SupabaseClient, charge: Stripe.Charge): Promise<void> => {
  const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  const bookingId = charge.metadata?.booking_id
  const booking = bookingId
    ? await findBookingById(client, bookingId)
    : intentId
      ? await (async () => {
          const { data } = await client
            .from('bookings')
            .select('id')
            .eq('stripe_payment_intent_id', intentId)
            .maybeSingle()
          const row = data as { id: string } | null
          return row ? findBookingById(client, row.id) : null
        })()
      : null
  if (!booking) return

  const refunded = charge.amount_refunded ?? 0
  if (refunded <= booking.amount_refunded_cents) return

  const { error } = await client
    .from('bookings')
    .update({
      amount_refunded_cents: refunded,
      payment_state: refunded >= booking.amount_paid_cents ? 'refunded' : 'partially_refunded',
    })
    .eq('id', booking.id)
  if (error) throw new Error(error.message)

  await recordEvent(client, booking.id, 'refund_recorded', { amount_refunded_cents: refunded }, 'stripe')
}

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'POST') return methodNotAllowed('POST')

  const secret = env(ENV_NAMES.stripeWebhookSecret)
  const signature = request.headers.get('stripe-signature')
  if (secret.length === 0 || !bookingBackendConfigured()) {
    logFailure('webhook', new Error('webhook is not configured'))
    return jsonResponse({ received: false }, 503)
  }
  if (!signature) return jsonResponse({ received: false }, 400)

  // Signature verification needs the body exactly as sent — no JSON parsing first.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature, secret)
  } catch (caught) {
    logFailure('webhook-signature', caught)
    return jsonResponse({ received: false }, 400)
  }

  try {
    const client = serviceClient()

    // Claiming the event id is the idempotency guard: a redelivery of an event we
    // have already processed is acknowledged and dropped.
    const fresh = await claimStripeEvent(client, event.id, event.type)
    if (!fresh) return acknowledge('duplicate')

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCompleted(client, event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleExpired(client, event.data.object as Stripe.Checkout.Session)
        break
      case 'charge.refunded':
        await handleChargeRefunded(client, event.data.object as Stripe.Charge)
        break
      default:
        return acknowledge('ignored')
    }

    return acknowledge('processed')
  } catch (caught) {
    if (caught instanceof ConfigurationError) return jsonResponse({ received: false }, 503)
    // A 500 asks Stripe to retry. The event id is released so the retry can run.
    logFailure('webhook-handler', caught)
    try {
      await serviceClient().from('stripe_events').delete().eq('id', event.id)
    } catch (cleanup) {
      logFailure('webhook-cleanup', cleanup)
    }
    return jsonResponse({ received: false }, 500)
  }
}

export const config: Config = { path: '/.netlify/functions/stripe-webhook' }
