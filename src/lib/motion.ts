import type { Transition, Variants } from 'motion/react'

/**
 * Motion language: short, calm, opacity + small translate only.
 * Movement stays inside roughly 8–18px. No bounce, no zoom, no spin.
 */
export const EASE_CALM: Transition['ease'] = [0.22, 0.61, 0.36, 1]

export const calm = (duration = 0.6, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_CALM,
})

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: calm() },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: calm(0.7) },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: calm() },
}

/** Parent container for lightly staggered groups such as session cards. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0.04): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
})

/** Traced flight paths and rules that draw into view. */
export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.6, ease: EASE_CALM }, opacity: { duration: 0.3 } },
  },
}

export const VIEWPORT = { once: true, amount: 0.25 } as const

/** Interaction timings, kept in the 180–250ms band. */
export const HOVER_TRANSITION: Transition = { duration: 0.22, ease: EASE_CALM }
