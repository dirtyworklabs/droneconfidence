/**
 * Canonical session and training-area catalogue.
 *
 * This module is the one place the bookable facts — id, public name, price and
 * duration — are written down, and it is deliberately free of React, Vite and
 * `import.meta`, so the Netlify Functions that take money can import it too.
 *
 * `src/content/sessions.ts` spreads these entries into the marketing session
 * records rather than retyping them, and the server never accepts a price,
 * duration or name from the browser: it resolves them from here by id.
 *
 * Two lists, deliberately. `SESSION_CATALOG` is every session that has ever
 * been sold, so a historical booking row can still be resolved — its duration
 * is what the admin reschedule search needs. `BOOKABLE_SESSION_CATALOG` is what
 * the public can buy today, and it is the only list the public availability and
 * checkout paths consult. Retiring a session means removing its id from
 * `BookableSessionId`, never deleting its entry.
 */

/** Every session id a booking row may carry, including retired ones. */
export type SessionId = 'first-flight' | 'fly-with-confidence' | 'photo-video'

/** The sessions the public can book right now. A subset of `SessionId`. */
export type BookableSessionId = Extract<SessionId, 'first-flight'>

export type LocationId = 'south-sydney' | 'north-sydney'

export interface SessionCatalogEntry {
  id: SessionId
  /** Public display name, stored as a snapshot on every booking. */
  name: string
  /** Whole AUD dollars. Converted to cents for Stripe server-side only. */
  priceDollars: number
  /** Fixed lesson length. Sessions are never extendable. */
  durationMinutes: number
}

export interface BookableSessionCatalogEntry extends SessionCatalogEntry {
  id: BookableSessionId
}

const FIRST_FLIGHT: BookableSessionCatalogEntry = {
  id: 'first-flight',
  name: 'First Flight',
  priceDollars: 180,
  durationMinutes: 60,
}

/**
 * Every session ever offered. Retired entries stay so historical bookings —
 * admin detail, cancellation, refund and a duration-correct reschedule — keep
 * resolving. Not for public validation: use `findBookableSession()` there.
 */
export const SESSION_CATALOG: readonly SessionCatalogEntry[] = [
  FIRST_FLIGHT,
  // Retired: no longer bookable. Kept for historical booking rows only.
  { id: 'fly-with-confidence', name: 'Fly With Confidence', priceDollars: 240, durationMinutes: 90 },
  // Retired: no longer bookable. Kept for historical booking rows only.
  { id: 'photo-video', name: 'Photo & Video', priceDollars: 280, durationMinutes: 90 },
]

/** What the public can book today, in display order. */
export const BOOKABLE_SESSION_CATALOG: readonly BookableSessionCatalogEntry[] = [FIRST_FLIGHT]

/** The one lesson currently sold. `/book` carries it implicitly. */
export const DEFAULT_BOOKABLE_SESSION_ID: BookableSessionId = FIRST_FLIGHT.id

export interface LocationCatalogEntry {
  id: LocationId
  /** Public name, stored as a snapshot on every booking. */
  name: string
  /** Suburb the training area is based around. */
  area: string
}

export const LOCATION_CATALOG: readonly LocationCatalogEntry[] = [
  { id: 'south-sydney', name: 'South Sydney — Taren Point', area: 'Taren Point' },
  { id: 'north-sydney', name: 'North Sydney — North Ryde', area: 'North Ryde' },
]

/** Historical lookup, retired sessions included. Admin and stored rows only. */
export const findSession = (id: string | null | undefined): SessionCatalogEntry | null =>
  SESSION_CATALOG.find((entry) => entry.id === id) ?? null

/** Public lookup. Resolves only a session a customer may book now. */
export const findBookableSession = (
  id: string | null | undefined,
): BookableSessionCatalogEntry | null =>
  BOOKABLE_SESSION_CATALOG.find((entry) => entry.id === id) ?? null

export const isBookableSessionId = (value: string | null | undefined): value is BookableSessionId =>
  findBookableSession(value) !== null

export const findLocation = (id: string | null | undefined): LocationCatalogEntry | null =>
  LOCATION_CATALOG.find((entry) => entry.id === id) ?? null

/** Price in cents, derived server-side. Never accepted from a client. */
export const sessionPriceCents = (entry: SessionCatalogEntry): number =>
  Math.round(entry.priceDollars * 100)

export const CURRENCY = 'aud' as const
