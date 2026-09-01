import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { ROUTES } from '@/lib/routes'

export const AboutTrust = () => (
  <Section tone="sand" space="lg" aria-labelledby="about-trust-heading">
    <Container>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <ImageFrame
            slot="about-tom"
            ratio="aspect-[4/5]"
            rounded="panel"
            className="max-w-sm"
          />
        </Reveal>

        <Reveal delay={0.08} className="flex flex-col gap-5">
          <h2
            id="about-trust-heading"
            className="text-[clamp(1.9rem,4vw,2.7rem)]"
          >
            Experience behind Drone Confidence.
          </h2>

          <div className="measure space-y-4 text-[1.03rem] leading-relaxed text-ink-soft">
            <p>
              Tom Gerrard has been professionally involved with drones since 2016,
              including through In Motion Aero, which previously held a UAV
              Operator&rsquo;s Certificate (UOC) and conducted commercial unmanned
              aircraft operations in Australia.
            </p>
          </div>

          <div className="pt-1">
            <LinkButton to={ROUTES.about} variant="secondary">
              More about Tom
            </LinkButton>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
)