import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHero } from '@/components/marketing/PageHero'
import { BookingPaymentInfo } from '@/components/marketing/BookingPaymentInfo'
import { CustomLocationCallout } from '@/components/marketing/CustomLocationCallout'
import { BookingProgress } from '@/components/booking/BookingProgress'
import { BookingStep } from '@/components/booking/BookingStep'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { SessionSelector } from '@/components/booking/SessionSelector'
import { LocationSelector } from '@/components/booking/LocationSelector'
import { BookingAvailability } from '@/components/booking/BookingAvailability'
import { useBookingSelection } from '@/components/booking/useBookingSelection'
import { track } from '@/lib/analytics'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

/**
 * The permanent public booking entry point.
 *
 * Session and training area are chosen here, mirrored in the URL so deep links
 * and browser history behave, and the availability step is the single boundary
 * the real booking implementation plugs into. Nothing on this page depends on
 * whether that integration exists yet, and nothing here fabricates times,
 * payments or confirmations.
 */
const Book = () => {
  useSeo({
    title: 'Book a Drone Lesson Sydney | Drone Confidence',
    description:
      'Book a private one-on-one drone lesson in Sydney. First Flight $179, Fly With Confidence $239, Photo & Video $269. North and south Sydney training areas.',
    path: '/book',
    structuredData: [serviceSchema()],
  })

  const { session, location, currentStep, selectSession, selectLocation } = useBookingSelection()

  useEffect(() => {
    track('booking_page_viewed')
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Booking"
        title="Book your session."
        intro={
          <p>
            Choose the session and Sydney training area that suit you. You&rsquo;ll then choose an
            available time, tell us a little about your drone and complete payment securely online.
          </p>
        }
      />

      <Section tone="canvas" space="sm" aria-labelledby="booking-flow-heading">
        <Container>
          <h2 id="booking-flow-heading" className="sr-only">
            Start your booking
          </h2>

          <Reveal>
            <BookingProgress currentStep={currentStep} />
          </Reveal>

          <div className="mt-10 grid items-start gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
            <div className="flex flex-col gap-12 sm:gap-14">
              <Reveal>
                <BookingStep
                  id="booking-session"
                  number={1}
                  title="Choose your session"
                  description="Each session is private, one-on-one and a fixed length, using your own drone."
                >
                  <SessionSelector selectedId={session?.id ?? null} onSelect={selectSession} />
                </BookingStep>
              </Reveal>

              {session ? (
                <BookingStep
                  id="booking-location"
                  number={2}
                  title="Choose your training area"
                  description={<>Pick the side of Sydney that&rsquo;s most convenient for you.</>}
                  appear
                >
                  <LocationSelector selectedId={location?.id ?? null} onSelect={selectLocation} />
                </BookingStep>
              ) : null}

              {session && location ? (
                <BookingStep
                  id="booking-availability"
                  number={3}
                  title="Choose a date & time"
                  description="Available times are shown for your session and training area. Payment is completed securely at the end of booking."
                  appear
                >
                  <BookingAvailability sessionId={session.id} locationId={location.id} />
                </BookingStep>
              ) : null}
            </div>

            <BookingSummary session={session} location={location} />
          </div>
        </Container>
      </Section>

      <BookingPaymentInfo />
      <CustomLocationCallout />
    </>
  )
}

export default Book
