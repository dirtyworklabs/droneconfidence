import { SESSION_CATALOG } from '@shared/booking/catalog'
import type { Session, SessionId } from '@/types'

/**
 * The marketing copy for the three sessions.
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

const sessionCopy: Record<SessionId, SessionCopy> = {
  'first-flight': {
    label: 'FIRST FLIGHT',
    tagline: 'Start properly.',
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
  'fly-with-confidence': {
    label: 'FLY WITH CONFIDENCE',
    tagline: 'Turn basic flying into confident flying.',
    summary:
      'You can already get your drone in the air — but there are still situations where you hesitate, lose orientation or aren’t quite sure what the aircraft is going to do.',
    intro: [
      'You can already get your drone in the air — but there are still situations where you hesitate, lose orientation or aren’t quite sure what the aircraft is going to do.',
      'This session builds control, awareness and confidence through practical flying.',
      'Rather than following a rigid syllabus, we’ll identify the areas you want to improve and work directly on them.',
    ],
    covers: [
      'Smooth, controlled flying',
      'Better orientation',
      'Flying towards and away from yourself',
      'Coordinated turns',
      'Circles and repeatable flight paths',
      'More precise take-offs and landings',
      'Height and distance judgement',
      'Obstacle awareness',
      'Wind awareness',
      'Battery planning',
      'Return-to-Home behaviour and settings',
      'Intelligent flight features',
      'Building a reliable pre-flight routine',
      'What to do when something doesn’t look right',
    ],
    bestFor:
      'Beginner and developing pilots who want to become more capable and relaxed in the air.',
    bestForShort: 'Developing pilots',
    ctaLabel: 'Book Fly With Confidence',
    imageSlot: 'session-fly-with-confidence',
  },
  'photo-video': {
    label: 'PHOTO & VIDEO',
    tagline: 'Stop just flying. Start creating.',
    summary:
      'Once you’re comfortable controlling the aircraft, the next challenge is making the footage actually look good.',
    intro: [
      'Once you’re comfortable controlling the aircraft, the next challenge is making the footage actually look good.',
      'This session combines practical drone flying with professional photography and image-making experience.',
      'We’ll work on both your camera settings and the way you move the aircraft.',
    ],
    covers: [
      'Camera setup',
      'Exposure',
      'ISO and shutter speed',
      'White balance',
      'Photo settings',
      'Resolution and frame rates',
      'ND filters where appropriate',
      'Gimbal settings and movement',
      'Smooth cinematic flying',
      'Push-ins and pull-outs',
      'Reveal shots',
      'Orbits',
      'Parallel and tracking movements',
      'Creating foreground and depth',
      'Planning a shot before take-off',
      'Intelligent flight modes where appropriate',
      'Reviewing your footage and identifying improvements',
    ],
    bestFor:
      'Drone owners, photographers, content creators and small businesses wanting better aerial imagery.',
    bestForShort: 'Aerial photo/video',
    ctaLabel: 'Book Photo & Video',
    imageSlot: 'session-photo-video',
  },
}

/** Catalogue facts plus marketing copy, in catalogue order. */
export const sessions: Session[] = SESSION_CATALOG.map((entry) => ({
  id: entry.id,
  name: entry.name,
  price: entry.priceDollars,
  durationMinutes: entry.durationMinutes,
  ...sessionCopy[entry.id],
}))

export const sessionById = (id: SessionId): Session => {
  const match = sessions.find((session) => session.id === id)
  if (!match) throw new Error(`Unknown session: ${id}`)
  return match
}

export const formatPrice = (price: number): string => `$${price}`

export const formatDuration = (minutes: number): string => `${minutes} minutes`

/** Lowest published price, used in hero and meta copy. */
export const lowestSessionPrice = Math.min(...sessions.map((session) => session.price))

/** Options offered by the enquiry form, in the order the spec defines. */
export const preferredSessionOptions = [
  ...sessions.map((session) => session.name),
  'Not sure yet',
]
