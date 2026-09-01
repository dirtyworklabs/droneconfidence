# Acuity Scheduling setup (future)

Documentation only. **Nothing in this file is required for the current build, deploy, or for the
website to work.** The site is fully functional before any scheduling account exists — every booking
CTA routes to `/book`, which shows a polished enquiry state.

Follow this once you're ready to take real bookings.

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

## 9. Enable booking on the website

See the "Enabling booking" section of the [README](../README.md). Either edit
`src/config/booking.ts` or set the environment variables in Netlify:

```
VITE_BOOKING_ENABLED=true
VITE_BOOKING_URL=https://…
VITE_BOOKING_FIRST_FLIGHT_URL=https://…
VITE_BOOKING_FLY_CONFIDENCE_URL=https://…
VITE_BOOKING_PHOTO_VIDEO_URL=https://…
```

`bookingEnabled` is derived, not just declared: it only becomes true when at least one **absolute
http(s)** URL is present. A typo can't produce a dead CTA — the CTA quietly falls back to `/book`.

## 10. Test end to end before going live

Run the full test in [`launch-checklist.md`](./launch-checklist.md) — homepage → session → booking
platform → payment → confirmation email → reschedule → refund. Do not enable live booking until that
passes.
