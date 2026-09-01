/**
 * Transactional email copy.
 *
 * Adapted from docs/booking-email-templates.md — the approved wording, with the
 * merge placeholders replaced by real booking data. Nothing here claims CASA
 * approval, a licence, certification or insurance, and no message promises a
 * specific park.
 */

import { formatLongDate, formatMoneyCents, formatTimeRange } from '../../../shared/booking/format'
import { experienceLabel } from '../../../shared/booking/experience'
import type { CancellationReason } from '../../../shared/booking/types'
import type { BookingRow } from '../store'
import { type EmailBody, firstName, renderEmail } from './render'

const sessionLines = (booking: BookingRow): string[] => [
  `${booking.session_name} · ${booking.duration_minutes} minutes`,
  formatLongDate(new Date(booking.starts_at), booking.time_zone),
  formatTimeRange(new Date(booking.starts_at), new Date(booking.ends_at), booking.time_zone),
  booking.location_name,
]

const BRING = [
  'Your drone',
  'Controller',
  'Charged batteries',
  'Phone or tablet if required',
  'Memory card',
  "Any accessories you'd like help with",
]

export const confirmationEmail = (booking: BookingRow): EmailBody =>
  renderEmail("You're booked — Drone Confidence", [
    { kind: 'heading', text: "You're booked." },
    { kind: 'paragraph', text: `Hi ${firstName(booking.customer_name)},` },
    { kind: 'paragraph', text: 'Thanks for booking a Drone Confidence session.' },
    { kind: 'paragraph', text: 'Your payment has been received and your session is confirmed.' },
    { kind: 'label', text: 'Your session' },
    { kind: 'lines', items: sessionLines(booking) },
    { kind: 'lines', items: [`Booking reference: ${booking.reference}`, `Paid: ${formatMoneyCents(booking.amount_paid_cents, booking.currency)}`] },
    {
      kind: 'paragraph',
      text: "We'll review the information about your drone and confirm your meeting point before the lesson.",
    },
    { kind: 'label', text: 'Please bring' },
    { kind: 'list', items: BRING },
    { kind: 'paragraph', text: "We'll keep an eye on the weather leading up to the session." },
    {
      kind: 'paragraph',
      text: "If conditions aren't suitable for safe flying, we'll reschedule at no cost or refund you in full.",
    },
    { kind: 'paragraph', text: 'See you there.' },
  ])

const REMINDER_CHECKLIST = [
  'Charge your drone batteries',
  'Charge your controller',
  'Charge your phone or tablet',
  'Bring your memory card',
  "Bring any accessories you'd like help with",
  'Check that your drone app opens correctly',
]

export const reminderEmail = (booking: BookingRow): EmailBody =>
  renderEmail('Your Drone Confidence session is tomorrow', [
    { kind: 'paragraph', text: `Hi ${firstName(booking.customer_name)},` },
    { kind: 'paragraph', text: 'A quick reminder to:' },
    { kind: 'list', items: REMINDER_CHECKLIST },
    { kind: 'label', text: 'Your training area' },
    { kind: 'lines', items: [booking.location_name] },
    { kind: 'label', text: 'Your session' },
    {
      kind: 'lines',
      items: [
        `${booking.session_name} · ${booking.duration_minutes} minutes`,
        `${formatLongDate(new Date(booking.starts_at), booking.time_zone)}, ${formatTimeRange(new Date(booking.starts_at), new Date(booking.ends_at), booking.time_zone)}`,
      ],
    },
    { kind: 'paragraph', text: "If weather conditions require a change, we'll contact you directly." },
    { kind: 'paragraph', text: 'See you tomorrow.' },
  ])

/** Refund wording, taken from the amount actually sent to Stripe. */
const refundSentence = (
  reason: CancellationReason,
  refundedCents: number,
  booking: BookingRow,
): string => {
  if (reason === 'weather_reschedule') {
    return 'No refund has been issued yet — we will move your session to another suitable time, or refund you in full if you would prefer.'
  }
  if (refundedCents <= 0) {
    return 'No refund was due on this booking. If you think that is wrong, reply to this email and we will check.'
  }
  const amount = formatMoneyCents(refundedCents, booking.currency)
  if (refundedCents >= booking.amount_paid_cents) {
    return `A full refund of ${amount} has been issued.`
  }
  const retained = formatMoneyCents(booking.amount_paid_cents - refundedCents, booking.currency)
  return `${amount} has been refunded and ${retained} retained, in line with the booking policy.`
}

export const cancellationEmail = (
  booking: BookingRow,
  reason: CancellationReason,
  refundedCents: number,
): EmailBody =>
  renderEmail('Your Drone Confidence booking has been cancelled', [
    { kind: 'paragraph', text: `Hi ${firstName(booking.customer_name)},` },
    { kind: 'paragraph', text: 'Your booking for:' },
    { kind: 'lines', items: sessionLines(booking) },
    { kind: 'paragraph', text: 'has been cancelled.' },
    { kind: 'label', text: 'Refund' },
    { kind: 'paragraph', text: refundSentence(reason, refundedCents, booking) },
    {
      kind: 'paragraph',
      text: 'Please allow several business days for a refund to appear, depending on your bank or payment provider.',
    },
  ])

export const rescheduleEmail = (booking: BookingRow, previousStartsAt: Date): EmailBody =>
  renderEmail('Your Drone Confidence session has been moved', [
    { kind: 'paragraph', text: `Hi ${firstName(booking.customer_name)},` },
    {
      kind: 'paragraph',
      text: `Your session has been moved from ${formatLongDate(previousStartsAt, booking.time_zone)}, ${formatTimeRange(previousStartsAt, new Date(previousStartsAt.getTime() + booking.duration_minutes * 60000), booking.time_zone)}.`,
    },
    { kind: 'label', text: 'Your new session' },
    { kind: 'lines', items: sessionLines(booking) },
    { kind: 'lines', items: [`Booking reference: ${booking.reference}`] },
    {
      kind: 'paragraph',
      text: 'Nothing else changes — your payment carries across to the new time. If this time does not suit, reply to this email and we will find another.',
    },
  ])

/** Owner notification. Includes the operational detail the lesson needs. */
export const ownerNotificationEmail = (booking: BookingRow, adminUrl: string): EmailBody =>
  renderEmail(`New booking — ${booking.session_name}, ${formatLongDate(new Date(booking.starts_at), booking.time_zone)}`, [
    { kind: 'heading', text: 'New booking confirmed.' },
    { kind: 'label', text: 'Session' },
    { kind: 'lines', items: [...sessionLines(booking), `Paid: ${formatMoneyCents(booking.amount_paid_cents, booking.currency)}`, `Reference: ${booking.reference}`] },
    { kind: 'label', text: 'Customer' },
    {
      kind: 'lines',
      items: [booking.customer_name, booking.email, booking.mobile],
    },
    { kind: 'label', text: 'Drone and experience' },
    {
      kind: 'lines',
      items: [booking.drone_model, experienceLabel(booking.experience_code)],
    },
    { kind: 'label', text: 'What they want help with' },
    { kind: 'paragraph', text: booking.help_with },
    ...(booking.notes
      ? [
          { kind: 'label' as const, text: 'Notes' },
          { kind: 'paragraph' as const, text: booking.notes },
        ]
      : []),
    { kind: 'button', label: 'Open the admin dashboard', href: adminUrl },
  ])
