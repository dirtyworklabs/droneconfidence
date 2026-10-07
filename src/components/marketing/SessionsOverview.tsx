import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { SessionCard } from '@/components/marketing/SessionCard'
import { activeSession } from '@/content/sessions'

/** The homepage's single beginner lesson, presented as one deliberate offering. */
export const SessionsOverview = () => (
  <Section id="sessions" tone="sage" space="lg" aria-labelledby="sessions-heading">
    <Container>
      <SectionHeading
        eyebrow="Beginner lesson"
        id="sessions-heading"
        title="Start with the fundamentals."
        intro={
          <p>
            One focused lesson: private, one-on-one and flown on your own aircraft.
          </p>
        }
        size="lg"
      />

      <div className="mt-11">
        <SessionCard session={activeSession} />
      </div>
    </Container>
  </Section>
)
