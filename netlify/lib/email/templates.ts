/**
 * Transactional email copy for Drone Confidence.
 *
 * Customer-facing messages are intentionally clear, warm and practical.
 * Nothing here claims CASA approval, a licence, certification or insurance,
 * and no message promises a specific park or meeting point until it has been
 * confirmed.
 */

import {
  formatLongDate,
  formatMoneyCents,
  formatTimeRange,
} from '../../../shared/booking/format'
import { experienceLabel } from '../../../shared/booking/experience'
import type { CancellationReason } from '../../../shared/booking/types'
import type { BookingRow } from '../store'
import { type EmailBody, firstName, renderEmail } from './render'

const sessionLines = (booking: BookingRow): string[] => [
  `${booking.session_name} · ${booking.duration_minutes} minutes`,
  formatLongDate(new Date(booking.starts_at), booking.time_zone),
  formatTimeRange(
    new Date(booking.starts_at),
    new Date(booking.ends_at),
    booking.time_zone,
  ),
  booking.location_name,
]

/**
 * The equipment pair, for preparing the lesson.
 *
 * `controller_model` is null on bookings taken before it was collected, and is
 * reported as such rather than left blank or guessed at.
 */
const equipmentLines = (booking: BookingRow): string[] => [
  `Aircraft: ${booking.drone_model}`,
  `Controller / RC: ${booking.controller_model ?? 'Not recorded'}`,
  `Experience: ${experienceLabel(booking.experience_code)}`,
]

const BRING = [
  'Your drone',
  'Your controller',
  'Charged drone batteries',
  'Your phone or tablet, if required for your drone',
  'A memory card',
  "Any accessories you'd like help with",
]

/**
 * Sent to the customer immediately after a successful booking.
 */
export const confirmationEmail = (booking: BookingRow): EmailBody =>
  renderEmail("You're booked | Drone Confidence", [
    {
      kind: 'heading',
      text: "You're booked.",
    },
    {
      kind: 'paragraph',
      text: `Hi ${firstName(booking.customer_name)},`,
    },
    {
      kind: 'paragraph',
      text: `Thanks for booking a ${booking.session_name} session with Drone Confidence. Your payment has been received and your session is confirmed.`,
    },

    {
      kind: 'label',
      text: 'Your session',
    },
    {
      kind: 'lines',
      items: sessionLines(booking),
    },

    {
      kind: 'label',
      text: 'Booking details',
    },
    {
      kind: 'lines',
      items: [
        `Booking reference: ${booking.reference}`,
        `Paid: ${formatMoneyCents(
          booking.amount_paid_cents,
          booking.currency,
        )}`,
        `Aircraft: ${booking.drone_model}`,
        `Controller / RC: ${booking.controller_model ?? 'Not recorded'}`,
      ],
    },

    {
      kind: 'paragraph',
      text: "I'll review the information you provided about your aircraft and controller, and send through the exact meeting point before your session.",
    },

    {
      kind: 'label',
      text: 'Please bring',
    },
    {
      kind: 'list',
      items: BRING,
    },

    {
      kind: 'paragraph',
      text: "Drone flying is weather dependent, so I'll keep an eye on conditions as your session approaches.",
    },
    {
      kind: 'paragraph',
      text: "If the weather isn't suitable for safe and useful flying, we can move your session at no cost or arrange a full refund.",
    },

    {
      kind: 'paragraph',
      text: 'Looking forward to flying with you.',
    },
  ])

const REMINDER_CHECKLIST = [
  'Charge all of your drone batteries',
  'Charge your controller',
  'Charge your phone or tablet',
  'Make sure your drone app opens and you are signed in',
  'Bring your memory card',
  "Bring any accessories you'd like help with",
]

/**
 * Sent approximately 24 hours before the session.
 */
export const reminderEmail = (booking: BookingRow): EmailBody =>
  renderEmail('Your Drone Confidence session is tomorrow', [
    {
      kind: 'heading',
      text: 'Your session is tomorrow.',
    },
    {
      kind: 'paragraph',
      text: `Hi ${firstName(booking.customer_name)},`,
    },
    {
      kind: 'paragraph',
      text: 'Just a quick reminder that your Drone Confidence session is tomorrow.',
    },

    {
      kind: 'label',
      text: 'Your session',
    },
    {
      kind: 'lines',
      items: [
        `${booking.session_name} · ${booking.duration_minutes} minutes`,
        formatLongDate(
          new Date(booking.starts_at),
          booking.time_zone,
        ),
        formatTimeRange(
          new Date(booking.starts_at),
          new Date(booking.ends_at),
          booking.time_zone,
        ),
        booking.location_name,
      ],
    },

    {
      kind: 'label',
      text: 'Before you leave',
    },
    {
      kind: 'list',
      items: REMINDER_CHECKLIST,
    },

    {
      kind: 'paragraph',
      text: "If weather conditions require a change, I'll contact you directly.",
    },

    {
      kind: 'paragraph',
      text: 'See you tomorrow.',
    },
  ])

/**
 * Refund wording based on the amount actually sent to Stripe.
 */
const refundSentence = (
  reason: CancellationReason,
  refundedCents: number,
  booking: BookingRow,
): string => {
  if (reason === 'weather_reschedule') {
    return 'No refund has been issued because the session is being moved to another suitable time. If you would prefer not to reschedule, a full refund can be arranged.'
  }

  if (refundedCents <= 0) {
    return 'No refund was due on this booking. If you believe this is incorrect, reply to this email and I will check it for you.'
  }

  const amount = formatMoneyCents(refundedCents, booking.currency)

  if (refundedCents >= booking.amount_paid_cents) {
    return `A full refund of ${amount} has been issued to your original payment method.`
  }

  const retained = formatMoneyCents(
    booking.amount_paid_cents - refundedCents,
    booking.currency,
  )

  return `${amount} has been refunded and ${retained} retained in line with the booking policy.`
}

/**
 * Sent when a booking is cancelled.
 *
 * Weather reschedules receive slightly different wording because the booking
 * is being moved rather than treated as an ordinary customer cancellation.
 */
export const cancellationEmail = (
  booking: BookingRow,
  reason: CancellationReason,
  refundedCents: number,
): EmailBody => {
  if (reason === 'weather_reschedule') {
    return renderEmail(
      'Your Drone Confidence session needs to be rescheduled',
      [
        {
          kind: 'heading',
          text: 'We need to move your session.',
        },
        {
          kind: 'paragraph',
          text: `Hi ${firstName(booking.customer_name)},`,
        },
        {
          kind: 'paragraph',
          text: "The conditions for your scheduled Drone Confidence session aren't looking suitable for safe and useful flying, so we need to move it to another time.",
        },

        {
          kind: 'label',
          text: 'Original session',
        },
        {
          kind: 'lines',
          items: sessionLines(booking),
        },

        {
          kind: 'label',
          text: 'What happens next',
        },
        {
          kind: 'paragraph',
          text: "I'll be in touch to arrange another suitable time for your session.",
        },
        {
          kind: 'paragraph',
          text: 'There is no charge to reschedule because of weather. If you would prefer not to move the session, a full refund can be arranged instead.',
        },

        {
          kind: 'paragraph',
          text: `Your booking reference is ${booking.reference}.`,
        },
      ],
    )
  }

  return renderEmail(
    'Your Drone Confidence booking has been cancelled',
    [
      {
        kind: 'heading',
        text: 'Your booking has been cancelled.',
      },
      {
        kind: 'paragraph',
        text: `Hi ${firstName(booking.customer_name)},`,
      },
      {
        kind: 'paragraph',
        text: 'Your Drone Confidence booking below has been cancelled.',
      },

      {
        kind: 'label',
        text: 'Cancelled session',
      },
      {
        kind: 'lines',
        items: sessionLines(booking),
      },

      {
        kind: 'label',
        text: 'Booking reference',
      },
      {
        kind: 'lines',
        items: [booking.reference],
      },

      {
        kind: 'label',
        text: 'Refund',
      },
      {
        kind: 'paragraph',
        text: refundSentence(reason, refundedCents, booking),
      },

      ...(refundedCents > 0
        ? [
            {
              kind: 'paragraph' as const,
              text: 'Please allow several business days for the refund to appear, depending on your bank or payment provider.',
            },
          ]
        : []),
    ],
  )
}

/**
 * Sent after an existing booking has been moved to a new date or time.
 */
export const rescheduleEmail = (
  booking: BookingRow,
  previousStartsAt: Date,
): EmailBody => {
  const previousEndsAt = new Date(
    previousStartsAt.getTime() + booking.duration_minutes * 60_000,
  )

  return renderEmail(
    'Your Drone Confidence session has been rescheduled',
    [
      {
        kind: 'heading',
        text: 'Your session has been rescheduled.',
      },
      {
        kind: 'paragraph',
        text: `Hi ${firstName(booking.customer_name)},`,
      },
      {
        kind: 'paragraph',
        text: 'Your Drone Confidence session has been moved to a new date or time.',
      },

      {
        kind: 'label',
        text: 'Previous session',
      },
      {
        kind: 'lines',
        items: [
          formatLongDate(previousStartsAt, booking.time_zone),
          formatTimeRange(
            previousStartsAt,
            previousEndsAt,
            booking.time_zone,
          ),
        ],
      },

      {
        kind: 'label',
        text: 'Your new session',
      },
      {
        kind: 'lines',
        items: sessionLines(booking),
      },

      {
        kind: 'label',
        text: 'Booking reference',
      },
      {
        kind: 'lines',
        items: [booking.reference],
      },

      {
        kind: 'paragraph',
        text: 'Your existing payment carries across to the new session, so there is nothing else you need to do.',
      },
      {
        kind: 'paragraph',
        text: "If the new time doesn't suit, reply to this email and we'll find another suitable time.",
      },
    ],
  )
}

/**
 * Internal owner notification.
 *
 * Includes the operational information needed to prepare for the session.
 */
export const ownerNotificationEmail = (
  booking: BookingRow,
  adminUrl: string,
): EmailBody =>
  renderEmail(
    `New booking | ${booking.session_name} | ${formatLongDate(
      new Date(booking.starts_at),
      booking.time_zone,
    )}`,
    [
      {
        kind: 'heading',
        text: 'New booking confirmed.',
      },

      {
        kind: 'label',
        text: 'Session',
      },
      {
        kind: 'lines',
        items: [
          ...sessionLines(booking),
          `Paid: ${formatMoneyCents(
            booking.amount_paid_cents,
            booking.currency,
          )}`,
          `Reference: ${booking.reference}`,
        ],
      },

      {
        kind: 'label',
        text: 'Customer',
      },
      {
        kind: 'lines',
        items: [
          booking.customer_name,
          booking.email,
          booking.mobile,
        ],
      },

      {
        kind: 'label',
        text: 'Aircraft and controller',
      },
      {
        kind: 'lines',
        items: equipmentLines(booking),
      },

      {
        kind: 'label',
        text: 'What they want help with',
      },
      {
        kind: 'paragraph',
        text: booking.help_with,
      },

      ...(booking.notes
        ? [
            {
              kind: 'label' as const,
              text: 'Additional notes',
            },
            {
              kind: 'paragraph' as const,
              text: booking.notes,
            },
          ]
        : []),

      {
        kind: 'button',
        label: 'Open admin dashboard',
        href: adminUrl,
      },
    ],
  )