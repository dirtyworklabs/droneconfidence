import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'

/** Three real situations, not a catalogue of them. */
const examples = [
  'If you’ve bought a DJI Mini and you’re worried about losing it, we’ll work on that.',
  'If Return-to-Home doesn’t make sense, we’ll go through it.',
  'If you can fly perfectly well but your video looks jerky, we’ll spend the time on movement and camera technique.',
]

const benefits = [
  {
    title: 'Your aircraft',
    body: 'Learn the drone, controller and settings you’ll actually use.',
  },
  {
    title: 'Real flying time',
    body: 'Most of the session happens with the controller in your hands.',
  },
  {
    title: 'Answers when you need them',
    body: 'Work through questions and uncertainty while they are actually happening.',
  },
]

/**
 * The one section that carries the whole personalised-training argument. It
 * replaced two near-identical sections, so the page makes the point once and
 * makes it properly.
 */
export const Differentiator = () => (
  <Section tone="deep" space="md" aria-labelledby="differentiator-heading" className="overflow-hidden">
    <TopoBackdrop tone="light" fade={false} className="opacity-60" />

    <Container className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <Reveal className="flex flex-col gap-5">
          <h2 id="differentiator-heading" className="text-canvas text-[clamp(1.9rem,4vw,2.8rem)]">
            Your drone. Your questions. Your session.
          </h2>
          <p className="measure font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-sage-soft">
            This isn&rsquo;t group training with a fixed lesson plan.
          </p>
        </Reveal>

        <Reveal delay={0.08} as="ul" className="flex flex-col">
          {examples.map((example) => (
            <li
              key={example}
              className="border-b border-sage/25 py-5 text-[1.04rem] leading-relaxed text-sage-soft/90 first:pt-0 last:border-b-0 last:pb-0"
            >
              {example}
            </li>
          ))}
        </Reveal>
      </div>

      <Reveal className="mt-14 grid gap-x-14 gap-y-8 border-t border-sage/25 pt-10 sm:grid-cols-3">
        {benefits.map((benefit) => (
          <div key={benefit.title}>
            <h3 className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-canvas">
              {benefit.title}
            </h3>
            <p className="pt-2 text-[0.99rem] leading-relaxed text-sage-soft/85">{benefit.body}</p>
          </div>
        ))}
      </Reveal>

      <Reveal
        delay={0.06}
        className="mt-12 font-display text-[clamp(1.3rem,2.8vw,1.75rem)] font-semibold leading-snug tracking-[-0.025em] text-canvas"
      >
        The goal is confidence to go flying without us.
      </Reveal>
    </Container>
  </Section>
)
