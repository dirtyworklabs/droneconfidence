import { LinkButton, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { bookingPath } from '@/lib/routes'
import { track } from '@/lib/analytics'
import type { LocationId, SessionId } from '@/types'

interface BookingCtaProps {
  /** Preselects a session on /book. Omit for the general CTA. */
  sessionId?: SessionId
  /** Preselects a training area on /book. */
  locationId?: LocationId
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  withArrow?: boolean
  fullWidth?: boolean
  className?: string
  /** Where the CTA lives, for analytics only. Never personal data. */
  context?: string
}

/**
 * The only place a booking CTA is created.
 *
 * Every CTA leads to /book — the permanent public booking entry point — with
 * optional session or training-area context in the query string. Marketing
 * pages therefore never need to know which provider or backend sits behind
 * booking, and no CTA can end up dead or pointing off-site unexpectedly.
 */
export const BookingCta = ({
  sessionId,
  locationId,
  children,
  variant = 'primary',
  size = 'md',
  withArrow,
  fullWidth,
  className,
  context,
}: BookingCtaProps) => {
  const to = bookingPath({ session: sessionId, location: locationId })

  const handleClick = () => {
    track('booking_clicked', {
      session: sessionId ?? 'general',
      location: locationId ?? 'none',
      context,
    })
  }

  return (
    <LinkButton
      to={to}
      onClick={handleClick}
      variant={variant}
      size={size}
      withArrow={withArrow}
      fullWidth={fullWidth}
      className={className}
    >
      {children}
    </LinkButton>
  )
}
