import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface EyebrowProps {
  children: ReactNode
  className?: string
  tone?: 'default' | 'onDark'
}

/** Small uppercase label with a short leading rule — the site's section marker. */
export const Eyebrow = ({ children, className, tone = 'default' }: EyebrowProps) => (
  <p
    className={cn(
      'flex items-center gap-3 font-sans text-[0.7rem] font-medium uppercase tracking-[0.2em]',
      tone === 'onDark' ? 'text-sky' : 'text-sage',
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={cn('h-px w-7', tone === 'onDark' ? 'bg-sky/50' : 'bg-sage/40')}
    />
    {children}
  </p>
)
