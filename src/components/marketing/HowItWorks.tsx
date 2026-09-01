import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'

interface Step {
  title: string
  body: ReactNode
}

/**
 * The customer journey, described once.
 *
 * This is the final public sequence and does not vary: it describes what
 * booking a session involves, never the state of an integration.
 */
const steps: Step[] = [
  {
    title: 'Choose your session',
    body: <p>First Flight, Fly With Confidence or Photo &amp; Video.</p>,
  },
  {
    title: 'Choose your training area and time',
    body: <p>Choose North or South Sydney and an available appointment.</p>,
  },
  {
    title: 'Tell us about your drone and book',
    body: <p>Answer a few short questions and complete payment securely online.</p>,
  },
  {
    title: 'Meet and fly',
    body: <p>Bring your drone, controller and charged batteries. We&rsquo;ll take it from there.</p>,
  },
]

export const HowItWorks = () => (
  <Section tone="surface" space="md" aria-labelledby="how-heading">
    <Container>
      <SectionHeading
        eyebrow="How it works"
        id="how-heading"
        title="Simple from booking to take-off."
        size="lg"
      />

      <Reveal as="ol" className="mt-11 grid gap-y-1 md:grid-cols-2 md:gap-x-16">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-5 border-t border-ink/10 py-6 md:gap-6">
            <span
              aria-hidden="true"
              className="mt-0.5 font-display text-[0.85rem] font-semibold tracking-[0.08em] text-sage"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="font-display text-[1.12rem] font-semibold tracking-[-0.02em]">
                {step.title}
              </h3>
              <div className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">{step.body}</div>
            </div>
          </li>
        ))}
      </Reveal>
    </Container>
  </Section>
)
