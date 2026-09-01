import { describe, expect, it } from 'vitest'
import { CANCELLATION_OUTCOMES, isCancellationReason, isRescheduleOutcome, refundCents } from '@shared/booking/policy'

const PAID = 17900
const START = new Date('2026-10-06T21:00:00Z')

const refund = (reason: Parameters<typeof refundCents>[0]['reason'], hoursBefore: number, refunded = 0) =>
  refundCents({
    reason,
    startsAt: START,
    now: new Date(START.getTime() - hoursBefore * 3600_000),
    amountPaidCents: PAID,
    amountRefundedCents: refunded,
  })

describe('cancellation policy', () => {
  it('refunds a customer cancellation in full outside 24 hours', () => {
    expect(refund('customer_outside_24h', 48)).toBe(PAID)
  })

  it('refunds half within 24 hours, whichever reason the owner picked', () => {
    expect(refund('customer_within_24h', 6)).toBe(PAID / 2)
    // The boundary is measured from the booking's own start time, so choosing the
    // "outside" reason 6 hours out still applies the 50% rule.
    expect(refund('customer_outside_24h', 6)).toBe(PAID / 2)
  })

  it('treats exactly 24 hours as inside the window', () => {
    expect(refund('customer_outside_24h', 24)).toBe(PAID / 2)
    expect(refund('customer_outside_24h', 24.5)).toBe(PAID)
  })

  it('refunds half for a no-show and everything for weather or goodwill', () => {
    expect(refund('no_show', 0)).toBe(PAID / 2)
    expect(refund('weather_refund', 2)).toBe(PAID)
    expect(refund('goodwill_full_refund', 2)).toBe(PAID)
  })

  it('refunds nothing when the weather outcome is a reschedule', () => {
    expect(refund('weather_reschedule', 2)).toBe(0)
    expect(isRescheduleOutcome('weather_reschedule')).toBe(true)
    expect(isRescheduleOutcome('no_show')).toBe(false)
  })

  it('subtracts what has already been refunded so nothing is paid back twice', () => {
    expect(refund('weather_refund', 48, PAID)).toBe(0)
    expect(refund('weather_refund', 48, 5000)).toBe(PAID - 5000)
    // A partial refund followed by a smaller entitlement never goes negative.
    expect(refund('no_show', 1, PAID)).toBe(0)
  })

  it('refunds nothing on an unpaid booking', () => {
    expect(
      refundCents({
        reason: 'goodwill_full_refund',
        startsAt: START,
        now: new Date(),
        amountPaidCents: 0,
        amountRefundedCents: 0,
      }),
    ).toBe(0)
  })

  it('only accepts the published reasons', () => {
    for (const outcome of CANCELLATION_OUTCOMES) {
      expect(isCancellationReason(outcome.reason)).toBe(true)
    }
    expect(isCancellationReason('full_refund_please')).toBe(false)
    expect(isCancellationReason('')).toBe(false)
  })
})
