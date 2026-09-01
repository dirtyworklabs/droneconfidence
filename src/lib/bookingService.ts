/**
 * Booking service boundary.
 *
 * This is the seam the real booking implementation plugs into. The public UI at
 * /book is finished; the machinery that supplies availability, reserves a slot,
 * takes payment and returns a confirmation is a separate implementation step.
 *
 * Nothing in this file invents availability, slots, prices, customers or
 * confirmations, and nothing here is allowed to leak developer language into
 * production copy.
 *
 * What the next implementation should do:
 *
 *  1. Implement a `BookingService` (a provider API behind a Netlify function, or
 *     a first-party calendar) and return it from `getBookingService()`.
 *  2. Add a `{ kind: 'service' }` case to `AvailabilitySource` and render a slot
 *     picker for it in `src/components/booking/BookingAvailability.tsx`.
 *  3. Extend the flow with the details and payment steps (steps 4 of the
 *     progress indicator) using the same `BookingSelection` state.
 *
 * No other part of /book, and no marketing page, needs to change to do that.
 */

import { bookingIntegration, resolveHandoffTarget } from '@/config/booking'
import type { ExternalBookingTarget, LocationId, SessionId } from '@/types'

/** A single bookable start time. ISO 8601 strings including the offset. */
export interface AvailabilitySlot {
  id: string
  startsAt: string
  endsAt: string
}

/** Slots grouped by calendar day. `date` is an ISO date in Australia/Sydney. */
export interface AvailabilityDay {
  date: string
  slots: AvailabilitySlot[]
}

/** Everything the availability lookup needs, all of it non-personal. */
export interface AvailabilityQuery {
  sessionId: SessionId
  locationId: LocationId
  /** ISO date to search from. Defaults to the provider's earliest notice. */
  fromDate?: string
}

export type AvailabilityResult =
  | { status: 'ok'; days: AvailabilityDay[] }
  | { status: 'unavailable' }

/** The slot a customer intends to book. Created only by the future flow. */
export interface BookingDraft extends AvailabilityQuery {
  slotId: string
}

/**
 * Contract for the future integration. Implementations must never be called
 * with customer details from the URL, and must not be given card data — payment
 * is redirected to, or hosted by, the payment provider.
 */
export interface BookingService {
  readonly id: string
  fetchAvailability(query: AvailabilityQuery): Promise<AvailabilityResult>
  /** Reserve the slot and start hosted checkout. Added by the next task. */
  startCheckout?(draft: BookingDraft): Promise<{ redirectUrl: string }>
}

/**
 * No booking service is registered yet. Returning null is the safe state: the
 * availability step renders an operational fallback rather than a dead button.
 */
export const getBookingService = (): BookingService | null => null

/**
 * What the availability step should render for the current selection.
 *
 * 'embed' and 'handoff' are real provider integrations, used only when a usable
 * absolute URL is configured. 'unavailable' is the safe default.
 */
export type AvailabilitySource =
  | { kind: 'embed'; url: string }
  | { kind: 'handoff'; target: ExternalBookingTarget }
  | { kind: 'unavailable' }

export const resolveAvailabilitySource = (query: AvailabilityQuery): AvailabilitySource => {
  if (bookingIntegration.mode === 'embed' && bookingIntegration.embedUrl.length > 0) {
    return { kind: 'embed', url: bookingIntegration.embedUrl }
  }

  const target = resolveHandoffTarget(query.sessionId)
  if (target) return { kind: 'handoff', target }

  return { kind: 'unavailable' }
}
