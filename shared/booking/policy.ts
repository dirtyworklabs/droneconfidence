/**
 * The published Booking & Cancellation Policy, expressed as data.
 *
 * The wording on /booking-policy is the source of truth for customers; these
 * shares are the same rules in a form the refund code can apply. The amount is
 * always derived on the server from the booking's start time and the reason the
 * owner selects — a refund figure is never accepted from a browser.
 */

import type { CancellationOutcome, CancellationReason } from './types'

export const CANCELLATION_OUTCOMES: readonly CancellationOutcome[] = [
  {
    reason: 'customer_outside_24h',
    label: 'Customer cancelled more than 24 hours before',
    refundShare: 1,
  },
  {
    reason: 'customer_within_24h',
    label: 'Customer cancelled within 24 hours',
    refundShare: 0.5,
  },
  { reason: 'no_show', label: 'No-show', refundShare: 0.5 },
  {
    reason: 'weather_refund',
    label: 'Weather or unsuitable conditions — full refund',
    refundShare: 1,
  },
  {
    reason: 'weather_reschedule',
    label: 'Weather or unsuitable conditions — reschedule instead, no refund now',
    refundShare: 0,
  },
  { reason: 'goodwill_full_refund', label: 'Drone Confidence cancelled — full refund', refundShare: 1 },
]

export const isCancellationReason = (value: string): value is CancellationReason =>
  CANCELLATION_OUTCOMES.some((outcome) => outcome.reason === value)

/**
 * The friendly label for a stored cancellation reason.
 *
 * `bookings.cancellation_reason` keeps the identifier; no surface shows it. A
 * value that is no longer in the list (an older row, a retired reason) is
 * humanised rather than dropped, so the record still reads as something.
 */
export const cancellationReasonLabel = (reason: string): string =>
  CANCELLATION_OUTCOMES.find((outcome) => outcome.reason === reason)?.label ??
  reason.replace(/_/g, ' ').replace(/^./, (first) => first.toUpperCase())

export const cancellationOutcome = (reason: CancellationReason): CancellationOutcome => {
  const match = CANCELLATION_OUTCOMES.find((outcome) => outcome.reason === reason)
  if (!match) throw new Error(`Unknown cancellation reason: ${reason}`)
  return match
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Refund in cents for a cancellation.
 *
 * Customer-initiated cancellations are graded by how close the session is, and
 * the 24-hour boundary is measured from the booking's own start instant rather
 * than anything the browser sends. Whatever has already been refunded is
 * subtracted, so repeating an action cannot refund twice.
 */
export const refundCents = (input: {
  reason: CancellationReason
  startsAt: Date
  now: Date
  amountPaidCents: number
  amountRefundedCents: number
}): number => {
  const { refundShare } = cancellationOutcome(input.reason)

  const share =
    input.reason === 'customer_outside_24h' || input.reason === 'customer_within_24h'
      ? input.startsAt.getTime() - input.now.getTime() > DAY_MS
        ? 1
        : 0.5
      : refundShare

  const target = Math.round(input.amountPaidCents * share)
  return Math.max(0, Math.min(target, input.amountPaidCents) - input.amountRefundedCents)
}

/** Whether the outcome is a reschedule rather than a cancellation. */
export const isRescheduleOutcome = (reason: CancellationReason): boolean =>
  reason === 'weather_reschedule'
