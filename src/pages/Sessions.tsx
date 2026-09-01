import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { SessionComparison } from '@/components/marketing/SessionComparison'
import { SessionDetail } from '@/components/marketing/SessionDetail'
import { WhatToBring } from '@/components/marketing/WhatToBring'
import { NotALicence } from '@/components/marketing/NotALicence'
import { FinalCta } from '@/components/marketing/FinalCta'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { sessions } from '@/content/sessions'
import { ASK_A_QUESTION_QUERY } from '@/lib/routes'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

const guidance = [
  { situation: 'Never flown', answer: 'First Flight' },
  { situation: 'Can fly but lack confidence', answer: 'Fly With Confidence' },
  { situation: 'Comfortable flying and want better imagery', answer: 'Photo & Video' },
]

const Sessions = () => {
  useSeo({
    title: 'Private Drone Lessons Sydney | Drone Confidence',
    description:
      'Three private one-on-one drone sessions in Sydney: First Flight ($179, 60 min), Fly With Confidence ($239, 90 min) and Photo & Video ($269, 90 min).',
    path: '/sessions',
    structuredData: [serviceSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="Sessions"
        title="Three sessions. One at a time, built around you."
        intro={
          <>
            <p>
              Every session is private, one-on-one and flown on your own aircraft. Session lengths are
              fixed, so you always know exactly what you&rsquo;re booking.
            </p>
          </>
        }
      />

      <Section tone="canvas" space="sm" aria-labelledby="at-a-glance-heading">
        <SessionComparison />
      </Section>

      {sessions.map((session, index) => (
        <SessionDetail key={session.id} session={session} index={index} />
      ))}

      <Section tone="sage" space="lg" aria-labelledby="which-session-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
            <Reveal className="flex flex-col gap-5">
              <Eyebrow>Choosing</Eyebrow>
              <h2 id="which-session-heading" className="text-[clamp(1.8rem,3.8vw,2.5rem)]">
                Not sure which session?
              </h2>
              <p className="measure text-ink-soft">
                Still unsure? Tell us what you&rsquo;d like help with and we&rsquo;ll point you in the
                right direction.
              </p>
              <div className="pt-1">
                <LinkButton to={ASK_A_QUESTION_QUERY} variant="secondary" size="lg">
                  Ask a Question
                </LinkButton>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <dl className="flex flex-col">
                {guidance.map((item) => (
                  <div
                    key={item.situation}
                    className="flex flex-col gap-1 border-b border-ink/10 py-5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <dt className="text-[1rem] text-ink-soft">{item.situation}</dt>
                    <dd className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-eucalyptus">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </Container>
      </Section>

      <WhatToBring />
      <NotALicence />
      <FinalCta />
    </>
  )
}

export default Sessions
