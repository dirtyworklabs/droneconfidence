import { bookingConfig } from '@/config/booking'

/**
 * Embedded scheduler. Only rendered when an embed URL genuinely exists and
 * embed mode has been deliberately enabled — never an empty iframe.
 */
export const BookingEmbed = () => {
  if (bookingConfig.bookingDisplayMode !== 'embed' || bookingConfig.embedUrl.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-surface shadow-[var(--shadow-raise)]">
      <iframe
        src={bookingConfig.embedUrl}
        title="Book a Drone Confidence session"
        loading="lazy"
        className="h-[42rem] w-full border-0"
      />
    </div>
  )
}
