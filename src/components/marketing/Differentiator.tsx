import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { ROUTES } from '@/lib/routes'

/**
 * Three real situations, not a catalogue of them. Kept short on purpose — the
 * detailed inclusions for each session live on /sessions.
 */
const examples = [
  'New drone? Work through setup, controls, Return-to-Home and the basics.',
  'Already flying? Build smoother control, orientation and better judgement.',
  'Want better imagery? Focus on camera settings, movement and shot technique.',
]

/**
 * One concise editorial statement of the personalised coaching model. The
 * fuller philosophy (own aircraft, real flying time, answers in the moment)
 * now lives in SessionApproach on /sessions.
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
            This isn&rsquo;t group training with a fixed lesson plan. We start with your drone, your
            experience and what you actually want to improve.
          </p>
          <p className="measure text-[1.02rem] leading-relaxed text-sage-soft/85">
            The goal is confidence to go flying without us.
          </p>
          <div className="pt-2">
            <LinkButton to={ROUTES.sessions} variant="onDark" size="lg" withArrow>
              Explore the Sessions
            </LinkButton>
          </div>
        </Reveal>

        <Reveal delay={0.08} as="ul" className="flex flex-col lg:pt-2">
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
    </Container>
  </Section>
)
