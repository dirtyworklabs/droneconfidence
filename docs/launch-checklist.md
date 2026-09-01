# Launch checklist

Three parts. The **Website** and **Domain** sections apply to launching the public site. The
**Booking integration** section applies when the live booking implementation is connected behind
`/book`; the public booking UI is already complete and needs no redesign for it.

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
- [ ] Privacy page reviewed and accurate for what the site actually does.
- [ ] Booking policy reviewed and consistent with the cancellation table shown elsewhere.
- [ ] Keyboard pass: tab through the header, mobile menu, FAQ accordion, the `/book` selection
      steps and the contact form.
- [ ] Reduced-motion pass: enable "reduce motion" in the OS and confirm the site is calm and usable.
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] Browser console clean on every route.

### Form testing (deployed only)

Netlify Forms cannot be tested from `localhost` — submissions need the deployed function. There is
one form: `contact`.

- [ ] Submit the contact form on `/contact`; confirm it appears under **Netlify → Forms → contact**.
- [ ] Submit it once via `/contact?reason=custom-location` and confirm the custom-location field is
      captured.
- [ ] Confirm email notifications are configured in Netlify so submissions actually reach an inbox.
- [ ] Confirm the success message appears and does not imply a session was booked or paid for.
- [ ] Trigger a validation error deliberately and confirm the error summary is announced and
      focused.

### Public booking UI (deployed)

The booking experience at `/book` ships with the website, before any integration exists.

- [ ] `/book` loads with the four-step progress indicator and no launch or waitlist language.
- [ ] Selecting a session reveals the training area step; selecting a training area reveals the date
      and time step.
- [ ] The summary shows the correct session, duration, price and training area.
- [ ] Deep links preselect correctly: `?session=first-flight`, `?session=fly-with-confidence`,
      `?session=photo-video`, `?location=south-sydney`, `?location=north-sydney`.
- [ ] An invalid value (e.g. `?session=nope`) is ignored and removed from the URL.
- [ ] Browser back and forward step through selections.
- [ ] With no integration configured, the date and time step shows
      "Online booking is temporarily unavailable." with a Contact link — never a fake calendar.
- [ ] Keyboard pass through both selection steps: focus is visible and selection works without a
      mouse.
- [ ] Desktop summary stays clear of the header and footer while sticky.

## Domain

- [ ] Custom domain configured in Netlify.
- [ ] HTTPS active with a valid certificate.
- [ ] Canonical redirects correct — one primary hostname, others redirect (e.g. `www` → apex or the
      reverse, chosen deliberately).
- [ ] `siteConfig.siteUrl` matches the live canonical domain (`src/config/site.ts`).
- [ ] `public/sitemap.xml` and `public/robots.txt` reference the same canonical domain.
- [ ] Social card renders correctly when the URL is pasted into a message.

## Booking integration

Only required when connecting the live booking implementation. The public UI does not change.

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
- [ ] Session-specific scheduling URLs added to configuration.
- [ ] General scheduling URL added to configuration.
- [ ] Integration enabled (`VITE_BOOKING_ENABLED=true`) and confirmed to resolve — the date and time
      step no longer shows the unavailable fallback.
- [ ] Every booking CTA re-tested after enabling — homepage, session cards, sessions page, locations,
      final CTA, header, mobile nav, `/book`. CTAs always point at `/book`, so none of them should
      change behaviour.
- [ ] Privacy page reviewed again; it now names the scheduling and payment providers.

### Final real-world test

Complete one entire test booking:

1. Homepage
2. → `/book` with a session preselected
3. → training area
4. → real date and time
5. → details
6. → payment
7. → confirmation
8. → email
9. → reschedule / cancellation test

**Do not enable live booking until this succeeds.**
