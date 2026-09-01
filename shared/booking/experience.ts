/**
 * Experience levels use a stable internal code, so the stored value keeps its
 * meaning even if the customer-facing wording is edited later.
 */

export const EXPERIENCE_LEVELS = [
  { code: 'new', label: 'New / first few flights' },
  { code: 'some', label: 'Some experience' },
  { code: 'confidence', label: 'Comfortable flying, want more confidence' },
  { code: 'creative', label: 'Experienced, focusing on photo/video' },
] as const

export type ExperienceCode = (typeof EXPERIENCE_LEVELS)[number]['code']

export const isExperienceCode = (value: string): value is ExperienceCode =>
  EXPERIENCE_LEVELS.some((level) => level.code === value)

export const experienceLabel = (code: string): string =>
  EXPERIENCE_LEVELS.find((level) => level.code === code)?.label ?? code
