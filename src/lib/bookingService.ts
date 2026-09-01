/**
 * Booking service boundary — now first-party.
 *
 * Everything /book needs from the server goes through this module: availability,
 * starting a checkout, and reading back a confirmation. Each call is a fetch to a
 * Netlify Function, which is the only thing allowed to talk to Supabase or
 * Stripe. The browser never holds a service key, never sees a price it can
 * change, and never decides whether a booking is paid.
 *
 * Nothing here fabricates availability. When the server says booking is
 * unavailable, the UI says exactly that.
 */

import type {
  AvailabilityResponse,
  CheckoutRequest,
  CheckoutResponse,
  ConfirmationResponse,
  LocationId,
  SessionId,
} from '@shared/booking/types'

const ENDPOINT = {
  availability: '/.netlify/functions/booking-availability',
  checkout: '/.netlify/functions/booking-checkout',
  confirmation: '/.netlify/functions/booking-confirmation',
} as const

export interface AvailabilityQuery {
  sessionId: SessionId
  locationId: LocationId
}

/**
 * Live availability for one session and training area.
 *
 * A network or server failure is reported as `disabled` — the same operational
 * message a switched-off booking system produces — rather than an error the
 * customer has to interpret.
 */
export const fetchAvailability = async (
  query: AvailabilityQuery,
  signal?: AbortSignal,
): Promise<AvailabilityResponse> => {
  const params = new URLSearchParams({ session: query.sessionId, location: query.locationId })

  try {
    const response = await fetch(`${ENDPOINT.availability}?${params.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
      // Availability is never cached: a slot can go while the page is open.
      cache: 'no-store',
    })
    if (!response.ok) return { status: 'disabled' }
    return (await response.json()) as AvailabilityResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return { status: 'disabled' }
  }
}

/**
 * Reserves the slot and returns the hosted Stripe Checkout URL.
 *
 * `attemptId` is generated once per submission attempt and reused on retries, so
 * a double-click or a flaky connection cannot create two holds or two charges.
 */
export const startCheckout = async (request: CheckoutRequest): Promise<CheckoutResponse> => {
  try {
    const response = await fetch(ENDPOINT.checkout, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(request),
    })
    const body = (await response.json()) as CheckoutResponse
    return body
  } catch {
    return {
      status: 'error',
      code: 'server_error',
      message: 'We could not reach the booking system. Please check your connection and try again.',
    }
  }
}

/** Asks the server what actually happened to a checkout. */
export const fetchConfirmation = async (
  checkoutSessionId: string,
  signal?: AbortSignal,
): Promise<ConfirmationResponse> => {
  const params = new URLSearchParams({ session_id: checkoutSessionId })

  try {
    const response = await fetch(`${ENDPOINT.confirmation}?${params.toString()}`, {
      signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    return (await response.json()) as ConfirmationResponse
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return { status: 'error' }
  }
}

/** One id per submission attempt, used for both hold and Stripe idempotency. */
export const newAttemptId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : // Older browsers only. Shape matters (the server validates a UUID), not entropy quality.
      '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (character) =>
        (
          Number(character) ^
          (Math.floor(Math.random() * 256) & (15 >> (Number(character) / 4)))
        ).toString(16),
      )
