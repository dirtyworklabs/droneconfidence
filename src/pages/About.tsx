import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { ExperienceStrip } from '@/components/marketing/ExperienceStrip'
import { NotALicence } from '@/components/marketing/NotALicence'
import { FinalCta } from '@/components/marketing/FinalCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { Reveal } from '@/components/ui/Reveal'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { useSeo } from '@/lib/seo'
import { localBusinessSchema } from '@/lib/structuredData'

const About = () => {
  useSeo({
    title: 'About Drone Confidence | Private Drone Coaching Sydney',
    description:
      'Drone Confidence is run by Tom Gerrard, professionally involved with drones since 2016 across commercial and government projects, with a photography background.',
    path: '/about',
    structuredData: [localBusinessSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="About"
        title="Experience behind Drone Confidence."
      />

      <Section tone="canvas" space="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <ImageFrame
                  slot="about-tom"
                  ratio="aspect-[4/3]"
                  rounded="panel"
                />

                <p className="pt-4 text-[0.9rem] text-ink-muted">
                  Tom Gerrard · Founder, Drone Confidence
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col gap-6">
              <div className="space-y-5 text-[1.06rem] leading-relaxed text-ink-soft">
                <p>
                  Tom has been professionally involved with drones since 2016,
                  including through In Motion Aero, which held a UAV
                  Operator&rsquo;s Certificate (UOC) and conducted commercial
                  unmanned aircraft operations in Australia.
                </p>

                <p>
                  He currently holds RPA operator accreditation covering
                  excluded RPA, micro RPA and model aircraft. His work has
                  included drone operations for major commercial and government
                  clients across a range of real-world projects and
                  environments.
                </p>

                <p>
                  Tom also works professionally as a creative technologist and
                  photographer, bringing practical experience in cameras,
                  composition and image-making to Drone Confidence&rsquo;s
                  Photo &amp; Video sessions.
                </p>

                <p>
                  After years of working with both professional operators and
                  everyday drone owners, he kept seeing the same problem:
                </p>
              </div>

              <blockquote className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-7 sm:p-8">
                <Eyebrow>The gap</Eyebrow>

                <div className="space-y-3 pt-4 font-display text-[clamp(1.15rem,2.3vw,1.4rem)] font-semibold leading-snug tracking-[-0.02em] text-eucalyptus">
                  <p>
                    Some people don&rsquo;t want a drone qualification.
                  </p>

                  <p>
                    They&rsquo;ve simply bought a drone and want an experienced
                    person to spend an hour or two showing them how to use it
                    properly.
                  </p>
                </div>
              </blockquote>

              <p className="font-display text-[1.2rem] font-semibold tracking-[-0.02em]">
                That&rsquo;s what Drone Confidence is for.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      <ExperienceStrip />
      <NotALicence />
      <FinalCta />
    </>
  )
}

export default About