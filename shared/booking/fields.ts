/**
 * Field validation shared by the browser and the server.
 *
 * The booking form and the Netlify Function that creates a hold run the *same*
 * rules from this module, so a request that bypasses the UI is judged by
 * exactly the same standard as one that doesn't. Prices and durations are
 * absent on purpose: those are resolved server-side from the catalogue and are
 * never part of a submitted payload.
 */

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export const MAX = {
  name: 80,
  email: 120,
  mobile: 30,
  shortText: 120,
  droneModel: 100,
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
  | 'experienceCode'
  | 'helpWith'
  | 'notes'
  | 'policyAccepted'

export const BOOKING_FIELD_ORDER: BookingDetailField[] = [
  'customerName',
  'email',
  'mobile',
  'droneModel',
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
  experienceCode: '',
  helpWith: '',
  notes: '',
  policyAccepted: false,
}

export const validateBookingDetails = (
  values: BookingDetailValues,
  isExperienceCode: (code: string) => boolean,
): FieldErrors<BookingDetailField> => {
  const errors: FieldErrors<BookingDetailField> = {
    customerName: requireText(values.customerName, 'Full name', MAX.name),
    email: requireEmail(values.email),
    mobile: requireMobile(values.mobile),
    droneModel: requireText(values.droneModel, 'Drone make and model', MAX.droneModel),
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
