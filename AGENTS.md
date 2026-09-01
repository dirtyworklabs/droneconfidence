# AGENTS.md

Working notes for anyone (human or agent) changing this codebase.

## What this is

A marketing website for a Sydney private drone-coaching business. Vite + React 19 + TypeScript,
Tailwind CSS v4, React Router v7, Motion for React, deployed to Netlify as a static SPA.

The **public booking UI is complete** — `/book` is a real, permanent booking flow with session and
training-area selection. The **live booking integration is a separate implementation step**: this
repository is not a booking application. Do not add a database, customer accounts, an admin dashboard,
a payment form, a scheduling backend or an email-sending service. Availability, payment,
confirmation, emails and administration live with the providers behind `/book`. Netlify Forms covers
everything the site itself needs from a "backend".

## Architecture

```
src/
  config/       booking.ts (integration config only), site.ts — every public value
  content/      sessions, locations, faqs, testimonials, images — all copy lives here
  components/
    ui/         Button, Container, Section, Eyebrow, SectionHeading, Reveal, Accordion
    layout/     Header, Footer, MobileNav, Layout, Wordmark, navigation
    booking/    BookingCta, useBookingSelection, BookingProgress, BookingStep, BookingChoice,
                SessionSelector, LocationSelector, BookingSummary, BookingAvailability, BookingEmbed
    forms/      Fields, ContactForm, SuccessPanel
    marketing/  one component per page section, carrying the approved copy
    visuals/    ImageFrame, Treatments (SVG image fallbacks), TopoBackdrop
  lib/          seo, structuredData, netlifyForms, validation, analytics, motion, routes, cn,
                bookingService (the booking integration seam)
  pages/        one file per route, default-exported for lazy loading
  styles/       index.css — the entire design system (@theme tokens + @utility)
  types/        shared domain types
```

`@/` is aliased to `src/` in both `tsconfig.app.json` (`paths`) and `vite.config.ts`
(`resolve.alias`). Both are required — tsconfig alone won't resolve at runtime.

## Non-obvious decisions

**Every CTA goes to `/book`, and only `BookingCta` builds the link.** `bookingPath({ session,
location })` in `src/lib/routes.ts` is the only place a booking URL is assembled. Pass `sessionId` or
`locationId` to preselect. Never hard-code a booking URL in a component, and never point a CTA
off-site.

**Public website state and booking integration state are separate.** `src/config/booking.ts` holds
*only* integration configuration and must not influence marketing copy — no page, FAQ, step list or
heading may branch on it. Its mode is derived, not declared: it can only leave `'none'` when an
absolute `http(s)` URL is genuinely usable.

**`src/lib/bookingService.ts` is the integration seam.** It is the only consumer of
`src/config/booking.ts`, and `BookingAvailability` is its only consumer in turn. The next
implementation implements `BookingService`, returns it from `getBookingService()`, and adds a
`{ kind: 'service' }` case to `AvailabilitySource`. Nothing else in `/book` or in marketing changes.

**Never fabricate availability.** No sample slots, hard-coded times, fake calendar, fake
confirmation, customer records or placeholder checkout. When nothing is configured, the date and time
step says "Online booking is temporarily unavailable." and offers Contact. That wording is
operational, never "coming soon", "being prepared" or a waitlist. Developer-facing notes stay behind
`import.meta.env.DEV`.

**Booking selection lives in the URL.** `useBookingSelection()` validates `?session=` and
`?location=` against `src/content/*`, drops invalid values, and mirrors changes with
`preventScrollReset`. React state plus search params only — no state library. Never put personal data
in the URL.

**Netlify Forms needs `public/__forms.html`.** Netlify's build bot can't see client-rendered forms,
so that hidden skeleton registers the `contact` form and every field name. Adding a field to a React
form without adding it there means the submission is rejected. AJAX POSTs go to `/__forms.html`, not
`/`.

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
canonical, OG/Twitter tags and JSON-LD directly. It serialises `structuredData` to a string for its
dependency array so callers can pass inline literals without re-running the effect every render.

**Motion is restrained on purpose.** 8–18px of movement, 180–250ms interactions, 2–4px card lift.
Every animated component calls `useReducedMotion()` and renders a static branch; `index.css` also
clamps animation globally under `prefers-reduced-motion`.

## Conventions

- Copy belongs in `src/content/*`, not in components, when it's a list or repeated value. Prose that
  appears exactly once can live in its section component.
- Prices, session names and durations come only from `src/content/sessions.ts` via `formatPrice` /
  `formatDuration`. Never retype "$179".
- Pages are `export default` (required for `React.lazy`); components are named exports.
- Use `LinkButton` for internal routes, `AnchorButton` for external, `Button` for actions. One
  primary CTA per view — don't make everything `variant="primary"`.
- Touch targets stay at 44px or larger (`min-h-11` / `min-h-13` in the Button size map).
- Analytics events go through `track()` and carry **no** personal data — no name, email, phone, drone
  model or message content.
- Never render customer input as raw HTML. There is no `dangerouslySetInnerHTML` in this codebase.

## Hard guardrails

- No secrets in the frontend. No Stripe secret key, Acuity API secret, service-role credential or
  private key in `src`, in git, or in any `VITE_*` variable (all of which the browser can read).
  Public booking URLs are not secrets.
- Never collect card numbers, CVV, expiry dates or payment credentials.
- Never fabricate testimonials. `src/content/testimonials.ts` is empty and `Testimonials` returns
  `null` when it is.
- Never claim CASA approval, a licence, certification, insurance, venue permission or government
  endorsement.
- Never guarantee a specific park, and never imply a session can be extended.
- No `/admin` route, no custom admin dashboard.
- Don't build the booking backend here: no booking CRUD, live calendar, Google Calendar sync, Acuity
  API call, Stripe Checkout or webhook, email sending, confirmation number, refund or availability
  rule engine. That is the separate live-integration step, reached through
  `src/lib/bookingService.ts`.

## Verifying a change

```bash
npm run build   # tsc -b then vite build; fails on any type error
npm run preview # check routes, console, and a mobile viewport
```

The contact form can only be tested on a deployed URL. On `/book`, walk the four routing cases —
`/book`, `?session=` (three values), `?location=` (two values), and an invalid value that should be
dropped. To check the configured integration path, temporarily set `VITE_BOOKING_ENABLED=true` with a
real absolute URL, then revert.
