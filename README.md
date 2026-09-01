# Drone Confidence

Marketing website for Drone Confidence — private one-on-one drone training in Sydney.

Vite · React 19 · TypeScript · Tailwind CSS v4 · React Router · Motion for React · Netlify.

The public website is the finished public face of an operating business, including the complete
booking experience at `/book`. It is deliberately **not** a scheduling application: there is no
database, no customer accounts, no payment form and no backend in this repository. Real availability,
date and time selection, customer details, payment, confirmation and booking administration are
supplied by the live booking integration, which is a separate implementation step behind `/book`.

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
| `VITE_BOOKING_ENABLED` | `true` to activate the booking integration inside `/book`. |
| `VITE_BOOKING_URL` | General provider scheduling URL. |
| `VITE_BOOKING_FIRST_FLIGHT_URL` | First Flight provider scheduling URL. |
| `VITE_BOOKING_FLY_CONFIDENCE_URL` | Fly With Confidence provider scheduling URL. |
| `VITE_BOOKING_PHOTO_VIDEO_URL` | Photo & Video provider scheduling URL. |
| `VITE_BOOKING_DISPLAY_MODE` | `embed` to render the scheduler in place instead of handing off. |
| `VITE_BOOKING_EMBED_URL` | Required by `embed` mode; ignored otherwise. |
| `VITE_BOOKING_PROVIDER` | Provider identifier. Defaults to `acuity`. |
| `VITE_BOOKING_OPEN_IN_NEW_TAB` | `true` to hand off in a new tab. Defaults to same tab. |

None of these variables affect marketing copy anywhere on the site. They only decide what the date
and time step inside `/book` can reach.

**Never** put a secret in a `VITE_*` variable — every one of them is readable in the browser. No
Stripe secret key, Acuity API secret, service-role credential or private key belongs in this
repository. Public booking URLs are not secrets.

### Forms

Both forms use Netlify Forms and require no backend. `public/__forms.html` is a hidden static
skeleton that exists purely so Netlify's build bot can register the forms and their fields —
**don't delete it, and add any new field to it as well as to the React form.** Submissions POST via
AJAX to `/__forms.html` as `application/x-www-form-urlencoded`.

Registered form: `contact` (the `/contact` enquiry form). It is a general enquiry channel — asking
which session suits you, requesting a custom Sydney location, or an ordinary question. It does not
create a booking and does not take payment.

Forms only work on a deployed site, not on `localhost`. After the first deploy, enable email
notifications in **Netlify → Project configuration → Notifications** so submissions reach an inbox.

## Booking: what is built and what is next

**The public booking UI is complete. The live booking integration is still a separate implementation
step.**

`/book` is the permanent public booking entry point and the permanent integration boundary. It is
always rendered in full — no page on this site is waiting for a launch, and there is no
"coming soon", "being prepared" or register-interest state anywhere.

What is built:

- Step 1 **Session** and step 2 **Location** are functional selection UI driven by
  `src/content/sessions.ts` and `src/content/locations.ts`, with a live summary of session, duration,
  price and training area.
- Selections are mirrored in the query string, so `/book?session=first-flight` and
  `/book?location=north-sydney` deep-link, and back/forward work. Values are validated against real
  content and silently dropped when they don't match. No personal data ever goes in the URL.
- Every booking CTA — header, mobile nav, hero, session cards, sessions page, locations, final CTA —
  routes to `/book` through `BookingCta`, carrying session or location context. There are no `#`
  links, no placeholder URLs and no dead buttons.
- Step 3 **Date & time** is the boundary. When no integration is configured it renders an operational
  "Online booking is temporarily unavailable." fallback with a link to Contact, never a fake calendar.
- Custom locations are handled as a request at `/contact?reason=custom-location`, never as an instant
  booking, because travel, venue or permit costs must be confirmed first.

What the live integration still has to supply:

real availability, date and time selection, customer and drone details capture, payment, booking
creation, confirmation, email automation, reschedule and cancellation mechanics, and booking
administration.

### The integration boundary

`src/lib/bookingService.ts` is the only seam. It defines the `BookingService` contract
(`fetchAvailability`, and later `startCheckout`) plus `resolveAvailabilitySource()`, which decides
what the date and time step renders. `src/components/booking/BookingAvailability.tsx` is the only
component that consumes it, and `src/config/booking.ts` is read only through it — never by a
marketing component.

To connect a provider:

1. Create the platform account and appointment types — see
   [`docs/acuity-setup.md`](docs/acuity-setup.md). Connect payment via
   [`docs/stripe-setup.md`](docs/stripe-setup.md).
2. Add the public scheduling URLs as Netlify environment variables (above), and set
   `VITE_BOOKING_ENABLED=true`.
3. Deploy, then walk `/book` end to end for each session and both training areas.

For a first-party flow instead of a hand-off, implement `BookingService`, return it from
`getBookingService()`, and add a `{ kind: 'service' }` case to `AvailabilitySource` rendered by
`BookingAvailability`. Nothing else in `/book`, and no marketing page, needs to change.

Two things worth knowing about `src/config/booking.ts`:

- The integration mode is **derived**, not merely declared. It can only leave `'none'` when an
  absolute `http(s)` URL genuinely exists, so a typo or empty value degrades to the safe fallback
  instead of a broken control.
- Resolution order inside the availability step: `embed` mode with a usable embed URL → embedded
  scheduler; a session-specific URL → that URL; a usable general URL → the general URL; otherwise →
  the temporarily-unavailable fallback.

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

[`docs/launch-checklist.md`](docs/launch-checklist.md) — website, domain and booking-integration
activation, including the full end-to-end test booking that must pass before booking goes live.

## Documentation

- [`docs/acuity-setup.md`](docs/acuity-setup.md) — scheduling provider setup, appointment types,
  intake questions
- [`docs/stripe-setup.md`](docs/stripe-setup.md) — payment setup, and why the frontend has no Stripe
  integration
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
