import { Container } from '@/components/ui/Container'
import { RevealGroup, RevealItem } from '@/components/ui/Reveal'

/** Quiet trust signals — deliberately not oversized vanity statistics. */
const signals = [
  'Working with drones since 2013',
  '10+ years commercial experience',
  'Government & commercial projects',
  'Drone industry & regulatory experience',
  'Professional photography background',
]

export const ExperienceStrip = () => (
  <div className="border-y border-ink/8 bg-surface">
    <Container className="py-7">
      <RevealGroup
        as="ul"
        staggerChildren={0.05}
        className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[0.92rem] text-ink-soft"
      >
        {signals.map((signal) => (
          <RevealItem as="li" key={signal} className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sage/60" />
            {signal}
          </RevealItem>
        ))}
      </RevealGroup>
    </Container>
  </div>
)
