import { useMemo, useState } from 'react'
import { findSession, sessionPriceCents } from '@shared/booking/catalog'
import type { BookingRow } from '../../netlify/lib/store'
import {
  cancellationEmail,
  confirmationEmail,
  ownerNotificationEmail,
  reminderEmail,
  rescheduleEmail,
} from '../../netlify/lib/email/templates'
import type { EmailBody } from '../../netlify/lib/email/render'

// A current hypothetical booking, so the amounts come from the live catalogue.
const PREVIEW_PRICE_CENTS = sessionPriceCents(findSession('fly-with-confidence')!)

const MOCK_BOOKING: BookingRow = {
  id: 'preview-booking',
  reference: 'DC-7F3K2Q',
  attempt_id: null,

  session_slug: 'fly-with-confidence',
  session_name: 'Fly With Confidence',
  duration_minutes: 90,
  price_cents: PREVIEW_PRICE_CENTS,

  location_slug: 'taren-point',
  location_name: 'South Sydney · Taren Point',

  // 10:00 am – 11:30 am Sydney time on 10 September 2026.
  starts_at: '2026-09-10T00:00:00.000Z',
  ends_at: '2026-09-10T01:30:00.000Z',
  occupied_until: '2026-09-10T01:45:00.000Z',
  booking_day: '2026-09-10',
  time_zone: 'Australia/Sydney',

  customer_name: 'Alex Morgan',
  email: 'alex@example.com',
  mobile: '0400 123 456',

  drone_model: 'DJI Mini 4 Pro',
  experience_code: 'some',
  help_with:
    'Return-to-Home, smoother flight controls, camera settings and feeling more confident flying independently.',
  notes:
    'Would especially like help understanding obstacle avoidance and safe battery margins.',

  status: 'confirmed',
  is_active: true,
  hold_expires_at: null,

  stripe_checkout_session_id: 'cs_test_preview',
  stripe_payment_intent_id: 'pi_test_preview',

  currency: 'aud',
  amount_paid_cents: PREVIEW_PRICE_CENTS,
  amount_refunded_cents: 0,
  payment_state: 'paid',
  stripe_refund_id: null,

  cancellation_reason: null,

  created_at: '2026-09-02T07:00:00.000Z',
  updated_at: '2026-09-02T07:00:00.000Z',
  confirmed_at: '2026-09-02T07:00:00.000Z',
  cancelled_at: null,
}

type PreviewId =
  | 'confirmation'
  | 'reminder'
  | 'reschedule'
  | 'cancellation-full'
  | 'cancellation-partial'
  | 'weather-reschedule'
  | 'owner'

interface PreviewOption {
  id: PreviewId
  label: string
  description: string
}

const PREVIEWS: PreviewOption[] = [
  {
    id: 'confirmation',
    label: 'Booking confirmation',
    description: 'Sent to the customer immediately after payment.',
  },
  {
    id: 'reminder',
    label: '24-hour reminder',
    description: 'Sent to the customer before their session.',
  },
  {
    id: 'reschedule',
    label: 'Rescheduled session',
    description: 'Sent when an existing booking is moved.',
  },
  {
    id: 'cancellation-full',
    label: 'Cancellation · full refund',
    description: 'Example of a cancellation where the full payment is refunded.',
  },
  {
    id: 'cancellation-partial',
    label: 'Cancellation · partial refund',
    description: 'Example of a cancellation with a 50% refund.',
  },
  {
    id: 'weather-reschedule',
    label: 'Weather · reschedule',
    description: 'Sent when unsuitable weather means the session needs to move.',
  },
  {
    id: 'owner',
    label: 'Owner · new booking',
    description: 'Internal notification sent when a new booking is confirmed.',
  },
]

const PRODUCTION_LOGO_URL =
  'https://droneconfidence.com/images/drone-confidence-email-logo.png'

const LOCAL_LOGO_URL = '/images/drone-confidence-email-logo.png'

const emailForPreview = (id: PreviewId): EmailBody => {
  switch (id) {
    case 'confirmation':
      return confirmationEmail(MOCK_BOOKING)

    case 'reminder':
      return reminderEmail(MOCK_BOOKING)

    case 'reschedule':
      return rescheduleEmail(
        MOCK_BOOKING,
        new Date('2026-09-08T23:00:00.000Z'),
      )

    case 'cancellation-full':
      return cancellationEmail(
        MOCK_BOOKING,
        'customer_outside_24h',
        MOCK_BOOKING.amount_paid_cents,
      )

    case 'cancellation-partial':
      return cancellationEmail(
        MOCK_BOOKING,
        'customer_within_24h',
        Math.round(MOCK_BOOKING.amount_paid_cents * 0.5),
      )

    case 'weather-reschedule':
      return cancellationEmail(
        MOCK_BOOKING,
        'weather_reschedule',
        0,
      )

    case 'owner':
      return ownerNotificationEmail(
        MOCK_BOOKING,
        'http://localhost:5173/admin',
      )
  }
}

const EmailPreview = () => {
  const [selectedId, setSelectedId] =
    useState<PreviewId>('confirmation')

  const [mobile, setMobile] = useState(false)

  const selected =
    PREVIEWS.find((preview) => preview.id === selectedId) ??
    PREVIEWS[0]

  const email = useMemo(
    () => emailForPreview(selectedId),
    [selectedId],
  )

  /**
   * Production emails deliberately use the public HTTPS logo.
   *
   * For this local-only preview we swap that URL for the image inside
   * public/images so the logo can be checked before deployment.
   */
  const previewHtml = useMemo(
    () =>
      email.html.replaceAll(
        PRODUCTION_LOGO_URL,
        LOCAL_LOGO_URL,
      ),
    [email.html],
  )

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#ecece8',
        color: '#123f3f',
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: '1px solid #d8dad5',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '18px 24px',
            display: 'flex',
            gap: 20,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#5a7d63',
                marginBottom: 4,
              }}
            >
              Local development only
            </div>

            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Drone Confidence email previews
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => setMobile(false)}
              style={{
                border:
                  !mobile
                    ? '1px solid #123f3f'
                    : '1px solid #d8dad5',
                background: !mobile ? '#123f3f' : '#ffffff',
                color: !mobile ? '#ffffff' : '#123f3f',
                padding: '8px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Desktop
            </button>

            <button
              type="button"
              onClick={() => setMobile(true)}
              style={{
                border:
                  mobile
                    ? '1px solid #123f3f'
                    : '1px solid #d8dad5',
                background: mobile ? '#123f3f' : '#ffffff',
                color: mobile ? '#ffffff' : '#123f3f',
                padding: '8px 14px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Mobile
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '28px 24px 60px',
          display: 'grid',
          gridTemplateColumns: 'minmax(230px, 300px) minmax(0, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
      >
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid #d8dad5',
            borderRadius: 16,
            padding: 10,
          }}
        >
          {PREVIEWS.map((preview) => {
            const active = preview.id === selectedId

            return (
              <button
                key={preview.id}
                type="button"
                onClick={() => setSelectedId(preview.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  border: 0,
                  borderRadius: 11,
                  padding: '12px 13px',
                  margin: 0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: active ? '#f0f4ef' : 'transparent',
                  color: '#123f3f',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 700 : 600,
                    marginBottom: 3,
                  }}
                >
                  {preview.label}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: '#667071',
                  }}
                >
                  {preview.description}
                </div>
              </button>
            )
          })}
        </aside>

        <section style={{ minWidth: 0 }}>
          <div
            style={{
              maxWidth: mobile ? 390 : 720,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                marginBottom: 12,
                padding: '12px 15px',
                background: '#ffffff',
                border: '1px solid #d8dad5',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#7a8283',
                  marginBottom: 4,
                }}
              >
                Subject
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#23282a',
                }}
              >
                {email.subject}
              </div>
            </div>

            <iframe
              title={`${selected.label} email preview`}
              srcDoc={previewHtml}
              style={{
                display: 'block',
                width: '100%',
                height: 1050,
                border: '1px solid #d8dad5',
                borderRadius: 16,
                background: '#ffffff',
              }}
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default EmailPreview