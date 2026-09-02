# AGENTS.md

Working notes for anyone (human or agent) changing this codebase.

## What this is

The marketing website **and the operating booking system** for a Sydney private drone-coaching
business. Vite + React 19 + TypeScript, Tailwind CSS v4, React Router v7, Motion for React, deployed
to Netlify. Booking state lives in Supabase Postgres, payment goes through Stripe Checkout,
transactional email goes through Resend, and trusted work happens in Netlify Functions.

This file previously said not to build a database, an admin dashboard, a payment flow or an email
sender. That has changed: those are now the product. What has *not* changed is everything below under
**Hard guardrails**.

Division of responsibility, and it is not negotiable:

> **Supabase owns booking state. Stripe owns payment processing. The browser is never authoritative
> for prices, duration, booking status or payment status.**

Deliberately absent, and must stay absent: Acuity, Calendly or any other booking platform; Google
Calendar; Firebase or a second database; customer accounts; Stripe Elements or any custom card
field; a second backend framework; a state-management library.

## Architecture

```
shared/booking/   catalog, rules, availability, policy, time, format, fields,
                  experience, types — the domain, with no React and no import.meta,
                  so pages, functions and tests share one definition
src/
  config/         site.ts — every public value
  content/        sessions, locations, faqs, testimonials, images — all copy lives here
  components/
    ui/           Button, Container, Section, Eyebrow, SectionHeading, Reveal, Accordion
    layout/       Header, Footer, MobileNav, Layout, Wordmark, navigation
    booking/      BookingCta, useBookingSelection, BookingProgress, BookingStep, BookingChoice,
                  SessionSelector, LocationSelector, SlotPicker, BookingAvailability,
                  BookingDetailsForm, BookingSummary, BookingUnavailable
    admin/        AdminShell, useAdminSession, AdminBookingsPanel, AdminAvailabilityPanel,
                  AdminSettingsPanel
    forms/        Fields, ContactForm, SuccessPanel
    marketing/    one component per page section, carrying the approved copy
    visuals/      ImageFrame, Treatments (SVG image fallbacks), TopoBackdrop
  lib/            seo, structuredData, netlifyForms, validation, analytics, motion, routes, cn,
                  bookingService (public booking API client), adminApi, supabaseClient
  pages/          one file per route, default-exported for lazy loading
  styles/         index.css — the entire design system (@theme tokens + @utility)
  types/          shared domain types
netlify/
  functions/      booking-availability, booking-checkout, booking-confirmation,
                  stripe-webhook, booking-reminders (hourly),
                  admin-bookings, admin-availability, admin-settings
  lib/            supabase, store, availabilityService, bookingAccess, bookingInput, stripe,
                  refunds, adminAuth, env, http, email/{render,templates,send}
supabase/migrations/  0001_booking_core.sql, 0002_booking_functions.sql,
                      0003_privilege_hardening.sql, 0004_service_role_table_grants.sql
tests/            vitest — migrations run against real Postgres via PGlite
```

`@/` is aliased to `src/` and `@shared/` to `shared/`, in both `tsconfig.app.json` (`paths`) and
`vite.config.ts` (`resolve.alias`). Both are required — tsconfig alone won't resolve at runtime.
Netlify Functions import `shared/` by relative path, because they are bundled without the Vite alias.

## Non-obvious decisions

**Every CTA goes to `/book`, and only `BookingCta` builds the link.** `bookingPath({ session,
location })` in `src/lib/routes.ts` is the only place a booking URL is assembled. Pass `sessionId` or
`locationId` to preselect. Never hard-code a booking URL in a component, and never point a CTA
off-site.

**The server decides what things cost.** `shared/booking/catalog.ts` holds the id, name, price and
duration of every session, and `netlify/lib/bookingInput.ts` resolves them from it by id. A payload
containing `priceCents`, `durationMinutes` or `sessionName` is ignored, not trusted. The same applies
to refunds: the admin dashboard sends a `CancellationReason`, and the amount is derived from the
policy and the booking's own start time.

**Availability is computed, never stored as a slot list.** `shared/booking/availability.ts` is a pure
function of settings, existing occupancy and blocks. It runs on the server
(`netlify/lib/availabilityService.ts`) and is covered by `tests/availability.test.ts`. Never
fabricate a slot, a calendar or a confirmation: when nothing is bookable the step says so, in
operational language — never "coming soon", "being prepared" or a waitlist.

**The booking master switch defaults to off.** `booking_settings.booking_enabled` ships `false`. With
it off, `/book` still renders all four steps and reports at step 3 that online booking is
unavailable. No marketing copy, FAQ, heading or step list may branch on it. The one exception is
`netlify/lib/bookingAccess.ts`: `publicBookingAllowed(bookingEnabled)` is the single definition of
"a customer may book now", and its local-only override requires `BOOKING_TEST_MODE=true` *and* an
explicit `SITE_URL` of `http://localhost:8888` *and* a `sk_test_` Stripe key, all three at once, so
`netlify dev` can exercise the flow against Stripe's sandbox while the shared database switch stays
off. It is server-only, fails closed, is enforced in both `availabilityService` and
`booking-checkout`, and must never gain a browser, URL, cookie or admin surface — see
`docs/local-booking-test-mode.md`.

**Concurrency is a database problem, and it is solved in the database.** `reserve_booking_hold`,
`confirm_booking_payment` and `reschedule_booking` take an advisory lock on the Sydney booking day and
rely on two GiST exclusion constraints: `bookings_no_overlap` (start → occupied_until, buffer
included) and `bookings_single_location_per_day` (one training area per Sydney day). Never move either
check into the browser or into a read-then-write in TypeScript. The `is_active` boolean exists so no
index predicate ever has to call `now()`, which Postgres will not allow.

**One training area per Sydney day.** Once a live booking *or* an unexpired hold exists on a date, the
other area disappears from availability. The lock lifts when the last hold expires or the last
booking is cancelled. `location_locked:<slug>` is raised so the customer can be told which area the
day is committed to.

**A hold is a booking row, not a lock table.** It is `status = 'pending_payment'` with
`hold_expires_at` 30 minutes out, matching Stripe's minimum Checkout expiry. `expire_stale_holds`
releases lapsed holds with a small grace period, so a webhook arriving a few seconds late still
confirms rather than losing a paid booking.

**Stripe's webhook is the only thing that confirms a booking.** Not the customer's return to the
site. `stripe-webhook` verifies the signature against the **raw** body, records every event id in
`stripe_events`, and ignores an id it has already seen. `/booking-confirmed` asks the server what
happened using the Checkout Session id; it never treats its own URL as proof of payment.

**Email failure never rolls back a paid booking.** `sendOnce()` writes an idempotency row before
delivering, so a retry cannot send twice, and a delivery problem is reported to the owner rather than
undoing the payment.

**Time is Sydney time, and the server is not.** Netlify runs in UTC. Every conversion goes through
`shared/booking/time.ts` (`TZDate` from `@date-fns/tz`) — `instantAt`, `dayOf`, `minutesOf`. Never
build a `Date` from a bare `YYYY-MM-DDTHH:mm` string: Node reads it as server-local and silently
shifts by 10 or 11 hours. Admin availability blocks are submitted as a date plus minutes past local
midnight for exactly this reason.

**Booking selection lives in the URL; the customer's details do not.** `useBookingSelection()`
validates `?session=`, `?location=` and `?slot=` against real content, drops invalid values, and
mirrors changes with `preventScrollReset`. React state plus search params only — no state library.
Never put personal data in the URL.

**The admin route is hidden, and hiding it is not the security.** `requireAdmin()` in
`netlify/lib/adminAuth.ts` verifies the bearer token with Supabase server-side and requires the
authenticated email to equal `ADMIN_NOTIFICATION_EMAIL`, compared case-insensitively. A valid
Supabase user who is not the owner is refused like an anonymous request. Panels never hold a token:
`AdminRun` fetches a fresh one per call.

**RLS is on with zero policies.** Default deny. The service-role key, server-side only, is the only
way to data. Do not disable RLS, and do not add an anon policy to "make something work" — move the
work into a function instead.

**Revoking a function from `anon` does nothing on its own.** Postgres grants EXECUTE on every new
function to PUBLIC, and `anon` inherits it, so `0003_privilege_hardening.sql` revokes PUBLIC first and
then grants EXECUTE back to `service_role` only. Any new function in `public` must be added to that
migration's hardening list — `tests/migrations.test.ts` fails if one isn't. The definer RPCs run with
`search_path = ''` (pinned by `alter function`, so 0002 stays the only copy of each body), which is
only safe because every relation and type they name is schema-qualified. Keep new SQL qualified.

**Netlify Forms needs `public/__forms.html`.** Netlify's build bot can't see client-rendered forms,
so that hidden skeleton registers the `contact` form and every field name. Adding a field to a React
form without adding it there means the submission is rejected. AJAX POSTs go to `/__forms.html`, not
`/`. The booking flow does **not** use Netlify Forms, and the contact form is unrelated to it.

**Tailwind v4 has no config file.** Design tokens are `@theme` variables in `src/styles/index.css`;
custom utilities are `@utility` blocks in the same file. Use the token names (`bg-canvas`,
`text-ink-soft`, `text-sage`, `rounded-[var(--radius-card)]`, `ease-[var(--ease-calm)]`) rather than
raw hex.

**The FAQ accordion keeps answers in the DOM.** It animates `grid-template-rows` from `0fr` to `1fr`
and marks the collapsed panel `inert`, so content stays indexable while staying out of the tab order.
Don't replace it with conditional rendering.

**Image slots ship with designed fallbacks.** `ImageFrame` renders a real `<img>` when
`imageSlots[key].src` is non-empty and an SVG `Treatment` at identical geometry otherwise. To add
photography, edit `src/content/images.ts` only — no component changes.

**SEO is a hook, not a library.** `useSeo()` in `src/lib/seo.ts` upserts title, description,
canonical, OG/Twitter tags and JSON-LD directly. `/admin/*` and `/booking-confirmed` pass
`noIndex: true`, and `netlify.toml` sends `X-Robots-Tag` for them as well, for crawlers that never
run the JavaScript.

**Motion is restrained on purpose.** 8–18px of movement, 180–250ms interactions, 2–4px card lift.
Every animated component calls `useReducedMotion()` and renders a static branch; `index.css` also
clamps animation globally under `prefers-reduced-motion`. The admin dashboard is deliberately plainer
than the marketing site — compact, no hero, no motion for its own sake.

## Conventions

- Copy belongs in `src/content/*`, not in components, when it's a list or repeated value. Prose that
  appears exactly once can live in its section component.
- Prices, session names and durations come only from `shared/booking/catalog.ts` — through
  `src/content/sessions.ts` for display, and through `findSession()` on the server. Never retype
  "$179".
- Pages are `export default` (required for `React.lazy`); components are named exports.
- Use `LinkButton` for internal routes, `AnchorButton` for external, `Button` for actions. One
  primary CTA per view — don't make everything `variant="primary"`.
- Touch targets stay at 44px or larger (`min-h-11` / `min-h-13` in the Button size map).
- Analytics events go through `track()` and carry **no** personal data — no name, email, phone, drone
  model, message content, booking reference or Stripe id.
- Never render customer input as raw HTML. There is no `dangerouslySetInnerHTML` in this codebase,
  and every customer value in an email goes through `escapeHtml`.
- A customer never sees a stack trace, a provider error or an internal availability-block reason.
  Functions return a short, honest sentence; the detail stays server-side.
- New SQL goes in a new numbered file in `supabase/migrations/`. Never edit an applied migration.

## Hard guardrails

- `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `RESEND_API_KEY` are
  server-only. Never expose one through a `VITE_*` variable (all of which the browser can read),
  never log a value, never commit one. `SUPABASE_SECRET_KEY` must not appear in browser code at all.
- Never collect card numbers, CVV, expiry dates or payment credentials. Payment happens on Stripe's
  hosted page.
- Never put customer notes or contact details into Stripe metadata beyond the email address Stripe
  needs for the receipt.
- Never trust a price, duration, session name or refund amount that arrived from a browser.
- Never fabricate availability, a confirmation, a booking reference or a payment status.
- Never fabricate testimonials. `src/content/testimonials.ts` is empty and `Testimonials` returns
  `null` when it is.
- Never claim CASA approval, a licence, certification, insurance, venue permission or government
  endorsement — in a page, an email or a dashboard.
- Never guarantee a specific park, and never imply a session can be extended.
- Collect only what the lesson needs. No date of birth, address, licence number or payment detail.
- No customer accounts, no customer-facing login, no public write path to the database.

## Verifying a change

```bash
npm run typecheck   # tsc -b --noEmit; fails on any type error
npm test            # vitest, including the migrations on real Postgres via PGlite
npm run build       # tsc -b then vite build
npm run preview     # check routes, console, and a mobile viewport
```

The contact form and the Netlify Functions can only be exercised on a deployed URL (or via
`netlify dev` with the environment variables set).

On `/book`, walk the routing cases — `/book`, `?session=` (three values), `?location=` (two values),
`?slot=`, an invalid value that should be dropped, and a return with `?checkout=cancelled`. Check both
booking-disabled and booking-enabled states at step 3.

Concurrency changes must come with a test in `tests/migrations.test.ts`. It applies both migrations to
a real Postgres and asserts the behaviour that cannot be reasoned about from the TypeScript: duplicate
attempts, buffered slots, the same-day area lock, expiry with grace, webhook idempotency, reschedule
audit history, and RLS being on with no policies.
