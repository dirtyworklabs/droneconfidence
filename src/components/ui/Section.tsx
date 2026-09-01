import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type SectionTone = 'canvas' | 'surface' | 'sage' | 'deep' | 'sand'

interface SectionProps {
  children: ReactNode
  id?: string
  tone?: SectionTone
  className?: string
  /** Vertical rhythm. Sections deliberately vary. */
  space?: 'sm' | 'md' | 'lg'
  as?: 'section' | 'div' | 'footer' | 'article'
  'aria-labelledby'?: string
}

const tones: Record<SectionTone, string> = {
  canvas: 'bg-canvas text-ink',
  surface: 'bg-surface text-ink',
  sage: 'bg-sage-soft text-ink',
  deep: 'bg-eucalyptus text-canvas',
  sand: 'bg-sand-soft text-ink',
}

const spaces = {
  sm: 'py-14 sm:py-16',
  md: 'py-18 sm:py-24',
  lg: 'py-22 sm:py-32',
}

export const Section = ({
  children,
  id,
  tone = 'canvas',
  className,
  space = 'md',
  as: Component = 'section',
  ...aria
}: SectionProps) => (
  <Component id={id} className={cn('relative', tones[tone], spaces[space], className)} {...aria}>
    {children}
  </Component>
)
