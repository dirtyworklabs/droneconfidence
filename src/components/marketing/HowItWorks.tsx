import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { bookingConfig } from '@/config/booking'
import { CUSTOM_LOCATION_QUERY } from '@/lib/routes'

interface Step {
  title: string
  body: ReactNode
}

const customLocationLink = (
  <Link
    to={CUSTOM_LOCATION_QUERY}
    className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
  >
    ask about a custom location
  </Link>
)

const liveSteps: Step[] = [
  {
    title: 'Choose your session',
    body: <p>First Flight, Fly With Confidence or Photo &amp; Video.</p>,
  },
  {
    title: 'Pick a time and training area',
    body: <p>Choose North or South Sydney and a suitable appointment.</p>,
  },
  {
    title: 'Tell us about your drone and book',
    body: <p>Answer a few short questions and pay securely online.</p>,
  },
  {
    title: 'Meet and fly',
    body: (
      <p>
        Bring your drone, controller and charged batteries. We&rsquo;ll take it from there.
      </p>
    ),
  },
]

/**
 * Pre-launch wording. It describes what actually happens today rather than
 * narrating the state of an integration, so the site reads as intentional —
 * and swaps to the live sequence on its own once booking is enabled.
 */
const preLaunchSteps: Step[] = [
  {
    title: 'Choose your session',
    body: <p>First Flight, Fly With Confidence or Photo &amp; Video.</p>,
  },
  {
    title: 'Pick a training area',
    body: <p>Choose North or South Sydney, or {customLocationLink}.</p>,
  },
  {
    title: 'Tell us about your drone',
    body: <p>Send a few details about what you own and what you&rsquo;d like help with.</p>,
  },
  {
    title: 'Register your interest',
    body: <p>We&rsquo;ll contact you when suitable online booking becomes available.</p>,
  },
]

export const HowItWorks = () => {
  const steps = bookingConfig.bookingEnabled ? liveSteps : preLaunchSteps

  return (
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
}
