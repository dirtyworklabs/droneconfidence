import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ContainerProps {
  children: ReactNode
  className?: string
  /** 'wide' for full compositions, 'text' for editorial reading columns. */
  width?: 'wide' | 'text'
}

export const Container = ({ children, className, width = 'wide' }: ContainerProps) => (
  <div
    className={cn(
      'mx-auto w-full px-5 sm:px-8',
      width === 'wide' ? 'max-w-[76rem]' : 'max-w-[46rem]',
      className,
    )}
  >
    {children}
  </div>
)
