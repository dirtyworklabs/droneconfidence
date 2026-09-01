# Stripe setup (future)

Documentation only. **No Stripe account, key, product or price is required to build, deploy or run
this website.**

## The website does not integrate with Stripe

This is deliberate and should stay that way:

- The Drone Confidence frontend never collects card numbers, CVV, expiry dates or any payment
  credential.
- There is no payment form, no Stripe Checkout call, no webhook handler and no server in this repo.
- Stripe is connected **through the scheduling platform** (Acuity), which handles the payment page.
- No Stripe key belongs in this repository. Secret keys must never appear in `src`, in git, in
  committed files, or in any `VITE_*` variable — every `VITE_*` value is readable by the browser.

The only thing the website knows about payment is the copy on `/book` and `/booking-policy`:
full payment is taken at the time of booking, and it is processed securely by the external
booking/payment provider.

## Future setup

- [ ] Create or verify a Stripe account (business details, bank account, identity verification).
- [ ] Connect Stripe to the scheduling platform using its own integration screen.
- [ ] Configure the scheduling platform to require **full payment** at the time of booking — not a
      deposit, and not pay-on-the-day.
- [ ] Verify the currency is **AUD** and that prices display as $179 / $239 / $269.
- [ ] Run a test payment in Stripe test mode.
- [ ] Test the cancellation and refund workflow, including a partial (50%) refund.
- [ ] Confirm the customer receives a receipt.
- [ ] Confirm refunds are returned to the original payment method.
- [ ] Switch from test mode to live mode only after all of the above succeed.

## Refunds

The published policy at `/booking-policy` is the source of truth:

| Situation | Outcome |
| --- | --- |
| Cancelled more than 24 hours before | Full refund |
| Cancelled within 24 hours | 50% refunded, 50% retained |
| No-show | 50% refunded, 50% retained |
| Weather / unsuitable conditions determined by Drone Confidence | Free reschedule or full refund, no fee |

If the scheduling platform can't issue a 50% refund automatically, issue it manually in the Stripe
dashboard. Keep the wording on the website unchanged — it already tells customers refunds may take
several business days depending on their bank.

## If the payment provider changes

Nothing in `src` needs to change except the provider name used by the privacy page:
`siteConfig.providers.payment` in `src/config/site.ts`.
