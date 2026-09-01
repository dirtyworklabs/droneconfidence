/**
 * Booking integration configuration.
 *
 * Important: this file does **not** describe the state of the public website.
 * The public booking experience at /book is permanent and always rendered, and
 * no marketing copy anywhere on the site depends on anything in here.
 *
 * What this configuration controls is only the integration point where live
 * availability or checkout is required — the availability step inside /book.
 * It is consumed through `src/lib/bookingService.ts`, never directly by a
 * marketing component.
 *
 * No secrets belong in this file, or in any VITE_ variable: every VITE_ value
 * is readable in the browser. Public booking URLs are not secrets.
 */

import type { BookingIntegrationMode, ExternalBookingTarget, SessionId } from '@/types'

const readString = (value: string | undefined): string => (value ?? '').trim()

const readFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalised = readString(value).toLowerCase()
  if (normalised === 'true' || normalised === '1' || normalised === 'yes') return true
  if (normalised === 'false' || normalised === '0' || normalised === 'no') return false
  return fallback
}

/** Only absolute http(s) URLs are ever used, so a malformed value can't produce a dead control. */
export const isUsableBookingUrl = (value: string | undefined): boolean => {
  const candidate = readString(value)
  if (candidate.length === 0) return false
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Optional per-session hand-off URLs. Kept because a provider that exposes one
 * public link per appointment type is still the quickest route to real
 * availability — but they are consumed by the booking flow, not by CTAs.
 */
const sessionUrls: Record<SessionId, string> = {
  'first-flight': readString(import.meta.env.VITE_BOOKING_FIRST_FLIGHT_URL),
  'fly-with-confidence': readString(import.meta.env.VITE_BOOKING_FLY_CONFIDENCE_URL),
  'photo-video': readString(import.meta.env.VITE_BOOKING_PHOTO_VIDEO_URL),
}

const generalUrl = readString(import.meta.env.VITE_BOOKING_URL)
const embedUrl = readString(import.meta.env.VITE_BOOKING_EMBED_URL)

const anyHandoffUrl =
  isUsableBookingUrl(generalUrl) ||
  (Object.values(sessionUrls) as string[]).some((url) => isUsableBookingUrl(url))

const embedRequested = readString(import.meta.env.VITE_BOOKING_DISPLAY_MODE).toLowerCase() === 'embed'
const embedReady = embedRequested && isUsableBookingUrl(embedUrl)

/** Master switch for the integration layer only. Defaults to off. */
const integrationRequested = readFlag(import.meta.env.VITE_BOOKING_ENABLED, false)

/**
 * The mode is derived, never merely declared: it can only leave 'none' when a
 * usable absolute URL actually exists. That guarantee is what lets the
 * availability step render a safe fallback instead of a dead button.
 */
const mode: BookingIntegrationMode = !integrationRequested
  ? 'none'
  : embedReady
    ? 'embed'
    : anyHandoffUrl
      ? 'external'
      : 'none'

export const bookingIntegration = {
  /** Named in the privacy policy via `siteConfig.providers`, not from here. */
  provider: readString(import.meta.env.VITE_BOOKING_PROVIDER) || 'acuity',
  mode,
  /** True once live availability or checkout can genuinely be reached. */
  configured: mode !== 'none',
  embedUrl: embedReady ? embedUrl : '',
  /** Same-tab hand-off by default; no popups. */
  openInNewTab: readFlag(import.meta.env.VITE_BOOKING_OPEN_IN_NEW_TAB, false),
} as const

/**
 * Resolves the external hand-off for a session, preferring a session-specific
 * link. Returns null when nothing usable is configured — callers must handle
 * that rather than rendering a link to nowhere.
 */
export const resolveHandoffTarget = (sessionId?: SessionId | null): ExternalBookingTarget | null => {
  if (bookingIntegration.mode !== 'external') return null

  const specific = sessionId ? sessionUrls[sessionId] : ''
  const href = isUsableBookingUrl(specific)
    ? specific
    : isUsableBookingUrl(generalUrl)
      ? generalUrl
      : ''

  if (href.length === 0) return null
  return { href, newTab: bookingIntegration.openInNewTab }
}
