/**
 * Field validation shared by the browser and the server.
 *
 * The booking form and the Netlify Function that creates a hold run the *same*
 * rules from this module, so a request that bypasses the UI is judged by
 * exactly the same standard as one that doesn't. Prices and durations are
 * absent on purpose: those are resolved server-side from the catalogue and are
 * never part of a submitted payload.
 */

import { findAircraft, isCompatiblePair, isKnownController } from './hardware'

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export const MAX = {
  name: 80,
  email: 120,
  mobile: 30,
  shortText: 120,
  droneModel: 100,
  controllerModel: 100,
  helpWith: 600,
  message: 2000,
  notes: 1500,
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isBlank = (value: string): boolean => value.trim().length === 0

export const requireText = (value: string, label: string, max: number): string | undefined => {
  if (isBlank(value)) return `${label} is required.`
  if (value.trim().length > max) return `${label} must be ${max} characters or fewer.`
  return undefined
}

export const requireEmail = (value: string): string | undefined => {
  if (isBlank(value)) return 'Email is required.'
  if (value.trim().length > MAX.email) return `Email must be ${MAX.email} characters or fewer.`
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter an email address we can reply to.'
  return undefined
}

export const requireMobile = (value: string): string | undefined => {
  if (isBlank(value)) return 'Mobile number is required.'
  const digits = value.replace(/[^\d]/g, '')
  if (digits.length < 8) return 'Enter a mobile number we can reach you on.'
  if (value.trim().length > MAX.mobile) return 'That mobile number looks too long.'
  return undefined
}

export const requireChoice = (value: string, label: string): string | undefined =>
  isBlank(value) ? `Please choose ${label}.` : undefined

export const optionalLength = (value: string, label: string, max: number): string | undefined =>
  value.trim().length > max ? `${label} must be ${max} characters or fewer.` : undefined

export const firstErrorKey = <T extends string>(errors: FieldErrors<T>, order: T[]): T | undefined =>
  order.find((key) => Boolean(errors[key]))

/** The fields step 4 collects, in the order they appear and are announced. */
export type BookingDetailField =
  | 'customerName'
  | 'email'
  | 'mobile'
  | 'droneModel'
  | 'controllerModel'
  | 'experienceCode'
  | 'helpWith'
  | 'notes'
  | 'policyAccepted'

export const BOOKING_FIELD_ORDER: BookingDetailField[] = [
  'customerName',
  'email',
  'mobile',
  'droneModel',
  'controllerModel',
  'experienceCode',
  'helpWith',
  'notes',
  'policyAccepted',
]

export interface BookingDetailValues {
  customerName: string
  email: string
  mobile: string
  droneModel: string
  controllerModel: string
  experienceCode: string
  helpWith: string
  notes: string
  policyAccepted: boolean
}

export const emptyBookingDetails: BookingDetailValues = {
  customerName: '',
  email: '',
  mobile: '',
  droneModel: '',
  controllerModel: '',
  experienceCode: '',
  helpWith: '',
  notes: '',
  policyAccepted: false,
}

/**
 * The controller half of the equipment pair.
 *
 * Required first, then cross-checked against the aircraft. Compatibility is
 * only asserted when *both* sides are models the catalogue knows: an
 * "Other / not listed" aircraft, or a controller the customer described
 * themselves, has no listed pairing to judge it against, so it is accepted on
 * its own terms rather than guessed at.
 */
export const hardwarePairing = (
  droneModel: string,
  controllerModel: string,
): string | undefined => {
  const required = requireText(controllerModel, 'Controller / RC model', MAX.controllerModel)
  if (required) return required

  const controller = controllerModel.trim()
  const aircraft = findAircraft(droneModel.trim())
  if (!aircraft || !isKnownController(controller)) return undefined

  return isCompatiblePair(aircraft.name, controller)
    ? undefined
    : `${controller} isn’t compatible with the ${aircraft.name}. Please choose one of the listed controllers.`
}

export const validateBookingDetails = (
  values: BookingDetailValues,
  isExperienceCode: (code: string) => boolean,
): FieldErrors<BookingDetailField> => {
  const errors: FieldErrors<BookingDetailField> = {
    customerName: requireText(values.customerName, 'Full name', MAX.name),
    email: requireEmail(values.email),
    mobile: requireMobile(values.mobile),
    droneModel: requireText(values.droneModel, 'Aircraft make and model', MAX.droneModel),
    controllerModel: hardwarePairing(values.droneModel, values.controllerModel),
    experienceCode: isBlank(values.experienceCode)
      ? requireChoice(values.experienceCode, 'your experience level')
      : isExperienceCode(values.experienceCode.trim())
        ? undefined
        : 'Please choose your experience level.',
    helpWith: requireText(values.helpWith, 'What you’d like help with', MAX.helpWith),
    notes: optionalLength(values.notes, 'Additional notes', MAX.notes),
    policyAccepted: values.policyAccepted
      ? undefined
      : 'Please confirm you’ve read the Booking & Cancellation Policy.',
  }

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as FieldErrors<BookingDetailField>
}
