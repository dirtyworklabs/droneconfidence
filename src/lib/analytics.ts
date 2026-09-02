/**
 * First-party analytics.
 *
 * `track()` keeps the same signature it always had, and still forwards to a
 * `window.dataLayer` array if some future provider creates one. What is new is
 * that events are also delivered to `/.netlify/functions/analytics-event`,
 * which is the only thing that writes to `public.analytics_events` — the
 * browser never touches Supabase.
 *
 * What leaves the page is decided by `shared/analytics/`, and the collector
 * applies the same rules again server-side. Three things are worth restating
 * here, because they are the point of the design:
 *
 *   - Only the *pathname* is sent. A query string is cut before anything else
 *     happens, so `?session_id=` on /booking-confirmed and the selection
 *     parameters on /book cannot be recorded.
 *   - The anonymous session id lives in `sessionStorage` only. There is no
 *     cookie, no localStorage and no cross-visit identifier: a new browser
 *     session is a new anonymous session, deliberately.
 *   - Delivery is fire-and-forget and every failure is swallowed. Nothing in
 *     this module is awaited by a booking, a form or a navigation.
 */

import {
  SESSION_ID_KEY,
  SESSION_STARTED_KEY,
  createTracker,
  type TrackerHost,
} from '@shared/analytics/tracker'
import type { AnalyticsEvent, AnalyticsPayload, AnalyticsWireEvent } from '@shared/analytics/events'

export type { AnalyticsEvent, AnalyticsPayload }

const ENDPOINT = '/.netlify/functions/analytics-event'

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>
}

/** Shape matters (the collector validates a UUID); entropy quality does not. */
const randomId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) =>
        (
          Number(character) ^
          (Math.floor(Math.random() * 256) & (15 >> (Number(character) / 4)))
        ).toString(16),
      )

/**
 * One POST per event, outside the critical path.
 *
 * `keepalive` lets the request survive the navigation that often follows the
 * event it describes — a CTA click, or leaving for Stripe's hosted page. The
 * response is never read and a rejection is discarded.
 */
const deliver = (event: AnalyticsWireEvent): void => {
  if (typeof fetch !== 'function') return
  void fetch(ENDPOINT, {
    method: 'POST',
    keepalive: true,
    cache: 'no-store',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(() => undefined)
}

const host: TrackerHost = {
  pathname: () => window.location.pathname,
  referrer: () => document.referrer ?? '',
  search: () => window.location.search,
  newId: randomId,
  read: (key) => window.sessionStorage.getItem(key),
  write: (key, value) => window.sessionStorage.setItem(key, value),
  send: deliver,
}

const tracker = createTracker(host)

export const track = (event: AnalyticsEvent, payload: AnalyticsPayload = {}): void => {
  if (typeof window === 'undefined') return

  // Forwarded first, so a dataLayer consumer sees exactly what it always did.
  const target = window as DataLayerWindow
  if (Array.isArray(target.dataLayer)) {
    target.dataLayer.push({ event, ...payload })
  }

  try {
    tracker.track(event, payload)
  } catch {
    // Analytics is never allowed to interrupt what the visitor was doing.
  }
}

export { SESSION_ID_KEY, SESSION_STARTED_KEY }
