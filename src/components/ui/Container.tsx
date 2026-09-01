import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  /** 'wide' for full compositions, 'text' for editorial reading columns. */
  width?: 'wide' | 'text'
  /**
   * 'tight' trims the narrow-width gutter by 4px. Used by the header, where
   * every pixel decides whether the booking CTA stays on one line.
   */
  gutter?: 'default' | 'tight'
}

export const Container = ({ children, className, width = 'wide', gutter = 'default' }: ContainerProps) => (
  <div
    className={cn(
      'mx-auto w-full sm:px-8',
      gutter === 'tight' ? 'px-4' : 'px-5',
      width === 'wide' ? 'max-w-[76rem]' : 'max-w-[46rem]',
      className,
    )}
  >
    {children}
  </div>
)
