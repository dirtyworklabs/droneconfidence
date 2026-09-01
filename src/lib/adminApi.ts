/**
 * Admin API client.
 *
 * Every call carries the Supabase access token as a bearer header, and every
 * endpoint verifies it server-side. Nothing here decides what the owner is
 * allowed to do — that is settled in `netlify/lib/adminAuth.ts`. A 401 means the
 * session has gone, and the dashboard sends the owner back to the login form.
 */

import type { BookingSettings } from '@shared/booking/rules'
import type {
  AdminAvailabilityBlock,
  AdminBookingDetail,
  AdminBookingRow,
  AvailabilityDay,
  CancellationReason,
} from '@shared/booking/types'

const ENDPOINT = {
  bookings: '/.netlify/functions/admin-bookings',
  availability: '/.netlify/functions/admin-availability',
  settings: '/.netlify/functions/admin-settings',
} as const

export class AdminAuthExpired extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.')
    this.name = 'AdminAuthExpired'
  }
}

const request = async <T>(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (response.status === 401) throw new AdminAuthExpired()

  const body = (await response.json().catch(() => null)) as
    | ({ status: string; message?: string } & Record<string, unknown>)
    | null

  if (!response.ok || !body || body.status !== 'ok') {
    throw new Error(body?.message ?? 'That did not work. Please try again.')
  }
  return body as T
}

export type BookingView = 'upcoming' | 'past' | 'cancelled'

export const listBookings = (token: string, view: BookingView) =>
  request<{ bookings: AdminBookingRow[] }>(token, `${ENDPOINT.bookings}?view=${view}`).then(
    (body) => body.bookings,
  )

export const getBooking = (token: string, id: string) =>
  request<{ booking: AdminBookingDetail }>(
    token,
    `${ENDPOINT.bookings}?id=${encodeURIComponent(id)}`,
  ).then((body) => body.booking)

export interface CancelResult {
  refundedCents: number
  refundShare: number
  emailSent: boolean
  problem: string | null
}

/** Only the reason is sent — the refund amount is derived on the server. */
export const cancelBooking = (token: string, bookingId: string, reason: CancellationReason) =>
  request<CancelResult>(token, ENDPOINT.bookings, {
    method: 'POST',
    body: JSON.stringify({ action: 'cancel', bookingId, reason }),
  })

export const rescheduleBooking = (
  token: string,
  bookingId: string,
  startsAt: string,
  locationId?: string,
) =>
  request<{ startsAt: string; emailSent: boolean }>(token, ENDPOINT.bookings, {
    method: 'POST',
    body: JSON.stringify({ action: 'reschedule', bookingId, startsAt, locationId }),
  })

export const listBlocks = (token: string) =>
  request<{ blocks: AdminAvailabilityBlock[] }>(token, ENDPOINT.availability).then(
    (body) => body.blocks,
  )

/**
 * A block as the owner enters it: a Sydney calendar date plus minutes past local
 * midnight. The server converts it with the configured booking time zone, so no
 * timezone-less timestamp is ever sent.
 */
export interface NewBlock {
  date: string
  fromMinutes: number
  toMinutes: number
  locationId: string | null
  reason: string
}

export const createBlock = (token: string, block: NewBlock) =>
  request<{ id: string }>(token, ENDPOINT.availability, {
    method: 'POST',
    body: JSON.stringify(block),
  })

export const deleteBlock = (token: string, id: string) =>
  request<Record<string, never>>(token, `${ENDPOINT.availability}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

/** Real slots for the reschedule picker, with the notice period waived. */
export const adminSlots = (token: string, sessionId: string, locationId: string, excludeId: string) =>
  request<{ days: AvailabilityDay[]; timeZone: string }>(
    token,
    `${ENDPOINT.availability}?slots=1&session=${encodeURIComponent(sessionId)}&location=${encodeURIComponent(locationId)}&exclude=${encodeURIComponent(excludeId)}`,
  )

export const getSettings = (token: string) =>
  request<{ settings: BookingSettings }>(token, ENDPOINT.settings).then((body) => body.settings)

export const saveSettings = (token: string, settings: BookingSettings) =>
  request<{ settings: BookingSettings }>(token, ENDPOINT.settings, {
    method: 'PUT',
    body: JSON.stringify(settings),
  }).then((body) => body.settings)
