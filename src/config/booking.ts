/**
 * Booking configuration layer.
 *
 * The website never talks to a scheduling API. It only needs public booking
 * URLs, so switching provider later is a configuration change rather than a
 * rebuild. Until real URLs exist, every booking CTA routes to /book, which
 * renders a polished pre-integration state.
 *
 * No secrets belong in this file, or in any VITE_ variable.
 */

import type { BookingDisplayMode, BookingTarget, SessionId } from '@/types'

const BOOK_PAGE = '/book'

const readString = (value: string | undefined): string => (value ?? '').trim()

const readFlag = (value: string | undefined, fallback: boolean): boolean => {
  const normalised = readString(value).toLowerCase()
  if (normalised === 'true' || normalised === '1' || normalised === 'yes') return true
  if (normalised === 'false' || normalised === '0' || normalised === 'no') return false
  return fallback
}

/** Only absolute http(s) URLs are ever used, so a malformed value can't produce a dead CTA. */
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

const readDisplayMode = (value: string | undefined): BookingDisplayMode => {
  const normalised = readString(value).toLowerCase()
  if (normalised === 'external' || normalised === 'embed' || normalised === 'disabled') {
    return normalised
  }
  // External hand-off is the intended default: more reliable on mobile, and it
  // keeps payment and authentication out of an iframe.
  return 'external'
}

const sessionUrls: Record<SessionId, string> = {
  'first-flight': readString(import.meta.env.VITE_BOOKING_FIRST_FLIGHT_URL),
  'fly-with-confidence': readString(import.meta.env.VITE_BOOKING_FLY_CONFIDENCE_URL),
  'photo-video': readString(import.meta.env.VITE_BOOKING_PHOTO_VIDEO_URL),
}

const generalBookingUrl = readString(import.meta.env.VITE_BOOKING_URL)
const embedUrl = readString(import.meta.env.VITE_BOOKING_EMBED_URL)

const anyUsableUrl =
  isUsableBookingUrl(generalBookingUrl) ||
  (Object.values(sessionUrls) as string[]).some((url) => isUsableBookingUrl(url))

const requestedDisplayMode = readDisplayMode(import.meta.env.VITE_BOOKING_DISPLAY_MODE)

/**
 * Booking is only ever considered enabled when a usable URL actually exists.
 * That guarantee is what lets every CTA in the site be rendered unconditionally.
 */
const bookingEnabled = readFlag(import.meta.env.VITE_BOOKING_ENABLED, false) && anyUsableUrl

const embedAvailable = requestedDisplayMode === 'embed' && isUsableBookingUrl(embedUrl)

export const bookingConfig = {
  bookingEnabled,
  bookingProvider: readString(import.meta.env.VITE_BOOKING_PROVIDER) || 'acuity',
  bookingDisplayMode: (bookingEnabled
    ? embedAvailable
      ? 'embed'
      : 'external'
    : 'disabled') as BookingDisplayMode,
  generalBookingUrl,
  firstFlightBookingUrl: sessionUrls['first-flight'],
  flyWithConfidenceBookingUrl: sessionUrls['fly-with-confidence'],
  photoVideoBookingUrl: sessionUrls['photo-video'],
  embedUrl: embedAvailable ? embedUrl : '',
  /** Same-tab hand-off by default; no popups. */
  openInNewTab: readFlag(import.meta.env.VITE_BOOKING_OPEN_IN_NEW_TAB, false),
  bookPagePath: BOOK_PAGE,
} as const

const internalTarget = (): BookingTarget => ({ kind: 'internal', href: BOOK_PAGE, external: false })

const externalTarget = (href: string): BookingTarget => ({
  kind: 'external',
  href,
  external: true,
  newTab: bookingConfig.openInNewTab,
})

/**
 * Single resolver for every booking CTA in the site.
 *
 * - booking disabled → /book
 * - session-specific URL present → that URL
 * - otherwise a usable general URL → general URL
 * - anything missing or malformed → /book
 */
export const resolveBookingTarget = (sessionId?: SessionId): BookingTarget => {
  if (!bookingConfig.bookingEnabled) return internalTarget()

  if (sessionId) {
    const specific = sessionUrls[sessionId]
    if (isUsableBookingUrl(specific)) return externalTarget(specific)
  }

  if (isUsableBookingUrl(bookingConfig.generalBookingUrl)) {
    return externalTarget(bookingConfig.generalBookingUrl)
  }

  return internalTarget()
}

/**
 * True when a booking CTA leaves the site. Used to decide whether to show the
 * subtle external-link affordance.
 */
export const leavesSite = (sessionId?: SessionId): boolean => resolveBookingTarget(sessionId).external
