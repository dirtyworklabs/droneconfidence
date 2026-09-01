/** Shared route helpers so query-driven entry points stay consistent. */

import type { LocationId, SessionId } from '@/types'

export const ROUTES = {
  home: '/',
  sessions: '/sessions',
  locations: '/locations',
  about: '/about',
  faq: '/faq',
  book: '/book',
  contact: '/contact',
  privacy: '/privacy',
  bookingPolicy: '/booking-policy',
} as const

/**
 * Query parameters understood by /book. They carry a session and/or training
 * area only — never a name, email, phone number, drone model or note.
 */
export const BOOKING_PARAM = {
  session: 'session',
  location: 'location',
} as const

export interface BookingLinkOptions {
  session?: SessionId
  location?: LocationId
}

/**
 * The single place a /book link is built.
 *
 * /book is the permanent public booking entry point, so marketing CTAs never
 * need to know which provider or backend sits behind it — they only preselect
 * context. Values are ids from the session and location content, and /book
 * validates them again on arrival.
 */
export const bookingPath = ({ session, location }: BookingLinkOptions = {}): string => {
  const params = new URLSearchParams()
  if (session) params.set(BOOKING_PARAM.session, session)
  if (location) params.set(BOOKING_PARAM.location, location)
  const query = params.toString()
  return query.length > 0 ? `${ROUTES.book}?${query}` : ROUTES.book
}

/** Contact page pre-set to a custom-location request. */
export const CUSTOM_LOCATION_QUERY = '/contact?reason=custom-location'

/** Contact page pre-set to a "which session" question. */
export const ASK_A_QUESTION_QUERY = '/contact?reason=which-session'

/** Contact page pre-set to a booking question. */
export const BOOKING_QUESTION_QUERY = '/contact?reason=booking'
