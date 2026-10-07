import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BOOKABLE_SESSION_CATALOG,
  DEFAULT_BOOKABLE_SESSION_ID,
  SESSION_CATALOG,
  findBookableSession,
  findSession,
  isBookableSessionId,
  sessionPriceCents,
} from '@shared/booking/catalog'
import { DEFAULT_BOOKING_SETTINGS } from '@shared/booking/rules'
import { formatPriceRange } from '@shared/booking/format'
import { validateCheckoutRequest } from '../netlify/lib/bookingInput'
import type { AvailabilityOutcome } from '../netlify/lib/availabilityService'

/**
 * Active versus retired sessions.
 *
 * First Flight is the only lesson the public can buy. Fly With Confidence and
 * Photo & Video are retired, but historical booking rows may still carry them,
 * so the historical catalogue must keep resolving them for the owner — while
 * every public path (availability and checkout) refuses them.
 */

const RETIRED = ['fly-with-confidence', 'photo-video'] as const

const lookupAvailability = vi.fn<(client: unknown, query: unknown) => Promise<AvailabilityOutcome>>()
vi.mock('../netlify/lib/availabilityService', () => ({
  lookupAvailability: (client: unknown, query: unknown) => lookupAvailability(client, query),
}))

vi.mock('../netlify/lib/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../netlify/lib/supabase')>()),
  serviceClient: () => ({}),
  bookingBackendConfigured: () => true,
}))

vi.mock('../netlify/lib/adminAuth', () => ({
  requireAdmin: async () => ({ ok: true, identity: { email: 'owner@example.com' } }),
}))

const publicAvailability = (await import('../netlify/functions/booking-availability.mts')).default
const adminAvailability = (await import('../netlify/functions/admin-availability.mts')).default

const okOutcome: AvailabilityOutcome = {
  status: 'ok',
  settings: { ...DEFAULT_BOOKING_SETTINGS, bookingEnabled: true },
  days: [],
}

beforeEach(() => {
  lookupAvailability.mockReset()
  lookupAvailability.mockResolvedValue(okOutcome)
})

const checkoutPayload = (sessionId: unknown) => ({
  attemptId: '11111111-1111-4111-8111-111111111111',
  sessionId,
  locationId: 'south-sydney',
  startsAt: '2026-10-05T21:00:00.000Z',
  firstName: 'Alex',
  lastName: 'Taylor',
  email: 'alex@example.com',
  mobile: '0400 000 000',
  guestAttendance: 'just-me',
  droneModel: 'DJI Mini 4K',
  controllerModel: 'DJI RC-N1',
  experienceCode: 'new',
  helpWith: 'Getting confident flying in a park',
  policyAccepted: true,
})

describe('the session catalogue', () => {
  it('offers First Flight, and only First Flight, to the public', () => {
    expect(BOOKABLE_SESSION_CATALOG.map((entry) => entry.id)).toEqual(['first-flight'])
    expect(DEFAULT_BOOKABLE_SESSION_ID).toBe('first-flight')
    expect(findBookableSession('first-flight')).toMatchObject({
      name: 'First Flight',
      priceDollars: 180,
      durationMinutes: 60,
    })
    expect(isBookableSessionId('first-flight')).toBe(true)
  })

  it('does not resolve a retired or unknown session through the public lookup', () => {
    for (const id of [...RETIRED, 'custom-cheap', '', null, undefined]) {
      expect(findBookableSession(id)).toBeNull()
      expect(isBookableSessionId(id)).toBe(false)
    }
  })

  it('still resolves the retired sessions historically, with their original facts', () => {
    expect(SESSION_CATALOG.map((entry) => entry.id)).toEqual([
      'first-flight',
      'fly-with-confidence',
      'photo-video',
    ])
    expect(findSession('fly-with-confidence')).toMatchObject({
      name: 'Fly With Confidence',
      priceDollars: 240,
      durationMinutes: 90,
    })
    expect(findSession('photo-video')).toMatchObject({
      name: 'Photo & Video',
      priceDollars: 280,
      durationMinutes: 90,
    })
    expect(findSession('first-flight')).toBe(findBookableSession('first-flight'))
    expect(findSession('custom-cheap')).toBeNull()
  })
})

describe('new checkout', () => {
  it('accepts First Flight and resolves $180, 60 minutes and the name server-side', () => {
    const result = validateCheckoutRequest({
      ...checkoutPayload('first-flight'),
      priceCents: 1,
      durationMinutes: 90,
      sessionName: 'Photo & Video',
    })
    if (!result.ok) throw new Error(result.problems.join(' / '))
    expect(result.value.session.id).toBe('first-flight')
    expect(result.value.session.name).toBe('First Flight')
    expect(result.value.session.durationMinutes).toBe(60)
    expect(sessionPriceCents(result.value.session)).toBe(18000)
  })

  it.each(RETIRED)('rejects a handcrafted checkout for the retired %s session', (id) => {
    const result = validateCheckoutRequest(checkoutPayload(id))
    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.problems).toContain('Choose one of the available sessions.')
  })

  it('rejects an arbitrary session id', () => {
    const result = validateCheckoutRequest(checkoutPayload('custom-cheap'))
    expect(result.ok).toBe(false)
  })
})

describe('public availability', () => {
  const get = (session: string) =>
    publicAvailability(
      new Request(
        `http://localhost/.netlify/functions/booking-availability?session=${session}&location=south-sydney`,
      ),
      {} as never,
    )

  it('computes First Flight times at 60 minutes', async () => {
    const response = await get('first-flight')
    expect(response.status).toBe(200)
    expect(lookupAvailability).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ sessionDurationMinutes: 60 }),
    )
  })

  it.each([...RETIRED, 'custom-cheap'])('refuses %s without looking anything up', async (id) => {
    const response = await get(id)
    expect(response.status).toBe(400)
    expect(lookupAvailability).not.toHaveBeenCalled()
  })
})

describe('admin reschedule availability', () => {
  const slots = (session: string) =>
    adminAvailability(
      new Request(
        `http://localhost/.netlify/functions/admin-availability?slots=1&session=${session}&location=north-sydney&exclude=booking-1`,
        { headers: { authorization: 'Bearer test' } },
      ),
      {} as never,
    )

  it.each(RETIRED)('offers a historical %s booking times at its own 90 minutes', async (id) => {
    const response = await slots(id)
    expect(response.status).toBe(200)
    expect(lookupAvailability).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        sessionDurationMinutes: 90,
        excludeBookingId: 'booking-1',
        waiveNotice: true,
      }),
    )
  })

  it('still refuses an id that was never a session', async () => {
    const response = await slots('custom-cheap')
    expect(response.status).toBe(400)
    expect(lookupAvailability).not.toHaveBeenCalled()
  })
})

describe('structured-data price range', () => {
  it('shows a single price as one figure, never "$180–$180"', () => {
    expect(formatPriceRange(BOOKABLE_SESSION_CATALOG.map((entry) => entry.priceDollars))).toBe('$180')
    expect(formatPriceRange([180, 180])).toBe('$180')
  })

  it('still produces a range if more than one lesson is bookable again', () => {
    expect(formatPriceRange([240, 180, 280])).toBe('$180–$280')
  })
})
