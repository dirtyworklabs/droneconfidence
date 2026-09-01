import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { LocationPanel } from '@/components/marketing/LocationPanel'
import { CustomLocationCallout } from '@/components/marketing/CustomLocationCallout'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { FinalCta } from '@/components/marketing/FinalCta'
import { Reveal, RevealGroup } from '@/components/ui/Reveal'
import { locationDisclaimer, locations } from '@/content/locations'
import { useSeo } from '@/lib/seo'
import { localBusinessSchema } from '@/lib/structuredData'

const Locations = () => {
  useSeo({
    title: 'Drone Training North & South Sydney | Drone Confidence',
    description:
      'Private drone training in two Sydney areas: around Taren Point in the south and North Ryde in the north. Custom Sydney locations by arrangement.',
    path: '/locations',
    structuredData: [localBusinessSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="Locations"
        title="Two Sydney training areas."
        intro={<p>Choose the side of Sydney that&rsquo;s most convenient for you.</p>}
      />

      <Section tone="canvas" space="sm">
        <Container>
          <RevealGroup as="ul" className="grid gap-6 lg:grid-cols-2">
            {locations.map((location) => (
              <LocationPanel key={location.id} location={location} headingLevel="h2" />
            ))}
          </RevealGroup>

          <Reveal className="mt-8">
            <p className="measure text-[0.92rem] leading-relaxed text-ink-muted">{locationDisclaimer}</p>
          </Reveal>
        </Container>
      </Section>

      <CustomLocationCallout />
      <HowItWorks />
      <FinalCta />
    </>
  )
}

export default Locations
