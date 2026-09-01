import { CalendarClock } from 'lucide-react'
import { AnchorButton, LinkButton } from '@/components/ui/Button'
import { BookingEmbed } from '@/components/booking/BookingEmbed'
import { resolveAvailabilitySource } from '@/lib/bookingService'
import { BOOKING_QUESTION_QUERY } from '@/lib/routes'
import { track } from '@/lib/analytics'
import type { LocationId, SessionId } from '@/types'

interface BookingAvailabilityProps {
  sessionId: SessionId
  locationId: LocationId
}

/**
 * Operational fallback.
 *
 * Shown whenever live availability can't be reached — before the booking
 * integration is implemented, and afterwards if it's unreachable. It is an
 * ordinary service message, not a launch or waitlist message, and it never
 * leaves the visitor without a next step.
 */
const Unavailable = () => (
  <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sand/80 bg-sand-soft/70 p-6 sm:p-7">
    <div className="flex items-start gap-3">
      <CalendarClock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sage" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-[1.08rem] font-semibold tracking-[-0.02em] text-ink">
          Online booking is temporarily unavailable.
        </p>
        <p className="measure text-[0.97rem] leading-relaxed text-ink-soft">
          Live times can&rsquo;t be shown right now. Send us a message with the session and training
          area you&rsquo;d like and we&rsquo;ll come back to you with the next available times.
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

/**
 * Step 3 — the integration boundary.
 *
 * This component is the only place in the site that knows how live availability
 * is reached. It renders a configured provider hand-off when one genuinely
 * exists, and the operational fallback otherwise. No sample dates, no sample
 * times, no fake calendar and no fake confirmation.
 *
 * The next implementation adds a slot picker here, driven by
 * `resolveAvailabilitySource` / `BookingService` in `src/lib/bookingService.ts`.
 * Nothing else on /book has to change.
 */
export const BookingAvailability = ({ sessionId, locationId }: BookingAvailabilityProps) => {
  const source = resolveAvailabilitySource({ sessionId, locationId })

  return (
    <div className="flex flex-col gap-4">
      {source.kind === 'embed' ? (
        <BookingEmbed url={source.url} />
      ) : source.kind === 'handoff' ? (
        <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-ink/8 bg-surface p-6 shadow-[var(--shadow-raise)] sm:p-7">
          <p className="measure text-[0.99rem] leading-relaxed text-ink-soft">
            Continue to choose an available time for your session, tell us about your drone and
            complete payment securely.
          </p>
          <div>
            <AnchorButton
              href={source.target.href}
              newTab={source.target.newTab}
              external
              size="lg"
              onClick={() =>
                track('booking_integration_opened', { session: sessionId, location: locationId })
              }
            >
              Choose a date &amp; time
            </AnchorButton>
          </div>
        </div>
      ) : (
        <Unavailable />
      )}

      {import.meta.env.DEV ? (
        <p className="rounded-[var(--radius-control)] border border-dashed border-ink/20 px-4 py-3 text-[0.82rem] leading-relaxed text-ink-muted">
          Dev note (never rendered in production): availability source is
          &ldquo;{source.kind}&rdquo;. Implement <code>getBookingService()</code> and add the{' '}
          <code>service</code> case in <code>src/lib/bookingService.ts</code> to render real slots
          here.
        </p>
      ) : null}
    </div>
  )
}
