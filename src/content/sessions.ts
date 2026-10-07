import { BOOKABLE_SESSION_CATALOG, DEFAULT_BOOKABLE_SESSION_ID } from '@shared/booking/catalog'
import type { BookableSessionId, Session } from '@/types'

/**
 * The marketing copy for the sessions the public can book — today, First Flight
 * only. Retired sessions remain in the catalogue for historical bookings, but
 * have no public copy here, so no page can render or link to one.
 *
 * The bookable facts — id, name, price and duration — are *not* here. They live
 * in `shared/booking/catalog.ts`, which the Netlify Functions also import, so
 * the price a customer is charged and the price shown on the website are the
 * same number by construction. This file supplies everything that is presentation
 * only, and `sessions` below merges the two.
 *
 * Session lengths are fixed. Copy must never suggest a session can run longer
 * or be extended — a longer session would be a separate bookable product.
 */
type SessionCopy = Omit<Session, 'id' | 'name' | 'price' | 'durationMinutes'>

const sessionCopy: Record<BookableSessionId, SessionCopy> = {
  'first-flight': {
    label: 'BEGINNER SESSION',
    tagline: 'First Flight',
    summary:
      'Perfect if you’ve recently bought a drone, have never flown before, or don’t quite feel confident taking it out by yourself.',
    intro: [
      'Perfect if you’ve recently bought a drone, have never flown before, or don’t quite feel confident taking it out by yourself.',
      'We’ll get your aircraft ready, make sure the important settings make sense and spend most of the session actually flying.',
    ],
    covers: [
      'Drone, controller and app setup',
      'Pre-flight checks',
      'Understanding the flight controls',
      'Take-off and landing',
      'Hovering and orientation',
      'Controlled forward, backward and sideways flight',
      'Turns and positioning',
      'Height and distance awareness',
      'Battery management',
      'Return-to-Home',
      'Basic location and airspace awareness',
      'The Australian drone rules relevant to everyday flying',
      'Your questions about your particular aircraft',
    ],
    bestFor: 'New drone owners and complete beginners.',
    bestForShort: 'Complete beginners',
    ctaLabel: 'Book First Flight',
    imageSlot: 'session-first-flight',
  },
}

/** Bookable catalogue facts plus marketing copy, in catalogue order. */
export const sessions: Session[] = BOOKABLE_SESSION_CATALOG.map((entry) => ({
  id: entry.id,
  name: entry.name,
  price: entry.priceDollars,
  durationMinutes: entry.durationMinutes,
  ...sessionCopy[entry.id],
}))

export const sessionById = (id: BookableSessionId): Session => {
  const match = sessions.find((session) => session.id === id)
  if (!match) throw new Error(`Unknown session: ${id}`)
  return match
}

export const formatPrice = (price: number): string => `$${price}`

export const formatDuration = (minutes: number): string => `${minutes} minutes`

/** The one lesson currently sold. `/book` carries it without asking. */
export const activeSession: Session = sessionById(DEFAULT_BOOKABLE_SESSION_ID)
