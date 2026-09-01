export type SessionId = 'first-flight' | 'fly-with-confidence' | 'photo-video'

export interface Session {
  id: SessionId
  /** Display name, e.g. "First Flight". */
  name: string
  /** Uppercase eyebrow label used above headings. */
  label: string
  /** Price in AUD, whole dollars. Single source of truth. */
  price: number
  /** Fixed session length in minutes. Sessions are not extendable. */
  durationMinutes: number
  /** Short headline promise, e.g. "Start properly." */
  tagline: string
  /** One-line summary used in compact cards and comparison rows. */
  summary: string
  /** Full introduction paragraphs shown on the sessions page. */
  intro: string[]
  /** "We can cover" list. */
  covers: string[]
  /** "Best for" line. */
  bestFor: string
  /** Very short audience label for the comparison table. */
  bestForShort: string
  /** Booking CTA label, e.g. "Book First Flight — $179". */
  ctaLabel: string
  /** Slot key for the session's intended photograph. */
  imageSlot: ImageSlotKey
}

export type ImageSlotKey =
  | 'hero'
  | 'session-first-flight'
  | 'session-fly-with-confidence'
  | 'session-photo-video'
  | 'location-south'
  | 'location-north'
  | 'about-tom'

export type LocationId = 'south-sydney' | 'north-sydney'

export interface TrainingLocation {
  id: LocationId
  /** Region label, e.g. "SOUTH SYDNEY". */
  label: string
  /** Suburb, e.g. "Taren Point". */
  area: string
  /** Careful public wording, e.g. "based around Gwawley Park, Taren Point". */
  reference: string
  /** Intro sentence for the area. */
  description: string
  /** Suburbs the area suits. */
  suburbs: string[]
  ctaLabel: string
  imageSlot: ImageSlotKey
  /** Value submitted by enquiry forms for this area. */
  enquiryValue: string
}

export interface Faq {
  id: string
  question: string
  answer: string[]
  /** Show in the homepage FAQ preview. */
  featured?: boolean
  /** Optional inline link rendered under the answer. */
  link?: { label: string; to: string }
}

export interface Testimonial {
  quote: string
  firstName: string
  suburb?: string
  session: string
  trainingArea?: string
}

export type BookingDisplayMode = 'disabled' | 'external' | 'embed'

export type BookingTarget =
  | { kind: 'internal'; href: string; external: false }
  | { kind: 'external'; href: string; external: true; newTab: boolean }
