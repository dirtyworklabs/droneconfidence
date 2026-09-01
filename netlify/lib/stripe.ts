/**
 * Stripe access, confined to the server.
 *
 * The secret key never leaves this process and the application never sees a
 * card number: customers are sent to Stripe's hosted Checkout page, and Stripe
 * tells us what happened through the signed webhook.
 */

import Stripe from 'stripe'
import { ENV_NAMES, env } from './env'
import { ConfigurationError } from './supabase'

let cached: Stripe | null = null

export const stripeClient = (): Stripe => {
  if (cached) return cached
  const key = env(ENV_NAMES.stripeSecret)
  if (key.length === 0) throw new ConfigurationError([ENV_NAMES.stripeSecret])
  cached = new Stripe(key, { maxNetworkRetries: 2 })
  return cached
}

export const stripeConfigured = (): boolean => env(ENV_NAMES.stripeSecret).length > 0

export interface CheckoutParams {
  bookingId: string
  reference: string
  attemptId: string
  sessionName: string
  durationMinutes: number
  locationName: string
  priceCents: number
  email: string
  /** Local session start, already formatted for display. */
  startsAtLabel: string
  /** Absolute expiry of the slot hold. Stripe requires at least 30 minutes. */
  expiresAt: Date
  origin: string
}

/**
 * Creates a hosted Checkout Session for one lesson.
 *
 * The line item is built from `price_data` on the fly — there are no Stripe
 * Product or Price objects to keep in step with `SESSION_CATALOG`, and the
 * amount comes from the catalogue rather than the request body.
 *
 * Only the identifiers needed to reconcile a payment go into metadata. Customer
 * notes, phone number and drone details stay in Supabase.
 */
export const createCheckoutSession = async (params: CheckoutParams): Promise<Stripe.Checkout.Session> => {
  const stripe = stripeClient()

  return stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: params.email,
      client_reference_id: params.reference,
      // Stripe expires the session at the same instant the database hold does,
      // so an abandoned checkout releases the slot rather than holding it open.
      expires_at: Math.floor(params.expiresAt.getTime() / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: params.priceCents,
            product_data: {
              name: `${params.sessionName} — private drone lesson`,
              description: `${params.durationMinutes} minutes · ${params.locationName} · ${params.startsAtLabel}`,
            },
          },
        },
      ],
      metadata: {
        booking_id: params.bookingId,
        booking_reference: params.reference,
        attempt_id: params.attemptId,
      },
      payment_intent_data: {
        metadata: {
          booking_id: params.bookingId,
          booking_reference: params.reference,
        },
      },
      success_url: `${params.origin}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${params.origin}/book?checkout=cancelled`,
    },
    // Keyed on the browser's attempt id, so a double-submitted form or a retried
    // request returns the same Checkout Session instead of charging twice.
    { idempotencyKey: `checkout:${params.attemptId}` },
  )
}

/** Verifies a webhook signature against the raw request body. */
export const constructWebhookEvent = (rawBody: string, signature: string, secret: string): Stripe.Event =>
  stripeClient().webhooks.constructEvent(rawBody, signature, secret)
