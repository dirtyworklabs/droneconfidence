/**
 * Owner booking management.
 *
 * GET  /.netlify/functions/admin-bookings?view=upcoming|past|cancelled
 * GET  /.netlify/functions/admin-bookings?id=<uuid>
 * POST /.netlify/functions/admin-bookings  { action: 'cancel' | 'reschedule', ... }
 *
 * Every request is authorised by `requireAdmin()` before anything is read or
 * written. Refund amounts are derived from the published policy on the server;
 * the browser only names the reason.
 */

import type { Context } from '@netlify/functions'
import { findSlot } from '../../shared/booking/availability'
import { findLocation } from '../../shared/booking/catalog'
import { cancellationOutcome, isCancellationReason, isRescheduleOutcome } from '../../shared/booking/policy'
import type {
  AdminBookingDetail,
  AdminBookingEvent,
  AdminBookingRow,
  CancellationReason,
} from '../../shared/booking/types'
import { requireAdmin } from '../lib/adminAuth'
import { lookupAvailability } from '../lib/availabilityService'
import { jsonResponse, logFailure, methodNotAllowed, readJson } from '../lib/http'
import { cancellationEmail, rescheduleEmail } from '../lib/email/templates'
import { sendAlways, sendOnce } from '../lib/email/send'
import { issueRefund } from '../lib/refunds'
import { BOOKING_COLUMNS, type BookingRow, findBookingById, recordEvent } from '../lib/store'
import { ConfigurationError, serviceClient } from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const toRow = (booking: BookingRow): AdminBookingRow => ({
  id: booking.id,
  reference: booking.reference,
  status: booking.status,
  paymentState: booking.payment_state,
  sessionId: booking.session_slug,
  sessionName: booking.session_name,
  durationMinutes: booking.duration_minutes,
  locationId: booking.location_slug,
  locationName: booking.location_name,
  startsAt: booking.starts_at,
  endsAt: booking.ends_at,
  customerName: booking.customer_name,
  email: booking.email,
  priceCents: booking.price_cents,
  amountPaidCents: booking.amount_paid_cents,
  amountRefundedCents: booking.amount_refunded_cents,
})

const toDetail = (booking: BookingRow, events: AdminBookingEvent[]): AdminBookingDetail => ({
  ...toRow(booking),
  mobile: booking.mobile,
  droneModel: booking.drone_model,
  experienceCode: booking.experience_code,
  helpWith: booking.help_with,
  notes: booking.notes,
  occupiedUntil: booking.occupied_until,
  timeZone: booking.time_zone,
  holdExpiresAt: booking.hold_expires_at,
  stripeCheckoutSessionId: booking.stripe_checkout_session_id,
  stripePaymentIntentId: booking.stripe_payment_intent_id,
  cancellationReason: booking.cancellation_reason,
  createdAt: booking.created_at,
  updatedAt: booking.updated_at,
  confirmedAt: booking.confirmed_at,
  cancelledAt: booking.cancelled_at,
  events,
})

const listBookings = async (client: SupabaseClient, view: string): Promise<AdminBookingRow[]> => {
  const nowIso = new Date().toISOString()
  let query = client.from('bookings').select(BOOKING_COLUMNS)

  if (view === 'cancelled') {
    query = query.in('status', ['cancelled', 'expired']).order('starts_at', { ascending: false }).limit(200)
  } else if (view === 'past') {
    query = query
      .in('status', ['confirmed', 'completed'])
      .lt('starts_at', nowIso)
      .order('starts_at', { ascending: false })
      .limit(200)
  } else {
    // Upcoming includes live holds so the owner can see a slot being taken now.
    query = query
      .in('status', ['confirmed', 'completed', 'pending_payment'])
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(200)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as unknown as BookingRow[]
  // A pending hold that has already lapsed is noise, not an upcoming booking.
  return rows.filter((row) => row.status !== 'pending_payment' || row.is_active).map(toRow)
}

const loadEvents = async (client: SupabaseClient, bookingId: string): Promise<AdminBookingEvent[]> => {
  const { data, error } = await client
    .from('booking_events')
    .select('id, event_type, detail, actor, created_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const entry = row as {
      id: string
      event_type: string
      detail: Record<string, unknown> | null
      actor: string | null
      created_at: string
    }
    return {
      id: entry.id,
      eventType: entry.event_type,
      detail: entry.detail,
      actor: entry.actor,
      createdAt: entry.created_at,
    }
  })
}

const cancelBooking = async (
  client: SupabaseClient,
  booking: BookingRow,
  reason: CancellationReason,
  actor: string,
): Promise<Response> => {
  if (booking.status === 'cancelled') {
    return jsonResponse({ status: 'error', message: 'That booking is already cancelled.' }, 409)
  }
  if (isRescheduleOutcome(reason)) {
    return jsonResponse(
      {
        status: 'error',
        message: 'Use Reschedule for a weather change that keeps the booking. Cancelling is a separate action.',
      },
      400,
    )
  }

  const now = new Date()
  // The refund is computed from the booking's own start time and the amount
  // actually paid — never from anything the browser sent.
  const refund = await issueRefund(client, booking, reason, now)

  const { error } = await client
    .from('bookings')
    .update({
      status: 'cancelled',
      is_active: false,
      hold_expires_at: null,
      cancellation_reason: reason,
      cancelled_at: now.toISOString(),
    })
    .eq('id', booking.id)
  if (error) throw new Error(error.message)

  await recordEvent(
    client,
    booking.id,
    'cancelled',
    { reason, refunded_cents: refund.refundedCents, refund_id: refund.refundId },
    actor,
  )

  const updated = (await findBookingById(client, booking.id)) ?? booking
  const email = await sendOnce(
    client,
    booking.id,
    'cancellation',
    booking.email,
    cancellationEmail(updated, reason, refund.refundedCents),
  )

  return jsonResponse({
    status: 'ok',
    refundedCents: refund.refundedCents,
    refundShare: cancellationOutcome(reason).refundShare,
    emailSent: email.sent,
    problem: refund.problem,
  })
}

const rescheduleBooking = async (
  client: SupabaseClient,
  booking: BookingRow,
  startsAtIso: string,
  locationId: string | null,
  actor: string,
): Promise<Response> => {
  if (booking.status !== 'confirmed') {
    return jsonResponse({ status: 'error', message: 'Only a confirmed booking can be moved.' }, 409)
  }

  const location = findLocation(locationId ?? booking.location_slug)
  if (!location) {
    return jsonResponse({ status: 'error', message: 'Unknown training area.' }, 400)
  }

  // The new time is validated against the same engine the public flow uses, with
  // the customer notice period waived and this booking excluded from occupancy.
  const availability = await lookupAvailability(client, {
    sessionDurationMinutes: booking.duration_minutes,
    locationId: location.id,
    waiveNotice: true,
    excludeBookingId: booking.id,
  })
  if (availability.status !== 'ok') {
    return jsonResponse({ status: 'error', message: 'Availability is unavailable right now.' }, 503)
  }

  const slot = findSlot(availability.days, startsAtIso)
  if (!slot) {
    return jsonResponse({ status: 'error', message: 'That time is not available.' }, 409)
  }

  const startsAt = new Date(slot.startsAt)
  const endsAt = new Date(slot.endsAt)
  const occupiedUntil = new Date(endsAt.getTime() + availability.settings.bufferMinutes * 60000)
  const previousStartsAt = new Date(booking.starts_at)

  const { data, error } = await client.rpc('reschedule_booking', {
    p_booking_id: booking.id,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt.toISOString(),
    p_occupied_until: occupiedUntil.toISOString(),
    p_location_slug: location.id,
    p_location_name: location.name,
    p_grace_minutes: availability.settings.holdGraceMinutes,
    p_actor: actor,
  })
  if (error) throw new Error(error.message)

  const result = (Array.isArray(data) ? data[0] : data) as { outcome: string } | undefined
  const outcome = result?.outcome ?? 'unknown'

  if (outcome === 'location_locked') {
    return jsonResponse(
      {
        status: 'error',
        message: 'That date is already committed to the other training area.',
      },
      409,
    )
  }
  if (outcome !== 'rescheduled') {
    return jsonResponse({ status: 'error', message: 'That time was taken while you were moving the booking.' }, 409)
  }

  const updated = (await findBookingById(client, booking.id)) ?? booking
  // A booking can legitimately be moved more than once, so this message is not
  // covered by the one-per-booking idempotency record.
  const email = await sendAlways(updated.email, rescheduleEmail(updated, previousStartsAt))

  return jsonResponse({ status: 'ok', startsAt: updated.starts_at, emailSent: email.sent })
}

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'POST') return methodNotAllowed('GET, POST')

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const client = serviceClient()

    if (request.method === 'GET') {
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      if (id) {
        const booking = await findBookingById(client, id)
        if (!booking) return jsonResponse({ status: 'error', message: 'Not found.' }, 404)
        const events = await loadEvents(client, booking.id)
        return jsonResponse({ status: 'ok', booking: toDetail(booking, events) })
      }
      const view = url.searchParams.get('view') ?? 'upcoming'
      return jsonResponse({ status: 'ok', view, bookings: await listBookings(client, view) })
    }

    const body = await readJson<Record<string, unknown>>(request)
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId : ''
    const booking = bookingId ? await findBookingById(client, bookingId) : null
    if (!booking) return jsonResponse({ status: 'error', message: 'Not found.' }, 404)

    if (body?.action === 'cancel') {
      const reason = typeof body.reason === 'string' ? body.reason : ''
      if (!isCancellationReason(reason)) {
        return jsonResponse({ status: 'error', message: 'Choose a cancellation reason.' }, 400)
      }
      return await cancelBooking(client, booking, reason, auth.identity.email)
    }

    if (body?.action === 'reschedule') {
      const startsAt = typeof body.startsAt === 'string' ? body.startsAt : ''
      const locationId = typeof body.locationId === 'string' ? body.locationId : null
      if (startsAt.length === 0) {
        return jsonResponse({ status: 'error', message: 'Choose a new time.' }, 400)
      }
      return await rescheduleBooking(client, booking, startsAt, locationId, auth.identity.email)
    }

    return jsonResponse({ status: 'error', message: 'Unknown action.' }, 400)
  } catch (caught) {
    if (caught instanceof ConfigurationError) {
      return jsonResponse({ status: 'error', message: 'The booking backend is not configured.' }, 503)
    }
    logFailure('admin-bookings', caught)
    return jsonResponse({ status: 'error', message: 'Something went wrong.' }, 500)
  }
}
