import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { EASE_CALM } from '@/lib/motion'
import { ROUTES } from '@/lib/routes'

const examples = [
  {
    number: '01',
    title: 'New to drones?',
    text: 'Work through setup, controls, Return-to-Home, pre-flight checks and the fundamentals of safe flying.',
  },
  {
    number: '02',
    title: 'Already flying?',
    text: 'Improve orientation, smoother control, situational awareness and decision-making.',
  },
  {
    number: '03',
    title: 'Want better photos and video?',
    text: 'Focus on camera settings, framing, movement and practical shot techniques.',
  },
]

/**
 * A restrained flight-path detail used only in this section.
 * It draws into view once and remains static afterwards.
 */
const FlightPathGraphic = () => {
  const reducedMotion = useReducedMotion()

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 900 560"
      fill="none"
      className="pointer-events-none absolute -right-40 top-1/2 hidden h-[38rem] w-[61rem] -translate-y-1/2 text-sage-soft lg:block"
    >
      <motion.path
        d="M72 442C154 378 185 282 292 277C410 272 425 376 543 344C657 313 643 194 752 149C792 132 830 132 864 142"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={
          reducedMotion
            ? false
            : {
                pathLength: 0,
                opacity: 0,
              }
        }
        whileInView={
          reducedMotion
            ? undefined
            : {
                pathLength: 1,
                opacity: 1,
              }
        }
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          pathLength: {
            duration: 1.8,
            ease: EASE_CALM,
          },
          opacity: {
            duration: 0.4,
            ease: EASE_CALM,
          },
        }}
      />

      <motion.circle
        cx="292"
        cy="277"
        r="5"
        fill="currentColor"
        fillOpacity="0.32"
        initial={reducedMotion ? false : { opacity: 0 }}
        whileInView={reducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.4,
          delay: 0.55,
          ease: EASE_CALM,
        }}
      />

      <motion.circle
        cx="543"
        cy="344"
        r="5"
        fill="currentColor"
        fillOpacity="0.32"
        initial={reducedMotion ? false : { opacity: 0 }}
        whileInView={reducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.4,
          delay: 0.95,
          ease: EASE_CALM,
        }}
      />

      <motion.circle
        cx="752"
        cy="149"
        r="5"
        fill="currentColor"
        fillOpacity="0.32"
        initial={reducedMotion ? false : { opacity: 0 }}
        whileInView={reducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.4,
          delay: 1.3,
          ease: EASE_CALM,
        }}
      />
    </svg>
  )
}

export const Differentiator = () => (
  <Section
    tone="deep"
    space="md"
    aria-labelledby="differentiator-heading"
    className="overflow-hidden"
  >
    <TopoBackdrop
      tone="light"
      fade={false}
      className="opacity-40"
    />

    <FlightPathGraphic />

    <Container className="relative">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-16 xl:gap-x-20">
        {/* Main statement */}
        <Reveal className="flex flex-col gap-6 lg:col-span-5">
          <h2
            id="differentiator-heading"
            className="max-w-[10ch] text-[clamp(2rem,4vw,3rem)] text-canvas"
          >
            Your drone. Your session.
          </h2>

          <p className="measure font-display text-[1.12rem] font-semibold leading-snug tracking-[-0.02em] text-sage-soft sm:text-[1.18rem]">
            We start with your drone, your
            experience and what you want to feel more confident doing.
          </p>

          <div className="border-l border-sage-soft/25 pl-4">
            <p className="font-display text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-sage-soft/55">
              The goal
            </p>

            <p className="mt-1.5 max-w-[30rem] font-display text-[1.06rem] font-semibold leading-snug tracking-[-0.015em] text-canvas">
              Leave feeling more confident, capable and independent with your
              drone.
            </p>
          </div>

          {/* Desktop CTA */}
          <div className="hidden pt-2 lg:block">
            <LinkButton
              to={ROUTES.sessions}
              variant="onDark"
              size="lg"
              withArrow
            >
              Explore the Sessions
            </LinkButton>
          </div>
        </Reveal>

        {/* Session examples */}
        <RevealGroup
          as="ul"
          className="relative flex flex-col gap-3 lg:col-span-7 lg:gap-4"
          staggerChildren={0.09}
        >
          {examples.map((example) => (
            <RevealItem
              key={example.number}
              as="li"
              className="group relative grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[var(--radius-card)] border border-sage/30 bg-eucalyptus-deep/40 p-5 backdrop-blur-[2px] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage-soft/40 hover:bg-eucalyptus-deep/55 hover:shadow-[var(--shadow-lift)] sm:gap-5 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-sage-soft/20 bg-sage-soft/10 font-display text-[0.7rem] font-bold tracking-[0.1em] text-sage-soft/70 transition-[transform,background-color,border-color,color] duration-200 ease-[var(--ease-calm)] group-hover:scale-105 group-hover:border-sage-soft/35 group-hover:bg-sage-soft/15 group-hover:text-sage-soft"
              >
                {example.number}
              </div>

              <div>
                <h3 className="text-[1.06rem] font-semibold tracking-[-0.015em] text-canvas sm:text-[1.12rem]">
                  {example.title}
                </h3>

                <p className="mt-1.5 text-[0.96rem] leading-relaxed text-sage-soft/75 sm:text-[1rem]">
                  {example.text}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Mobile CTA comes after the examples */}
        <Reveal className="lg:hidden">
          <LinkButton
            to={ROUTES.sessions}
            variant="onDark"
            size="lg"
            withArrow
            fullWidth
          >
            Explore the Sessions
          </LinkButton>
        </Reveal>
      </div>
    </Container>
  </Section>
)