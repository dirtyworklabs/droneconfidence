/**
 * Grouping real availability into browsable months.
 *
 * Step 3 shows one month at a time, and this module decides what that means.
 * It is deliberately pure and deliberately ignorant: the only input is the day
 * list the availability endpoint returned, and the only months that exist are
 * the ones present in it. There is no calendar arithmetic, no booking horizon,
 * no weekday rule and no notice period here — those live on the server, and
 * duplicating any of them in the browser would create a second answer to the
 * question of what is bookable.
 *
 * `AvailabilityDay.date` is already a Sydney `YYYY-MM-DD`, so a month key is a
 * string slice rather than a timezone conversion.
 */

import type { AvailabilityDay } from './types'

export interface AvailabilityMonth {
  /** Sydney calendar month, `YYYY-MM`. */
  key: string
  /** The bookable days in that month, in the order the server returned them. */
  days: AvailabilityDay[]
}

/**
 * Which month is on screen, and whose times are listed.
 *
 * `activeDate` is a view concern only. The booking itself is the selected start
 * time, which lives in the URL — browsing months never changes it.
 */
export interface MonthView {
  monthKey: string
  activeDate: string
}

/** `'2026-09-10'` → `'2026-09'`. */
export const monthKeyOf = (date: string): string => date.slice(0, 7)

/**
 * The months that genuinely have times, in server order.
 *
 * A day with no slots is dropped rather than shown as an unavailable square:
 * this is an available-date selector, not a date picker with the impossible
 * days greyed out.
 */
export const groupDaysByMonth = (days: AvailabilityDay[]): AvailabilityMonth[] => {
  const months: AvailabilityMonth[] = []

  for (const day of days) {
    if (day.slots.length === 0) continue
    const key = monthKeyOf(day.date)
    const existing = months.find((month) => month.key === key)
    if (existing) existing.days.push(day)
    else months.push({ key, days: [day] })
  }

  return months
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-AU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * `'2026-09'` → `'September 2026'`.
 *
 * Formatted at UTC midday from the key's own numbers, so the label can never
 * drift a month either side of the key it came from.
 */
export const formatMonthKey = (key: string): string => {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return key
  return MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1, 12)))
}

export const findMonth = (
  months: AvailabilityMonth[],
  key: string,
): AvailabilityMonth | null => months.find((month) => month.key === key) ?? null

/**
 * The next or previous month that actually has availability, or null at the
 * bounds — which is what disables the arrow.
 *
 * Stepping moves through the months present in the data, so a barren month is
 * skipped rather than shown empty, and there is nothing beyond the last one to
 * navigate to.
 */
export const stepMonthKey = (
  months: AvailabilityMonth[],
  key: string,
  step: -1 | 1,
): string | null => {
  const index = months.findIndex((month) => month.key === key)
  if (index === -1) return months[0]?.key ?? null
  return months[index + step]?.key ?? null
}

/**
 * Which day's times to list when a month comes into view.
 *
 * The selected day if it is in this month — so returning to it shows the
 * booking as it stands — and otherwise the month's first available day, which
 * keeps a time list on screen without selecting anything.
 */
export const dateForMonth = (
  months: AvailabilityMonth[],
  key: string,
  selectedDate: string | null,
): string => {
  const month = findMonth(months, key)
  if (!month) return ''
  if (selectedDate !== null && month.days.some((day) => day.date === selectedDate)) {
    return selectedDate
  }
  return month.days[0]?.date ?? ''
}

/** Opens on the selected booking's month, or the first month with times. */
export const initialMonthView = (
  months: AvailabilityMonth[],
  selectedDate: string | null,
): MonthView => {
  const monthKey =
    selectedDate !== null && findMonth(months, monthKeyOf(selectedDate)) !== null
      ? monthKeyOf(selectedDate)
      : months[0]?.key ?? ''

  return { monthKey, activeDate: dateForMonth(months, monthKey, selectedDate) }
}

/**
 * Reconciles the view against a refreshed availability list.
 *
 * The rule is: leave the customer where they are whenever that is still a real
 * place to be. A month that still exists stays on screen even if the day they
 * were looking at has gone, and only a month that has disappeared entirely
 * moves the view — to the selected booking's month if there is one, otherwise
 * to the first month with times.
 *
 * Returns the same object when nothing needs to change, so this is safe to call
 * from an effect.
 */
export const reconcileMonthView = (
  months: AvailabilityMonth[],
  selectedDate: string | null,
  current: MonthView,
): MonthView => {
  const monthKey =
    findMonth(months, current.monthKey) !== null
      ? current.monthKey
      : initialMonthView(months, selectedDate).monthKey

  const month = findMonth(months, monthKey)
  const activeDate =
    month !== null && month.days.some((day) => day.date === current.activeDate)
      ? current.activeDate
      : dateForMonth(months, monthKey, selectedDate)

  if (monthKey === current.monthKey && activeDate === current.activeDate) return current
  return { monthKey, activeDate }
}

/** The day whose times are listed, or null while a month has none. */
export const activeDayOf = (
  months: AvailabilityMonth[],
  view: MonthView,
): AvailabilityDay | null =>
  findMonth(months, view.monthKey)?.days.find((day) => day.date === view.activeDate) ?? null
