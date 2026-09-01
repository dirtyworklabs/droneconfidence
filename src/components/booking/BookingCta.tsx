import { AnchorButton, LinkButton, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { resolveBookingTarget } from '@/config/booking'
import { track } from '@/lib/analytics'
import type { SessionId } from '@/types'

interface BookingCtaProps {
  /** Omit for the general "Book a Session" CTA. */
  sessionId?: SessionId
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
 * Routing decisions live entirely in the booking config resolver, so no
 * component ever hard-codes a booking URL and no CTA can end up dead:
 * anything missing or malformed falls back to /book.
 */
export const BookingCta = ({
  sessionId,
  children,
  variant = 'primary',
  size = 'md',
  withArrow,
  fullWidth,
  className,
  context,
}: BookingCtaProps) => {
  const target = resolveBookingTarget(sessionId)

  const handleClick = () => {
    track('booking_clicked', { session: sessionId ?? 'general', context, destination: target.kind })
    if (target.external) {
      track('external_booking_opened', { session: sessionId ?? 'general' })
    }
  }

  if (target.external) {
    return (
      <AnchorButton
        href={target.href}
        newTab={target.newTab}
        onClick={handleClick}
        variant={variant}
        size={size}
        external
        fullWidth={fullWidth}
        className={className}
      >
        {children}
      </AnchorButton>
    )
  }

  return (
    <LinkButton
      to={target.href}
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
