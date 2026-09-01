import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RevealGroup } from '@/components/ui/Reveal'
import { SessionCard } from '@/components/marketing/SessionCard'
import { sessions } from '@/content/sessions'

export const SessionsOverview = () => (
  <Section id="sessions" tone="sage" space="lg" aria-labelledby="sessions-heading">
    <Container>
      <SectionHeading
        eyebrow="Three sessions"
        id="sessions-heading"
        title="Choose where you want to start."
        intro={
          <p>
            Every session is private, one-on-one and flown on your own aircraft. Session lengths are
            fixed, so you know exactly what you&rsquo;re booking.
          </p>
        }
        size="lg"
      />

      <RevealGroup as="ul" className="mt-12 grid gap-6 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </RevealGroup>
    </Container>
  </Section>
)
