/**
 * The confirmation step in front of a cancellation.
 *
 * Cancelling refunds real money and cannot be undone, so the admin surface asks
 * once before it sends anything. Two pieces live here rather than in the panel,
 * so the same definition can be tested without a browser:
 *
 * - `cancellationPreview` restates the published policy for the owner. It is
 *   **advisory only**. The server recomputes the refund from the booking's own
 *   start time and what has already been refunded, and no amount is ever sent
 *   from the browser.
 * - `cancelFlowStep` is the only way the panel changes cancellation stage, so
 *   "the first click asks" and "a confirmed cancellation is sent once" are
 *   properties of this function rather than of a component's wiring.
 */

import { cancellationReasonLabel, refundCents } from './policy'
import type { CancellationReason } from './types'

export interface CancellationPreview {
  /** The human wording for the reason — never the stored identifier. */
  reasonLabel: string
  /** What the policy says would be refunded now, in cents. */
  refundCents: number
  /** What would stay with the business, in cents. */
  retainedCents: number
}

export const cancellationPreview = (input: {
  reason: CancellationReason
  startsAt: Date
  now: Date
  amountPaidCents: number
  amountRefundedCents: number
}): CancellationPreview => {
  const refund = refundCents(input)
  return {
    reasonLabel: cancellationReasonLabel(input.reason),
    refundCents: refund,
    retainedCents: Math.max(0, input.amountPaidCents - input.amountRefundedCents - refund),
  }
}

/** `confirming` is the dialog; `submitting` is the request in flight. */
export type CancelStage = 'idle' | 'confirming' | 'submitting'

export type CancelEvent =
  /** The owner pressed "Cancel booking" in the panel. */
  | 'request'
  /** The owner chose "Keep booking", pressed Escape, or clicked away. */
  | 'dismiss'
  /** The owner pressed the confirm button in the dialog. */
  | 'confirm'
  /** The request came back, either way. */
  | 'settled'

export interface CancelStep {
  stage: CancelStage
  /** Whether this step is the one that sends the cancellation. */
  submit: boolean
}

const step = (stage: CancelStage, submit = false): CancelStep => ({ stage, submit })

/**
 * Pressing "Cancel booking" only ever opens the dialog: `submit` is true for
 * exactly one transition, `confirming` → `submitting`. A second confirm while
 * the request is in flight is ignored, and nothing is dismissable mid-flight.
 */
export const cancelFlowStep = (stage: CancelStage, event: CancelEvent): CancelStep => {
  if (event === 'settled') return step('idle')
  if (stage === 'submitting') return step('submitting')

  switch (event) {
    case 'request':
      return step('confirming')
    case 'dismiss':
      return step('idle')
    case 'confirm':
      // Never from `idle`: the dialog must have been open.
      return stage === 'confirming' ? step('submitting', true) : step('idle')
  }
}
