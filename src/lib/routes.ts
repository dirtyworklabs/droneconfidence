/** Shared route helpers so query-driven entry points stay consistent. */

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

/** Contact page pre-set to a custom-location request. */
export const CUSTOM_LOCATION_QUERY = '/contact?reason=custom-location'

/** Contact page pre-set to a "which session" question. */
export const ASK_A_QUESTION_QUERY = '/contact?reason=which-session'
