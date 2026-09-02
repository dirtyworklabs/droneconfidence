import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from '@/components/ui/Reveal'
import { EASE_CALM } from '@/lib/motion'

const points = [
  {
    number: '01',
    title: 'Your aircraft',
    body: 'Learn the drone, controller and settings you’ll actually use when you’re flying on your own.',
  },
  {
    number: '02',
    title: 'Real flying time',
    body: 'Most of the session happens with the controller in your hands, building confidence through real practice.',
  },
  {
    number: '03',
    title: 'Answers in the moment',
    body: 'Work through questions and uncertainty as they come up during real flying.',
  },
]

const ApproachLine = () => {
  const reducedMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-10 left-[1.12rem] top-10 hidden w-px sm:block"
    >
      <div className="absolute inset-0 bg-eucalyptus/10" />

      <motion.div
        className="absolute inset-x-0 top-0 origin-top bg-eucalyptus/35"
        style={{ height: '100%' }}
        initial={
          reducedMotion
            ? false
            : {
                scaleY: 0,
                opacity: 0,
              }
        }
        whileInView={
          reducedMotion
            ? undefined
            : {
                scaleY: 1,
                opacity: 1,
              }
        }
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          duration: 1.15,
          ease: EASE_CALM,
        }}
      />
    </div>
  )
}

export const SessionApproach = () => (
  <Section
    tone="sand"
    space="md"
    aria-labelledby="session-approach-heading"
    className="overflow-hidden"
  >
    <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-20">
        {/* Introduction */}
        <div className="lg:col-span-5">
          <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28">
            <Eyebrow>The approach</Eyebrow>

            <h2
              id="session-approach-heading"
              className="max-w-[13ch] text-[clamp(1.9rem,3.6vw,2.6rem)]"
            >
              Built around you, not a fixed lesson plan.
            </h2>

            <p className="measure text-[1.04rem] leading-relaxed text-ink-soft">
              Whichever session you choose, we start with your drone, your
              experience and what you want to feel more confident doing.
            </p>

            <div className="mt-3 hidden max-w-[24rem] border-l border-eucalyptus/20 pl-4 sm:block">
              <p className="font-display text-[0.68rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/60">
                Practical by design
              </p>

              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-muted">
                The session adapts as you fly, so time is spent on the things
                that are most useful to you.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Coaching flow */}
        <div className="lg:col-span-7">
          <Reveal className="mb-5 flex items-center gap-3">
            <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.16em] text-eucalyptus/60">
              How the session works
            </span>

            <span
              aria-hidden="true"
              className="h-px flex-1 bg-eucalyptus/15"
            />
          </Reveal>

          <div className="relative">
            <ApproachLine />

            <RevealGroup
              as="ol"
              className="relative flex flex-col gap-3 sm:gap-4"
              staggerChildren={0.09}
            >
              {points.map((point) => (
                <RevealItem
                  key={point.number}
                  as="li"
                  className="group relative rounded-[var(--radius-card)] border border-ink/10 bg-surface/70 p-5 transition-[transform,box-shadow,border-color,background-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-eucalyptus/25 hover:bg-surface hover:shadow-[var(--shadow-lift)] sm:ml-12 sm:p-6"
                >
                  {/* Timeline node */}
                  <div
                    aria-hidden="true"
                    className="mb-4 flex size-9 items-center justify-center rounded-full border border-eucalyptus/20 bg-sand-soft font-display text-[0.68rem] font-bold tracking-[0.08em] text-eucalyptus transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-calm)] group-hover:scale-105 group-hover:border-eucalyptus/35 group-hover:bg-eucalyptus/10 sm:absolute sm:-left-[3.05rem] sm:top-6 sm:mb-0"
                  >
                    {point.number}
                  </div>

                  <div className="sm:flex sm:items-start sm:gap-8">
                    <h3 className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-ink sm:w-[10.5rem] sm:shrink-0">
                      {point.title}
                    </h3>

                    <p className="mt-2 text-[0.97rem] leading-relaxed text-ink-soft sm:mt-0">
                      {point.body}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-5 h-px w-0 bg-eucalyptus/30 transition-[width] duration-300 ease-[var(--ease-calm)] group-hover:w-16 sm:left-6"
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* Outcome */}
          <Reveal
            delay={0.1}
            className="relative mt-6 overflow-hidden rounded-[var(--radius-card)] border border-eucalyptus/15 bg-eucalyptus/[0.055] p-5 sm:ml-12 sm:p-6"
          >
            <div
              aria-hidden="true"
              className="absolute -right-10 -top-10 size-28 rounded-full border border-eucalyptus/10"
            />

            <div
              aria-hidden="true"
              className="absolute -right-2 -top-2 size-16 rounded-full border border-eucalyptus/10"
            />

            <div className="relative flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-eucalyptus/10 text-eucalyptus"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-5"
                >
                  <path
                    d="M5 12h12m-4-4 4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="font-display text-[0.67rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/60">
                  The outcome
                </p>

                <p className="mt-2 max-w-[34rem] font-display text-[1.14rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                  Leave confident enough to keep flying, practising and
                  improving independently.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)