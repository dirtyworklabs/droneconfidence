import type { TrainingLocation } from '@/types'

/**
 * Public location wording is deliberately careful: training areas are described
 * as "based around" a park and are always subject to conditions. No exact
 * meeting point is published, and no specific field is guaranteed.
 */
export const locations: TrainingLocation[] = [
  {
    id: 'south-sydney',
    label: 'SOUTH SYDNEY',
    area: 'Taren Point',
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
    enquiryValue: 'South Sydney — Taren Point',
  },
  {
    id: 'north-sydney',
    label: 'NORTH SYDNEY',
    area: 'North Ryde',
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
    enquiryValue: 'North Sydney — North Ryde',
  },
]

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
 * Experience levels. Used by the enquiry intake questions, and by the customer
 * details step of the booking flow when that is implemented.
 */
export const experienceOptions = [
  'I’ve never flown',
  'I’ve flown a few times',
  'I’m comfortable with basic flying',
  'I’m an experienced pilot wanting to improve specific skills',
]
