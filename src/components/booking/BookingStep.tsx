import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { calm } from '@/lib/motion'
import { cn } from '@/lib/cn'

interface BookingStepProps {
  /** 1-based step number, shown as an editorial numeral. */
  number: number
  title: string
  description?: ReactNode
  /** Stable id used to label the section. */
  id: string
  /**
   * Fades the step in when it becomes reachable. Used for the steps that appear
   * after a selection rather than on page load.
   */
  appear?: boolean
  children: ReactNode
  className?: string
}

/** Fade for a step that appears mid-page. Static under prefers-reduced-motion. */
const Appear = ({ children }: { children: ReactNode }) => {
  const reduced = useReducedMotion()
  if (reduced) return <>{children}</>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={calm(0.4)}>
      {children}
    </motion.div>
  )
}

/**
 * One stage of the booking flow: numeral, heading, optional line of guidance,
 * then its controls. The same wrapper is used by the later date/time and
 * details steps, so the page keeps a single rhythm as the flow grows.
 */
export const BookingStep = ({
  number,
  title,
  description,
  id,
  appear = false,
  children,
  className,
}: BookingStepProps) => {
  const body = (
    <section aria-labelledby={`${id}-heading`} className={cn('flex flex-col gap-5', className)}>
      <header className="flex flex-col gap-2">
        <span
          aria-hidden="true"
          className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-sage"
        >
          Step {String(number).padStart(2, '0')}
        </span>
        <h2 id={`${id}-heading`} className="text-[clamp(1.4rem,2.8vw,1.8rem)]">
          {title}
        </h2>
        {description ? (
          <p className="measure text-[0.99rem] leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </header>

      <div>{children}</div>
    </section>
  )

  return appear ? <Appear>{body}</Appear> : body
}
