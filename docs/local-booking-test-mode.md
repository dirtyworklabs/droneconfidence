# Local booking test mode

How to drive a complete booking — hold, Stripe Checkout, webhook, confirmation, email — through
`netlify dev` while the shared Supabase database keeps `booking_settings.booking_enabled = false`.

This is a **local testing convenience only**. Production stays closed, and nothing in the database
changes.

## What it is

Public booking normally opens on one condition: `booking_settings.booking_enabled` in Supabase. The
server-side helper `netlify/lib/bookingAccess.ts` adds one narrow, local-only exception:

```
publicBookingAllowed = settings.bookingEnabled OR safeLocalBookingTestMode
```

`safeLocalBookingTestMode` is true **only when all three of these hold at once**:

| # | Condition | Notes |
| --- | --- | --- |
| 1 | `BOOKING_TEST_MODE` is exactly `true` | `1`, `yes`, `TRUE` and anything else are refused. |
| 2 | The explicit `SITE_URL` is `http://localhost:8888` | A trailing slash is normalised away; nothing else is. Netlify's own `URL` variable is deliberately **not** consulted, because it is set in every deploy context. |
| 3 | `STRIPE_SECRET_KEY` begins with `sk_test_` | A `sk_live_…` key, an empty key, or any unrecognised key format is refused. |

Failure is closed. Missing, empty or unexpected values mean booking stays shut, and
`BOOKING_TEST_MODE=true` on its own does nothing at all. The Stripe key is only ever inspected by
prefix — no part of it is logged, returned or exposed.

The flag is **server-only**. It has no `VITE_` prefix, it never reaches browser code, and there is no
query parameter, cookie, header, hidden control or admin setting that can turn it on. Test mode is
not an admin concept: the admin dashboard's `waiveNotice` behaviour is unchanged and unrelated.

## Where it is enforced

- `netlify/lib/availabilityService.ts` — a public/customer availability lookup requires
  `publicBookingAllowed(...)`. An authorised admin lookup (`waiveNotice: true`) is unaffected, exactly
  as before.
- `netlify/functions/booking-checkout.mts` — re-applies the same decision from the settings row
  before any hold is reserved or any Checkout Session is created. Defence in depth: a direct POST to
  the function cannot bypass a closed booking system, and gets the ordinary
  "Online booking is temporarily unavailable." response.

Nothing else changes. Availability calculation, the seven-day notice, the three-month horizon,
bookable weekdays, Sydney/DST handling, buffers, same-day location locking, blocked dates,
server-side price and duration authority, `reserve_booking_hold`, the database exclusion constraints,
Stripe idempotency, webhook signature verification, RLS, refunds and email all behave identically.

## Netlify configuration

In **Site configuration → Environment variables**, add:

| Variable | Value | Scope | Contexts |
| --- | --- | --- | --- |
| `BOOKING_TEST_MODE` | `true` | **Functions** only | **Local development only** |

Explicitly:

- Never set it in **Production**.
- Never set it in **Deploy Previews**.
- Never set it in **Branch deploys**.
- Never create a `VITE_BOOKING_TEST_MODE`.

In the same *Local development* context, `SITE_URL` must be `http://localhost:8888` and
`STRIPE_SECRET_KEY` must be the Stripe **sandbox/test** secret (`sk_test_…`). Production keeps
`SITE_URL=https://droneconfidence.com` and its live key, so the override can never activate there.

Then run:

```bash
netlify dev            # serves the site and the functions on http://localhost:8888
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook
```

Use the signing secret `stripe listen` prints as the local `STRIPE_WEBHOOK_SECRET`, otherwise nothing
will confirm the booking — the webhook, not the return to the site, is what confirms a payment.

## The shared database

Local testing uses the **same Supabase project as production**. There is no second database. That
means:

- Sandbox bookings are **real rows** in the production `bookings` table, with real audit events,
  holds and email-idempotency rows.
- They occupy real slots, and — because of the one-training-area-per-Sydney-day rule — a test booking
  locks the other area for that date until it is cancelled or its hold lapses.
- **Delete them by hand once testing is finished.** Pick dates you would not otherwise sell.
- Confirmation and owner-notification email is really sent, to whatever addresses the test booking
  uses.

`booking_settings.booking_enabled` stays `false` throughout. Do not turn the production booking
switch on in order to test locally — that is what this override exists to avoid — and do not edit the
settings row for testing.

## Tests

`tests/bookingAccess.test.ts` covers the three-part gate and the availability integration;
`tests/bookingCheckoutGate.test.ts` forces the availability lookup to succeed with the switch off and
proves checkout still refuses. Neither calls Stripe, Supabase or Resend.
