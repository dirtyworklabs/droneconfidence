/**
 * Contracts shared by the browser and the Netlify Functions.
 *
 * Everything here is safe to send to a browser: no internal block reasons, no
 * Stripe secrets, and no customer data beyond what the person booking typed in
 * themselves.
 */

import type { LocationId, SessionId } from './catalog'

// Re-exported so a consumer of these contracts needs only one import.
export type { LocationId, SessionId } from './catalog'
import type { DayIso } from './time'

/** A single bookable start time. ISO 8601 instants, offset included. */
export interface AvailabilitySlot {
  /** Stable, derived from the start instant. Re-validated server-side. */
  id: string
  startsAt: string
  endsAt: string
}

/** Slots grouped by calendar day. `date` is a Sydney `YYYY-MM-DD`. */
export interface AvailabilityDay {
  date: DayIso
  slots: AvailabilitySlot[]
}

export type AvailabilityResponse =
  | { status: 'ok'; days: AvailabilityDay[]; timeZone: string }
  /** Booking is switched off by the owner. Not an error. */
  | { status: 'disabled' }
  /** Reachable, but nothing is bookable in the horizon. */
  | { status: 'empty'; timeZone: string }

export type BookingStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed'

export type PaymentState = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded' | 'failed'

/** Everything step 4 collects. Prices and durations are deliberately absent. */
export interface CheckoutRequest {
  attemptId: string
  sessionId: SessionId
  locationId: LocationId
  /** ISO instant of the chosen slot, as returned by the availability endpoint. */
  startsAt: string
  customerName: string
  email: string
  mobile: string
  /** Human-readable aircraft make and model, e.g. "DJI Mini 4 Pro". */
  droneModel: string
  /** Human-readable controller model, e.g. "DJI RC 2". */
  controllerModel: string
  experienceCode: string
  helpWith: string
  notes?: string
  policyAccepted: boolean
}

export type CheckoutResponse =
  | { status: 'ok'; url: string; reference: string }
  | {
      status: 'error'
      /** Machine-readable so the UI can react without parsing prose. */
      code:
        | 'disabled'
        | 'invalid'
        | 'slot_taken'
        | 'location_locked'
        | 'unavailable'
        | 'payment_setup_failed'
        | 'server_error'
      message: string
      /** Present for `location_locked` so the UI can name the locked area. */
      lockedLocationId?: LocationId
    }

/** The safe subset of a booking the confirmation page is allowed to render. */
export interface BookingSummary {
  reference: string
  sessionName: string
  durationMinutes: number
  locationName: string
  startsAt: string
  endsAt: string
  amountPaidCents: number
  currency: string
  email: string
  timeZone: string
}

export type ConfirmationResponse =
  | { status: 'confirmed'; booking: BookingSummary }
  /** Payment has landed but the Stripe webhook has not been processed yet. */
  | { status: 'processing' }
  | { status: 'unpaid' }
  | { status: 'expired' }
  | { status: 'not_found' }
  | { status: 'error' }

/** Owner-facing shapes. Only ever returned to a verified admin token. */
export interface AdminBookingRow {
  id: string
  reference: string
  status: BookingStatus
  paymentState: PaymentState
  sessionId: string
  sessionName: string
  durationMinutes: number
  locationId: string
  locationName: string
  startsAt: string
  endsAt: string
  customerName: string
  email: string
  priceCents: number
  amountPaidCents: number
  amountRefundedCents: number
}

export interface AdminBookingDetail extends AdminBookingRow {
  mobile: string
  droneModel: string
  /** Null on bookings taken before the controller was collected. */
  controllerModel: string | null
  experienceCode: string
  helpWith: string
  notes: string | null
  occupiedUntil: string
  timeZone: string
  holdExpiresAt: string | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  cancelledAt: string | null
  events: AdminBookingEvent[]
}

export interface AdminBookingEvent {
  id: string
  eventType: string
  detail: Record<string, unknown> | null
  actor: string | null
  createdAt: string
}

export interface AdminAvailabilityBlock {
  id: string
  startsAt: string
  endsAt: string
  locationId: LocationId | null
  reason: string
  createdAt: string
}

/** Reasons an owner can cancel. The refund share is derived from this server-side. */
export type CancellationReason =
  | 'customer_outside_24h'
  | 'customer_within_24h'
  | 'no_show'
  | 'weather_refund'
  | 'weather_reschedule'
  | 'goodwill_full_refund'

export interface CancellationOutcome {
  reason: CancellationReason
  label: string
  /** Share of the amount paid to refund, 0–1. */
  refundShare: number
}
