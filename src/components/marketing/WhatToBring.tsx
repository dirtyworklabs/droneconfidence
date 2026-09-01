import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'

const items = [
  'Your drone',
  'Controller',
  'Phone or tablet if required',
  'All available batteries',
  'Charging hub if you have one',
  'Memory card',
  'Any ND filters or accessories you want help with',
  'The relevant drone app already installed if possible',
]

export const WhatToBring = () => (
  <Section tone="canvas" space="lg" aria-labelledby="bring-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
        <SectionHeading
          eyebrow="On the day"
          id="bring-heading"
          title="Bring your drone. We’ll handle the rest."
          intro={<p>For most sessions, bring:</p>}
          size="lg"
        />

        <div className="flex flex-col gap-8">
          <RevealGroup as="ul" staggerChildren={0.04} className="grid gap-x-8 sm:grid-cols-2">
            {items.map((item) => (
              <RevealItem as="li" key={item} className="border-b border-ink/8 py-3 text-[0.99rem] text-ink-soft">
                {item}
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.06} className="rounded-[var(--radius-card)] border border-sand/70 bg-sand-soft/70 p-6 sm:p-7">
            <h3 className="font-display text-[1.1rem] font-semibold tracking-[-0.02em]">
              Drone still in the box?
            </h3>
            <div className="space-y-3 pt-2 text-[0.97rem] leading-relaxed text-ink-soft">
              <p>That&rsquo;s okay. For First Flight, setup can be part of the session.</p>
              <p>
                If your aircraft requires firmware updates, account activation or other preparation, we
                may recommend completing some of that before arriving so we can maximise your flying
                time.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)
