import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_BOOKING_SETTINGS, type BookingSettings } from '@shared/booking/rules'
import { publicBookingAllowed, safeLocalBookingTestMode } from '../netlify/lib/bookingAccess'

/**
 * The one decision that opens public booking.
 *
 * In production only `booking_settings.booking_enabled` opens it. The local
 * override exists so `netlify dev` can drive a whole Stripe-sandbox booking
 * against the shared database while that switch stays off — and it is written to
 * fail closed, so every case below that is missing any one of the three
 * conditions must report booking as closed.
 */

const LOCALHOST = 'http://localhost:8888'
const PRODUCTION = 'https://droneconfidence.com'
const TEST_KEY = 'sk_test_0000000000000000'
const LIVE_KEY = 'sk_live_0000000000000000'

const configure = (vars: Record<string, string | undefined>): void => {
  for (const name of ['BOOKING_TEST_MODE', 'SITE_URL', 'URL', 'STRIPE_SECRET_KEY']) {
    delete process.env[name]
  }
  for (const [name, value] of Object.entries(vars)) {
    if (value !== undefined) process.env[name] = value
  }
}

const safeLocal = {
  BOOKING_TEST_MODE: 'true',
  SITE_URL: LOCALHOST,
  STRIPE_SECRET_KEY: TEST_KEY,
}

afterEach(() => configure({}))

describe('safe local booking test mode', () => {
  it('is off when nothing is configured — the database switch is the only gate', () => {
    configure({})
    expect(safeLocalBookingTestMode()).toBe(false)
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('opens booking with the database switch off when all three conditions hold', () => {
    configure(safeLocal)
    expect(safeLocalBookingTestMode()).toBe(true)
    expect(publicBookingAllowed(false)).toBe(true)
  })

  it('accepts a trailing slash on SITE_URL and nothing else about the origin', () => {
    configure({ ...safeLocal, SITE_URL: `${LOCALHOST}/` })
    expect(publicBookingAllowed(false)).toBe(true)

    configure({ ...safeLocal, SITE_URL: `${LOCALHOST}///` })
    expect(publicBookingAllowed(false)).toBe(true)

    for (const origin of [
      'http://localhost:8889',
      'https://localhost:8888',
      'http://localhost:8888/book',
      'http://127.0.0.1:8888',
      'http://localhost:8888.evil.example',
    ]) {
      configure({ ...safeLocal, SITE_URL: origin })
      expect(publicBookingAllowed(false)).toBe(false)
    }
  })

  it('refuses the production origin', () => {
    configure({ ...safeLocal, SITE_URL: PRODUCTION })
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('refuses a live Stripe key', () => {
    configure({ ...safeLocal, STRIPE_SECRET_KEY: LIVE_KEY })
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('refuses an empty, absent or unrecognised Stripe key rather than assuming it is a sandbox key', () => {
    for (const key of [undefined, '', 'sk_', 'rk_test_123', 'SK_TEST_123', 'test_sk_123', 'whsec_123']) {
      configure({ ...safeLocal, STRIPE_SECRET_KEY: key })
      expect(publicBookingAllowed(false)).toBe(false)
    }
  })

  it('needs BOOKING_TEST_MODE to be exactly "true"', () => {
    for (const flag of [undefined, 'false', '1', 'yes', 'TRUE', 'True', 'on']) {
      configure({ ...safeLocal, BOOKING_TEST_MODE: flag })
      expect(publicBookingAllowed(false)).toBe(false)
    }
  })

  it('does nothing on BOOKING_TEST_MODE alone', () => {
    configure({ BOOKING_TEST_MODE: 'true' })
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('cannot be activated by a production configuration that merely sets the flag', () => {
    // The deployed site, with the flag switched on by mistake: production origin,
    // live key, and Netlify's own `URL` present. All three variants stay closed.
    configure({ BOOKING_TEST_MODE: 'true', SITE_URL: PRODUCTION, STRIPE_SECRET_KEY: LIVE_KEY })
    expect(publicBookingAllowed(false)).toBe(false)

    configure({ BOOKING_TEST_MODE: 'true', SITE_URL: PRODUCTION, STRIPE_SECRET_KEY: TEST_KEY })
    expect(publicBookingAllowed(false)).toBe(false)

    configure({ BOOKING_TEST_MODE: 'true', SITE_URL: LOCALHOST, STRIPE_SECRET_KEY: LIVE_KEY })
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('never uses Netlify\'s URL fallback as proof that test mode is safe', () => {
    // `siteOrigin()` falls back to `URL`; this gate deliberately does not, because
    // Netlify sets `URL` in every deploy context.
    configure({ BOOKING_TEST_MODE: 'true', URL: LOCALHOST, STRIPE_SECRET_KEY: TEST_KEY })
    expect(publicBookingAllowed(false)).toBe(false)
  })

  it('leaves an enabled database switch alone', () => {
    configure({})
    expect(publicBookingAllowed(true)).toBe(true)

    configure({ BOOKING_TEST_MODE: 'false', SITE_URL: PRODUCTION, STRIPE_SECRET_KEY: LIVE_KEY })
    expect(publicBookingAllowed(true)).toBe(true)
  })
})

/**
 * Availability, which is where the public gate lives.
 */

const loadSettings = vi.fn<() => Promise<BookingSettings | null>>()
const loadOccupancy = vi.fn(async () => [])
const loadBlocks = vi.fn(async () => [])
const recordEvent = vi.fn(async () => undefined)

vi.mock('../netlify/lib/store', () => ({
  loadSettings: (...args: unknown[]) => loadSettings(...(args as [])),
  loadOccupancy: () => loadOccupancy(),
  loadBlocks: () => loadBlocks(),
  recordEvent: () => recordEvent(),
}))

const { lookupAvailability } = await import('../netlify/lib/availabilityService')

// A Tuesday well outside the seven-day notice window.
const NOW = new Date('2026-09-01T00:00:00Z')

const settingsWith = (bookingEnabled: boolean): BookingSettings => ({
  ...DEFAULT_BOOKING_SETTINGS,
  bookingEnabled,
})

const lookup = (options: { bookingEnabled: boolean; waiveNotice?: boolean }) => {
  loadSettings.mockResolvedValue(settingsWith(options.bookingEnabled))
  return lookupAvailability({} as never, {
    sessionDurationMinutes: 60,
    locationId: 'south-sydney',
    now: NOW,
    waiveNotice: options.waiveNotice,
  })
}

describe('availability gate', () => {
  it('reports disabled to a customer when the database switch is off and test mode is absent', async () => {
    configure({})
    expect((await lookup({ bookingEnabled: false })).status).toBe('disabled')
  })

  it('serves a customer when the database switch is off and safe local test mode is on', async () => {
    configure(safeLocal)
    const outcome = await lookup({ bookingEnabled: false })
    expect(outcome.status).toBe('ok')
    if (outcome.status === 'ok') expect(outcome.days.some((day) => day.slots.length > 0)).toBe(true)
  })

  it('stays disabled for a customer when only part of the override is configured', async () => {
    configure({ ...safeLocal, STRIPE_SECRET_KEY: LIVE_KEY })
    expect((await lookup({ bookingEnabled: false })).status).toBe('disabled')
  })

  it('serves a customer normally when the database switch is on', async () => {
    configure({})
    expect((await lookup({ bookingEnabled: true })).status).toBe('ok')
  })

  it('preserves the admin waiveNotice lookup, which is unaffected by test mode', async () => {
    configure({})
    expect((await lookup({ bookingEnabled: false, waiveNotice: true })).status).toBe('ok')
  })

  it('reports unconfigured when there is no settings row, whatever test mode says', async () => {
    configure(safeLocal)
    loadSettings.mockResolvedValue(null)
    const outcome = await lookupAvailability({} as never, {
      sessionDurationMinutes: 60,
      locationId: 'south-sydney',
      now: NOW,
    })
    expect(outcome.status).toBe('unconfigured')
  })
})
