/**
 * Refunds, derived from the published policy.
 *
 * The browser sends a cancellation *reason*; the amount is always computed here
 * from the booking's own start time, the amount actually paid and what has
 * already been refunded. A refund amount from a client is never used.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { refundCents } from '../../shared/booking/policy'
import type { CancellationReason } from '../../shared/booking/types'
import { logFailure } from './http'
import type { BookingRow } from './store'
import { stripeClient } from './stripe'

export interface RefundResult {
  refundedCents: number
  refundId: string | null
  /** True when nothing needed refunding (unpaid, zero share, already refunded). */
  skipped: boolean
  /** Set when Stripe declined; the cancellation still proceeds. */
  problem: string | null
}

export const issueRefund = async (
  client: SupabaseClient,
  booking: BookingRow,
  reason: CancellationReason,
  now: Date,
): Promise<RefundResult> => {
  const amount = refundCents({
    reason,
    startsAt: new Date(booking.starts_at),
    now,
    amountPaidCents: booking.amount_paid_cents,
    amountRefundedCents: booking.amount_refunded_cents,
  })

  if (amount <= 0 || !booking.stripe_payment_intent_id) {
    return { refundedCents: 0, refundId: null, skipped: true, problem: null }
  }

  try {
    const refund = await stripeClient().refunds.create(
      {
        payment_intent: booking.stripe_payment_intent_id,
        amount,
        metadata: { booking_id: booking.id, booking_reference: booking.reference, reason },
      },
      // One refund per booking per reason, however many times the button is
      // pressed or the request is retried.
      { idempotencyKey: `refund:${booking.id}:${reason}` },
    )

    const total = booking.amount_refunded_cents + amount
    const { error } = await client
      .from('bookings')
      .update({
        amount_refunded_cents: total,
        stripe_refund_id: refund.id,
        payment_state: total >= booking.amount_paid_cents ? 'refunded' : 'partially_refunded',
      })
      .eq('id', booking.id)
    if (error) throw new Error(error.message)

    return { refundedCents: amount, refundId: refund.id, skipped: false, problem: null }
  } catch (error) {
    // A failed refund must not leave the booking half-cancelled: the caller
    // completes the cancellation and surfaces this so the owner can retry in
    // the Stripe dashboard.
    logFailure('refund', error)
    return {
      refundedCents: 0,
      refundId: null,
      skipped: false,
      problem: 'The booking was cancelled, but the refund could not be sent to Stripe. Check the Stripe dashboard.',
    }
  }
}
