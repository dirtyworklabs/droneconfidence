import { useEffect } from 'react'
import type { CancellationPreview } from '@shared/booking/cancellationConfirm'
import { formatMoneyCents } from '@shared/booking/format'
import { Button } from '@/components/ui/Button'

interface CancelBookingDialogProps {
  /** The policy preview for the reason the owner chose. Advisory only. */
  preview: CancellationPreview
  /** True while the confirmed cancellation is in flight. */
  busy: boolean
  onConfirm: () => void
  onDismiss: () => void
}

/**
 * The one confirmation in the dashboard, because cancelling is the one action
 * that moves money and cannot be undone.
 *
 * Deliberately not a general modal system: it states what will happen, in the
 * admin's own plain style, and offers a way out. The amounts are the published
 * policy restated for the owner — the server recalculates the refund when the
 * cancellation is submitted, and this dialog never sends a figure.
 */
export const CancelBookingDialog = ({
  preview,
  busy,
  onConfirm,
  onDismiss,
}: CancelBookingDialogProps) => {
  const refunds = preview.refundCents > 0

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onDismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [busy, onDismiss])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/45 p-4 sm:items-center sm:p-6"
      onClick={busy ? undefined : onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-booking-title"
        aria-describedby="cancel-booking-body"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[30rem] rounded-[var(--radius-card)] border border-ink/10 bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-6"
      >
        <h2
          id="cancel-booking-title"
          className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
        >
          Cancel this booking?
        </h2>

        <div
          id="cancel-booking-body"
          className="mt-3 flex flex-col gap-2 text-[0.95rem] leading-relaxed text-ink-soft"
        >
          <p>
            {refunds
              ? `This will cancel the booking and refund ${formatMoneyCents(preview.refundCents)} to the customer.`
              : 'This will cancel the booking. No refund will be issued to the customer.'}
          </p>
          {refunds && preview.retainedCents > 0 ? (
            <p>
              {formatMoneyCents(preview.retainedCents)} will be retained in line with the booking
              policy.
            </p>
          ) : null}
          <p>Reason: {preview.reasonLabel}.</p>
          <p className="font-medium text-ink">This action cannot be undone.</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" size="compact" onClick={onDismiss} disabled={busy}>
            Keep booking
          </Button>
          {/* autoFocus lands the keyboard on the dialog, so Escape and Tab stay useful. */}
          <Button type="button" size="compact" autoFocus onClick={onConfirm} disabled={busy}>
            {busy
              ? 'Cancelling…'
              : refunds
                ? `Cancel & refund ${formatMoneyCents(preview.refundCents)}`
                : 'Cancel booking'}
          </Button>
        </div>
      </div>
    </div>
  )
}
