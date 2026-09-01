import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { CUSTOM_LOCATION_QUERY } from '@/lib/routes'

interface Step {
  title: string
  body: React.ReactNode
}

const steps: Step[] = [
  {
    title: 'Choose your session',
    body: <p>Pick First Flight, Fly With Confidence or Photo &amp; Video.</p>,
  },
  {
    title: 'Choose North or South',
    body: (
      <>
        <p>Choose the standard training area that&rsquo;s most convenient for you.</p>
        <p className="pt-2">
          Need another location?{' '}
          <Link
            to={CUSTOM_LOCATION_QUERY}
            className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
          >
            Send a custom-location enquiry
          </Link>{' '}
          first.
        </p>
      </>
    ),
  },
  {
    title: 'Tell us about your drone',
    body: (
      <p>
        When booking, we&rsquo;ll ask for your drone model, experience level and anything you&rsquo;d
        particularly like help with.
      </p>
    ),
  },
  {
    title: 'Book and pay online',
    body: (
      <p>
        Once online booking is enabled, sessions are booked and paid in full at the time of booking.
        This secures your appointment.
      </p>
    ),
  },
  {
    title: 'We’ll confirm the details',
    body: (
      <p>
        You&rsquo;ll receive your booking information and meeting instructions before the session.
        We&rsquo;ll also keep an eye on the forecast and flying conditions.
      </p>
    ),
  },
  {
    title: 'Meet and go flying',
    body: <p>Bring your drone, controller, phone or tablet and charged batteries.</p>,
  },
]

export const HowItWorks = () => (
  <Section tone="surface" space="lg" aria-labelledby="how-heading">
    <Container>
      <SectionHeading
        eyebrow="How it works"
        id="how-heading"
        title="Simple from booking to take-off."
        size="lg"
      />

      <RevealGroup as="ol" staggerChildren={0.06} className="relative mt-12 grid gap-y-2 md:grid-cols-2 md:gap-x-16">
        {steps.map((step, index) => (
          <RevealItem
            as="li"
            key={step.title}
            className="relative flex gap-5 border-t border-ink/8 py-6 md:gap-6"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-sage/30 bg-sage-soft font-display text-[0.9rem] font-bold text-eucalyptus"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="font-display text-[1.12rem] font-semibold tracking-[-0.02em]">{step.title}</h3>
              <div className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">{step.body}</div>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  </Section>
)
