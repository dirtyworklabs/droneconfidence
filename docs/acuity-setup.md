# Acuity Scheduling setup

Documentation only. **Nothing in this file is required for the current build, deploy, or for the
website to work.** The public booking UI at `/book` is complete and ships without any scheduling
account: every CTA routes to `/book`, session and training area are chosen there, and the date and
time step shows an operational unavailable message until an integration is configured.

Follow this when connecting the live booking integration — the separate implementation step that
supplies real availability, details capture, payment and confirmation.

---

## 1. Account

- [ ] Create or confirm an Acuity Scheduling account.
- [ ] Set the business timezone to **Australia/Sydney**.
- [ ] Set currency to **AUD**.

## 2. Appointment types

Create one appointment type per session. Names, durations and prices must match
`src/content/sessions.ts` exactly — that file is the single source of truth for the website.

| Appointment type | Duration | Price |
| --- | --- | --- |
| First Flight | 60 minutes | $179 |
| Fly With Confidence | 90 minutes | $239 |
| Photo & Video | 90 minutes | $269 |

- [ ] Durations are fixed. Do not offer extensions or custom durations — the website never implies
      a session can be extended.
- [ ] Add a short description to each type, reusing the "Best for" line from the sessions page.

## 3. Availability

- [ ] Configure the hours you actually want to work, per training area if that's simpler.
- [ ] Add buffer time between sessions for travel between north and south Sydney.
- [ ] Set a minimum booking notice (e.g. 24 hours) so you have time to review drone details.
- [ ] Confirm the calendar renders in Australia/Sydney for a customer in another timezone.

## 4. Intake questions

Add these to every paid appointment type.

**Required**

1. *Which training area would you prefer?* (select)
   - South Sydney — Taren Point
   - North Sydney — North Ryde
2. *What drone do you have?* (free text)
3. *How would you describe your experience?* (select)
   - I've never flown
   - I've flown a few times
   - I'm comfortable with basic flying
   - I'm an experienced pilot wanting to improve specific skills
4. *What would you most like help with?* (free text)
5. *Mobile number* (required)
6. *Email* (required — usually captured by Acuity itself)

**Optional**

7. *Is there anything else I should know before your session?* (free text)

Do **not** add a custom-location option to the standard paid appointment types. Custom locations are
handled as a request on `/contact?reason=custom-location`, because travel, venue or permit costs must
be confirmed before booking. Only add a custom-location appointment type if you deliberately build a
manual or custom-price workflow for it.

## 5. Cancellation and rescheduling rules

Match the published policy at `/booking-policy`:

- [ ] Customers can cancel or reschedule **more than 24 hours** before the session → full refund.
- [ ] Within 24 hours → 50% refunded, 50% retained.
- [ ] No-show → 50% refunded, 50% retained.
- [ ] Weather or unsuitable conditions determined by Drone Confidence → free reschedule or full
      refund, no fee. This is a manual decision you make; do not automate it.

If Acuity can't express the 50% rule automatically, handle those refunds manually in Stripe and keep
the policy page as the published source of truth.

## 6. Payment

See [`stripe-setup.md`](./stripe-setup.md). In short: connect Stripe to Acuity and require **full
payment at the time of booking**.

## 7. Emails

Copy for each message is in [`booking-email-templates.md`](./booking-email-templates.md).

- [ ] Booking confirmation.
- [ ] 24-hour reminder.
- [ ] Weather reschedule (send manually, or use a saved template if Acuity supports one).
- [ ] Cancellation.
- [ ] Include the exact meeting point in the confirmation, not on the public website.

## 8. Collect the booking URLs

Once the appointment types exist, copy the public scheduling links:

- General scheduling page (all session types)
- First Flight direct link
- Fly With Confidence direct link
- Photo & Video direct link

These are public URLs, not secrets. Never put an Acuity **API key or secret** anywhere in this
repository or in a `VITE_*` variable — the browser can read every `VITE_*` value.

## 9. Enable the integration on the website

See "Booking: what is built and what is next" in the [README](../README.md). Set the environment
variables in Netlify:

```
VITE_BOOKING_ENABLED=true
VITE_BOOKING_URL=https://…
VITE_BOOKING_FIRST_FLIGHT_URL=https://…
VITE_BOOKING_FLY_CONFIDENCE_URL=https://…
VITE_BOOKING_PHOTO_VIDEO_URL=https://…
```

The integration mode is derived, not just declared: it can only leave `'none'` when at least one
**absolute http(s)** URL is present. A typo can't produce a dead control — the date and time step
falls back to "Online booking is temporarily unavailable." with a Contact link.

None of these variables change any marketing copy. They are read only through
`src/lib/bookingService.ts`, which the date and time step inside `/book` consumes. Session-specific
links are used as a hand-off from that step, not from the CTAs — every CTA on the site points at
`/book`.

For a first-party flow (real slots rendered on `/book` instead of a hand-off), implement
`BookingService` in `src/lib/bookingService.ts`, return it from `getBookingService()`, and add a
`{ kind: 'service' }` case to `AvailabilitySource` for
`src/components/booking/BookingAvailability.tsx` to render.

## 10. Test end to end before going live

Run the full test in [`launch-checklist.md`](./launch-checklist.md) — homepage → `/book` → session →
training area → real date and time → payment → confirmation email → reschedule → refund. Do not
enable live booking until that passes.
