import { describe, expect, it } from 'vitest'
import {
  cancelFlowStep,
  cancellationPreview,
  type CancelStage,
} from '@shared/booking/cancellationConfirm'
import { CANCELLATION_OUTCOMES, cancellationReasonLabel } from '@shared/booking/policy'

const PAID = 17900
const START = new Date('2026-10-06T21:00:00Z')

/** Replays a sequence of events the way the panel does, one click at a time. */
const replay = (events: Parameters<typeof cancelFlowStep>[1][]) => {
  let stage: CancelStage = 'idle'
  let submits = 0
  for (const event of events) {
    const next = cancelFlowStep(stage, event)
    stage = next.stage
    if (next.submit) submits += 1
  }
  return { stage, submits }
}

describe('cancellation confirmation flow', () => {
  it('opens the dialog on the first press and sends nothing', () => {
    expect(replay(['request'])).toEqual({ stage: 'confirming', submits: 0 })
  })

  it('sends nothing when the dialog is dismissed', () => {
    expect(replay(['request', 'dismiss'])).toEqual({ stage: 'idle', submits: 0 })
  })

  it('sends the cancellation once when it is confirmed', () => {
    expect(replay(['request', 'confirm'])).toEqual({ stage: 'submitting', submits: 1 })
    // A second confirm, or a dismiss, while the request is in flight changes nothing.
    expect(replay(['request', 'confirm', 'confirm', 'dismiss', 'confirm'])).toEqual({
      stage: 'submitting',
      submits: 1,
    })
  })

  it('never sends a cancellation the dialog did not confirm', () => {
    expect(replay(['confirm'])).toEqual({ stage: 'idle', submits: 0 })
    expect(replay(['request', 'dismiss', 'confirm'])).toEqual({ stage: 'idle', submits: 0 })
  })

  it('returns to idle once the request settles, having sent it once', () => {
    expect(replay(['request', 'confirm', 'settled'])).toEqual({ stage: 'idle', submits: 1 })
  })
})

describe('cancellation preview', () => {
  const preview = (reason: Parameters<typeof cancellationPreview>[0]['reason'], hoursBefore: number) =>
    cancellationPreview({
      reason,
      startsAt: START,
      now: new Date(START.getTime() - hoursBefore * 3600_000),
      amountPaidCents: PAID,
      amountRefundedCents: 0,
    })

  it('previews a full refund with nothing retained', () => {
    expect(preview('customer_outside_24h', 48)).toEqual({
      reasonLabel: 'Customer cancelled more than 24 hours before',
      refundCents: PAID,
      retainedCents: 0,
    })
  })

  it('previews the retained half inside 24 hours', () => {
    expect(preview('customer_within_24h', 6)).toEqual({
      reasonLabel: 'Customer cancelled within 24 hours',
      refundCents: PAID / 2,
      retainedCents: PAID / 2,
    })
  })

  it('previews no refund without inventing a $0.00 refund', () => {
    const result = preview('weather_reschedule', 48)
    expect(result.refundCents).toBe(0)
    expect(result.retainedCents).toBe(PAID)
  })
})

describe('cancellation reason labels', () => {
  it('names every stored reason in words', () => {
    for (const outcome of CANCELLATION_OUTCOMES) {
      expect(cancellationReasonLabel(outcome.reason)).toBe(outcome.label)
      expect(cancellationReasonLabel(outcome.reason)).not.toContain('_')
    }
    expect(cancellationReasonLabel('customer_within_24h')).toBe('Customer cancelled within 24 hours')
  })

  it('humanises a reason that is no longer in the list', () => {
    expect(cancellationReasonLabel('some_retired_reason')).toBe('Some retired reason')
  })
})
