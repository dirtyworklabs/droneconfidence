import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RevealGroup } from '@/components/ui/Reveal'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { LocationPanel } from '@/components/marketing/LocationPanel'
import { locationDisclaimer, locations } from '@/content/locations'

export const LocationsPreview = () => (
  <Section id="locations" tone="canvas" space="lg" aria-labelledby="locations-heading">
    <Container>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Where we fly"
          id="locations-heading"
          title="Two Sydney training areas."
          intro={<p>Choose the side of Sydney that&rsquo;s most convenient for you.</p>}
          size="lg"
        />
        <Reveal delay={0.1} className="shrink-0">
          <LinkButton to="/locations" variant="secondary">
            All location details
          </LinkButton>
        </Reveal>
      </div>

      <RevealGroup as="ul" className="mt-12 grid gap-6 lg:grid-cols-2">
        {locations.map((location) => (
          <LocationPanel key={location.id} location={location} compact />
        ))}
      </RevealGroup>

      <Reveal className="mt-8">
        <p className="measure text-[0.92rem] leading-relaxed text-ink-muted">{locationDisclaimer}</p>
      </Reveal>
    </Container>
  </Section>
)
