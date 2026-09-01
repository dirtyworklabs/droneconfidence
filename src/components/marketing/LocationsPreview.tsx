import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal, RevealGroup } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { LocationPanel } from '@/components/marketing/LocationPanel'
import { customLocationNote, locationDisclaimer, locations } from '@/content/locations'
import { CUSTOM_LOCATION_QUERY, ROUTES } from '@/lib/routes'

export const LocationsPreview = () => (
  <Section id="locations" tone="canvas" space="md" aria-labelledby="locations-heading">
    <Container>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
        <SectionHeading
          id="locations-heading"
          title="Two Sydney training areas."
          intro={<p>Choose the side of Sydney that&rsquo;s most convenient for you.</p>}
          size="lg"
        />
        <Reveal delay={0.1} className="shrink-0">
          <LinkButton to={ROUTES.locations} variant="quiet">
            All location details
          </LinkButton>
        </Reveal>
      </div>

      <RevealGroup as="ul" className="mt-11 grid gap-6 lg:grid-cols-2">
        {locations.map((location) => (
          <LocationPanel key={location.id} location={location} compact />
        ))}
      </RevealGroup>

      {/* Custom locations belong with the locations, not in a section of their own. */}
      <Reveal className="mt-10 flex flex-col gap-5 border-t border-ink/10 pt-8 sm:flex-row sm:items-start sm:justify-between sm:gap-12">
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
            Need somewhere else?
          </h3>
          <p className="text-[1rem] leading-relaxed text-ink-soft">
            Other Sydney locations may be possible by arrangement.
          </p>
          <p className="measure text-[0.9rem] leading-relaxed text-ink-muted">{customLocationNote}</p>
        </div>

        <div className="shrink-0">
          <LinkButton to={CUSTOM_LOCATION_QUERY} variant="secondary" withArrow>
            Request a Custom Location
          </LinkButton>
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <p className="measure text-[0.9rem] leading-relaxed text-ink-muted">{locationDisclaimer}</p>
      </Reveal>
    </Container>
  </Section>
)
