import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { ROUTES } from '@/lib/routes'

export const AboutPreview = () => (
  <Section tone="canvas" space="lg" aria-labelledby="about-preview-heading">
    <Container>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <ImageFrame slot="about-tom" ratio="aspect-[4/5]" rounded="panel" className="max-w-sm" />
        </Reveal>

        <Reveal delay={0.08} className="flex flex-col gap-5">
          <Eyebrow>Who you&rsquo;ll be flying with</Eyebrow>
          <h2 id="about-preview-heading" className="text-[clamp(1.9rem,4vw,2.7rem)]">
            Experience behind Drone Confidence.
          </h2>
          <div className="measure space-y-4 text-[1.03rem] leading-relaxed text-ink-soft">
            <p>
              Tom Gerrard has been professionally involved with drones since 2013, when he founded In
              Motion Aero during the early development of Australia&rsquo;s commercial drone industry.
            </p>
            <p>
              Over more than a decade, his work has included drone operations for major commercial and
              government clients across a range of real-world projects and environments — alongside a
              professional photography background that feeds directly into the Photo &amp; Video
              session.
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
