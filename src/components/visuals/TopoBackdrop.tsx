import { cn } from '@/lib/cn'

interface TopoBackdropProps {
  className?: string
  tone?: 'ink' | 'light'
  /** Fades the contours out towards the bottom of the section. */
  fade?: boolean
}

/**
 * Decorative topographic contours used sparingly behind editorial sections.
 * Purely presentational; never carries meaning.
 */
export const TopoBackdrop = ({ className, tone = 'ink', fade = true }: TopoBackdropProps) => (
  <div
    aria-hidden="true"
    className={cn(
      'pointer-events-none absolute inset-0 overflow-hidden',
      fade && '[mask-image:linear-gradient(to_bottom,black,transparent_85%)]',
      className,
    )}
  >
    <svg
      viewBox="0 0 1440 520"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke={tone === 'ink' ? '#163F37' : '#DDEBE6'}
      strokeOpacity={tone === 'ink' ? 0.1 : 0.18}
      strokeWidth={1}
    >
      <path d="M-40 96C220 32 420 168 720 104s420 46 800-30" />
      <path d="M-40 152C240 88 440 224 740 160s400 48 780-28" />
      <path d="M-40 212C260 148 460 282 760 218s380 50 760-26" />
      <path d="M-40 276C280 212 480 344 780 280s360 52 740-24" />
      <path d="M-40 344C300 280 500 410 800 346s340 54 720-22" />
      <path d="M-40 416C320 352 520 480 820 416s320 56 700-20" />
    </svg>
  </div>
)
