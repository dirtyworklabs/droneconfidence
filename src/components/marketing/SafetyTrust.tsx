import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from '@/components/ui/Reveal'
import { EASE_CALM } from '@/lib/motion'

const knowing = [
  {
    number: '01',
    title: 'Location',
    body: 'Is this actually a suitable place to fly?',
  },
  {
    number: '02',
    title: 'Aircraft',
    body: 'Know what the drone is going to do before it does it.',
  },
  {
    number: '03',
    title: 'Battery',
    body: 'Have enough power for the flight, the return and a sensible margin.',
  },
  {
    number: '04',
    title: 'Return-to-Home',
    body: 'Know what it is set to do before relying on it.',
  },
  {
    number: '05',
    title: 'Weather',
    body: 'Understand how wind and changing conditions affect the flight.',
  },
  {
    number: '06',
    title: 'Surroundings',
    body: 'Keep awareness of other people, obstacles and aircraft.',
  },
  {
    number: '07',
    title: 'Conditions',
    body: 'Recognise when something about the flight doesn’t feel right.',
  },
  {
    number: '08',
    title: 'The no-go decision',
    body: 'Sometimes the best decision is not to take off at all.',
  },
]

/**
 * A single, restrained pre-flight visual:
 * the orbit draws into view and the propeller spins once.
 * No crosshair/radar treatment and no looping animation.
 */
const DecisionGraphic = () => {
  const reducedMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="mt-8 hidden max-w-[27rem] grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-5 sm:grid"
    >
      {/* Orbit + propeller */}
      <div className="relative size-[9.5rem]">
        <svg
          viewBox="0 0 160 160"
          fill="none"
          className="absolute inset-0 size-full text-eucalyptus"
        >
          {/* Faint complete orbit */}
          <ellipse
            cx="80"
            cy="80"
            rx="66"
            ry="42"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.08"
          />

          {/* Orbit drawing into view */}
          <motion.ellipse
            cx="80"
            cy="80"
            rx="66"
            ry="42"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeOpacity="0.42"
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
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              pathLength: {
                duration: 1.45,
                ease: EASE_CALM,
              },
              opacity: {
                duration: 0.3,
                ease: EASE_CALM,
              },
            }}
          />

          {/* Orbit waypoint */}
          <motion.circle
            cx="146"
            cy="80"
            r="3.5"
            fill="currentColor"
            initial={
              reducedMotion
                ? false
                : {
                    scale: 0,
                    opacity: 0,
                  }
            }
            whileInView={
              reducedMotion
                ? undefined
                : {
                    scale: 1,
                    opacity: 0.7,
                  }
            }
            viewport={{ once: true }}
            transition={{
              duration: 0.35,
              delay: 1.05,
              ease: EASE_CALM,
            }}
          />

          {/* Centre hub surround */}
          <circle
            cx="80"
            cy="80"
            r="22"
            fill="currentColor"
            fillOpacity="0.035"
            stroke="currentColor"
            strokeOpacity="0.1"
          />
        </svg>

        {/* Propeller spins once independently of the orbit */}
        <motion.div
          className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface/60 text-eucalyptus"
          initial={
            reducedMotion
              ? false
              : {
                  rotate: -90,
                  scale: 0.85,
                  opacity: 0,
                }
          }
          whileInView={
            reducedMotion
              ? undefined
              : {
                  rotate: 270,
                  scale: 1,
                  opacity: 1,
                }
          }
          viewport={{ once: true, amount: 0.6 }}
          transition={{
            rotate: {
              duration: 1.15,
              delay: 0.15,
              ease: EASE_CALM,
            },
            scale: {
              duration: 0.45,
              delay: 0.1,
              ease: EASE_CALM,
            },
            opacity: {
              duration: 0.3,
              delay: 0.1,
              ease: EASE_CALM,
            },
          }}
        >
          <svg
            viewBox="0 0 44 44"
            fill="none"
            className="size-8"
          >
            <path
              d="M22 19.5C20.8 14.4 21.5 8.7 24.8 5.5C27 3.4 30.1 4.2 30.3 7.2C30.6 11.4 27.3 16.8 23.6 20.7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M22 19.5C20.8 14.4 21.5 8.7 24.8 5.5C27 3.4 30.1 4.2 30.3 7.2C30.6 11.4 27.3 16.8 23.6 20.7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(120 22 22)"
            />

            <path
              d="M22 19.5C20.8 14.4 21.5 8.7 24.8 5.5C27 3.4 30.1 4.2 30.3 7.2C30.6 11.4 27.3 16.8 23.6 20.7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="rotate(240 22 22)"
            />

            <circle
              cx="22"
              cy="22"
              r="2.6"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      </div>

      {/* Supporting copy */}
      <div>
        <p className="font-display text-[0.67rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/60">
          Pre-flight judgement
        </p>

        <p className="mt-2 font-display text-[1.02rem] font-semibold leading-snug tracking-[-0.02em] text-eucalyptus">
          Know the flight before you fly it.
        </p>

        <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-muted">
          The safest flight decisions often happen before take-off.
        </p>
      </div>
    </div>
  )
}

export const SafetyTrust = () => (
  <Section
    tone="sand"
    space="lg"
    aria-labelledby="safety-heading"
    className="overflow-hidden"
  >
    <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-20">
        {/* Editorial introduction */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="Safety & judgement"
              id="safety-heading"
              title="Confidence starts with knowing when to fly."
              intro={
                <div className="space-y-3">
                  <p>
                    Good drone flying isn&rsquo;t just about stick control.
                  </p>

                  <p>
                    It&rsquo;s also about understanding the aircraft, reading
                    the situation and making good decisions before and during
                    the flight.
                  </p>
                </div>
              }
              size="lg"
            />

            <Reveal delay={0.08}>
              <DecisionGraphic />
            </Reveal>
          </div>
        </div>

        {/* Decision points */}
        <div className="lg:col-span-7">
          <Reveal className="mb-5 flex items-center gap-3">
            <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.16em] text-eucalyptus/60">
              Before and during every flight
            </span>

            <span
              aria-hidden="true"
              className="h-px flex-1 bg-eucalyptus/15"
            />
          </Reveal>

          <RevealGroup
            as="ul"
            className="grid gap-3 sm:grid-cols-2 sm:gap-4"
            staggerChildren={0.055}
          >
            {knowing.map((item) => (
              <RevealItem
                key={item.number}
                as="li"
                className="group relative min-h-[9rem] rounded-[var(--radius-card)] border border-ink/10 bg-surface/70 p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-eucalyptus/25 hover:bg-surface hover:shadow-[var(--shadow-lift)] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-eucalyptus/15 bg-eucalyptus/[0.055] font-display text-[0.65rem] font-bold tracking-[0.08em] text-eucalyptus/60 transition-[transform,background-color,border-color,color] duration-200 ease-[var(--ease-calm)] group-hover:scale-105 group-hover:border-eucalyptus/25 group-hover:bg-eucalyptus/10 group-hover:text-eucalyptus"
                  >
                    {item.number}
                  </div>

                  <span
                    aria-hidden="true"
                    className="mt-3 h-px w-5 bg-eucalyptus/20 transition-[width,background-color] duration-200 ease-[var(--ease-calm)] group-hover:w-7 group-hover:bg-eucalyptus/40"
                  />
                </div>

                <h3 className="mt-5 font-display text-[1.07rem] font-semibold tracking-[-0.02em] text-ink">
                  {item.title}
                </h3>

                <p className="mt-1.5 text-[0.94rem] leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Safety statement */}
          <Reveal
            delay={0.08}
            className="mt-7 rounded-[var(--radius-card)] border border-eucalyptus/15 bg-eucalyptus/[0.055] p-5 sm:p-6"
          >
            <div className="sm:flex sm:items-start sm:gap-6">
              <div
                aria-hidden="true"
                className="mb-4 flex size-10 shrink-0 items-center justify-center rounded-full border border-eucalyptus/20 bg-eucalyptus/10 sm:mb-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5 text-eucalyptus"
                >
                  <path
                    d="M7.5 12.5l3 3 6-7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeOpacity="0.45"
                  />
                </svg>
              </div>

              <div>
                <p className="font-display text-[1.13rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                  Safety and good decision-making are built naturally into
                  every Drone Confidence session.
                </p>

                <p className="mt-3 text-[0.91rem] leading-relaxed text-ink-muted">
                  All sessions are conducted subject to applicable Australian
                  drone rules, airspace restrictions and local operating
                  requirements.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)