import { LOCATION_CATALOG } from '@shared/booking/catalog'
import { EXPERIENCE_LEVELS } from '@shared/booking/experience'
import type { LocationId, TrainingLocation } from '@/types'

/**
 * Public location wording is deliberately careful: training areas are described
 * as "based around" a park and are always subject to conditions. No exact
 * meeting point is published, and no specific field is guaranteed.
 *
 * The ids and the suburb each area is based around come from
 * `shared/booking/catalog.ts`, which the booking functions also read, so a
 * training area cannot exist on the website without existing in the booking
 * system too.
 */
type LocationCopy = Omit<TrainingLocation, 'id' | 'area' | 'enquiryValue'>

const locationCopy: Record<LocationId, LocationCopy> = {
  'south-sydney': {
    label: 'SOUTH SYDNEY',
    reference: 'based around Gwawley Park, Taren Point',
    description:
      'Our southern training area is based around Gwawley Park, Taren Point, providing a convenient option for customers coming from:',
    suburbs: [
      'St George',
      'Hurstville',
      'Rockdale',
      'Kogarah',
      'Sutherland Shire',
      'Cronulla',
      'and surrounding suburbs',
    ],
    ctaLabel: 'Book South Sydney',
    imageSlot: 'location-south',
  },
  'north-sydney': {
    label: 'NORTH SYDNEY',
    reference: 'based around North Ryde Common',
    description:
      'Our northern training area is based around North Ryde Common, providing a convenient option for customers coming from:',
    suburbs: [
      'Chatswood',
      'Ryde',
      'Macquarie Park',
      'Lane Cove',
      'Lower North Shore',
      'and surrounding suburbs',
    ],
    ctaLabel: 'Book North Sydney',
    imageSlot: 'location-north',
  },
}

export const locations: TrainingLocation[] = LOCATION_CATALOG.map((entry) => ({
  id: entry.id,
  area: entry.area,
  // The enquiry form and the booking snapshot use the same public label.
  enquiryValue: entry.name,
  ...locationCopy[entry.id],
}))

export const locationDisclaimer =
  'Exact training areas and meeting points are confirmed before each session and remain subject to suitable weather, airspace, venue access and local operating conditions.'

export const customLocationCopy =
  'Other Sydney locations may be possible by arrangement. Additional travel, venue or permit costs may apply to custom locations and will always be confirmed before you book.'

/**
 * The travel/venue/permit half of the custom-location message on its own, for
 * places that already state the "other locations may be possible" line.
 */
export const customLocationNote =
  'Additional travel, venue or permit costs may apply to custom locations and will always be confirmed before you book.'

/**
 * Experience levels for the enquiry form's free-text intake.
 *
 * The booking flow uses `EXPERIENCE_LEVELS` from `shared/booking/experience.ts`
 * instead, because a booking stores a stable code rather than a label — the
 * wording can be reworded later without rewriting stored bookings.
 */
export const experienceOptions = EXPERIENCE_LEVELS.map((level) => level.label)
