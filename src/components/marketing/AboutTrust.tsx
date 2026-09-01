import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { ROUTES } from '@/lib/routes'

const reassurances = [
  {
    title: 'Practical coaching, not a licence course',
    body: 'Drone Confidence helps everyday drone owners build practical flying confidence. It does not provide RePL qualifications or CASA certification.',
    link: { label: 'What the sessions cover', to: ROUTES.sessions },
  },
  {
    title: 'Weather matters',
    body: 'If conditions aren’t suitable, we’ll reschedule at no cost — or refund the session if a suitable alternative can’t be found.',
    link: { label: 'Booking & cancellation policy', to: ROUTES.bookingPolicy },
  },
]

/**
 * One trust area instead of four consecutive trust sections. The About preview
 * leads, the safety message is stated once and plainly, and the licence and
 * weather positions sit alongside it with links to the pages that carry the
 * full detail.
 */
export const AboutTrust = () => (
  <Section tone="sand" space="lg" aria-labelledby="about-trust-heading">
    <Container>
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <ImageFrame slot="about-tom" ratio="aspect-[4/5]" rounded="panel" className="max-w-sm" />
        </Reveal>

        <Reveal delay={0.08} className="flex flex-col gap-5">
          <h2 id="about-trust-heading" className="text-[clamp(1.9rem,4vw,2.7rem)]">
            Experience behind Drone Confidence.
          </h2>
          <div className="measure space-y-4 text-[1.03rem] leading-relaxed text-ink-soft">
            <p>
              Tom Gerrard has been professionally involved with drones since 2013, when he founded In
              Motion Aero during the early development of Australia&rsquo;s commercial drone industry.
            </p>
            <p>
              Over more than a decade his work has included drone operations for major commercial and
              government clients — alongside a professional photography background that feeds directly
              into the Photo &amp; Video session.
            </p>
          </div>
          <div className="pt-1">
            <LinkButton to={ROUTES.about} variant="secondary">
              More about Tom
            </LinkButton>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-16 border-t border-ink/12 pt-10">
        <p className="max-w-[34ch] font-display text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-snug tracking-[-0.025em]">
          Good flying is also knowing when not to take off.
        </p>
        <p className="measure pt-4 text-[1rem] leading-relaxed text-ink-soft">
          Location, conditions, battery, airspace and the people around you all matter. Safety and
          good decision-making are built naturally into every session, subject to applicable
          Australian drone rules and local operating requirements.
        </p>

        <dl className="mt-10 grid gap-x-14 gap-y-8 sm:grid-cols-2">
          {reassurances.map((item) => (
            <div key={item.title}>
              <dt className="font-display text-[1.1rem] font-semibold tracking-[-0.02em]">
                {item.title}
              </dt>
              <dd className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">
                {item.body}
                <Link
                  to={item.link.to}
                  className="mt-2 block text-[0.92rem] text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                >
                  {item.link.label}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Container>
  </Section>
)
