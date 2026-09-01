import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'

const knowing = [
  'whether the location is suitable',
  'what the aircraft is going to do',
  'how much battery you need',
  'what Return-to-Home is set to do',
  'how weather affects the flight',
  'where other people and aircraft are',
  'when conditions aren’t right',
  'when it’s better not to take off at all',
]

export const SafetyTrust = () => (
  <Section tone="sand" space="lg" aria-labelledby="safety-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <SectionHeading
          eyebrow="Safety & judgement"
          id="safety-heading"
          title="Confidence starts with knowing when to fly."
          intro={
            <div className="space-y-3">
              <p>Good drone flying isn&rsquo;t just about stick control.</p>
              <p>It&rsquo;s also knowing:</p>
            </div>
          }
          size="lg"
        />

        <div className="flex flex-col gap-7">
          <RevealGroup as="ul" staggerChildren={0.04} className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {knowing.map((item) => (
              <RevealItem as="li" key={item} className="flex items-start gap-3 py-1.5">
                <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-eucalyptus/40" />
                <span className="text-[0.99rem] leading-relaxed text-ink-soft">{item}</span>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.06} className="space-y-3 border-t border-ink/10 pt-6">
            <p className="font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em]">
              Safety and good decision-making are built naturally into every Drone Confidence session.
            </p>
            <p className="text-[0.94rem] leading-relaxed text-ink-muted">
              All sessions are conducted subject to applicable Australian drone rules, airspace
              restrictions and local operating requirements.
            </p>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)
