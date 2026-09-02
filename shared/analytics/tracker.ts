/**
 * The analytics tracker, with the browser factored out.
 *
 * Everything that decides *what* is sent lives here: the one-per-session
 * `session_started` event, the attribution capture, the sanitisation and the
 * ordering. Everything that decides *how* it leaves the page — sessionStorage,
 * `crypto.randomUUID`, `fetch` with `keepalive` — is supplied by the host, so
 * `src/lib/analytics.ts` stays a thin wiring layer and this logic is testable
 * without a DOM.
 *
 * Analytics is best effort by construction. Every host call is wrapped, so a
 * blocked storage API, a missing crypto implementation or a rejected request
 * cannot throw into a navigation, a slot selection, a form submit or checkout.
 */

import {
  type AnalyticsPayload,
  type AnalyticsWireEvent,
  SUPPORTED_UTM_PARAMS,
  buildAnalyticsEvent,
  isTrackablePath,
  isUuid,
  sanitiseHost,
} from './events'

/** sessionStorage keys. Nothing analytics-related is ever put in a cookie or localStorage. */
export const SESSION_ID_KEY = 'dc.analytics.session'
export const SESSION_STARTED_KEY = 'dc.analytics.started'

export interface TrackerHost {
  /** Current pathname, query string excluded by the sanitiser regardless. */
  pathname: () => string
  /** `document.referrer`, or an empty string. */
  referrer: () => string
  /** `window.location.search`. Read for the supported UTM keys only, never sent. */
  search: () => string
  /** A fresh UUID per event. */
  newId: () => string
  /** Per-tab session storage. May throw; the tracker copes. */
  read: (key: string) => string | null
  write: (key: string, value: string) => void
  /** Fire and forget. Must not be awaited by a caller. */
  send: (event: AnalyticsWireEvent) => void
}

export interface Tracker {
  track: (event: string, payload?: AnalyticsPayload) => void
}

const attempt = <T>(run: () => T, fallback: T): T => {
  try {
    return run()
  } catch {
    return fallback
  }
}

/**
 * Reads only the named UTM parameters out of a query string.
 *
 * The search string itself is never transmitted, and `utm_term`, `utm_content`
 * and every other parameter are ignored rather than stored.
 */
export const readAttribution = (search: string, referrer: string): AnalyticsPayload => {
  const out: AnalyticsPayload = {}

  const host = attempt(() => {
    if (referrer.length === 0) return undefined
    return sanitiseHost(new URL(referrer).hostname)
  }, undefined)
  if (host !== undefined) out.referrerHost = host

  const params = attempt(() => new URLSearchParams(search), null)
  if (params) {
    const named: Record<(typeof SUPPORTED_UTM_PARAMS)[number], keyof AnalyticsPayload> = {
      utm_source: 'utmSource',
      utm_medium: 'utmMedium',
      utm_campaign: 'utmCampaign',
    }
    for (const key of SUPPORTED_UTM_PARAMS) {
      const value = params.get(key)
      if (value !== null) out[named[key]] = value
    }
  }

  return out
}

export const createTracker = (host: TrackerHost): Tracker => {
  // Guards the recursive `session_started` emission within a page lifetime;
  // sessionStorage is what makes it once per browser session.
  let starting = false

  const sessionId = (): string | null => {
    const existing = attempt(() => host.read(SESSION_ID_KEY), null)
    if (existing !== null && isUuid(existing)) return existing.toLowerCase()

    const fresh = attempt(() => host.newId(), '')
    if (!isUuid(fresh)) return null
    // A write failure is survivable: the visit is still measured, it simply
    // reads as a series of one-event sessions rather than one session.
    attempt(() => host.write(SESSION_ID_KEY, fresh), undefined)
    return fresh.toLowerCase()
  }

  const emit = (id: string, session: string, event: string, path: string, payload?: AnalyticsPayload): void => {
    const wire = buildAnalyticsEvent({ id, sessionId: session, event, path, payload })
    if (!wire) return
    attempt(() => host.send(wire), undefined)
  }

  const startSession = (session: string, path: string): void => {
    if (starting) return
    if (attempt(() => host.read(SESSION_STARTED_KEY), null) === session) return
    starting = true
    try {
      attempt(() => host.write(SESSION_STARTED_KEY, session), undefined)
      const eventId = attempt(() => host.newId(), '')
      if (!isUuid(eventId)) return
      emit(eventId, session, 'session_started', path, {
        ...readAttribution(attempt(() => host.search(), ''), attempt(() => host.referrer(), '')),
      })
    } finally {
      starting = false
    }
  }

  const track = (event: string, payload: AnalyticsPayload = {}): void => {
    const path = attempt(() => host.pathname(), '')
    // The owner dashboard is not a measured surface.
    if (!isTrackablePath(path)) return

    const session = sessionId()
    if (session === null) return

    startSession(session, path)

    const eventId = attempt(() => host.newId(), '')
    if (!isUuid(eventId)) return
    emit(eventId, session, event, path, payload)
  }

  return { track }
}
