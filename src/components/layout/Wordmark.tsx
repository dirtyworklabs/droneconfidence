import { cn } from '@/lib/cn'

interface WordmarkProps {
  className?: string
  tone?: 'default' | 'onDark'
}

/**
 * Text wordmark with a small abstract mark: a traced arc rising over a
 * position dot — flight path and location, the site's two core motifs.
 *
 * The mark and the name both step down slightly at narrow widths so the header
 * can carry the wordmark, the booking CTA and the menu button on one line. The
 * name never wraps: it truncates as an absolute last resort, which keeps the
 * header composed even below the widths we design for.
 */
export const Wordmark = ({ className, tone = 'default' }: WordmarkProps) => (
  <span className={cn('inline-flex min-w-0 items-center gap-2 sm:gap-2.5', className)}>
    <svg viewBox="0 0 32 32" className="size-6 shrink-0 sm:size-7" aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="15" stroke={tone === 'onDark' ? '#DDEBE6' : '#163F37'} strokeOpacity="0.22" />
      <path
        d="M6 22c5-1 7-11 15-11 3 0 4 1 5 2"
        stroke={tone === 'onDark' ? '#B9DDE5' : '#337667'}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="21" cy="11" r="2.6" fill={tone === 'onDark' ? '#E9DCC5' : '#163F37'} />
    </svg>
    <span
      className={cn(
        'min-w-0 truncate font-display text-[0.9rem] font-bold leading-none tracking-[-0.03em] min-[400px]:text-[0.98rem] sm:text-[1.06rem]',
        tone === 'onDark' ? 'text-canvas' : 'text-ink',
      )}
    >
      Drone Confidence
    </span>
  </span>
)
