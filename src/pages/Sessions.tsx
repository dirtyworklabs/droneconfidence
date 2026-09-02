import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { SessionComparison } from '@/components/marketing/SessionComparison'
import { SessionApproach } from '@/components/marketing/SessionApproach'
import { SessionDetail } from '@/components/marketing/SessionDetail'
import { WhatToBring } from '@/components/marketing/WhatToBring'
import { DroneFamilies } from '@/components/marketing/DroneFamilies'
import { SafetyTrust } from '@/components/marketing/SafetyTrust'
import { NotALicence } from '@/components/marketing/NotALicence'
import { FinalCta } from '@/components/marketing/FinalCta'
import { sessions } from '@/content/sessions'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

const Sessions = () => {
  useSeo({
    title: 'Private Drone Lessons Sydney | Drone Confidence',
    description:
      'Three private one-on-one drone sessions in Sydney: First Flight ($180, 60 min), Fly With Confidence ($240, 90 min) and Photo & Video ($280, 90 min).',
    path: '/sessions',
    structuredData: [serviceSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="Sessions"
        title="Three sessions."
        intro={
          <p>
            Each has a fixed duration and clear focus, while the coaching itself
            adapts to your aircraft and what you want to improve.
          </p>
        }
        className="!pb-6 sm:!pb-8"
      />

      <Section
        tone="canvas"
        space="sm"
        aria-labelledby="at-a-glance-heading"
        className="!pt-0"
      >
        <SessionComparison />
      </Section>

      <SessionApproach />

      {sessions.map((session, index) => (
        <SessionDetail
          key={session.id}
          session={session}
          index={index}
        />
      ))}

      <WhatToBring />

      <DroneFamilies />

      <SafetyTrust />

      <NotALicence />

      <FinalCta />
    </>
  )
}

export default Sessions