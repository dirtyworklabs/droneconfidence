import { cn } from '@/lib/cn'

interface WordmarkProps {
  className?: string
  tone?: 'default' | 'onDark'
}

export const Wordmark = ({ className, tone = 'default' }: WordmarkProps) => (
  <span className={cn('inline-flex min-w-0 items-center gap-2 sm:gap-2.5', className)}>
    <img
      src="/images/drone-confidence-email-logo-icon.png"
      alt=""
      aria-hidden="true"
      className="size-7 shrink-0 object-contain sm:size-8"
    />

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