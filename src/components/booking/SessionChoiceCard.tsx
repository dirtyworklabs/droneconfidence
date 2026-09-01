import { Clock } from 'lucide-react'
import { BookingCta } from '@/components/booking/BookingCta'
import { RevealItem } from '@/components/ui/Reveal'
import { formatDuration, formatPrice } from '@/content/sessions'
import type { Session } from '@/types'

interface SessionChoiceCardProps {
  session: Session
  /** Shown under the price on the booking hand-off. */
  showBestFor?: boolean
  /**
   * Booking button. Omitted before booking is enabled, where a button would
   * only point back at the page the customer is already on.
   */
  withCta?: boolean
}

/** Compact session choice used on /book, in both pre- and post-integration states. */
export const SessionChoiceCard = ({
  session,
  showBestFor = true,
  withCta = true,
}: SessionChoiceCardProps) => (
  <RevealItem className="flex h-full flex-col gap-5 rounded-[var(--radius-card)] border border-ink/8 bg-surface p-6 shadow-[var(--shadow-raise)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)] sm:p-7">
    <div className="flex flex-col gap-2">
      <h3 className="text-[1.35rem]">{session.name}</h3>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock aria-hidden="true" className="size-3.5" />
          {formatDuration(session.durationMinutes)}
        </span>
        <span aria-hidden="true" className="text-ink/20">
          ·
        </span>
        <span className="font-display text-[1.05rem] font-semibold text-ink">
          {formatPrice(session.price)}
        </span>
      </p>
    </div>

    {showBestFor ? (
      <p className="flex-1 text-[0.97rem] leading-relaxed text-ink-soft">{session.summary}</p>
    ) : null}

    {withCta ? (
      <BookingCta sessionId={session.id} fullWidth context="booking-handoff" className="mt-auto">
        {`Book ${session.name}`}
      </BookingCta>
    ) : null}
  </RevealItem>
)
