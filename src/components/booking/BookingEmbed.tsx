interface BookingEmbedProps {
  /** Absolute provider URL, already validated by the booking config. */
  url: string
}

/**
 * Embedded scheduler.
 *
 * Rendered only by the availability step, and only when embed mode is
 * deliberately configured with a real URL — never an empty iframe.
 */
export const BookingEmbed = ({ url }: BookingEmbedProps) => {
  if (url.length === 0) return null

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-surface shadow-[var(--shadow-raise)]">
      <iframe
        src={url}
        title="Choose a date and time for your Drone Confidence session"
        loading="lazy"
        className="h-[42rem] w-full border-0"
      />
    </div>
  )
}
