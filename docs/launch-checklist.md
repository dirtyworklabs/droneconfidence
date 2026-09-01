# Launch checklist

Two parts. The **Website** and **Domain** sections apply to launching the marketing site now. The
**Booking** section applies only when you activate online bookings, which can happen later without
any redesign.

---

## Website

- [ ] Final copy reviewed end to end (prices, session names, durations, policy wording).
- [ ] Mobile reviewed on a real phone — hierarchy, tap targets, no horizontal scrolling, sticky
      booking bar not covering content.
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
- [ ] Both forms tested on the deployed site (see below).
- [ ] Privacy page reviewed and accurate for what the site actually does.
- [ ] Booking policy reviewed and consistent with the cancellation table shown elsewhere.
- [ ] Keyboard pass: tab through the header, mobile menu, FAQ accordion and both forms.
- [ ] Reduced-motion pass: enable "reduce motion" in the OS and confirm the site is calm and usable.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] Browser console clean on every route.

### Form testing (deployed only)

Netlify Forms cannot be tested from `localhost` — submissions need the deployed function.

- [ ] Submit the enquiry form on `/book`; confirm it appears under **Netlify → Forms →
      session-enquiry**.
- [ ] Submit the contact form on `/contact`; confirm it appears under **contact**.
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
- [ ] `public/sitemap.xml` and `public/robots.txt` reference the same canonical domain.
- [ ] Social card renders correctly when the URL is pasted into a message.

## Booking

Only required when activating online bookings.

- [ ] Acuity account created.
- [ ] Appointment types created (First Flight, Fly With Confidence, Photo & Video).
- [ ] Prices correct — $179 / $239 / $269.
- [ ] Durations correct — 60 / 90 / 90 minutes.
- [ ] Availability correct.
- [ ] Timezone set to Australia/Sydney.
- [ ] Intake questions correct (training area, drone, experience, help with, mobile, email, notes).
- [ ] Stripe connected.
- [ ] Full payment required at time of booking.
- [ ] Cancellation settings checked against `/booking-policy`.
- [ ] Confirmation email tested.
- [ ] Reminder email tested.
- [ ] Rescheduling tested.
- [ ] Refund tested, including a 50% partial refund.
- [ ] Session-specific booking URLs added to configuration.
- [ ] General booking URL added to configuration.
- [ ] Booking mode enabled (`VITE_BOOKING_ENABLED=true`, or `bookingEnabled` in
      `src/config/booking.ts`).
- [ ] Every booking CTA re-tested after enabling — homepage, session cards, sessions page, locations,
      final CTA, header, mobile bar, `/book`.
- [ ] Privacy page reviewed again; it now names the scheduling and payment providers.

### Final real-world test

Complete one entire test booking:

1. Homepage
2. → session
3. → booking platform
4. → payment
5. → confirmation
6. → email
7. → reschedule / cancellation test

**Do not enable live booking until this succeeds.**
