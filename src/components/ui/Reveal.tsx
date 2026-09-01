import type { ElementType, ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { VIEWPORT, calm } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Small stagger offset in seconds for grouped items. */
  delay?: number
  /** Distance travelled, kept inside the 8–18px band. */
  distance?: number
  as?: ElementType
}

/**
 * Restrained scroll reveal. Used on section headings and grouped items only —
 * not on every paragraph. Disabled entirely under prefers-reduced-motion.
 */
export const Reveal = ({ children, className, delay = 0, distance = 14, as }: RevealProps) => {
  const reduced = useReducedMotion()
  const Component = motion[(as ?? 'div') as 'div']

  if (reduced) {
    const Plain = (as ?? 'div') as ElementType
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Component
      className={cn(className)}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={calm(0.6, delay)}
    >
      {children}
    </Component>
  )
}

interface RevealGroupProps {
  children: ReactNode
  className?: string
  staggerChildren?: number
  as?: ElementType
}

/** Parent for lightly staggered children. Pair with <RevealItem>. */
export const RevealGroup = ({ children, className, staggerChildren = 0.08, as }: RevealGroupProps) => {
  const reduced = useReducedMotion()
  const Component = motion[(as ?? 'div') as 'div']

  if (reduced) {
    const Plain = (as ?? 'div') as ElementType
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren, delayChildren: 0.04 } } }}
    >
      {children}
    </Component>
  )
}

interface RevealItemProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

export const RevealItem = ({ children, className, as }: RevealItemProps) => {
  const reduced = useReducedMotion()
  const Component = motion[(as ?? 'div') as 'div']

  if (reduced) {
    const Plain = (as ?? 'div') as ElementType
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <Component
      className={className}
      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: calm() } }}
    >
      {children}
    </Component>
  )
}
