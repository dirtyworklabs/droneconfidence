import { describe, expect, it } from 'vitest'
import {
  ANALYTICS_FIELDS,
  type AnalyticsWireEvent,
  isTrackablePath,
  parseAnalyticsEvent,
  sanitisePath,
} from '../shared/analytics/events'
import {
  SESSION_ID_KEY,
  SESSION_STARTED_KEY,
  type TrackerHost,
  createTracker,
} from '../shared/analytics/tracker'

/**
 * The analytics privacy contract, asserted rather than trusted.
 *
 * The promise this layer makes is narrow and absolute: no customer identity, no
 * booking or Stripe identifier, no full URL, no query string, and nothing that
 * survives the browser tab. Those are properties of the code, so they are tested
 * as properties — with a fake browser, and with payloads that actively try to
 * smuggle the forbidden values through.
 */

interface Fake {
  host: TrackerHost
  sent: AnalyticsWireEvent[]
  storage: Map<string, string>
}

// Shared across fakes so two "browsers" in one test cannot mint the same id.
let counter = 0

const fake = (
  overrides: Partial<{ pathname: string; referrer: string; search: string }> = {},
  hostOverrides: Partial<TrackerHost> = {},
): Fake => {
  const sent: AnalyticsWireEvent[] = []
  const storage = new Map<string, string>()

  const host: TrackerHost = {
    pathname: () => overrides.pathname ?? '/',
    referrer: () => overrides.referrer ?? '',
    search: () => overrides.search ?? '',
    // Deterministic, but UUID-shaped and unique per call.
    newId: () => `${(counter += 1).toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`,
    read: (key) => storage.get(key) ?? null,
    write: (key, value) => void storage.set(key, value),
    send: (event) => void sent.push(event),
    ...hostOverrides,
  }

  return { host, sent, storage }
}

describe('analytics payload sanitisation', () => {
  it('stores nothing a customer could be identified by', () => {
    const { host, sent } = fake({ pathname: '/book' })

    createTracker(host).track('booking_checkout_started', {
      // Every forbidden value, offered under its most plausible key.
      name: 'Jordan Example',
      customerName: 'Jordan Example',
      email: 'jordan@example.com',
      phone: '0400 000 000',
      mobile: '0400 000 000',
      droneModel: 'DJI Mini 4 Pro',
      controllerModel: 'DJI RC 2',
      experience: 'I have flown twice in a park',
      helpWith: 'I want to feel calm in wind',
      notes: 'Meeting near the car park',
      reference: 'DC-4821',
      bookingId: '8f6c1d2e-0000-4000-8000-000000000000',
      checkoutSessionId: 'cs_test_a1b2c3',
      paymentIntentId: 'pi_3Abc123',
      refundId: 're_3Abc123',
      ip: '203.0.113.9',
      userAgent: 'Mozilla/5.0',
      url: 'https://droneconfidence.com.au/book?session=first-flight',
      // The one legitimate key in the pile.
      session: 'first-flight',
    })

    // sent[0] is the session_started event; this is the tracked call itself.
    const event = sent.find((candidate) => candidate.event_name === 'booking_checkout_started')
    expect(event).toBeDefined()
    expect(Object.keys(event!)).toEqual(['id', 'session_id', 'event_name', 'path', 'session_slug'])
    expect(event!.session_slug).toBe('first-flight')

    // Nothing in the row contains any of the forbidden substrings, whichever
    // field it might have landed in.
    const stored = JSON.stringify(event)
    for (const secret of [
      'Jordan', 'example.com', '0400', 'DJI', 'RC 2', 'wind', 'car park',
      'DC-4821', 'cs_test', 'pi_3', 're_3', '203.0.113', 'Mozilla', 'https',
    ]) {
      expect(stored).not.toContain(secret)
    }
  })

  it('has no field a booking reference, id or Stripe token could be stored in', () => {
    // The storable list is the whole contract. If a field is ever added, this
    // test is where the addition has to be justified.
    expect(ANALYTICS_FIELDS).toEqual([
      'path', 'session_slug', 'location_slug', 'context', 'reason', 'code',
      'form_name', 'source_page', 'referrer_host',
      'utm_source', 'utm_medium', 'utm_campaign',
    ])
  })

  it('keeps only the pathname, never the query string or fragment', () => {
    // /booking-confirmed carries a Stripe Checkout Session id in its query.
    expect(sanitisePath('/booking-confirmed?session_id=cs_test_a1b2c3')).toBe('/booking-confirmed')
    expect(sanitisePath('/book?session=first-flight&location=north-sydney')).toBe('/book')
    expect(sanitisePath('/book#step-3')).toBe('/book')
    // An absolute URL is not a pathname, so it is dropped rather than trimmed.
    expect(sanitisePath('https://droneconfidence.com.au/book')).toBeUndefined()
  })

  it('reduces a referrer to a hostname and reads only the three named UTM keys', () => {
    const { host, sent } = fake({
      pathname: '/',
      referrer: 'https://www.google.com/search?q=drone+lessons+sydney&client=safari',
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=drone+lessons&utm_content=ad-b&gclid=xyz',
    })

    createTracker(host).track('page_viewed')

    const started = sent.find((event) => event.event_name === 'session_started')
    expect(started).toBeDefined()
    expect(started!.referrer_host).toBe('www.google.com')
    expect(started!.utm_source).toBe('google')
    expect(started!.utm_medium).toBe('cpc')
    expect(started!.utm_campaign).toBe('spring')
    // utm_term, utm_content, gclid and the search string itself are not stored.
    const stored = JSON.stringify(started)
    expect(stored).not.toContain('drone+lessons')
    expect(stored).not.toContain('ad-b')
    expect(stored).not.toContain('xyz')
    expect(stored).not.toContain('?')
    expect(stored).not.toContain('search')
  })
})

describe('anonymous session identity', () => {
  it('sends exactly one session_started per browser session', () => {
    const { host, sent, storage } = fake({ pathname: '/' })
    const tracker = createTracker(host)

    tracker.track('page_viewed')
    tracker.track('booking_clicked', { source: 'hero' })
    tracker.track('page_viewed')

    expect(sent.filter((event) => event.event_name === 'session_started')).toHaveLength(1)
    // One anonymous id, shared by every event, held only in sessionStorage.
    const ids = new Set(sent.map((event) => event.session_id))
    expect(ids.size).toBe(1)
    expect(storage.get(SESSION_ID_KEY)).toBe([...ids][0])
    expect(storage.get(SESSION_STARTED_KEY)).toBe([...ids][0])
    // A distinct event id each time, so a retried beacon is a no-op insert.
    expect(new Set(sent.map((event) => event.id)).size).toBe(sent.length)
  })

  it('treats a new session storage as a new, unlinkable visitor', () => {
    const first = fake({ pathname: '/' })
    createTracker(first.host).track('page_viewed')
    const second = fake({ pathname: '/' })
    createTracker(second.host).track('page_viewed')

    expect(first.sent[0]!.session_id).not.toBe(second.sent[0]!.session_id)
    expect(second.sent.filter((event) => event.event_name === 'session_started')).toHaveLength(1)
  })
})

describe('untracked surfaces', () => {
  it('measures nothing on the owner dashboard', () => {
    for (const pathname of ['/admin', '/admin/login', '/admin/bookings']) {
      const { host, sent, storage } = fake({ pathname })
      createTracker(host).track('page_viewed')
      expect(sent).toEqual([])
      // Not even an anonymous session id is created there.
      expect(storage.size).toBe(0)
      expect(isTrackablePath(pathname)).toBe(false)
    }

    expect(isTrackablePath('/administration')).toBe(true)
  })

  it('discards an event name outside the supported vocabulary', () => {
    const { host, sent } = fake({ pathname: '/' })
    createTracker(host).track('customer_email_captured')
    // The session still starts; the unknown event does not survive.
    expect(sent.map((event) => event.event_name)).toEqual(['session_started'])
  })
})

describe('failure safety', () => {
  it('never throws when storage, crypto or delivery fail', () => {
    const blocked = fake({ pathname: '/book' }, {
      read: () => { throw new Error('storage disabled') },
      write: () => { throw new Error('storage disabled') },
      send: () => { throw new Error('network down') },
    })
    expect(() => createTracker(blocked.host).track('booking_slot_selected')).not.toThrow()

    const noCrypto = fake({ pathname: '/book' }, { newId: () => { throw new Error('no crypto') } })
    expect(() => createTracker(noCrypto.host).track('booking_slot_selected')).not.toThrow()
    expect(noCrypto.sent).toEqual([])
  })
})

describe('server-side parsing', () => {
  it('ignores a client timestamp and any unknown property', () => {
    const event = parseAnalyticsEvent({
      id: '11111111-1111-4111-8111-111111111111',
      session_id: '22222222-2222-4222-8222-222222222222',
      event_name: 'booking_slot_selected',
      path: '/book?session=first-flight',
      occurred_at: '2000-01-01T00:00:00Z',
      created_at: '2000-01-01T00:00:00Z',
      email: 'jordan@example.com',
      notes: 'anything at all',
      session: 'first-flight',
    })

    expect(event).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      session_id: '22222222-2222-4222-8222-222222222222',
      event_name: 'booking_slot_selected',
      path: '/book',
      session_slug: 'first-flight',
    })
  })

  it('rejects a body without a valid event id and session id', () => {
    const base = {
      id: '11111111-1111-4111-8111-111111111111',
      session_id: '22222222-2222-4222-8222-222222222222',
      event_name: 'page_viewed',
    }
    expect(parseAnalyticsEvent({ ...base, id: 'not-a-uuid' })).toBeNull()
    expect(parseAnalyticsEvent({ ...base, session_id: '' })).toBeNull()
    expect(parseAnalyticsEvent({ ...base, event_name: 'made_up' })).toBeNull()
    expect(parseAnalyticsEvent({ ...base, path: '/admin/bookings' })).toBeNull()
    expect(parseAnalyticsEvent('page_viewed')).toBeNull()
    expect(parseAnalyticsEvent(null)).toBeNull()
  })
})
