# Drone Confidence

Website and booking system for Drone Confidence — private one-on-one drone training in Sydney.

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · Motion for React · Netlify Functions
· Supabase · Stripe Checkout · Resend.

This repository is both the public marketing site and the operating booking system behind it.
Customers choose a session, a training area and a genuinely available time, pay through Stripe's
hosted checkout, and receive a confirmation email. The owner runs everything from `/admin`.

There are still no customer accounts, no card fields and no payment form here: Supabase owns booking
state, Stripe owns payment, and the browser is never authoritative for a price, a duration or a
booking status.

---

## Development

Requires Node 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server on http://localhost:5173
npm run build    # type-check (tsc -b) and build to dist/
npm run preview  # serve the production build locally
npm run typecheck
npm test         # vitest: migrations (real Postgres via PGlite), availability, policy, auth
```

`npm run build` fails on any TypeScript error — the type-check runs before Vite.

The **public site builds and runs with no environment variable set**, including with Supabase absent.
The booking flow and the admin login need the variables below.

## Deployment

Netlify, from `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: `/*` → `/index.html` (200), so deep links like `/booking-policy` work
- Security headers and immutable caching for `/assets/*`

To deploy: connect the repository to Netlify and push. No build plugins are needed.

### Environment variables

**Browser values** (readable by anyone — never put a secret here):

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical site URL. Defaults to `https://droneconfidence.com`. |
| `VITE_CONTACT_EMAIL` | Shown in the footer and privacy page. Hidden entirely when unset. |
| `VITE_CONTACT_PHONE` | Optional. Hidden when unset. |
| `VITE_INSTAGRAM_URL` | Optional. Hidden when unset. |
| `VITE_SUPABASE_URL` | Supabase project URL. Used **only** by the admin login. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key. Used **only** by the admin login. |

The two Supabase browser values are optional as far as the public site is concerned: without them
the site builds and every public page works, and `/admin/login` says the dashboard is not configured
rather than crashing. Row Level Security is enabled with no policies, so the publishable key grants
no data access on its own.

**Server-only values**, read by Netlify Functions and never sent to the browser:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Service-role key. The only credential with data access. |
| `STRIPE_SECRET_KEY` | Creating Checkout Sessions and issuing refunds. |
| `STRIPE_WEBHOOK_SECRET` | Verifying the raw-body signature on every webhook. |
| `RESEND_API_KEY` | Sending transactional email. |
| `RESEND_FROM_EMAIL` | From address, on a Resend-verified domain. |
| `RESEND_REPLY_TO` | Reply-to address the owner reads. |
| `ADMIN_NOTIFICATION_EMAIL` | Owner notifications **and** the only address allowed into `/admin`. |
| `SITE_URL` | Absolute origin for Stripe return URLs and email links. |
| `BOOKING_TEST_MODE` | **Local development only.** Opens public booking against Stripe's sandbox while the database master switch stays off. See [`docs/local-booking-test-mode.md`](docs/local-booking-test-mode.md). Never set it in Production, Deploy Previews or Branch deploys. |

**Never** put a secret in a `VITE_*` variable — every one of them is readable in the browser. Secret
keys are never logged, never returned by a function and never committed.

### Forms

The contact form uses Netlify Forms and needs no function of its own. `public/__forms.html` is a hidden static
skeleton that exists purely so Netlify's build bot can register the forms and their fields —
**don't delete it, and add any new field to it as well as to the React form.** Submissions POST via
AJAX to `/__forms.html` as `application/x-www-form-urlencoded`.

Registered form: `contact` (the `/contact` enquiry form). It is a general enquiry channel — asking
which session suits you, requesting a custom Sydney location, or an ordinary question. It does not
create a booking and does not take payment.

Forms only work on a deployed site, not on `localhost`. After the first deploy, enable email
notifications in **Netlify → Project configuration → Notifications** so submissions reach an inbox.

## How booking works

`/book` is the permanent public booking entry point, and every CTA on the site enters through it.
Four steps, in order:

1. **Session** — from `src/content/sessions.ts`.
2. **Training area** — from `src/content/locations.ts`.
3. **Date & time** — real slots from `/.netlify/functions/booking-availability`. If the master switch
   is off, or nothing is available, the step says so. It never invents a time.
4. **Your details & payment** — the fields the lesson needs, a review panel, an unticked policy
   acknowledgement, then a redirect to Stripe Checkout.

Session, training area and the chosen start time are mirrored in the query string, so
`/book?session=first-flight&location=north-sydney` deep-links and back/forward work. Values are
validated against real content and silently dropped when they don't match. **No personal detail ever
goes in the URL, or into an analytics event.**

Payment and confirmation:

- `booking-checkout` validates the submission, resolves the price and duration from
  `shared/booking/catalog.ts` (never from the payload), reserves a 30-minute hold, and creates a
  Stripe Checkout Session with a dynamic AUD line item.
- Stripe's hosted page collects the card. **No card number, CVV or expiry ever reaches this
  application.**
- `stripe-webhook` is what confirms a booking — not the customer's return to the site. It verifies
  the raw-body signature, records every event id, and ignores a redelivery.
- `/booking-confirmed` asks the server what actually happened. While the webhook is still in flight
  it shows "Payment received. Confirming your booking…" and polls.

Custom locations are still handled as a request at `/contact?reason=custom-location`, never as an
instant booking, because travel, venue or permit costs must be confirmed first.

### Business rules

All times are Australia/Sydney, and all arithmetic is DST-correct.

| Rule | Value |
| --- | --- |
| Bookable days | Tuesday, Wednesday, Thursday |
| Day window | 08:00 – 15:00, lesson finishing by 3:00 pm |
| Latest start | 2:00 pm (60 min) · 1:30 pm (90 min) |
| Slot increment | 30 minutes |
| Buffer between lessons | 30 minutes (not required before the first of the day) |
| Minimum notice | 7 days |
| Horizon | 3 calendar months |
| Checkout hold | 30 minutes |

Two rules matter more than the rest:

- **One training area per Sydney day.** Once a live booking or an unexpired hold exists on a date,
  that date is committed to that area, and the other area disappears from availability. The lock is
  enforced by a Postgres exclusion constraint inside a serialised function — not by a browser check —
  so two customers cannot hold different areas for the same empty date.
- **Public holidays are blocked by hand**, in `/admin` → Availability. There is no holiday API and no
  hard-coded list of NSW dates.

### Architecture

```
src/                    the public site and the owner dashboard (browser only)
shared/booking/         domain logic shared by both — catalogue, rules, availability,
                        policy, Sydney time, formatting. No React, no import.meta.
netlify/functions/      booking-availability, booking-checkout, booking-confirmation,
                        stripe-webhook, booking-reminders (hourly),
                        admin-bookings, admin-availability, admin-settings
netlify/lib/            Supabase, Stripe, Resend, admin auth, validation, refunds
supabase/migrations/    the schema and the concurrency functions
tests/                  vitest, including the migrations applied to real Postgres
```

`shared/` is aliased as `@shared/*` for the browser and imported by relative path from `netlify/`, so
one definition of a price, a rule or a refund share serves the page, the function and the test.

### The owner dashboard

`/admin/login` and `/admin`, outside the marketing layout, `noindex`, and not in the sitemap. Sign-in
is Supabase Auth; there is one account, the owner's.

Hiding the route protects nothing, so it isn't the protection. Every admin function calls
`requireAdmin()`, which verifies the bearer token with Supabase server-side and requires the
authenticated email to match `ADMIN_NOTIFICATION_EMAIL`. A valid Supabase user who is not the owner
is refused exactly like an anonymous request.

The dashboard covers bookings (upcoming, past, cancelled), booking detail with cancel and reschedule,
availability blocks, and settings — including the **booking master switch, which ships off**. Refund
amounts are always derived on the server from the policy and the booking's own start time; the
dashboard sends a reason, never an amount.

### Setting it up

See [`docs/launch-checklist.md`](docs/launch-checklist.md) for the full sequence. In short: create
the Supabase project, apply the migrations in `supabase/migrations/` in order (`0001` → `0004`),
create the owner user, set the environment variables above, add the Stripe webhook
([`docs/stripe-setup.md`](docs/stripe-setup.md)), verify the Resend domain, then work through the
test-mode checklist before turning the master switch on.

## Images still required

Every image slot has a hand-drawn SVG fallback at the exact geometry the photograph will occupy, so
the layout doesn't change when real photography arrives. Drop files into `public/images/`, then set
`src` (and optional `srcSet`/`width`/`height`) on the matching slot in `src/content/images.ts`.

| Slot | Where it appears | Suggested subject |
| --- | --- | --- |
| `hero` | Homepage hero | Wide Sydney open space, drone in flight or being launched, natural light |
| `session-first-flight` | First Flight card and detail | Beginner with controller, calm and unposed |
| `session-fly-with-confidence` | Fly With Confidence card and detail | Confident flying in an open reserve |
| `session-photo-video` | Photo & Video card and detail | Framing a shot, screen visible, real composition |
| `location-south` | Locations — south | Open grass and sky near Taren Point |
| `location-north` | Locations — north | Open reserve near North Ryde |
| `about-tom` | About page and homepage preview | Tom, outdoors, natural, holding or beside a drone |

Avoid stock imagery of unrelated drone hardware and anything AI-generated. Real photography of real
sessions and real Sydney locations only. Landscape 3:2 or 4:3 works best; the portrait slot is 4:5.

## Launch checklist

[`docs/launch-checklist.md`](docs/launch-checklist.md) — website, domain, Supabase, Stripe, Resend
and dashboard checks, including the end-to-end test booking that must pass before the master switch
is turned on.

## Documentation

- [`docs/stripe-setup.md`](docs/stripe-setup.md) — Checkout, the webhook, and the refund policy in
  practice
- [`docs/booking-email-templates.md`](docs/booking-email-templates.md) — the approved copy for every
  transactional message, and which code sends it
- [`docs/launch-checklist.md`](docs/launch-checklist.md) — pre-launch checks
- [`AGENTS.md`](AGENTS.md) — architecture and conventions

## Content guardrails

These are deliberate and should be preserved:

- Prices, names and durations live only in `src/content/sessions.ts`. Session lengths are fixed —
  never imply a session can be extended.
- `src/content/testimonials.ts` is empty and the testimonials section does not render. Never add a
  fabricated name, quote or rating.
- No CASA approval, licence, certification, insurance status, venue permission or government
  endorsement is claimed anywhere. Drone Confidence provides practical coaching, not RePL training.
- No specific park is guaranteed — training areas are described as "based around" a suburb.
- No extra services, discounts, group lessons, gift vouchers, memberships or subscriptions.
