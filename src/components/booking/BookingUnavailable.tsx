import { CalendarClock } from 'lucide-react'
import { LinkButton } from '@/components/ui/Button'
import { BOOKING_QUESTION_QUERY } from '@/lib/routes'

interface BookingUnavailableProps {
  /**
   * Replaces the booking-disabled notice with an operational message and a
   * contact link — used when booking is on but nothing is free in the horizon.
   */
  body?: string
}

/**
 * Fallback for the date and time step.
 *
 * Without a `body` it is the booking-disabled notice, shown when the booking
 * system is switched off or unreachable: a launch notice with no call to action.
 * With a `body` it is the operational "nothing free right now" message, which
 * always offers a next step and never implies a message reserves anything.
 */
export const BookingUnavailable = ({ body }: BookingUnavailableProps) => {
  if (body === undefined) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sand/80 bg-sand-soft/70 p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sage" />
          <div className="flex flex-col gap-2">
            <p className="font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
              Bookings opening soon
            </p>
            <p className="measure text-[0.97rem] leading-relaxed text-ink-soft">
              We&rsquo;re currently putting the finishing touches on the launch of Drone Confidence
              and preparing First Flight bookings to open.
            </p>
            <p className="measure text-[0.97rem] leading-relaxed text-ink-soft">
              We look forward to helping you get airborne with confidence. Please check back
              regularly for launch updates and available times.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sand/80 bg-sand-soft/70 p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sage" />
        <div className="flex flex-col gap-2">
          <p className="font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
            Online booking is temporarily unavailable.
          </p>
          <p className="measure text-[0.97rem] leading-relaxed text-ink-soft">{body}</p>
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
}
