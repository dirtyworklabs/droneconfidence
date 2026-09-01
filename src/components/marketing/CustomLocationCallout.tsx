import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { customLocationCopy } from '@/content/locations'
import { CUSTOM_LOCATION_QUERY } from '@/lib/routes'

interface CustomLocationCalloutProps {
  /** Renders without the surrounding section wrapper. */
  bare?: boolean
}

const Body = () => (
  <div className="flex flex-col items-start gap-6 rounded-[var(--radius-panel)] border border-sand/80 bg-sand-soft/70 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
    <div className="flex flex-col gap-4">
      <Eyebrow>Custom locations</Eyebrow>
      <h2 className="text-[clamp(1.6rem,3.2vw,2.15rem)]">Need somewhere else?</h2>
      <p className="measure text-[1rem] leading-relaxed text-ink-soft">
        Other Sydney locations may be possible by arrangement.
      </p>
      <p className="measure text-[0.95rem] leading-relaxed text-ink-muted">{customLocationCopy}</p>
    </div>

    <div className="shrink-0">
      <LinkButton to={CUSTOM_LOCATION_QUERY} variant="secondary" size="lg">
        Request a Custom Location
      </LinkButton>
    </div>
  </div>
)

export const CustomLocationCallout = ({ bare = false }: CustomLocationCalloutProps) => {
  if (bare) return <Body />

  return (
    <Section tone="canvas" space="md">
      <Container>
        <Reveal>
          <Body />
        </Reveal>
      </Container>
    </Section>
  )
}
