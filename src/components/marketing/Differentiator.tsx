import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'

const examples = [
  'If you’ve bought a DJI Mini and you’re worried about losing it, we’ll work on that.',
  'If Return-to-Home doesn’t make sense, we’ll go through it.',
  'If you can fly perfectly well but your video looks jerky, we’ll spend more time on movement and camera technique.',
  'If you’ve barely taken the drone out of the box, we’ll start there.',
]

export const Differentiator = () => (
  <Section tone="deep" space="lg" aria-labelledby="differentiator-heading" className="overflow-hidden">
    <TopoBackdrop tone="light" fade={false} className="opacity-60" />

    <Container className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <Reveal className="flex flex-col gap-5">
          <Eyebrow tone="onDark">The difference</Eyebrow>
          <h2 id="differentiator-heading" className="text-canvas text-[clamp(1.9rem,4vw,2.8rem)]">
            Your drone. Your questions. Your session.
          </h2>
          <p className="measure text-sage-soft/85">
            This isn&rsquo;t group training with a fixed lesson plan.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <ul className="flex flex-col">
            {examples.map((example) => (
              <li
                key={example}
                className="border-b border-sage/25 py-5 text-[1.04rem] leading-relaxed text-sage-soft/90 first:pt-0 last:border-b-0 last:pb-0"
              >
                {example}
              </li>
            ))}
          </ul>
          <p className="pt-7 font-display text-[1.35rem] font-semibold tracking-[-0.02em] text-canvas">
            The session adapts to you.
          </p>
        </Reveal>
      </div>
    </Container>
  </Section>
)
