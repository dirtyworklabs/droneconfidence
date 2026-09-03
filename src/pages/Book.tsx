import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SYDNEY } from '@shared/booking/time'
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
import { BookingDetailsForm } from '@/components/booking/BookingDetailsForm'
import { useBookingSelection } from '@/components/booking/useBookingSelection'
import { formatPrice, sessions } from '@/content/sessions'
import { track } from '@/lib/analytics'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

/** "First Flight $180, Fly With Confidence $240, Photo & Video $280" — from the catalogue. */
const sessionPriceList = sessions
  .map((session) => `${session.name} ${formatPrice(session.price)}`)
  .join(', ')

/**
 * The permanent public booking entry point.
 *
 * Four steps, in order: session, training area, a real available time, then
 * details and payment. Session, area and the chosen time are mirrored in the URL
 * so deep links and browser history behave; the customer's own details are not.
 *
 * Nothing here fabricates availability, prices or confirmations. Times come from
 * the availability endpoint, the price charged is resolved on the server from the
 * session catalogue, and payment happens on Stripe's hosted page.
 */
const Book = () => {
  useSeo({
    title: 'Book a Drone Lesson Sydney | Drone Confidence',
    description: `Book a private one-on-one drone lesson in Sydney. ${sessionPriceList}. North and south Sydney training areas.`,
    path: '/book',
    structuredData: [serviceSchema()],
  })

  const { session, location, slot, currentStep, selectSession, selectLocation, selectSlot, clearSlot } =
    useBookingSelection()
  const [params, setParams] = useSearchParams()
  // Bumped whenever the server tells us the times we're showing are stale.
  const [refreshToken, setRefreshToken] = useState(0)
  const [timeZone, setTimeZone] = useState(SYDNEY)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    track('booking_page_viewed')
  }, [])

  // Coming back from an abandoned Stripe Checkout. The hold releases itself, so
  // all the customer needs is their place in the flow and an honest explanation.
  useEffect(() => {
    if (params.get('checkout') !== 'cancelled') return
    setNotice(
      'Payment was not completed, so nothing has been charged and that time has been released. Choose a time to try again.',
    )
    setRefreshToken((token) => token + 1)
    const next = new URLSearchParams(params)
    next.delete('checkout')
    next.delete('slot')
    setParams(next, { replace: true, preventScrollReset: true })
  }, [params, setParams])

  /** The chosen time was gone by the time we asked for it. Reopen step 3. */
  const handleSlotRejected = useCallback(() => {
    setNotice(
      'That time was taken while you were filling in your details. Nothing has been charged. Please choose another time.',
    )
    setRefreshToken((token) => token + 1)
    clearSlot()
  }, [clearSlot])

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

          {notice ? (
            <div
              role="status"
              className="mt-8 rounded-[var(--radius-control)] border border-sage/25 bg-sage/8 p-4 text-[0.93rem] leading-relaxed text-ink-soft"
            >
              {notice}
            </div>
          ) : null}

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
                  description="Available times are shown for your session and training area, in Sydney time. Payment is completed securely at the end of booking."
                  appear
                >
                  <BookingAvailability
                    sessionId={session.id}
                    locationId={location.id}
                    selected={slot}
                    onSelect={selectSlot}
                    refreshToken={refreshToken}
                    onTimeZone={setTimeZone}
                  />
                </BookingStep>
              ) : null}

              {session && location && slot ? (
                <BookingStep
                  id="booking-details"
                  number={4}
                  title="Your details & payment"
                  description={<>We only ask for what the lesson needs. You&rsquo;ll review everything before paying.</>}
                  appear
                >
                  <BookingDetailsForm
                    session={session}
                    location={location}
                    slot={slot}
                    timeZone={timeZone}
                    onSlotRejected={handleSlotRejected}
                  />
                </BookingStep>
              ) : null}
            </div>

            <BookingSummary session={session} location={location} slot={slot} timeZone={timeZone} />
          </div>
        </Container>
      </Section>

      <BookingPaymentInfo />
      <CustomLocationCallout />
    </>
  )
}

export default Book
