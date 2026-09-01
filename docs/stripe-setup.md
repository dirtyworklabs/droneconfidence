# Stripe setup

The site takes real payments through **Stripe Checkout**. Everything in this document is
configuration performed in the Stripe dashboard and in Netlify environment variables — there is no
code change involved.

## How payment works here

1. The customer completes the four steps at `/book`.
2. `create-checkout` reserves the slot as a 30-minute hold in Supabase, then creates a Stripe
   Checkout Session with a dynamic AUD `price_data` line item priced from
   `shared/booking/catalog.ts`.
3. The browser is redirected to Stripe's hosted page. **Card details are entered on Stripe, never on
   this site.** No card number, CVV or expiry ever reaches this application.
4. Stripe calls `/.netlify/functions/stripe-webhook`. `checkout.session.completed` is what confirms
   a booking — not the customer's return to the site.
5. `/booking-confirmed` asks the server what actually happened, using the Checkout Session id in the
   URL. It never trusts the URL as proof of payment.

There are no Products or Prices to create in Stripe. Each Checkout Session is priced from the
session catalogue at request time, so a price change in the code is the only change needed.

## Environment variables

Both are **server-only** and are read by Netlify Functions:

| Variable | Where it is used |
| --- | --- |
| `STRIPE_SECRET_KEY` | `create-checkout`, `stripe-webhook`, refunds |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` signature verification |

Never expose either through a `VITE_*` variable — every `VITE_*` value is readable by the browser.
Never paste a key into a commit, a comment or a log line.

## Webhook

- Endpoint URL: `https://<your-domain>/.netlify/functions/stripe-webhook`
- Events to send: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

The handler verifies the signature against the **raw** request body, records every event id in
`stripe_events`, and ignores an id it has already processed — so a redelivery cannot double-confirm
or double-charge.

## Test-mode checklist

- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in Netlify (test-mode values).
- [ ] Webhook endpoint added with the three events above.
- [ ] Complete a booking with card `4242 4242 4242 4242`; confirm `/booking-confirmed` shows the
      booking and the reference matches the row in Supabase.
- [ ] Confirm the customer confirmation email and owner notification arrive.
- [ ] Start a booking and abandon the Stripe page; confirm the slot is held, then released, and that
      `/book?checkout=cancelled` explains nothing was charged.
- [ ] Let a hold lapse without paying; confirm `checkout.session.expired` marks it `expired` and the
      time becomes bookable again.
- [ ] Cancel a paid booking in `/admin` with each reason; confirm the refund amount matches the
      policy table below and appears in Stripe.
- [ ] Confirm a repeated cancel does not refund twice.
- [ ] Reschedule a paid booking; confirm the payment is preserved and the customer is emailed.

Only switch to live keys once every box above passes.

## Refunds

The published policy at `/booking-policy` is the source of truth, and
`shared/booking/policy.ts` is that policy expressed as data:

| Situation | Outcome |
| --- | --- |
| Cancelled more than 24 hours before | Full refund |
| Cancelled within 24 hours | 50% refunded, 50% retained |
| No-show | 50% refunded, 50% retained |
| Weather / unsuitable conditions determined by Drone Confidence | Free reschedule or full refund, no fee |

The amount is always computed on the server from the booking's own start time and the amount
actually paid. A refund figure is never accepted from a browser, refunds carry a Stripe idempotency
key, and anything already refunded is subtracted so a repeated action cannot pay out twice.

Refunds are issued to the original payment method and can take several business days to appear —
which is what the site already tells customers.
