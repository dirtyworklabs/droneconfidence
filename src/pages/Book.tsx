import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, HelpCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal, RevealGroup } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { PageHero } from '@/components/marketing/PageHero'
import { BookingPaymentInfo } from '@/components/marketing/BookingPaymentInfo'
import { CustomLocationCallout } from '@/components/marketing/CustomLocationCallout'
import { SessionChoiceCard } from '@/components/booking/SessionChoiceCard'
import { BookingEmbed } from '@/components/booking/BookingEmbed'
import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { bookingConfig } from '@/config/booking'
import { sessions } from '@/content/sessions'
import { ASK_A_QUESTION_QUERY, CUSTOM_LOCATION_QUERY, ROUTES } from '@/lib/routes'
import { track } from '@/lib/analytics'
import { useSeo } from '@/lib/seo'
import { serviceSchema } from '@/lib/structuredData'

/** Live hand-off: session choices lead straight to the external booking page. */
const BookingEnabledState = () => (
  <>
    <PageHero
      eyebrow="Booking"
      title="Book your session."
      intro={
        <p>
          Choose the session that&rsquo;s right for you, then select a date, time and location on our
          secure booking page.
        </p>
      }
    />

    <Section tone="canvas" space="sm" aria-labelledby="choose-session-heading">
      <Container>
        {/* The three cards are the heading's content; the label exists so the
            outline doesn't jump from the h1 to the card h3s. */}
        <h2 id="choose-session-heading" className="sr-only">
          Choose your session
        </h2>

        <RevealGroup className="grid gap-6 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionChoiceCard key={session.id} session={session} />
          ))}
        </RevealGroup>

        <Reveal className="mt-8 flex flex-col gap-3">
          <p className="measure flex items-start gap-2.5 text-[0.97rem] leading-relaxed text-ink-soft">
            <CalendarCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-sage" />
            You&rsquo;ll choose your date, time and training area on the secure booking page. Full
            payment is taken when your session is confirmed.
          </p>
          <p className="text-[0.95rem] text-ink-muted">
            Need a different Sydney location?{' '}
            <Link
              to={CUSTOM_LOCATION_QUERY}
              className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
            >
              Request a custom location
            </Link>{' '}
            instead.
          </p>
        </Reveal>

        {bookingConfig.bookingDisplayMode === 'embed' ? (
          <Reveal className="mt-10">
            <BookingEmbed />
          </Reveal>
        ) : null}
      </Container>
    </Section>
  </>
)

/**
 * Pre-integration hand-off.
 *
 * This is the only place in the site that knows online booking isn't connected
 * yet. It stays a strong page rather than an error state, and it never implies
 * a session has been booked or a payment taken.
 */
const BookingPreparingState = () => (
  <>
    <PageHero
      eyebrow="Booking"
      title="Ready to get flying?"
      intro={
        <>
          <p className="font-display text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
            Online booking is being prepared.
          </p>
          <p>Drone Confidence sessions will be available to book online here.</p>
          <p>
            If you&rsquo;d like to ask a question or register your interest in a session in the
            meantime, send us your details below.
          </p>
        </>
      }
      actions={
        <LinkButton to={ASK_A_QUESTION_QUERY} variant="secondary">
          Ask a Question
        </LinkButton>
      }
    />

    <Section tone="canvas" space="sm" aria-labelledby="session-summaries-heading">
      <Container>
        <Reveal className="flex flex-col gap-3">
          <Eyebrow>The sessions</Eyebrow>
          <h2 id="session-summaries-heading" className="text-[clamp(1.6rem,3.2vw,2.15rem)]">
            What you&rsquo;ll be able to book.
          </h2>
        </Reveal>

        <RevealGroup className="mt-8 grid gap-6 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionChoiceCard key={session.id} session={session} withCta={false} />
          ))}
        </RevealGroup>

        <Reveal className="mt-6">
          <p className="text-[0.95rem] text-ink-muted">
            Full session details are on the{' '}
            <Link
              to="/sessions"
              className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
            >
              sessions page
            </Link>
            .
          </p>
        </Reveal>
      </Container>
    </Section>

    <Section tone="sage" space="lg" aria-labelledby="interest-heading">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <Reveal className="flex flex-col gap-5">
            <Eyebrow>Register your interest</Eyebrow>
            <h2 id="interest-heading" className="text-[clamp(1.7rem,3.4vw,2.35rem)]">
              Want to be first to know?
            </h2>
            <p className="measure text-ink-soft">
              Send us your details and we&rsquo;ll be in touch — including as soon as online booking
              goes live.
            </p>
            <p className="flex items-start gap-2.5 text-[0.93rem] leading-relaxed text-ink-muted">
              <HelpCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
              Not sure which session?{' '}
              <Link
                to={ASK_A_QUESTION_QUERY}
                className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
              >
                Ask a question
              </Link>
              .
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-[var(--radius-panel)] border border-ink/8 bg-surface p-6 sm:p-9">
              <EnquiryForm sourcePage="/book" />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  </>
)

/**
 * Short, relevant policy only. The full booking and payment section belongs to
 * the live state — there is nothing to pay for yet, so it isn't shown here.
 */
const BookingBasics = () => (
  <Section tone="canvas" space="md" aria-labelledby="booking-basics-heading">
    <Container>
      <Reveal className="flex flex-col gap-5">
        <h2 id="booking-basics-heading" className="text-[clamp(1.6rem,3.2vw,2.15rem)]">
          Good to know.
        </h2>

        <dl className="grid gap-x-14 gap-y-7 border-t border-ink/10 pt-7 sm:grid-cols-2">
          <div>
            <dt className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
              Sessions are private and one-on-one
            </dt>
            <dd className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">
              Each session is a fixed length reserved just for you, using your own drone. Sessions
              can&rsquo;t be extended on the day.
            </dd>
          </div>
          <div>
            <dt className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
              Weather is never your problem
            </dt>
            <dd className="pt-2 text-[0.99rem] leading-relaxed text-ink-soft">
              If conditions aren&rsquo;t suitable, you can reschedule at no cost or take a full
              refund.
            </dd>
          </div>
        </dl>

        <p className="text-[0.95rem] text-ink-muted">
          <Link
            to={ROUTES.bookingPolicy}
            className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
          >
            Read the full booking &amp; cancellation policy
          </Link>
        </p>
      </Reveal>
    </Container>
  </Section>
)

const Book = () => {
  useSeo({
    title: 'Book a Drone Lesson Sydney | Drone Confidence',
    description:
      'Book a private one-on-one drone lesson in Sydney. First Flight $179, Fly With Confidence $239, Photo & Video $269. North and south Sydney training areas.',
    path: '/book',
    structuredData: [serviceSchema()],
  })

  useEffect(() => {
    track('booking_handoff_viewed', {
      state: bookingConfig.bookingEnabled ? 'enabled' : 'preparing',
      mode: bookingConfig.bookingDisplayMode,
    })
  }, [])

  return (
    <>
      {bookingConfig.bookingEnabled ? (
        <>
          <BookingEnabledState />
          <BookingPaymentInfo />
        </>
      ) : (
        <>
          <BookingPreparingState />
          <BookingBasics />
        </>
      )}
      <CustomLocationCallout />
    </>
  )
}

export default Book
