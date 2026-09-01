/**
 * Australia/Sydney date arithmetic.
 *
 * Every operational rule in the booking engine — bookable weekdays, the 08:00
 * to 15:00 window, the 7-day notice and the 3-calendar-month horizon — is
 * expressed in Sydney local time, which moves between AEST and AEDT. Offsets
 * are therefore never written down anywhere in this codebase: `TZDate` resolves
 * them from the IANA database for the specific instant involved.
 *
 * Calendar-day strings are plain `YYYY-MM-DD` and are manipulated through UTC
 * so the arithmetic can't be dragged across a DST boundary by accident.
 */

import { TZDate } from '@date-fns/tz'

export const SYDNEY = 'Australia/Sydney'

/** A `YYYY-MM-DD` calendar day, always interpreted in the booking timezone. */
export type DayIso = string

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const isDayIso = (value: unknown): value is DayIso =>
  typeof value === 'string' && DAY_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))

const partsOf = (day: DayIso): [number, number, number] => {
  const [year, month, date] = day.split('-').map(Number)
  return [year, month, date]
}

/**
 * The exact instant of a wall-clock time on a Sydney calendar day.
 *
 * Built from calendar fields rather than by adding milliseconds to midnight, so
 * a DST transition can never shift the resulting time of day.
 */
export const instantAt = (day: DayIso, minutesFromMidnight: number, timeZone = SYDNEY): Date => {
  const [year, month, date] = partsOf(day)
  const zoned = new TZDate(
    year,
    month - 1,
    date,
    Math.floor(minutesFromMidnight / 60),
    minutesFromMidnight % 60,
    0,
    0,
    timeZone,
  )
  return new Date(zoned.getTime())
}

/** The calendar day an instant falls on, in the booking timezone. */
export const dayOf = (instant: Date, timeZone = SYDNEY): DayIso => {
  const zoned = new TZDate(instant.getTime(), timeZone)
  const month = String(zoned.getMonth() + 1).padStart(2, '0')
  const date = String(zoned.getDate()).padStart(2, '0')
  return `${zoned.getFullYear()}-${month}-${date}`
}

/** Minutes past local midnight for an instant, in the booking timezone. */
export const minutesOf = (instant: Date, timeZone = SYDNEY): number => {
  const zoned = new TZDate(instant.getTime(), timeZone)
  return zoned.getHours() * 60 + zoned.getMinutes()
}

/** ISO weekday: Monday = 1 … Sunday = 7. Derived from the calendar day only. */
export const isoDayOfWeek = (day: DayIso): number => {
  const sunday0 = new Date(`${day}T00:00:00Z`).getUTCDay()
  return sunday0 === 0 ? 7 : sunday0
}

export const addDays = (day: DayIso, count: number): DayIso => {
  const value = new Date(`${day}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}

/**
 * Calendar-month addition, clamped to the end of the target month, so the
 * booking horizon is genuinely "three months ahead" rather than a fixed 90 days.
 */
export const addCalendarMonths = (day: DayIso, months: number): DayIso => {
  const [year, month, date] = partsOf(day)
  const target = new Date(Date.UTC(year, month - 1 + months, 1))
  const lastOfMonth = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(date, lastOfMonth))
  return target.toISOString().slice(0, 10)
}

export const compareDays = (left: DayIso, right: DayIso): number =>
  left < right ? -1 : left > right ? 1 : 0

/** `08:00` style label for a minutes-past-midnight value. */
export const minutesToClock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Parses `HH:MM`, returning null rather than throwing on rubbish input. */
export const clockToMinutes = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}
