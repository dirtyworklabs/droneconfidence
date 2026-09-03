import { describe, expect, it } from 'vitest'
import { findSession, sessionPriceCents } from '@shared/booking/catalog'
import { validateCheckoutRequest } from '../netlify/lib/bookingInput'

const valid = {
  attemptId: '11111111-1111-4111-8111-111111111111',
  sessionId: 'first-flight',
  locationId: 'south-sydney',
  startsAt: '2026-10-05T21:00:00.000Z',
  customerName: 'Alex Taylor',
  email: 'Alex@Example.com',
  mobile: '0400 000 000',
  droneModel: 'DJI Mini 4K',
  experienceCode: 'new',
  helpWith: 'Getting confident flying in a park',
  policyAccepted: true,
}

const accept = (overrides: Record<string, unknown> = {}) => {
  const result = validateCheckoutRequest({ ...valid, ...overrides })
  if (!result.ok) throw new Error(`expected valid, got: ${result.problems.join(' / ')}`)
  return result.value
}

const reject = (overrides: Record<string, unknown>) => {
  const result = validateCheckoutRequest({ ...valid, ...overrides })
  expect(result.ok).toBe(false)
  return result.ok ? [] : result.problems
}

describe('server-side booking validation', () => {
  it('accepts a complete submission and normalises the email', () => {
    const value = accept()
    expect(value.email).toBe('alex@example.com')
    expect(value.session.id).toBe('first-flight')
    expect(value.location.id).toBe('south-sydney')
    expect(value.notes).toBeNull()
  })

  it('resolves the price, duration and name from the catalogue, not the payload', () => {
    const value = accept({
      priceCents: 1,
      price: '$1',
      durationMinutes: 5,
      sessionName: 'Free lesson',
      amount: 0,
    })
    // Whatever the browser claims, the charge comes from shared/booking/catalog.ts.
    const firstFlight = findSession('first-flight')
    expect(firstFlight).not.toBeNull()
    expect(sessionPriceCents(value.session)).toBe(sessionPriceCents(firstFlight!))
    expect(value.session.durationMinutes).toBe(60)
    expect(value.session.name).toBe('First Flight')
    expect(Object.keys(value)).not.toContain('priceCents')
    expect(Object.keys(value)).not.toContain('durationMinutes')
  })

  it('rejects a session or training area that is not in the catalogue', () => {
    expect(reject({ sessionId: 'custom-cheap' })).toContain('Choose one of the available sessions.')
    expect(reject({ locationId: 'my-backyard' })).toContain(
      'Choose one of the standard training areas.',
    )
    expect(reject({ sessionId: null })).toContain('Choose one of the available sessions.')
  })

  it('rejects a submission with no usable attempt id', () => {
    expect(reject({ attemptId: 'abc' })).toContain('Invalid submission id.')
    expect(reject({ attemptId: undefined })).toContain('Invalid submission id.')
  })

  it('rejects an unparseable start time', () => {
    expect(reject({ startsAt: 'next Tuesday' })).toContain('Choose an available time.')
    expect(reject({ startsAt: '' })).toContain('Choose an available time.')
  })

  it('requires the policy acknowledgement', () => {
    expect(reject({ policyAccepted: false }).length).toBeGreaterThan(0)
    expect(reject({ policyAccepted: 'yes' }).length).toBeGreaterThan(0)
  })

  it('rejects an unknown experience code', () => {
    expect(reject({ experienceCode: 'expert-pilot' }).length).toBeGreaterThan(0)
  })

  it('requires the fields the lesson actually needs', () => {
    expect(reject({ customerName: '' }).length).toBeGreaterThan(0)
    expect(reject({ email: 'not-an-email' }).length).toBeGreaterThan(0)
    expect(reject({ mobile: '' }).length).toBeGreaterThan(0)
    expect(reject({ droneModel: '' }).length).toBeGreaterThan(0)
    expect(reject({ helpWith: '' }).length).toBeGreaterThan(0)
  })

  it('keeps optional notes optional and trims them to a sane length', () => {
    expect(accept({ notes: '  ' }).notes).toBeNull()
    expect(accept({ notes: 'Parking is tricky near me.' }).notes).toBe('Parking is tricky near me.')
    expect(reject({ notes: 'x'.repeat(5000) }).length).toBeGreaterThan(0)
  })

  it('rejects anything that is not an object', () => {
    for (const raw of [null, undefined, 'a string', 42, []]) {
      expect(validateCheckoutRequest(raw).ok).toBe(false)
    }
  })
})
