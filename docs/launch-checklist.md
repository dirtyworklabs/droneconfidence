# Launch checklist

Four parts: the public **Website**, the **Domain**, the **Booking system** (Supabase, Stripe, Resend
and the owner dashboard), and a final real-world test.

Nothing can be paid for until the booking master switch is turned on in `/admin` → Settings. It
ships **off**, so the site can be deployed safely before any of the booking configuration is
finished.

---

## Website

- [ ] Final copy reviewed end to end (prices, session names, durations, policy wording).
- [ ] Mobile reviewed on a real phone — hierarchy, tap targets, no horizontal scrolling, sticky
      header not covering content.
- [ ] Desktop reviewed at 1280px and above.
- [ ] Tablet reviewed around 768–1024px.
- [ ] No visible placeholders — no `[EMAIL]`, no lorem, no empty image boxes.
- [ ] Contact email added to `src/config/site.ts` (`contactEmail`). Until it's set, the footer email
      row hides itself rather than showing a placeholder.
- [ ] Instagram URL added if one exists (`instagramUrl`), otherwise it stays hidden.
- [ ] About/portrait image added if available (`src/content/images.ts` → `aboutPortrait`).
- [ ] Real photography added where available — hero, three sessions, two locations. Designed SVG
      fallbacks are used until then, at the same geometry, so no layout changes are needed.
- [ ] No fake testimonials. `src/content/testimonials.ts` is empty and the section does not render.
      Only add genuine quotes from real customers.
- [ ] No invented CASA approvals, licences, insurance claims, venue permissions or endorsements.
- [ ] 404 page works — visit `/not-a-real-page` on the deployed site, not just locally.
- [ ] Contact form tested on the deployed site (see below).
- [ ] Privacy page reviewed — it now names Netlify, Supabase, Stripe and Resend, and describes what a
      booking record contains.
- [ ] Booking policy reviewed and consistent with the cancellation table shown elsewhere.
- [ ] Keyboard pass: tab through the header, mobile menu, FAQ accordion, all four `/book` steps and
      the contact form.
- [ ] Reduced-motion pass: enable "reduce motion" in the OS and confirm the site is calm and usable.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm test` passes.
- [ ] Browser console clean on every route.

### Form testing (deployed only)

Netlify Forms cannot be tested from `localhost` — submissions need the deployed function. There is
one form: `contact`. It is unchanged by the booking system.

- [ ] Submit the contact form on `/contact`; confirm it appears under **Netlify → Forms → contact**.
- [ ] Submit it once via `/contact?reason=custom-location` and confirm the custom-location field is
      captured.
- [ ] Confirm email notifications are configured in Netlify so submissions actually reach an inbox.
- [ ] Confirm the success message appears and does not imply a session was booked or paid for.
- [ ] Trigger a validation error deliberately and confirm the error summary is announced and
      focused.

## Domain

- [ ] Custom domain configured in Netlify.
- [ ] HTTPS active with a valid certificate.
- [ ] Canonical redirects correct — one primary hostname, others redirect (e.g. `www` → apex or the
      reverse, chosen deliberately).
- [ ] `siteConfig.siteUrl` matches the live canonical domain (`src/config/site.ts`).
- [ ] `SITE_URL` in Netlify matches it too — it builds the Stripe return URLs and every email link.
- [ ] `public/sitemap.xml` and `public/robots.txt` reference the same canonical domain.
- [ ] `/admin` and `/booking-confirmed` are absent from the sitemap and disallowed in `robots.txt`.
- [ ] Social card renders correctly when the URL is pasted into a message.

## Booking system

### Supabase

- [ ] Project created in a region close to Sydney.
- [ ] All four migrations applied, in order: `0001_booking_core.sql`,
      `0002_booking_functions.sql`, `0003_privilege_hardening.sql`,
      `0004_service_role_table_grants.sql`.
- [ ] `select relrowsecurity from pg_class where relname = 'bookings';` returns `true`, and
      `select count(*) from pg_policies where schemaname = 'public';` returns `0`. Row Level Security
      is on with no policies: the service-role key is the only way in.
- [ ] `SUPABASE_URL` and `SUPABASE_SECRET_KEY` set in Netlify. The secret key is **server-only** —
      never in a `VITE_*` variable.
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set in Netlify. These are the browser
      values, used **only** by the admin login. The public site works without them.
- [ ] Owner user created under **Authentication → Users**, with the same address as
      `ADMIN_NOTIFICATION_EMAIL`. Email confirmation completed.
- [ ] Email signups disabled in Supabase Auth so no one else can create an account.
- [ ] Sign in at `/admin/login`, then confirm a *different* Supabase user (if one exists) is refused.

### Stripe

Full detail in [docs/stripe-setup.md](./stripe-setup.md).

- [ ] `STRIPE_SECRET_KEY` set (test mode first).
- [ ] Webhook endpoint added at `https://<domain>/.netlify/functions/stripe-webhook` for
      `checkout.session.completed`, `checkout.session.expired` and `charge.refunded`.
- [ ] `STRIPE_WEBHOOK_SECRET` set from that endpoint's signing secret.
- [ ] A test payment confirms a booking, and the confirmation page shows it.
- [ ] An abandoned checkout releases the slot.
- [ ] A refund appears in Stripe with the amount the policy requires.

### Resend

- [ ] Domain verified in Resend (SPF and DKIM records added at the DNS host).
- [ ] `RESEND_API_KEY` set (server-only).
- [ ] `RESEND_FROM_EMAIL` set to an address on the verified domain.
- [ ] `RESEND_REPLY_TO` set to the address the owner actually reads.
- [ ] `ADMIN_NOTIFICATION_EMAIL` set — this is both the owner notification address and the only
      address allowed into `/admin`.
- [ ] Confirmation email received and rendered correctly on a phone.
- [ ] Owner notification received with the drone, experience and help-with details.
- [ ] Reminder email received (temporarily move a test booking to ~24 hours away).
- [ ] Cancellation email received with the correct refund wording.

### Local sandbox testing (optional, before launch)

The whole booking flow can be driven locally through `netlify dev` against Stripe's sandbox while the
shared database keeps `booking_settings.booking_enabled = false`. See
[docs/local-booking-test-mode.md](./local-booking-test-mode.md).

- [ ] `BOOKING_TEST_MODE=true` set **server-only**, scope **Functions**, context **Local development
      only** — never Production, never Deploy Previews, never Branch deploys.
- [ ] `SITE_URL=http://localhost:8888` and a `sk_test_…` `STRIPE_SECRET_KEY` in the same local
      context. All three are required; anything missing or unrecognised leaves booking closed.
- [ ] Do **not** turn the production master switch on for local testing, and do not change
      `booking_settings.booking_enabled` in the database.
- [ ] Sandbox bookings are real rows in the shared database — delete them afterwards.

### Availability and settings

- [ ] `/admin` → Settings reviewed: bookable days Tue/Wed/Thu, day 08:00–15:00, 7 days notice,
      3 months ahead, 30-minute increment, 30-minute buffer, 30-minute checkout hold.
- [ ] Public holidays and any other unavailable dates added under Availability. There is no holiday
      API — dates are blocked deliberately, by hand.
- [ ] A block reason is internal: confirm it never appears in the response from
      `/.netlify/functions/booking-availability`.
- [ ] `/book` step 3 shows real times only: 08:00 first, last start 2:00 pm for a 60-minute session
      and 1:30 pm for a 90-minute one.
- [ ] Nothing is offered inside the 7-day notice window.
- [ ] With the master switch **off**, `/book` still shows all four steps and reports that online
      booking is unavailable at the date and time step. Nothing can be paid for.

### Public booking flow (deployed)

- [ ] `/book` loads with the four-step progress indicator and no launch or waitlist language.
- [ ] Selecting a session reveals the training area step, then real availability, then details.
- [ ] The summary shows the correct session, duration, price, training area and chosen time.
- [ ] Deep links preselect correctly: `?session=first-flight`, `?session=fly-with-confidence`,
      `?session=photo-video`, `?location=south-sydney`, `?location=north-sydney`.
- [ ] An invalid value (e.g. `?session=nope`) is ignored and removed from the URL.
- [ ] Browser back and forward step through selections.
- [ ] No personal detail ever appears in the URL.
- [ ] Book a real time in one training area, then confirm the **other** area disappears for that
      date — one location per Sydney day.
- [ ] Keyboard pass through all four steps: focus is visible and selection works without a mouse.
- [ ] Desktop summary stays clear of the header and footer while sticky.
- [ ] Every booking CTA re-tested — homepage, session cards, sessions page, locations, final CTA,
      header, mobile nav. All of them enter through `/book`.

## Final real-world test

Complete one entire booking in Stripe **test** mode:

1. Homepage
2. → `/book` with a session preselected
3. → training area
4. → a real available date and time
5. → details, review, policy acknowledgement
6. → Stripe Checkout
7. → `/booking-confirmed`, showing the reference the database issued
8. → confirmation email and owner notification
9. → reschedule from `/admin`, and confirm the customer is emailed
10. → cancel from `/admin`, and confirm the refund amount matches the policy

Then, in a second window, prove the concurrency rules:

- [ ] Two browsers reach step 4 on the same time; the second one to pay is told the time was taken
      and is not charged.
- [ ] Two browsers try to hold different training areas on the same empty date; only one succeeds.

**Switch to live Stripe keys and turn the booking master switch on only after all of the above
succeeds.**
