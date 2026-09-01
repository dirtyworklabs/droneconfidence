# Drone Confidence

Marketing website for Drone Confidence — private one-on-one drone training in Sydney.

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · Motion for React · Netlify.

This is a marketing, information and conversion website. It is deliberately **not** a scheduling
application: there is no database, no customer accounts, no payment form and no backend. Scheduling
and payment are handed off to an external booking platform when one is connected.

---

## Development

Requires Node 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server on http://localhost:5173
npm run build    # type-check (tsc -b) and build to dist/
npm run preview  # serve the production build locally
npm run typecheck
```

`npm run build` fails on any TypeScript error — the type-check runs before Vite.

No environment variable is required. The site builds and runs correctly with none set.

## Deployment

Netlify, from `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: `/*` → `/index.html` (200), so deep links like `/booking-policy` work
- Security headers and immutable caching for `/assets/*`

To deploy: connect the repository to Netlify and push. No build plugins are needed.

Optional environment variables (all public values, all optional):

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Canonical site URL. Defaults to `https://droneconfidence.com`. |
| `VITE_CONTACT_EMAIL` | Shown in the footer and privacy page. Hidden entirely when unset. |
| `VITE_CONTACT_PHONE` | Optional. Hidden when unset. |
| `VITE_INSTAGRAM_URL` | Optional. Hidden when unset. |
| `VITE_BOOKING_ENABLED` | `true` to turn on external booking. |
| `VITE_BOOKING_URL` | General booking page URL. |
| `VITE_BOOKING_FIRST_FLIGHT_URL` | First Flight direct booking URL. |
| `VITE_BOOKING_FLY_CONFIDENCE_URL` | Fly With Confidence direct booking URL. |
| `VITE_BOOKING_PHOTO_VIDEO_URL` | Photo & Video direct booking URL. |
| `VITE_BOOKING_EMBED_URL` | Only if you deliberately want an embedded scheduler. |

**Never** put a secret in a `VITE_*` variable — every one of them is readable in the browser. No
Stripe secret key, Acuity API secret, service-role credential or private key belongs in this
repository. Public booking URLs are not secrets.

### Forms

Both forms use Netlify Forms and require no backend. `public/__forms.html` is a hidden static
skeleton that exists purely so Netlify's build bot can register the forms and their fields —
**don't delete it, and add any new field to it as well as to the React form.** Submissions POST via
AJAX to `/__forms.html` as `application/x-www-form-urlencoded`.

Registered forms: `session-enquiry` (the `/book` enquiry form) and `contact` (the `/contact` form).

Forms only work on a deployed site, not on `localhost`. After the first deploy, enable email
notifications in **Netlify → Project configuration → Notifications** so submissions reach an inbox.

## Current booking state

**Online booking is not connected, and the site is complete and shippable in that state.**

- `bookingEnabled` is `false`, because no booking URL is configured.
- Every booking CTA — header, hero, session cards, sessions page, locations, final CTA, mobile bar —
  routes to `/book`. There are no `#` links, no placeholder URLs and no dead buttons.
- `/book` shows a designed hand-off state: the three session summaries, an enquiry form and the
  booking and cancellation policy. It is the only page that knows booking isn't live yet; there are
  no "coming soon" messages scattered elsewhere.
- The enquiry form makes clear that sending an enquiry doesn't book a session or take a payment.
- Custom locations are handled as a request at `/contact?reason=custom-location`, never as an instant
  booking, because travel, venue or permit costs must be confirmed first.

## Enabling booking

1. Create the booking platform account and appointment types — see
   [`docs/acuity-setup.md`](docs/acuity-setup.md). Connect payment via
   [`docs/stripe-setup.md`](docs/stripe-setup.md).
2. Copy the public booking URLs (general plus one per session).
3. Add them either as Netlify environment variables (above) or directly in
   `src/config/booking.ts`.
4. Set `VITE_BOOKING_ENABLED=true` (or `bookingEnabled` in the config file).
5. Deploy, then test every CTA — session-specific URLs should open their own session, and the general
   CTAs should open the general page.

Two things worth knowing about the resolver in `src/config/booking.ts`:

- `bookingEnabled` is **derived**. It only becomes true when at least one absolute `http(s)` URL is
  present, so a typo or empty value can never produce a broken CTA — it falls back to `/book`.
- CTA routing order: booking disabled → `/book`; session-specific URL → that URL; otherwise a usable
  general URL → the general URL; otherwise → `/book`.

Embedded scheduling is supported (`bookingDisplayMode: 'embed'` plus `VITE_BOOKING_EMBED_URL`) but an
external booking page is preferred, and the embed renders nothing at all unless a real URL exists.

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

[`docs/launch-checklist.md`](docs/launch-checklist.md) — website, domain and (later) booking
activation, including the full end-to-end test booking that must pass before booking goes live.

## Documentation

- [`docs/acuity-setup.md`](docs/acuity-setup.md) — future scheduling setup, appointment types, intake
  questions
- [`docs/stripe-setup.md`](docs/stripe-setup.md) — future payment setup, and why the frontend has no
  Stripe integration
- [`docs/booking-email-templates.md`](docs/booking-email-templates.md) — confirmation, reminder,
  weather reschedule and cancellation copy
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
