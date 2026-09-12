import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { ExperienceStrip } from '@/components/marketing/ExperienceStrip'
import { NotALicence } from '@/components/marketing/NotALicence'
import { FinalCta } from '@/components/marketing/FinalCta'
import { AboutGallery } from '@/components/marketing/AboutGallery'
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
        title="Meet your drone coach."
        className="!pb-2 sm:!pb-4"
      />

      <Section tone="canvas" space="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <div className="lg:sticky lg:top-28">
                <AboutGallery />

                <p className="pt-4 text-[0.9rem] text-ink-muted">
                  Tom Gerrard · Founder, Drone Confidence
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col gap-6">
              <div className="space-y-5 text-[1.06rem] leading-relaxed text-ink-soft">
                <p>
                  Tom Gerrard has worked professionally with drones since 2016, including founding
                  and operating In Motion Aero, which delivered commercial drone projects
                  across Australia under a UAV Operator&rsquo;s Certificate (UOC).
                </p>

                <p>
                  He currently holds RPA operator accreditation covering excluded RPA, micro
                  RPA and model aircraft. Over the years, his drone work has taken him across
                  a wide range of real-world environments, working with major commercial and
                  government clients.
                </p>

                <p>
                  Alongside drones, Tom works professionally as a creative technologist and
                  photographer. That experience with cameras, composition and image-making
                  also shapes Drone Confidence&rsquo;s Photo &amp; Video sessions.
                </p>

                <p>
                  Through years of working with professional operators and everyday drone
                  owners, one thing kept coming up:
                </p>
              </div>

              <blockquote className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-7 sm:p-8">
                <Eyebrow>The gap</Eyebrow>

                <div className="space-y-3 pt-4 font-display text-[clamp(1.15rem,2.3vw,1.4rem)] font-semibold leading-snug tracking-[-0.02em] text-eucalyptus">
                  <p>
                    Some people don&rsquo;t want a drone qualification.
                  </p>

                  <p>
                    They&rsquo;ve just bought a drone and want an experienced
                    person to show them how to use it.
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