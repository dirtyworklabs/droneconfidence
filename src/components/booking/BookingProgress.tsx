import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { BOOKING_STEPS } from '@/components/booking/useBookingSelection'

interface BookingProgressProps {
  /** 1-based. Steps beyond this are shown as still to come. */
  currentStep: number
  className?: string
}

/**
 * Understated progress indicator for the booking journey.
 *
 * Four hairline rules with numbered labels on tablet and up; on phones the rules
 * stay and the labels collapse to a single line, which keeps the whole thing to
 * two rows of text. Screen readers always get the full list, so nothing is
 * communicated by colour or width alone.
 */
export const BookingProgress = ({ currentStep, className }: BookingProgressProps) => (
  <div className={cn('flex flex-col gap-3', className)}>
    <ol aria-label="Booking steps" className="grid grid-cols-4 gap-x-2 sm:gap-x-6">
      {BOOKING_STEPS.map((label, index) => {
        const number = index + 1
        const isDone = number < currentStep
        const isCurrent = number === currentStep

        return (
          <li
            key={label}
            {...(isCurrent ? { 'aria-current': 'step' as const } : {})}
            className="flex flex-col gap-2"
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-[2px] w-full rounded-full transition-colors duration-300 ease-[var(--ease-calm)]',
                isDone || isCurrent ? 'bg-sage' : 'bg-ink/12',
              )}
            />
            <span className="sr-only flex items-baseline gap-2 sm:not-sr-only">
              <span
                aria-hidden="true"
                className={cn(
                  'font-display text-[0.72rem] font-semibold tracking-[0.08em] transition-colors duration-300 ease-[var(--ease-calm)]',
                  isDone || isCurrent ? 'text-sage' : 'text-ink-muted/70',
                )}
              >
                {String(number).padStart(2, '0')}
              </span>
              <span
                className={cn(
                  'text-[0.83rem] leading-snug transition-colors duration-300 ease-[var(--ease-calm)]',
                  isCurrent ? 'font-medium text-ink' : isDone ? 'text-ink-soft' : 'text-ink-muted',
                )}
              >
                {label}
              </span>
              {isDone ? (
                <Check aria-hidden="true" className="hidden size-3.5 shrink-0 text-sage sm:block" />
              ) : null}
            </span>
            <span className="sr-only">
              {isDone ? 'Completed' : isCurrent ? 'Current step' : 'Still to come'}
            </span>
          </li>
        )
      })}
    </ol>

    <p
      aria-hidden="true"
      className="font-display text-[0.85rem] font-medium tracking-[-0.01em] text-ink-soft sm:hidden"
    >
      Step {currentStep} of {BOOKING_STEPS.length}
      <span className="text-ink-muted"> · </span>
      {BOOKING_STEPS[currentStep - 1]}
    </p>
  </div>
)
