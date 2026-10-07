import { PageHero } from '@/components/marketing/PageHero'
import { SessionApproach } from '@/components/marketing/SessionApproach'
import { SessionDetail } from '@/components/marketing/SessionDetail'
import { WhatToBring } from '@/components/marketing/WhatToBring'
import { DroneFamilies } from '@/components/marketing/DroneFamilies'
import { SafetyTrust } from '@/components/marketing/SafetyTrust'
import { NotALicence } from '@/components/marketing/NotALicence'
import { FinalCta } from '@/components/marketing/FinalCta'
import { BookingCta } from '@/components/booking/BookingCta'
import { activeSession, formatDuration, formatPrice } from '@/content/sessions'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

/** The headline facts, read from the catalogue so the page can't drift from the price charged. */
const facts = [
  formatPrice(activeSession.price),
  formatDuration(activeSession.durationMinutes),
  'Private one-on-one',
  'Your own aircraft',
  'Beginner focus',
]

/**
 * The beginner lesson page. The URL stays /sessions for existing links and
 * search history; the content is the one public lesson, First Flight.
 */
const Sessions = () => {
  useSeo({
    title: 'Beginner Drone Lesson Sydney | First Flight',
    description: `First Flight: a private ${activeSession.durationMinutes}-minute beginner drone lesson in Sydney for ${formatPrice(activeSession.price)}. Setup, controls, take-off, landing, Return-to-Home and the fundamentals, on your own drone.`,
    path: '/sessions',
    structuredData: [serviceSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="Beginner lesson"
        title={`${activeSession.name}.`}
        intro={
          <>
            <p>
              A private {activeSession.durationMinutes}-minute beginner session built around your own
              drone, your questions and getting you confidently through the fundamentals.
            </p>
            <ul aria-label="Lesson at a glance" className="flex flex-wrap gap-2 pt-1">
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="rounded-full border border-ink/10 bg-surface px-3.5 py-1.5 font-display text-[0.86rem] font-semibold tracking-[-0.01em] text-ink"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </>
        }
        actions={
          <BookingCta sessionId={activeSession.id} size="lg" context="sessions-hero" withArrow>
            {activeSession.ctaLabel}
          </BookingCta>
        }
        className="!pb-6 sm:!pb-8"
      />

      <SessionApproach />

      <SessionDetail session={activeSession} index={0} />

      <WhatToBring />

      <DroneFamilies />

      <SafetyTrust />

      <NotALicence />

      <FinalCta />
    </>
  )
}

export default Sessions
