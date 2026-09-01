import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/cn'

/**
 * Quiet trust signals. Four only, separated by fine editorial rules rather than
 * bullet dots, so the strip reads as a masthead line and not a feature ticker.
 */
const signals = [
  'Working with drones since 2013',
  '10+ years commercial experience',
  'Government & commercial projects',
  'Professional photography background',
]

export const ExperienceStrip = () => (
  <div className="border-y border-ink/8 bg-surface">
    <Container className="py-6 sm:py-7">
      <Reveal
        as="ul"
        distance={10}
        className="grid gap-x-8 gap-y-2.5 text-[0.92rem] leading-snug text-ink-soft sm:grid-cols-2 lg:grid-cols-4"
      >
        {signals.map((signal, index) => (
          <li
            key={signal}
            className={cn('lg:border-l lg:border-ink/10 lg:pl-6', index === 0 && 'lg:border-l-0 lg:pl-0')}
          >
            {signal}
          </li>
        ))}
      </Reveal>
    </Container>
  </div>
)
