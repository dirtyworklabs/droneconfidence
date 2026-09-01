import { CalendarClock } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { BOOKING_QUESTION_QUERY } from '@/lib/routes'

interface BookingUnavailableProps {
  /** Overrides the default sentence under the heading. */
  body?: string
}

/**
 * Operational fallback for the date and time step.
 *
 * Shown when the booking system is switched off, unreachable, or has nothing in
 * the horizon. The wording is operational — a service that isn't available right
 * now — and never a launch announcement, a "coming soon" or a waitlist. There is
 * always a next step, and it never implies a message reserves anything.
 */
export const BookingUnavailable = ({ body }: BookingUnavailableProps) => (
  <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sand/80 bg-sand-soft/70 p-6 sm:p-7">
    <div className="flex items-start gap-3">
      <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sage" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
          Online booking is temporarily unavailable.
        </p>
        <p className="measure text-[0.97rem] leading-relaxed text-ink-soft">
          {body ??
            'Live times can’t be shown right now. Send us a message with the session and training area you’d like and we’ll come back to you with the next available times.'}
        </p>
        <p className="text-[0.88rem] leading-relaxed text-ink-muted">
          A message doesn&rsquo;t reserve a time or take a payment — we&rsquo;ll confirm everything
          with you first.
        </p>
      </div>
    </div>

    <div className="pt-1">
      <LinkButton to={BOOKING_QUESTION_QUERY} variant="secondary">
        Contact Drone Confidence
      </LinkButton>
    </div>
  </div>
)
