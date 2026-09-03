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
  controllerModel: 'DJI RC-N1',
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
    expect(reject({ controllerModel: '' }).length).toBeGreaterThan(0)
    expect(reject({ controllerModel: undefined }).length).toBeGreaterThan(0)
    expect(reject({ helpWith: '' }).length).toBeGreaterThan(0)
  })

  it('keeps optional notes optional and trims them to a sane length', () => {
    expect(accept({ notes: '  ' }).notes).toBeNull()
    expect(accept({ notes: 'Parking is tricky near me.' }).notes).toBe('Parking is tricky near me.')
    expect(reject({ notes: 'x'.repeat(5000) }).length).toBeGreaterThan(0)
  })

  it('accepts a controller the catalogue lists for the chosen aircraft', () => {
    // The DJI compatibility matrix is the only authority, on the server as well
    // as in the form.
    expect(accept({ droneModel: 'DJI Mini 4 Pro', controllerModel: 'DJI RC 2' }).controllerModel)
      .toBe('DJI RC 2')
    expect(accept({ droneModel: 'DJI Mini 4K', controllerModel: 'DJI RC-N1C' }).controllerModel)
      .toBe('DJI RC-N1C')
  })

  it('rejects a controller that is not compatible with the aircraft', () => {
    // A tampered POST cannot assert a pairing the form would never have offered.
    expect(reject({ droneModel: 'DJI Mini 4K', controllerModel: 'DJI RC 2' })).toContain(
      'DJI RC 2 isn’t compatible with the DJI Mini 4K. Please choose one of the listed controllers.',
    )
    expect(
      reject({ droneModel: 'DJI Avata', controllerModel: 'DJI Smart Controller' }).length,
    ).toBeGreaterThan(0)
  })

  it('rejects DJI Avata 360 with DJI RC Pro 2, which is future support only', () => {
    // The matrix marks that pairing with an asterisk — "support in future
    // updates" — so it is not current compatibility and must not be accepted.
    expect(reject({ droneModel: 'DJI Avata 360', controllerModel: 'DJI RC Pro 2' }).length)
      .toBeGreaterThan(0)
    // Its genuinely current controllers still pass.
    expect(accept({ droneModel: 'DJI Avata 360', controllerModel: 'DJI RC Motion 3' }).droneModel)
      .toBe('DJI Avata 360')
  })

  it('takes unlisted hardware at its word rather than inventing compatibility', () => {
    const custom = accept({
      droneModel: 'Autel EVO Lite+',
      controllerModel: 'Autel Smart Controller SE',
    })
    expect(custom.droneModel).toBe('Autel EVO Lite+')
    expect(custom.controllerModel).toBe('Autel Smart Controller SE')

    // A known aircraft with a controller we have never heard of is also fine:
    // there is no listed pairing to contradict.
    expect(accept({ droneModel: 'DJI Mini 4K', controllerModel: 'A modified RC-N1' }).controllerModel)
      .toBe('A modified RC-N1')

    // Length is still enforced on the free-text path.
    expect(reject({ controllerModel: 'x'.repeat(200) }).length).toBeGreaterThan(0)
  })

  it('rejects anything that is not an object', () => {
    for (const raw of [null, undefined, 'a string', 42, []]) {
      expect(validateCheckoutRequest(raw).ok).toBe(false)
    }
  })
})
