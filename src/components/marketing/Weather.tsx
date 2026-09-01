import { CloudRain, RefreshCw, Wind } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { ROUTES } from '@/lib/routes'

const signals = [
  { icon: CloudRain, label: 'Rain' },
  { icon: Wind, label: 'Strong wind' },
  { icon: RefreshCw, label: 'Free reschedule' },
]

export const Weather = () => (
  <Section tone="surface" space="lg" aria-labelledby="weather-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
        <SectionHeading
          eyebrow="Weather"
          id="weather-heading"
          title="What if the weather doesn’t cooperate?"
          size="lg"
        />

        <div className="flex flex-col gap-6">
          <Reveal className="space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
            <p>Drone lessons depend on suitable flying conditions.</p>
            <p>
              Rain, strong wind or other conditions can sometimes mean a session shouldn&rsquo;t go
              ahead.
            </p>
            <p className="font-display text-[1.12rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
              If we determine that conditions aren&rsquo;t suitable, we&rsquo;ll reschedule your
              session at no cost — or, if a suitable alternative time can&rsquo;t be found, refund you
              in full.
            </p>
            <p>
              You won&rsquo;t be charged a cancellation fee for a weather-related change initiated by
              Drone Confidence.
            </p>
          </Reveal>

          <Reveal delay={0.08} className="flex flex-wrap items-center gap-3">
            {signals.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-[var(--radius-chip)] border border-ink/8 bg-canvas px-3.5 py-2 text-[0.87rem] text-ink-soft"
              >
                <Icon aria-hidden="true" className="size-3.5 text-sage" />
                {label}
              </span>
            ))}
          </Reveal>

          <Reveal delay={0.12}>
            <LinkButton to={ROUTES.bookingPolicy} variant="quiet">
              Read the booking &amp; cancellation policy
            </LinkButton>
          </Reveal>
        </div>
      </div>
    </Container>
  </Section>
)
