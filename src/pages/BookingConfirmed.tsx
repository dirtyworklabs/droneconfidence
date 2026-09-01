import { type ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarCheck, Mail, MapPin } from 'lucide-react'
import { formatLongDate, formatMoneyCents, formatTimeRange } from '@shared/booking/format'
import type { BookingSummary, ConfirmationResponse } from '@shared/booking/types'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LinkButton } from '@/components/ui/Button'
import { fetchConfirmation } from '@/lib/bookingService'
import { track } from '@/lib/analytics'
import { ROUTES } from '@/lib/routes'
import { useSeo } from '@/lib/seo'

/** How often, and for how long, we re-ask while Stripe's webhook lands. */
const POLL_MS = 2500
const MAX_POLLS = 24

type View =
  | { kind: 'checking' }
  | { kind: 'processing' }
  | { kind: 'confirmed'; booking: BookingSummary }
  | { kind: 'unpaid' }
  | { kind: 'expired' }
  | { kind: 'missing' }
  | { kind: 'error' }

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 border-t border-ink/8 py-3.5 first:border-t-0 first:pt-0">
    <span aria-hidden="true" className="mt-0.5 text-sage">
      {icon}
    </span>
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.82rem] uppercase tracking-[0.12em] text-ink-muted">{label}</span>
      <span className="font-display text-[1rem] font-semibold tracking-[-0.01em] text-ink">
        {value}
      </span>
    </div>
  </div>
)

const Shell = ({ children }: { children: ReactNode }) => (
  <Section tone="canvas" space="md">
    <Container width="text">{children}</Container>
  </Section>
)

/**
 * Where Stripe returns a customer after hosted checkout.
 *
 * The page never treats its own URL as proof of payment. It asks the server what
 * actually happened to the checkout session, and the server answers from the
 * booking row that the Stripe webhook writes. Until that webhook has been
 * processed, the page says the payment has landed and the booking is being
 * confirmed — it does not invent a reference, a time or a receipt.
 */
const BookingConfirmed = () => {
  const [params] = useSearchParams()
  const checkoutSessionId = params.get('session_id') ?? ''
  const [view, setView] = useState<View>(
    checkoutSessionId.length > 0 ? { kind: 'checking' } : { kind: 'missing' },
  )
  const reported = useRef(false)

  useSeo({
    title: 'Booking confirmed | Drone Confidence',
    description: 'Your Drone Confidence session booking.',
    path: ROUTES.bookingConfirmed,
    // A confirmation belongs to one customer and must never be indexed.
    noIndex: true,
  })

  useEffect(() => {
    if (checkoutSessionId.length === 0) return

    const controller = new AbortController()
    let active = true
    let attempts = 0
    let timer: number | undefined

    const map = (response: ConfirmationResponse): View => {
      switch (response.status) {
        case 'confirmed':
          return { kind: 'confirmed', booking: response.booking }
        case 'processing':
          return { kind: 'processing' }
        case 'unpaid':
          return { kind: 'unpaid' }
        case 'expired':
          return { kind: 'expired' }
        case 'not_found':
          return { kind: 'missing' }
        default:
          return { kind: 'error' }
      }
    }

    const poll = async () => {
      attempts += 1
      try {
        const response = await fetchConfirmation(checkoutSessionId, controller.signal)
        if (!active) return
        const next = map(response)
        setView(next)
        // Only 'processing' is worth waiting on; every other answer is final.
        if (next.kind === 'processing' && attempts < MAX_POLLS) {
          timer = window.setTimeout(poll, POLL_MS)
        }
      } catch {
        if (active) setView({ kind: 'error' })
      }
    }

    void poll()

    return () => {
      active = false
      controller.abort()
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [checkoutSessionId])

  useEffect(() => {
    if (view.kind !== 'confirmed' || reported.current) return
    reported.current = true
    // No reference, email or Stripe id — the event records that it happened only.
    track('booking_confirmed_viewed')
  }, [view.kind])

  if (view.kind === 'checking') {
    return (
      <Shell>
        <p aria-live="polite" className="text-[1.05rem] leading-relaxed text-ink-soft">
          Checking your booking…
        </p>
      </Shell>
    )
  }

  if (view.kind === 'processing') {
    return (
      <Shell>
        <Eyebrow>Almost there</Eyebrow>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)]">
          Payment received. Confirming your booking…
        </h1>
        <p aria-live="polite" className="measure mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
          Your payment has gone through and we&rsquo;re finishing your booking now. This page updates
          by itself — you don&rsquo;t need to pay again or reload. Your confirmation email arrives as
          soon as it&rsquo;s done.
        </p>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-muted">
          If this page is still waiting after a minute or two, your booking is safe. Get in touch and
          we&rsquo;ll confirm it for you.
        </p>
        <div className="mt-8">
          <LinkButton to={ROUTES.contact} variant="secondary">
            Contact us
          </LinkButton>
        </div>
      </Shell>
    )
  }

  if (view.kind === 'confirmed') {
    const { booking } = view
    const startsAt = new Date(booking.startsAt)
    const endsAt = new Date(booking.endsAt)

    return (
      <Shell>
        <Eyebrow>Confirmed</Eyebrow>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)]">You&rsquo;re booked in.</h1>
        <p className="measure mt-4 text-[1.05rem] leading-relaxed text-ink-soft">
          Your booking reference is{' '}
          <strong className="font-display font-semibold text-ink">{booking.reference}</strong>. A
          confirmation has been sent to {booking.email}, and you&rsquo;ll get a reminder the day
          before your session.
        </p>

        <div className="mt-8 rounded-[var(--radius-card)] border border-ink/8 bg-surface p-5 sm:p-6">
          <Row
            icon={<CalendarCheck className="size-4" />}
            label="Session"
            value={booking.sessionName}
          />
          <Row
            icon={<CalendarCheck className="size-4" />}
            label="When"
            value={`${formatLongDate(startsAt, booking.timeZone)}, ${formatTimeRange(
              startsAt,
              endsAt,
              booking.timeZone,
            )}`}
          />
          <Row
            icon={<MapPin className="size-4" />}
            label="Training area"
            value={booking.locationName}
          />
          <Row
            icon={<Mail className="size-4" />}
            label="Paid"
            value={formatMoneyCents(booking.amountPaidCents, booking.currency.toUpperCase())}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
          <p>
            We&rsquo;ll confirm your exact meeting point with you before the session. Specific parks
            can&rsquo;t be guaranteed, and the flying area may be adjusted on the day for weather,
            airspace or venue conditions.
          </p>
          <p>
            Need to change something, or not sure about the conditions? Read the{' '}
            <Link
              to={ROUTES.bookingPolicy}
              className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
            >
              booking &amp; cancellation policy
            </Link>{' '}
            or get in touch.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to={ROUTES.contact} variant="secondary">
            Contact us
          </LinkButton>
          <LinkButton to={ROUTES.home} variant="quiet">
            Back to home
          </LinkButton>
        </div>
      </Shell>
    )
  }

  const message =
    view.kind === 'unpaid'
      ? 'This checkout wasn’t completed, so nothing has been charged and the time has been released. You can choose another time whenever you’re ready.'
      : view.kind === 'expired'
        ? 'This checkout expired before payment was completed, so nothing has been charged and the time has been released. You’re welcome to book again.'
        : view.kind === 'missing'
          ? 'We couldn’t find a booking for this link. If you completed a payment, don’t pay again — get in touch and we’ll sort it out.'
          : 'We couldn’t check this booking just now. If you completed a payment, don’t pay again — get in touch and we’ll confirm it for you.'

  return (
    <Shell>
      <Eyebrow>Booking</Eyebrow>
      <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)]">
        {view.kind === 'unpaid' || view.kind === 'expired'
          ? 'Payment wasn’t completed.'
          : 'We couldn’t confirm this booking.'}
      </h1>
      <p className="measure mt-4 text-[1.05rem] leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton to={ROUTES.book}>Choose a time</LinkButton>
        <LinkButton to={ROUTES.contact} variant="secondary">
          Contact us
        </LinkButton>
      </div>
    </Shell>
  )
}

export default BookingConfirmed
