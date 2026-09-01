import { describe, expect, it } from 'vitest'
import { escapeHtml, firstName } from '../netlify/lib/email/render'
import {
  cancellationEmail,
  confirmationEmail,
  ownerNotificationEmail,
  reminderEmail,
  rescheduleEmail,
} from '../netlify/lib/email/templates'
import type { BookingRow } from '../netlify/lib/store'

/**
 * Emails are the one place customer-typed text is composed into HTML, so the
 * escaping is asserted rather than assumed.
 */

const HOSTILE = '<script>alert("x")</script>'

const booking: BookingRow = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  reference: 'DC-7F3K2Q',
  attempt_id: null,
  session_slug: 'first-flight',
  session_name: 'First Flight',
  duration_minutes: 60,
  price_cents: 17900,
  location_slug: 'south-sydney',
  location_name: 'South Sydney — Taren Point',
  starts_at: '2026-10-05T21:00:00.000Z',
  ends_at: '2026-10-05T22:00:00.000Z',
  occupied_until: '2026-10-05T22:30:00.000Z',
  booking_day: '2026-10-06',
  time_zone: 'Australia/Sydney',
  customer_name: `Alex ${HOSTILE} Taylor`,
  email: 'alex@example.com',
  mobile: '0400000000',
  drone_model: `DJI Mini <b>4K</b>`,
  experience_code: 'new',
  help_with: `Flying near trees & powerlines ${HOSTILE}`,
  notes: `Nothing "special" <img onerror=1>`,
  status: 'confirmed',
  is_active: true,
  hold_expires_at: null,
  stripe_checkout_session_id: 'cs_test_1',
  stripe_payment_intent_id: 'pi_test_1',
  currency: 'aud',
  amount_paid_cents: 17900,
  amount_refunded_cents: 0,
  payment_state: 'paid',
  stripe_refund_id: null,
  cancellation_reason: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
  confirmed_at: '2026-09-01T00:00:00.000Z',
  cancelled_at: null,
}

describe('escapeHtml', () => {
  it('neutralises every character that could open a tag or attribute', () => {
    expect(escapeHtml('<a href="x" & \'y\'>')).toBe(
      '&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;',
    )
  })

  it('escapes the ampersand first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})

describe('firstName', () => {
  it('takes the first word and copes with odd input', () => {
    expect(firstName('Alex Taylor')).toBe('Alex')
    expect(firstName('  Alex  ')).toBe('Alex')
    expect(firstName('')).toBe('')
  })
})

describe('transactional emails', () => {
  const bodies = () => [
    confirmationEmail(booking),
    reminderEmail(booking),
    cancellationEmail(booking, 'weather_refund', 17900),
    rescheduleEmail(booking, new Date('2026-09-29T21:00:00.000Z')),
    ownerNotificationEmail(booking, 'https://example.test/admin'),
  ]

  it('never emits an unescaped customer value', () => {
    for (const body of bodies()) {
      expect(body.html).not.toContain('<script>')
      expect(body.html).not.toContain('<img')
      expect(body.html).not.toContain('<b>4K</b>')
    }
  })

  it('escapes the hostile text where it is actually quoted back', () => {
    // The owner notification repeats everything the customer typed.
    const html = ownerNotificationEmail(booking, 'https://example.test/admin').html
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;special&quot;')
  })

  it('shows the customer their own booking facts', () => {
    const html = confirmationEmail(booking).html
    expect(html).toContain('DC-7F3K2Q')
    expect(html).toContain('First Flight')
    expect(html).toContain('$179.00')
    // Sydney time, from the booking's own stored zone.
    expect(html).toContain('8:00')
  })

  it('gives the owner the details needed to run the lesson', () => {
    const html = ownerNotificationEmail(booking, 'https://example.test/admin').html
    expect(html).toContain('alex@example.com')
    expect(html).toContain('0400000000')
    expect(html).toContain('https://example.test/admin')
  })

  it('tells a refunded customer what was returned', () => {
    expect(cancellationEmail(booking, 'weather_refund', 17900).html).toContain('$179.00')
    expect(cancellationEmail(booking, 'weather_reschedule', 0).text).not.toContain('$179.00')
  })

  it('never claims an approval, licence or certification', () => {
    for (const body of bodies()) {
      const text = body.text.toLowerCase()
      for (const claim of ['casa', 'licence', 'licensed', 'certified', 'certification', 'insured']) {
        expect(text).not.toContain(claim)
      }
    }
  })
})
