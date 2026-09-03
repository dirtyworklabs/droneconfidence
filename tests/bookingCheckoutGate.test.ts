import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findSession, sessionPriceCents } from '@shared/booking/catalog'
import { DEFAULT_BOOKING_SETTINGS, type BookingSettings } from '@shared/booking/rules'
import type { AvailabilityOutcome } from '../netlify/lib/availabilityService'

/**
 * Checkout's own booking-access gate.
 *
 * The availability endpoint already refuses a closed booking system, but the
 * checkout function must not depend on that: a direct POST bypasses the browser
 * and the availability request entirely. So here the availability lookup is
 * *forced to succeed* with the database switch off, and checkout is still
 * required to refuse — no hold reserved, no Stripe Checkout Session created.
 */

const LOCALHOST = 'http://localhost:8888'
const PRODUCTION = 'https://droneconfidence.com'
const TEST_KEY = 'sk_test_0000000000000000'
const LIVE_KEY = 'sk_live_0000000000000000'

const safeLocal = {
  BOOKING_TEST_MODE: 'true',
  SITE_URL: LOCALHOST,
  STRIPE_SECRET_KEY: TEST_KEY,
}

const configure = (vars: Record<string, string | undefined>): void => {
  for (const name of ['BOOKING_TEST_MODE', 'SITE_URL', 'URL', 'STRIPE_SECRET_KEY']) {
    delete process.env[name]
  }
  for (const [name, value] of Object.entries(vars)) {
    if (value !== undefined) process.env[name] = value
  }
}

const START = '2026-09-22T22:00:00.000Z'

const settingsWith = (bookingEnabled: boolean): BookingSettings => ({
  ...DEFAULT_BOOKING_SETTINGS,
  bookingEnabled,
})

/** Availability that offers the chosen slot regardless of the master switch. */
const permissiveAvailability = (bookingEnabled: boolean): AvailabilityOutcome => ({
  status: 'ok',
  settings: settingsWith(bookingEnabled),
  days: [
    {
      date: '2026-09-23',
      slots: [{ id: 'slot-1', startsAt: START, endsAt: '2026-09-22T23:00:00.000Z' }],
    },
  ],
})

const lookupAvailability = vi.fn<() => Promise<AvailabilityOutcome>>()
vi.mock('../netlify/lib/availabilityService', () => ({
  lookupAvailability: () => lookupAvailability(),
}))

const createCheckoutSession = vi.fn()
vi.mock('../netlify/lib/stripe', () => ({
  stripeConfigured: () => true,
  createCheckoutSession: (...args: unknown[]) => createCheckoutSession(...args),
}))

const recordEvent = vi.fn(async () => undefined)
vi.mock('../netlify/lib/store', () => ({ recordEvent: () => recordEvent() }))

const rpc = vi.fn()
/** `.update({...}).eq(...)` — awaitable at every link, like the Supabase builder. */
const eqChain = (): PromiseLike<{ error: null }> & { eq: () => unknown } => {
  const chain = Promise.resolve({ error: null }) as unknown as PromiseLike<{ error: null }> & {
    eq: () => unknown
  }
  chain.eq = () => eqChain()
  return chain
}
const fakeClient = { rpc, from: () => ({ update: () => eqChain() }) }

vi.mock('../netlify/lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../netlify/lib/supabase')>()),
  serviceClient: () => fakeClient,
  bookingBackendConfigured: () => true,
}))

const checkout = (await import('../netlify/functions/booking-checkout.mts')).default

// The price the RPC must receive is the catalogue's, never the payload's.
const FIRST_FLIGHT = findSession('first-flight')!

const post = () =>
  checkout(
    new Request('http://localhost:8888/.netlify/functions/booking-checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        attemptId: '11111111-1111-4111-8111-111111111111',
        sessionId: 'first-flight',
        locationId: 'south-sydney',
        startsAt: START,
        customerName: 'Alex Taylor',
        email: 'alex@example.com',
        mobile: '0400 000 000',
        droneModel: 'DJI Mini 4K',
        controllerModel: 'DJI RC-N1',
        experienceCode: 'new',
        helpWith: 'Getting confident flying in a park',
        policyAccepted: true,
      }),
    }),
    {} as never,
  )

const expectRefused = async (response: Response) => {
  expect(response.status).toBe(503)
  expect(await response.json()).toMatchObject({ status: 'error', code: 'disabled' })
  expect(rpc).not.toHaveBeenCalled()
  expect(createCheckoutSession).not.toHaveBeenCalled()
}

beforeEach(() => {
  rpc.mockReset()
  createCheckoutSession.mockReset()
  lookupAvailability.mockResolvedValue(permissiveAvailability(false))
  configure({})
})

describe('checkout defence in depth', () => {
  it('refuses when the database switch is off and no test mode is configured', async () => {
    await expectRefused(await post())
  })

  it('refuses when BOOKING_TEST_MODE is set on its own', async () => {
    configure({ BOOKING_TEST_MODE: 'true' })
    await expectRefused(await post())
  })

  it('refuses a production origin, even with a Stripe test key', async () => {
    configure({ ...safeLocal, SITE_URL: PRODUCTION })
    await expectRefused(await post())
  })

  it('refuses a live Stripe key on localhost', async () => {
    configure({ ...safeLocal, STRIPE_SECRET_KEY: LIVE_KEY })
    await expectRefused(await post())
  })

  it('refuses an empty or unrecognised Stripe key on localhost', async () => {
    for (const key of [undefined, '', 'rk_test_123']) {
      rpc.mockReset()
      createCheckoutSession.mockReset()
      configure({ ...safeLocal, STRIPE_SECRET_KEY: key })
      await expectRefused(await post())
    }
  })

  it('refuses when BOOKING_TEST_MODE is false on an otherwise safe local setup', async () => {
    configure({ ...safeLocal, BOOKING_TEST_MODE: 'false' })
    await expectRefused(await post())
  })

  it('reserves a hold and starts Stripe Checkout under safe local test mode', async () => {
    configure(safeLocal)
    rpc.mockResolvedValue({ data: [{ booking_id: 'booking-1', reference: 'DC-TEST-1' }], error: null })
    createCheckoutSession.mockResolvedValue({ id: 'cs_test_1', url: 'https://checkout.stripe.test/x' })

    const response = await post()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok', reference: 'DC-TEST-1' })
    // The catalogue is still the only source of the price and duration.
    expect(rpc).toHaveBeenCalledWith(
      'reserve_booking_hold',
      expect.objectContaining({
        p_session_slug: 'first-flight',
        p_price_cents: sessionPriceCents(FIRST_FLIGHT),
        p_duration_minutes: 60,
        // The equipment pair reaches the reservation function as submitted.
        p_drone_model: 'DJI Mini 4K',
        p_controller_model: 'DJI RC-N1',
      }),
    )
  })

  it('proceeds normally when the database switch is on, with no test mode at all', async () => {
    lookupAvailability.mockResolvedValue(permissiveAvailability(true))
    rpc.mockResolvedValue({ data: [{ booking_id: 'booking-2', reference: 'DC-TEST-2' }], error: null })
    createCheckoutSession.mockResolvedValue({ id: 'cs_test_2', url: 'https://checkout.stripe.test/y' })

    const response = await post()
    expect(response.status).toBe(200)
    expect(createCheckoutSession).toHaveBeenCalledTimes(1)
  })
})
