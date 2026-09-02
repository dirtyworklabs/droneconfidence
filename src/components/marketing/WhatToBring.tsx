import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from '@/components/ui/Reveal'

const items = [
  'Your drone',
  'Controller',
  'Phone or tablet if required',
  'All available batteries',
  'Charging hub if you have one',
  'Memory card',
  'Any ND filters or accessories you want help with',
  'The relevant drone app already installed if possible',
]

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    fill="none"
    className="size-3.5"
  >
    <path
      d="M5.5 10.2 8.4 13l6.1-6.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const WhatToBring = () => (
  <Section
    tone="canvas"
    space="lg"
    aria-labelledby="bring-heading"
    className="overflow-hidden"
  >
    <Container>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16 xl:gap-x-20">
        {/* Introduction */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="On the day"
              id="bring-heading"
              title="Bring your drone. We’ll handle the rest."
              intro={
                <div className="space-y-3">
                  <p>
                    You don&rsquo;t need specialist equipment or a complicated
                    setup. For most sessions, just bring the gear you normally
                    fly with.
                  </p>

                  <p>
                    A few things are worth checking before you leave:
                  </p>
                </div>
              }
              size="lg"
            />

            {/* Small supporting checklist */}
            <Reveal
              delay={0.08}
              className="mt-8 hidden max-w-[24rem] sm:block"
            >
              <div className="border-l border-eucalyptus/20 pl-4">
                <p className="font-display text-[0.68rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/60">
                  Before you leave
                </p>

                <div className="mt-3 space-y-2">
                  {[
                    'Charge your batteries',
                    'Check the controller',
                    'Make sure the app is ready',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 text-[0.88rem] text-ink-muted"
                    >
                      <span className="text-eucalyptus">
                        <CheckIcon />
                      </span>

                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* What to bring */}
        <div className="lg:col-span-7">
          <Reveal className="mb-3 flex items-center gap-3">
            <span className="font-display text-[0.7rem] font-bold uppercase tracking-[0.16em] text-eucalyptus/60">
              What to bring
            </span>

            <span
              aria-hidden="true"
              className="h-px flex-1 bg-eucalyptus/15"
            />
          </Reveal>

          <RevealGroup
            as="ul"
            className="grid gap-x-8 sm:grid-cols-2"
            staggerChildren={0.045}
          >
            {items.map((item, index) => (
              <RevealItem
                key={item}
                as="li"
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-ink/10 py-3.5 transition-[border-color] duration-200 ease-[var(--ease-calm)] hover:border-eucalyptus/30"
              >
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full border border-eucalyptus/15 text-eucalyptus/60 transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-calm)] group-hover:scale-105 group-hover:border-eucalyptus/30 group-hover:bg-eucalyptus/[0.06] group-hover:text-eucalyptus"
                >
                  <CheckIcon />
                </span>

                <span className="text-[0.96rem] font-medium leading-snug text-ink-soft transition-[color,transform] duration-200 ease-[var(--ease-calm)] group-hover:translate-x-0.5 group-hover:text-ink">
                  {item}
                </span>

                <span
                  aria-hidden="true"
                  className="font-display text-[0.62rem] font-bold tracking-[0.08em] text-ink-muted/35 transition-colors duration-200 group-hover:text-eucalyptus/50"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* First Flight callout */}
          <Reveal
            delay={0.08}
            className="relative mt-7 overflow-hidden rounded-[var(--radius-card)] border border-eucalyptus/15 bg-sand-soft/60 p-6 sm:p-7"
          >
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 size-40 rounded-full border border-eucalyptus/10"
            />

            <div
              aria-hidden="true"
              className="absolute -right-4 -top-4 size-24 rounded-full border border-eucalyptus/10"
            />

            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex rounded-full border border-eucalyptus/15 bg-eucalyptus/[0.06] px-3 py-1 font-display text-[0.65rem] font-bold uppercase tracking-[0.14em] text-eucalyptus">
                  First Flight
                </span>

                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-eucalyptus/15"
                />
              </div>

              <h3 className="font-display text-[clamp(1.2rem,2vw,1.4rem)] font-semibold tracking-[-0.025em] text-ink">
                Drone still in the box?
              </h3>

              <div className="mt-3 max-w-[38rem] space-y-3 text-[0.97rem] leading-relaxed text-ink-soft">
                <p>
                  That&rsquo;s completely fine. For First Flight, getting your
                  drone set up can be part of the session.
                </p>

                <p>
                  If your aircraft requires firmware updates, account activation
                  or other preparation, we may recommend completing some of that
                  before arriving so we can maximise your flying time.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)