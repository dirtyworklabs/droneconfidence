import { BRAND_ICON, BRAND_LOGOS } from '@shared/brand'
import { cn } from '@/lib/cn'

/** Rendered heights; the width always follows the artwork's own ratio. */
const sizes = {
  header: 'h-8 min-[400px]:h-9 sm:h-10',
  menu: 'h-9',
  footer: 'h-11 sm:h-12',
  admin: 'h-7',
} as const

interface WordmarkProps {
  size?: keyof typeof sizes
  tone?: 'default' | 'onDark'
  /**
   * Below 360px the full lock-up can't share a row with the booking CTA at a
   * legible size, so the header swaps it for the standalone icon there.
   */
  compactBelow360?: boolean
}

/**
 * The official Drone Confidence logo. The supplied artwork is used as-is: the
 * intrinsic width and height are set so the browser reserves the right box
 * before the file arrives, and only the height is styled so it never stretches.
 */
export const Wordmark = ({ size = 'header', tone = 'default', compactBelow360 = false }: WordmarkProps) => {
  const logo = BRAND_LOGOS.horizontal[tone === 'onDark' ? 'onDark' : 'onLight']

  return (
    <span className="inline-flex min-w-0 items-center">
      {compactBelow360 ? (
        <img
          src={BRAND_ICON.src}
          width={BRAND_ICON.width}
          height={BRAND_ICON.height}
          alt="Drone Confidence"
          decoding="async"
          className="size-9 shrink-0 min-[360px]:hidden"
        />
      ) : null}
      <img
        src={logo.src}
        width={logo.width}
        height={logo.height}
        alt="Drone Confidence"
        decoding="async"
        className={cn(
          'w-auto max-w-none shrink-0',
          sizes[size],
          compactBelow360 && 'hidden min-[360px]:block',
        )}
      />
    </span>
  )
}
