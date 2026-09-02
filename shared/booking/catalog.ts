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
 */

export type SessionId = 'first-flight' | 'fly-with-confidence' | 'photo-video'

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

export const SESSION_CATALOG: readonly SessionCatalogEntry[] = [
  { id: 'first-flight', name: 'First Flight', priceDollars: 180, durationMinutes: 60 },
  { id: 'fly-with-confidence', name: 'Fly With Confidence', priceDollars: 240, durationMinutes: 90 },
  { id: 'photo-video', name: 'Photo & Video', priceDollars: 280, durationMinutes: 90 },
]

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

export const findSession = (id: string | null | undefined): SessionCatalogEntry | null =>
  SESSION_CATALOG.find((entry) => entry.id === id) ?? null

export const findLocation = (id: string | null | undefined): LocationCatalogEntry | null =>
  LOCATION_CATALOG.find((entry) => entry.id === id) ?? null

/** Price in cents, derived server-side. Never accepted from a client. */
export const sessionPriceCents = (entry: SessionCatalogEntry): number =>
  Math.round(entry.priceDollars * 100)

export const CURRENCY = 'aud' as const
