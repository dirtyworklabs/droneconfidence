/**
 * Reserve a slot, then start Stripe Checkout.
 *
 * POST /.netlify/functions/booking-checkout
 *
 * The order matters. The database reserves the slot first — atomically, with the
 * same-day training-area rule applied inside the transaction — and only then is a
 * Stripe Checkout Session created. A customer therefore never pays for a slot
 * somebody else already holds.
 *
 * Nothing about the price, the duration or the session name is read from the
 * request body; all three come from the catalogue.
 */

import type { Context } from '@netlify/functions'
import { formatDateTime } from '../../shared/booking/format'
import { findSlot } from '../../shared/booking/availability'
import { type LocationId, sessionPriceCents } from '../../shared/booking/catalog'
import type { CheckoutResponse } from '../../shared/booking/types'
import { lookupAvailability } from '../lib/availabilityService'
import { publicBookingAllowed } from '../lib/bookingAccess'
import { validateCheckoutRequest } from '../lib/bookingInput'
import { siteOrigin } from '../lib/env'
import { jsonResponse, logFailure, methodNotAllowed, readJson } from '../lib/http'
import { recordEvent } from '../lib/store'
import { createCheckoutSession, stripeConfigured } from '../lib/stripe'
import { ConfigurationError, bookingBackendConfigured, serviceClient } from '../lib/supabase'

type CheckoutErrorCode = Extract<CheckoutResponse, { status: 'error' }>['code']

const error = (
  code: CheckoutErrorCode,
  message: string,
  status: number,
  lockedLocationId?: LocationId,
): Response =>
  jsonResponse({ status: 'error', code, message, ...(lockedLocationId ? { lockedLocationId } : {}) }, status)

/** `location_locked:<slug>` from the reservation function. */
const lockedArea = (message: string): LocationId | undefined => {
  const match = /location_locked:([a-z-]+)/.exec(message)
  return match ? (match[1] as LocationId) : undefined
}

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'POST') return methodNotAllowed('POST')

  if (!bookingBackendConfigured() || !stripeConfigured()) {
    return error('disabled', 'Online booking is temporarily unavailable.', 503)
  }

  const body = await readJson<unknown>(request)
  const validated = validateCheckoutRequest(body)
  if (!validated.ok) {
    return error('invalid', validated.problems[0] ?? 'Please check the details you entered.', 400)
  }
  const input = validated.value

  const client = serviceClient()

  try {
    // The chosen slot is re-derived from authoritative availability. A start time
    // that is no longer offered — outside hours, inside the notice period, taken,
    // or on a day locked to the other area — is rejected before any charge.
    const availability = await lookupAvailability(client, {
      sessionDurationMinutes: input.session.durationMinutes,
      locationId: input.location.id,
    })

    if (availability.status !== 'ok') {
      return error('disabled', 'Online booking is temporarily unavailable.', 503)
    }

    // Defence in depth: the same decision, re-derived from the settings row here
    // rather than inferred from the availability lookup having succeeded. A
    // direct POST to this function cannot reserve a hold or create a Checkout
    // Session while public booking is closed.
    if (!publicBookingAllowed(availability.settings.bookingEnabled)) {
      return error('disabled', 'Online booking is temporarily unavailable.', 503)
    }

    const slot = findSlot(availability.days, input.startsAt.toISOString())
    if (!slot) {
      return error('unavailable', 'That time is no longer available. Please choose another.', 409)
    }

    const settings = availability.settings
    const startsAt = new Date(slot.startsAt)
    const endsAt = new Date(slot.endsAt)
    const occupiedUntil = new Date(endsAt.getTime() + settings.bufferMinutes * 60000)
    const priceCents = sessionPriceCents(input.session)

    const { data, error: rpcError } = await client.rpc('reserve_booking_hold', {
      p_attempt_id: input.attemptId,
      p_session_slug: input.session.id,
      p_session_name: input.session.name,
      p_duration_minutes: input.session.durationMinutes,
      p_price_cents: priceCents,
      p_location_slug: input.location.id,
      p_location_name: input.location.name,
      p_starts_at: startsAt.toISOString(),
      p_ends_at: endsAt.toISOString(),
      p_occupied_until: occupiedUntil.toISOString(),
      p_time_zone: settings.timeZone,
      p_customer_name: input.customerName,
      p_email: input.email,
      p_mobile: input.mobile,
      p_drone_model: input.droneModel,
      p_experience_code: input.experienceCode,
      p_help_with: input.helpWith,
      p_notes: input.notes,
      p_hold_minutes: settings.checkoutHoldMinutes,
      p_grace_minutes: settings.holdGraceMinutes,
    })

    if (rpcError) {
      const message = rpcError.message ?? ''
      const locked = lockedArea(message)
      if (locked) {
        return error(
          'location_locked',
          'Another lesson is already booked in the other training area on that date. Please choose a different date, or the same area.',
          409,
          locked,
        )
      }
      if (message.includes('slot_taken')) {
        return error('slot_taken', 'That time has just been taken. Please choose another.', 409)
      }
      throw new Error(message)
    }

    const reserved = (Array.isArray(data) ? data[0] : data) as
      | { booking_id: string; reference: string }
      | undefined
    if (!reserved) throw new Error('reservation returned no row')

    // Stripe's session must not outlive the database hold, and Stripe requires at
    // least 30 minutes, which `checkout_hold_minutes` is constrained to respect.
    const expiresAt = new Date(Date.now() + settings.checkoutHoldMinutes * 60000)

    let checkoutUrl: string | null = null
    try {
      const checkout = await createCheckoutSession({
        bookingId: reserved.booking_id,
        reference: reserved.reference,
        attemptId: input.attemptId,
        sessionName: input.session.name,
        durationMinutes: input.session.durationMinutes,
        locationName: input.location.name,
        priceCents,
        email: input.email,
        startsAtLabel: formatDateTime(startsAt, settings.timeZone),
        expiresAt,
        origin: siteOrigin(),
      })
      checkoutUrl = checkout.url ?? null

      await client
        .from('bookings')
        .update({ stripe_checkout_session_id: checkout.id })
        .eq('id', reserved.booking_id)
    } catch (stripeError) {
      logFailure('checkout-stripe', stripeError)
      // Release the hold immediately rather than leaving the slot blocked for the
      // full window because our payment setup failed.
      await client
        .from('bookings')
        .update({ status: 'expired', is_active: false, hold_expires_at: null })
        .eq('id', reserved.booking_id)
        .eq('status', 'pending_payment')
      await recordEvent(client, reserved.booking_id, 'hold_released', { cause: 'payment_setup_failed' }, 'system')

      return error(
        'payment_setup_failed',
        'We could not start the secure payment page. Please try again in a moment.',
        502,
      )
    }

    if (!checkoutUrl) {
      return error(
        'payment_setup_failed',
        'We could not start the secure payment page. Please try again in a moment.',
        502,
      )
    }

    return jsonResponse({
      status: 'ok',
      url: checkoutUrl,
      reference: reserved.reference,
    } satisfies CheckoutResponse)
  } catch (caught) {
    if (caught instanceof ConfigurationError) {
      return error('disabled', 'Online booking is temporarily unavailable.', 503)
    }
    logFailure('checkout', caught)
    return error('server_error', 'Something went wrong starting your booking. Please try again.', 500)
  }
}
