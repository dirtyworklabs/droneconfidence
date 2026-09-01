import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'

/**
 * The coaching philosophy, deliberately not the session scenarios — those are
 * covered by the SessionDetail sections directly below and by the homepage
 * examples, so this stays on how a session actually runs.
 */
const points = [
  {
    title: 'Your aircraft',
    body: 'Learn the drone, controller and settings you’ll actually use.',
  },
  {
    title: 'Real flying time',
    body: 'Most of the session happens with the controller in your hands.',
  },
  {
    title: 'Answers in the moment',
    body: 'Work through questions and uncertainty while they’re actually happening.',
  },
]

/**
 * A short bridge between "choose a session" and the detailed inclusions.
 * Intentionally lighter than a major marketing section: open editorial layout,
 * no cards, `sm` rhythm.
 */
export const SessionApproach = () => (
  <Section tone="sand" space="sm" aria-labelledby="session-approach-heading">
    <Container>
      <div className="grid gap-9 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-20">
        <Reveal className="flex flex-col gap-4">
          <Eyebrow>The approach</Eyebrow>
          <h2 id="session-approach-heading" className="text-[clamp(1.75rem,3.4vw,2.35rem)]">
            Built around you, not a fixed lesson plan.
          </h2>
          <p className="measure text-[1.04rem] leading-relaxed text-ink-soft">
            Whichever session you choose, we work with your drone, your experience and what you
            actually want to improve.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="flex flex-col">
          {points.map((point) => (
            <div
              key={point.title}
              className="border-b border-ink/10 py-4 first:border-t first:border-ink/10 last:border-b-0 sm:flex sm:gap-8"
            >
              <h3 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] sm:w-[11rem] sm:shrink-0">
                {point.title}
              </h3>
              <p className="pt-1.5 text-[0.99rem] leading-relaxed text-ink-soft sm:pt-0">
                {point.body}
              </p>
            </div>
          ))}

          <p className="pt-6 font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
            The goal is confidence to go flying without us.
          </p>
        </Reveal>
      </div>
    </Container>
  </Section>
)
