import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHero } from '@/components/marketing/PageHero'
import { cancellationRows } from '@/components/marketing/CancellationPolicy'
import { sessions, formatDuration, formatPrice } from '@/content/sessions'
import { customLocationCopy } from '@/content/locations'
import { CUSTOM_LOCATION_QUERY } from '@/lib/routes'
import { useSeo } from '@/lib/seo'

interface PolicySection {
  id: string
  heading: string
  body: ReactNode
}

const InlineLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link
    to={to}
    className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
  >
    {children}
  </Link>
)

const policySections: PolicySection[] = [
  {
    id: 'booking-confirmation',
    heading: 'Booking confirmation',
    body: (
      <>
        <p>
          A session is confirmed once your booking is completed and payment has been received. You
          will receive a confirmation with your session type, date, time and meeting point.
        </p>
        <p>
          Sending an enquiry through this website does not create a booking and does not reserve a
          time.
        </p>
      </>
    ),
  },
  {
    id: 'full-payment',
    heading: 'Full payment',
    body: (
      <>
        <p>
          Full payment is required at the time of booking. Your appointment reserves private
          one-on-one training time specifically for you.
        </p>
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              {session.name} — {formatPrice(session.price)} · {formatDuration(session.durationMinutes)}
            </li>
          ))}
        </ul>
        <p>
          Payment is processed securely by our payment provider. Drone Confidence does not store
          your card details.
        </p>
      </>
    ),
  },
  {
    id: 'rescheduling',
    heading: 'Rescheduling',
    body: (
      <p>
        You can reschedule more than 24 hours before your session at no cost, subject to
        availability. If you need to move a session inside 24 hours, get in touch as early as you
        can — see late cancellation below.
      </p>
    ),
  },
  {
    id: 'customer-cancellation',
    heading: 'Customer cancellation',
    body: (
      <p>
        Cancel or reschedule more than 24 hours before your session and you will receive a full
        refund.
      </p>
    ),
  },
  {
    id: 'late-cancellation',
    heading: 'Late cancellation',
    body: (
      <p>
        Cancel within 24 hours of your session and 50% is refunded and 50% is retained. Late
        cancellations usually can&rsquo;t be filled, and the time has already been set aside for
        you.
      </p>
    ),
  },
  {
    id: 'no-show',
    heading: 'No-show',
    body: (
      <p>
        If you don&rsquo;t attend a confirmed booking, 50% is refunded and 50% is retained. If
        something has gone wrong on the day, contact us as soon as you can.
      </p>
    ),
  },
  {
    id: 'weather',
    heading: 'Weather',
    body: (
      <>
        <p>
          Drone lessons depend on suitable flying conditions. Rain, strong wind or other conditions
          can sometimes mean a session shouldn&rsquo;t go ahead.
        </p>
        <p>
          If Drone Confidence determines that conditions aren&rsquo;t suitable, you can choose a free
          reschedule, or a full refund if a suitable alternative time can&rsquo;t be found. There is
          no cancellation fee for a weather-related change initiated by Drone Confidence.
        </p>
      </>
    ),
  },
  {
    id: 'unsafe-conditions',
    heading: 'Unsafe or unsuitable conditions',
    body: (
      <>
        <p>
          Sessions are conducted subject to applicable Australian drone rules, airspace restrictions
          and local operating requirements. Conditions on the ground — crowds, events, temporary
          restrictions, site access or aircraft issues — can occasionally make a planned session
          unsuitable.
        </p>
        <p>
          Where that happens, we&rsquo;ll either move to a suitable alternative, reschedule at no
          cost, or refund you in full.
        </p>
      </>
    ),
  },
  {
    id: 'training-locations',
    heading: 'Training locations',
    body: (
      <>
        <p>
          Standard sessions are based around Taren Point in Sydney&rsquo;s south and North Ryde in
          Sydney&rsquo;s north. Your exact meeting point is provided with your confirmed booking.
        </p>
        <p>
          Specific parks and open areas can&rsquo;t be guaranteed. Public spaces are shared, and
          conditions, events and local requirements change, so the precise flying area within a
          training location may be adjusted on the day.
        </p>
      </>
    ),
  },
  {
    id: 'custom-locations',
    heading: 'Custom-location requests',
    body: (
      <>
        <p>
          Custom locations are handled as a request rather than an instant booking, so the site,
          airspace, local rules and operating conditions can be checked first.
        </p>
        <p>{customLocationCopy}</p>
        <p>
          <InlineLink to={CUSTOM_LOCATION_QUERY}>Request a custom location</InlineLink>.
        </p>
      </>
    ),
  },
  {
    id: 'customer-equipment',
    heading: 'Customer equipment',
    body: (
      <>
        <p>
          Sessions are primarily designed around learning on your own aircraft, so please bring your
          drone, controller, charged batteries, propellers, memory card and phone or tablet with the
          relevant app installed.
        </p>
        <p>
          Tell us your drone model when you book. Lengthy firmware downloads and account setup can
          reduce flying time, so we may send you a few simple preparation steps beforehand. You
          remain responsible for your own equipment and for any registration or account requirements
          that apply to it.
        </p>
      </>
    ),
  },
  {
    id: 'refund-timing',
    heading: 'Refund timing',
    body: (
      <p>
        Refunds are returned through the original payment method and may take several business days
        to appear, depending on your bank or payment provider.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <p>
        Questions about this policy, a booking or a reschedule?{' '}
        <InlineLink to="/contact">Get in touch</InlineLink> and we&rsquo;ll help.
      </p>
    ),
  },
]

const BookingPolicy = () => {
  useSeo({
    title: 'Booking & Cancellation Policy | Drone Confidence',
    description:
      'Booking, payment, rescheduling, cancellation, no-show, weather and refund terms for private one-on-one drone lessons with Drone Confidence in Sydney.',
    path: '/booking-policy',
  })

  return (
    <>
      <PageHero
        eyebrow="Booking policy"
        title="Booking & cancellation policy."
        width="text"
        intro={
          <p>
            Plain English, so you know exactly where you stand before you book. Last updated
            September 2026.
          </p>
        }
      />

      <Section tone="canvas" space="sm">
        <Container width="text">
          <Reveal>
            <div className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-6 sm:p-8">
              <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
                At a glance
              </h2>
              <dl className="mt-4 flex flex-col">
                {cancellationRows.map((row) => (
                  <div key={row.when} className="border-t border-ink/8 py-3 first:border-t-0 first:pt-0">
                    <dt className="text-[0.95rem] font-medium text-ink">{row.when}</dt>
                    <dd className="text-[0.95rem] text-eucalyptus">{row.outcome}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <div className="mt-12 flex flex-col gap-10">
            {policySections.map((section, index) => (
              <Reveal key={section.id} delay={Math.min(index, 3) * 0.04}>
                <section aria-labelledby={`${section.id}-heading`}>
                  <h2
                    id={`${section.id}-heading`}
                    className="font-display text-[1.3rem] font-semibold tracking-[-0.025em]"
                  >
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-[1.01rem] leading-relaxed text-ink-soft [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                    {section.body}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <p className="rounded-[var(--radius-card)] border border-sand/80 bg-sand-soft/70 p-6 text-[0.97rem] leading-relaxed text-ink-soft">
              Nothing in this policy is intended to exclude rights that cannot lawfully be excluded
              under Australian Consumer Law.
            </p>
          </Reveal>
        </Container>
      </Section>
    </>
  )
}

export default BookingPolicy
