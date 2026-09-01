import { BookingChoice } from '@/components/booking/BookingChoice'
import { formatDuration, formatPrice, sessions } from '@/content/sessions'
import type { Session, SessionId } from '@/types'

interface SessionSelectorProps {
  selectedId: SessionId | null
  onSelect: (id: SessionId) => void
}

const SessionOption = ({
  session,
  selected,
  onSelect,
}: {
  session: Session
  selected: boolean
  onSelect: () => void
}) => (
  <BookingChoice
    name="booking-session"
    value={session.id}
    selected={selected}
    onSelect={onSelect}
    className="h-full"
  >
    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span className="font-display text-[1.22rem] font-semibold tracking-[-0.025em] text-ink">
        {session.name}
      </span>
      <span className="font-display text-[1.3rem] font-bold leading-none tracking-[-0.035em] text-ink">
        {formatPrice(session.price)}
      </span>
    </span>

    <span className="flex flex-col gap-2.5">
      <span className="text-[0.88rem] text-ink-muted">
        {formatDuration(session.durationMinutes)} · one-on-one
      </span>
      <span className="text-[0.94rem] leading-relaxed text-ink-soft">{session.summary}</span>
      <span className="text-[0.9rem] text-ink-soft">
        <span className="font-display font-semibold text-ink">Best for </span>
        {session.bestForShort}
      </span>
    </span>
  </BookingChoice>
)

/**
 * Step 1. Prices, names and durations come from the session content through the
 * shared formatters, so nothing is retyped here.
 */
export const SessionSelector = ({ selectedId, onSelect }: SessionSelectorProps) => (
  <fieldset>
    <legend className="sr-only">Choose your session</legend>

    <div className="grid gap-4 md:grid-cols-3">
      {sessions.map((session) => (
        <SessionOption
          key={session.id}
          session={session}
          selected={session.id === selectedId}
          onSelect={() => onSelect(session.id)}
        />
      ))}
    </div>
  </fieldset>
)
