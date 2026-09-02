/**
 * First-party analytics contract, shared by the browser and the collector.
 *
 * This module is the single definition of what an analytics event may contain.
 * It is deliberately free of React, Vite, `import.meta` and every DOM API, so
 * `src/lib/analytics.ts` and `netlify/functions/analytics-event.mts` sanitise
 * against exactly the same rules — and the server runs them again, because the
 * server is authoritative.
 *
 * The privacy boundary is enforced structurally rather than by convention:
 * there is a fixed list of storable fields, a fixed list of caller-supplied
 * payload keys that map onto them, a length cap on every one, and a character
 * class that rejects anything shaped like prose, an email address or a URL.
 * A name, email, phone number, drone model, note, booking reference or Stripe
 * identifier has no key it could arrive under, and `path` is never accepted
 * from a caller at all — it is derived from the current pathname, query string
 * removed.
 */

/** Every event the collector will store. Anything else is discarded. */
export const ANALYTICS_EVENTS = [
  // Added by the first-party layer.
  'session_started',
  'page_viewed',
  // The existing funnel, unchanged in meaning.
  'session_viewed',
  'booking_clicked',
  'booking_page_viewed',
  'booking_session_selected',
  'booking_location_selected',
  'booking_slot_selected',
  'booking_details_started',
  'booking_checkout_started',
  'booking_checkout_failed',
  'booking_confirmed_viewed',
  'booking_unavailable_shown',
  'enquiry_submitted',
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

export const isAnalyticsEvent = (value: unknown): value is AnalyticsEvent =>
  typeof value === 'string' && (ANALYTICS_EVENTS as readonly string[]).includes(value)

/**
 * The storable columns, with the cap each one is truncated to. These names are
 * the wire format *and* the column names in `public.analytics_events`, so there
 * is no third spelling of a field anywhere.
 */
export const ANALYTICS_FIELD_LIMITS = {
  path: 128,
  session_slug: 64,
  location_slug: 64,
  context: 64,
  reason: 64,
  code: 64,
  form_name: 64,
  source_page: 64,
  referrer_host: 128,
  utm_source: 64,
  utm_medium: 64,
  utm_campaign: 64,
} as const

export type AnalyticsField = keyof typeof ANALYTICS_FIELD_LIMITS

export const ANALYTICS_FIELDS = Object.keys(ANALYTICS_FIELD_LIMITS) as AnalyticsField[]

/**
 * Caller payload keys, mapped to the column they land in.
 *
 * `path` is absent on purpose: a caller cannot set it, so a full URL or a query
 * string can never be smuggled in through a payload.
 */
const PAYLOAD_KEYS = {
  session: 'session_slug',
  location: 'location_slug',
  context: 'context',
  reason: 'reason',
  code: 'code',
  form: 'form_name',
  source: 'source_page',
} as const satisfies Record<string, AnalyticsField>

/** Attribution keys, only ever supplied by the tracker itself. */
const ATTRIBUTION_KEYS = {
  referrerHost: 'referrer_host',
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
} as const satisfies Record<string, AnalyticsField>

const CALLER_KEYS: Record<string, AnalyticsField> = { ...PAYLOAD_KEYS, ...ATTRIBUTION_KEYS }

/** The only UTM parameters read from a query string. `utm_term`/`utm_content` are not. */
export const SUPPORTED_UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

/** Paths that are never tracked. The owner dashboard is not a public surface. */
export const UNTRACKED_PATH_PREFIXES = ['/admin'] as const

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

/** A single event, exactly as it travels over the wire and lands in a row. */
export interface AnalyticsWireEvent {
  /** Browser-generated per event. Used as the primary key, so a retry is a no-op. */
  id: string
  /** Anonymous, per browser-tab session. Never persisted beyond sessionStorage. */
  session_id: string
  event_name: AnalyticsEvent
  path?: string
  session_slug?: string
  location_slug?: string
  context?: string
  reason?: string
  code?: string
  form_name?: string
  source_page?: string
  referrer_host?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value.trim())

/**
 * A conservative character class for every label field.
 *
 * Slugs, short codes, context names and pathnames pass. Anything with an `@`,
 * a comma, a quote, a question mark or any other punctuation does not, which
 * is a second line of defence behind the key whitelist: even if a caller found
 * a way to pass free text, an email address or a sentence would be dropped
 * rather than truncated and stored.
 */
const LABEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._:/-]*$/

const collapse = (value: string): string => value.replace(/\s+/g, ' ').trim()

const label = (value: unknown, limit: number): string | undefined => {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : undefined
  }
  if (typeof value === 'boolean') return String(value)
  if (typeof value !== 'string') return undefined
  const cleaned = collapse(value).slice(0, limit)
  if (cleaned.length === 0) return undefined
  return LABEL_PATTERN.test(cleaned) ? cleaned : undefined
}

/**
 * A pathname, and only a pathname.
 *
 * Everything from the first `?` or `#` is cut before any other check, so a
 * `/booking-confirmed?session_id=cs_test_…` can never be stored — not
 * truncated, not encoded, not partially kept. A value that isn't a rooted path
 * is dropped rather than guessed at.
 */
export const sanitisePath = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const withoutQuery = value.split('?')[0]!.split('#')[0]!
  const cleaned = collapse(withoutQuery).slice(0, ANALYTICS_FIELD_LIMITS.path)
  if (!cleaned.startsWith('/')) return undefined
  if (cleaned.length > 1 && !LABEL_PATTERN.test(cleaned.slice(1))) return undefined
  return cleaned
}

const HOST_PATTERN = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/

/**
 * A bare hostname. `https://google.com/search?q=…` is not accepted here — the
 * tracker reduces a referrer to its hostname before this is called, and a value
 * that still looks like a URL is discarded.
 */
export const sanitiseHost = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const cleaned = value.trim().toLowerCase().replace(/\.$/, '').slice(0, ANALYTICS_FIELD_LIMITS.referrer_host)
  if (cleaned.length === 0) return undefined
  return HOST_PATTERN.test(cleaned) ? cleaned : undefined
}

/** True when this pathname is a public surface worth measuring. */
export const isTrackablePath = (pathname: unknown): boolean => {
  const path = sanitisePath(pathname)
  if (path === undefined) return false
  return !UNTRACKED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Maps a caller payload onto storable fields.
 *
 * Unknown keys are dropped, not persisted, and never reach a JSON column —
 * there is no JSON column. `path` in a payload is ignored.
 */
export const sanitisePayload = (payload: AnalyticsPayload = {}): Partial<Record<AnalyticsField, string>> => {
  const out: Partial<Record<AnalyticsField, string>> = {}
  for (const [key, raw] of Object.entries(payload)) {
    const field = CALLER_KEYS[key]
    if (!field) continue
    const value =
      field === 'referrer_host'
        ? sanitiseHost(raw)
        : label(raw, ANALYTICS_FIELD_LIMITS[field])
    if (value !== undefined) out[field] = value
  }
  return out
}

/** Builds the wire event, or null when it could never be stored. */
export const buildAnalyticsEvent = (input: {
  id: string
  sessionId: string
  event: string
  path?: unknown
  payload?: AnalyticsPayload
}): AnalyticsWireEvent | null => {
  if (!isUuid(input.id) || !isUuid(input.sessionId)) return null
  if (!isAnalyticsEvent(input.event)) return null

  const path = sanitisePath(input.path)
  // The dashboard is not measured, and neither is a request that arrives
  // claiming one of its paths.
  if (path !== undefined && !isTrackablePath(path)) return null

  return {
    id: input.id.trim().toLowerCase(),
    session_id: input.sessionId.trim().toLowerCase(),
    event_name: input.event,
    ...(path === undefined ? {} : { path }),
    ...sanitisePayload(input.payload),
  }
}

/**
 * Server-side parse of a posted body.
 *
 * Same rules, run again on values the browser sent. A client timestamp is not
 * read: `occurred_at` is stamped by the database.
 */
export const parseAnalyticsEvent = (raw: unknown): AnalyticsWireEvent | null => {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
  const body = raw as Record<string, unknown>

  const payload: AnalyticsPayload = {}
  for (const [key, field] of Object.entries({ ...PAYLOAD_KEYS, ...ATTRIBUTION_KEYS })) {
    // Accept either the caller spelling or the column spelling, so the wire
    // format and the payload format are both understood.
    const value = body[key] ?? body[field]
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      payload[key] = value
    }
  }

  return buildAnalyticsEvent({
    id: typeof body.id === 'string' ? body.id : '',
    sessionId: typeof body.session_id === 'string' ? body.session_id : '',
    event: typeof body.event_name === 'string' ? body.event_name : '',
    path: body.path,
    payload,
  })
}
