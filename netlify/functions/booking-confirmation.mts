/**
 * Server-verified booking confirmation.
 *
 * GET /.netlify/functions/booking-confirmation?session_id=<stripe checkout id>
 *
 * The success page asks this endpoint what really happened. Landing on
 * /booking-confirmed proves nothing on its own, so the state is read from the
 * booking row — which only the webhook can move to `confirmed`.
 *
 * When Stripe says the session is paid but the webhook has not landed yet, the
 * answer is `processing`, and the page polls. Only the fields the customer
 * already provided are returned.
 */

import type { Config, Context } from '@netlify/functions'
import type { BookingSummary, ConfirmationResponse } from '../../shared/booking/types'
import { jsonResponse, logFailure, methodNotAllowed } from '../lib/http'
import { findBookingByCheckoutSession, type BookingRow } from '../lib/store'
import { stripeClient, stripeConfigured } from '../lib/stripe'
import { ConfigurationError, bookingBackendConfigured, serviceClient } from '../lib/supabase'

const summarise = (booking: BookingRow): BookingSummary => ({
  reference: booking.reference,
  sessionName: booking.session_name,
  durationMinutes: booking.duration_minutes,
  locationName: booking.location_name,
  startsAt: booking.starts_at,
  endsAt: booking.ends_at,
  amountPaidCents: booking.amount_paid_cents,
  currency: booking.currency,
  email: booking.email,
  timeZone: booking.time_zone,
})

/** Has Stripe taken the money, whatever our own row currently says? */
const stripeSaysPaid = async (checkoutSessionId: string): Promise<boolean> => {
  if (!stripeConfigured()) return false
  try {
    const session = await stripeClient().checkout.sessions.retrieve(checkoutSessionId)
    return session.payment_status === 'paid' || session.status === 'complete'
  } catch (error) {
    logFailure('confirmation-stripe', error)
    return false
  }
}

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'GET') return methodNotAllowed('GET')

  const checkoutSessionId = new URL(request.url).searchParams.get('session_id')?.trim() ?? ''
  if (checkoutSessionId.length === 0 || checkoutSessionId.length > 200) {
    return jsonResponse({ status: 'not_found' } satisfies ConfirmationResponse, 400)
  }

  if (!bookingBackendConfigured()) {
    return jsonResponse({ status: 'error' } satisfies ConfirmationResponse, 503)
  }

  try {
    const booking = await findBookingByCheckoutSession(serviceClient(), checkoutSessionId)
    if (!booking) {
      // The row is written straight after the Checkout Session is created, so a
      // miss here is almost always a race with that write.
      return jsonResponse({ status: 'processing' } satisfies ConfirmationResponse)
    }

    if (booking.status === 'confirmed' || booking.status === 'completed') {
      return jsonResponse({
        status: 'confirmed',
        booking: summarise(booking),
      } satisfies ConfirmationResponse)
    }

    if (booking.status === 'pending_payment') {
      const paid = await stripeSaysPaid(checkoutSessionId)
      return jsonResponse({
        status: paid ? 'processing' : 'unpaid',
      } satisfies ConfirmationResponse)
    }

    if (booking.status === 'expired') {
      // A payment that lands after expiry is still honoured by the webhook, so
      // check Stripe before telling the customer their hold ran out.
      const paid = await stripeSaysPaid(checkoutSessionId)
      return jsonResponse({
        status: paid ? 'processing' : 'expired',
      } satisfies ConfirmationResponse)
    }

    return jsonResponse({ status: 'not_found' } satisfies ConfirmationResponse)
  } catch (caught) {
    if (caught instanceof ConfigurationError) {
      return jsonResponse({ status: 'error' } satisfies ConfirmationResponse, 503)
    }
    logFailure('confirmation', caught)
    return jsonResponse({ status: 'error' } satisfies ConfirmationResponse, 502)
  }
}

export const config: Config = { path: '/.netlify/functions/booking-confirmation' }
