# Booking email templates

The approved wording for every transactional message. These templates are **implemented in code**,
in `netlify/lib/email/templates.ts`, and delivered through Resend by `netlify/lib/email/send.ts`.
The `[SQUARE BRACKETS]` placeholders below correspond to real booking fields.

Change the wording here and in `templates.ts` together — this file is the copy of record, and the
code is what customers actually receive.

Which message is sent when:

| Template | Trigger | Sent by |
| --- | --- | --- |
| 1. Booking confirmation | `checkout.session.completed` | `stripe-webhook` |
| 2. 24-hour reminder | hourly schedule, ~24 hours before the lesson | `booking-reminders` |
| 3. Weather reschedule | owner reschedules in `/admin` | `admin-bookings` |
| 4. Cancellation | owner cancels in `/admin` | `admin-bookings` |
| 5. Owner notification | every confirmed booking | `stripe-webhook` |

Two rules the code enforces:

- **Every customer-supplied value is HTML-escaped** before it reaches an email body
  (`netlify/lib/email/render.ts`). Nothing a customer types can inject markup.
- **A failed email never rolls back a paid booking.** Delivery problems are recorded and surfaced to
  the owner; the booking stays confirmed. Confirmation, reminder and cancellation emails are sent
  through `sendOnce()`, which records an idempotency row first, so a retry cannot send twice.

---

## 1. Booking confirmation

**Subject:** You're booked — Drone Confidence

> **You're booked.**
>
> Hi [FIRST NAME],
>
> Thanks for booking a Drone Confidence session.
>
> Your payment has been received and your session is confirmed.
>
> **Your session**
> [SESSION]
> [DATE]
> [TIME]
> [TRAINING AREA]
>
> **Booking details**
> Booking reference: [REFERENCE]
> Paid: [AMOUNT]
> Aircraft: [AIRCRAFT]
> Controller / RC: [CONTROLLER]
>
> We'll review the information about your aircraft and controller and confirm your meeting point
> before the lesson.
>
> **Please bring:**
> - Your drone
> - Controller
> - Charged batteries
> - Phone or tablet if required
> - Memory card
> - Any accessories you'd like help with
>
> We'll keep an eye on the weather leading up to the session.
>
> If conditions aren't suitable for safe flying, we'll reschedule at no cost or refund you in full.
>
> See you there.
>
> Drone Confidence

---

## 2. 24-hour reminder

**Subject:** Your Drone Confidence session is tomorrow

> Hi [FIRST NAME],
>
> A quick reminder to:
> - Charge your drone batteries
> - Charge your controller
> - Charge your phone or tablet
> - Bring your memory card
> - Bring any accessories you'd like help with
> - Check that your drone app opens correctly
>
> **Your meeting location**
> [LOCATION]
>
> **Your session**
> [SESSION + TIME]
>
> If weather conditions require a change, we'll contact you directly.
>
> See you tomorrow.
>
> Drone Confidence

---

## 3. Weather reschedule

Send this manually once **you** have decided conditions aren't suitable. Never automate a go/no-go
decision from a weather API.

**Subject:** We need to move your Drone Confidence session

> Hi [FIRST NAME],
>
> The conditions for your scheduled Drone Confidence session aren't looking suitable for safe and
> useful flying.
>
> Rather than compromise the session, we'll move your booking to another suitable time at no cost —
> or refund you in full if you'd prefer.
>
> Use the booking link below to choose another available time, or reply and we'll help arrange it.
>
> [RESCHEDULE LINK]
>
> Drone Confidence

---

## 4. Cancellation

**Subject:** Your Drone Confidence booking has been cancelled

> Hi [FIRST NAME],
>
> Your booking for:
> [SESSION]
> [DATE]
> [TIME]
>
> has been cancelled.
>
> **Refund:**
> [REFUND INFORMATION]
>
> Please allow several business days for a refund to appear, depending on your bank/payment
> provider.
>
> Drone Confidence

`[REFUND INFORMATION]` is generated from the amount actually refunded, which the server derives
from the published policy in `shared/booking/policy.ts` — full refund, or 50% refunded and 50%
retained, or free reschedule/full refund for a weather change.

`[AIRCRAFT]` and `[CONTROLLER]` are the human-readable names chosen at step 4 of `/book`, stored on
the booking as written. A booking taken before the controller was collected shows
`Controller / RC: Not recorded` rather than a guessed value.

---

## 5. Owner notification

Internal only, sent to `ADMIN_NOTIFICATION_EMAIL` alongside every confirmation. Sections, in order:

> **New booking confirmed.**
>
> **Session** — session and duration, date, time, training area, amount paid, reference
>
> **Customer** — name, email, mobile
>
> **Aircraft and controller**
> Aircraft: [AIRCRAFT]
> Controller / RC: [CONTROLLER]
> Experience: [EXPERIENCE LEVEL]
>
> **What they want help with** — the customer's own words
>
> **Additional notes** — only when the customer added some
>
> [Open admin dashboard]

The equipment block is what the lesson is prepared around, so it names the aircraft and the
controller separately rather than as one free-text line.

---

## 6. Meeting details

Meeting details are confirmed by the owner directly, not automatically. Whichever message carries
them should include:

- Training area (South Sydney — Taren Point, or North Sydney — North Ryde)
- The exact meeting point
- Street address
- An optional map link
- Arrival instructions (where to park, where to wait, what to look for)
- A contact number for the day

Keep the exact meeting point in the booking emails. It is deliberately **not** published on the
marketing website — the FAQ says the meeting point is provided with a confirmed booking. Only change
that if it's an intentional decision later.
