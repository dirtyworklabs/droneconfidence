export type FieldErrors<T extends string> = Partial<Record<T, string>>

export const MAX = {
  name: 80,
  email: 120,
  mobile: 30,
  shortText: 120,
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
