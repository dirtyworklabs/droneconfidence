import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/ui/Reveal'

const reasons = [
  {
    title: 'Individual attention',
    body: 'There are no other students competing for flying time or asking unrelated questions.',
  },
  {
    title: 'Practical experience',
    body: 'Most of the session happens with a controller in your hands rather than sitting through presentations.',
  },
  {
    title: 'Training on your own aircraft',
    body: 'You’ll leave knowing how your drone, controller, menus, batteries and safety settings work.',
  },
  {
    title: 'Real-world answers',
    body: 'Ask questions as they happen rather than trying to find the answer later.',
  },
  {
    title: 'Confidence to fly without us',
    body: 'The goal isn’t to make you dependent on more lessons. It’s to help you become comfortable enough to go flying by yourself.',
  },
]

export const WhyOneOnOne = () => (
  <Section tone="canvas" space="lg" aria-labelledby="why-heading">
    <Container>
      <SectionHeading
        eyebrow="Why one-on-one"
        id="why-heading"
        title="Learn by actually flying."
        intro={
          <div className="space-y-3">
            <p>Watching tutorials is useful.</p>
            <p>
              It&rsquo;s very different to having someone experienced standing beside you while
              you&rsquo;re holding the controller.
            </p>
          </div>
        }
        size="lg"
      />

      <RevealGroup as="dl" className="mt-12 grid gap-x-16 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason, index) => (
          <RevealItem key={reason.title} className="border-t border-ink/10 py-6">
            <dt className="flex items-baseline gap-3 font-display text-[1.1rem] font-semibold tracking-[-0.02em]">
              <span aria-hidden="true" className="font-sans text-[0.72rem] font-medium tracking-[0.14em] text-sage">
                {String(index + 1).padStart(2, '0')}
              </span>
              {reason.title}
            </dt>
            <dd className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">{reason.body}</dd>
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  </Section>
)
