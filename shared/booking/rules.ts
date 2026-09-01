/**
 * Operational booking rules.
 *
 * The live values are rows in Supabase (`booking_settings`) so the owner can
 * change them from /admin without a deploy. What lives here is the shape of
 * that configuration, the seed defaults the migration writes, and the limits
 * that are not the owner's to relax.
 */

import { SYDNEY } from './time'

export interface BookingSettings {
  /** Master switch for public booking. Seeded off, on purpose. */
  bookingEnabled: boolean
  timeZone: string
  /** Bookable ISO weekdays: Monday = 1 … Sunday = 7. */
  weekdays: number[]
  /** Operating window, minutes past local midnight. */
  dayStartMinutes: number
  dayEndMinutes: number
  /** Minimum notice before the earliest bookable day. */
  noticeDays: number
  /** Booking horizon in calendar months, not a fixed number of days. */
  maxMonthsAhead: number
  slotIncrementMinutes: number
  /** Required gap between two lessons. Not required before the first one. */
  bufferMinutes: number
  /** Unpaid checkout hold. Stripe will not accept less than 30 minutes. */
  checkoutHoldMinutes: number
  /**
   * Grace applied to an expired hold before its slot is released, so a payment
   * that completes a moment after the nominal expiry can still be honoured.
   */
  holdGraceMinutes: number
}

/** Stripe Checkout rejects `expires_at` closer than 30 minutes. */
export const STRIPE_MIN_CHECKOUT_HOLD_MINUTES = 30

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  bookingEnabled: false,
  timeZone: SYDNEY,
  weekdays: [2, 3, 4],
  dayStartMinutes: 8 * 60,
  dayEndMinutes: 15 * 60,
  noticeDays: 7,
  maxMonthsAhead: 3,
  slotIncrementMinutes: 30,
  bufferMinutes: 30,
  checkoutHoldMinutes: 30,
  holdGraceMinutes: 3,
}

export const SETTINGS_LIMITS = {
  weekdays: { min: 1, max: 7 },
  dayMinutes: { min: 0, max: 24 * 60 },
  noticeDays: { min: 0, max: 90 },
  maxMonthsAhead: { min: 1, max: 12 },
  slotIncrementMinutes: [15, 20, 30, 60],
  bufferMinutes: { min: 0, max: 180 },
  checkoutHoldMinutes: { min: STRIPE_MIN_CHECKOUT_HOLD_MINUTES, max: 24 * 60 },
  holdGraceMinutes: { min: 0, max: 30 },
} as const

/**
 * Validates an owner-supplied settings patch. Returns the reasons it was
 * rejected rather than silently coercing, so a bad edit can't quietly change
 * what the public engine offers.
 */
export const validateSettings = (settings: BookingSettings): string[] => {
  const problems: string[] = []

  if (settings.weekdays.length === 0) problems.push('Choose at least one bookable weekday.')
  if (settings.weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    problems.push('Weekdays must be between Monday (1) and Sunday (7).')
  }
  if (new Set(settings.weekdays).size !== settings.weekdays.length) {
    problems.push('Each weekday can only be listed once.')
  }
  if (settings.dayEndMinutes <= settings.dayStartMinutes) {
    problems.push('The operating window must end after it starts.')
  }
  if (settings.dayStartMinutes < 0 || settings.dayEndMinutes > 24 * 60) {
    problems.push('The operating window must fall inside a single day.')
  }
  if (settings.noticeDays < SETTINGS_LIMITS.noticeDays.min || settings.noticeDays > SETTINGS_LIMITS.noticeDays.max) {
    problems.push('Minimum notice must be between 0 and 90 days.')
  }
  if (
    settings.maxMonthsAhead < SETTINGS_LIMITS.maxMonthsAhead.min ||
    settings.maxMonthsAhead > SETTINGS_LIMITS.maxMonthsAhead.max
  ) {
    problems.push('The booking horizon must be between 1 and 12 months.')
  }
  if (!(SETTINGS_LIMITS.slotIncrementMinutes as readonly number[]).includes(settings.slotIncrementMinutes)) {
    problems.push('Slot increment must be 15, 20, 30 or 60 minutes.')
  }
  if (settings.bufferMinutes < 0 || settings.bufferMinutes > SETTINGS_LIMITS.bufferMinutes.max) {
    problems.push('The buffer between lessons must be between 0 and 180 minutes.')
  }
  if (settings.checkoutHoldMinutes < STRIPE_MIN_CHECKOUT_HOLD_MINUTES) {
    problems.push(`The checkout hold cannot be shorter than ${STRIPE_MIN_CHECKOUT_HOLD_MINUTES} minutes.`)
  }
  if (settings.checkoutHoldMinutes > SETTINGS_LIMITS.checkoutHoldMinutes.max) {
    problems.push('The checkout hold cannot be longer than 24 hours.')
  }
  if (settings.holdGraceMinutes < 0 || settings.holdGraceMinutes > SETTINGS_LIMITS.holdGraceMinutes.max) {
    problems.push('The hold grace period must be between 0 and 30 minutes.')
  }

  return problems
}
