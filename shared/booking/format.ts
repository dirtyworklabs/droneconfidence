/**
 * Human-readable dates and money, in Sydney time.
 *
 * Used by the booking UI, the confirmation page, the admin surface and the
 * transactional emails, so a customer sees the same wording everywhere. `Intl`
 * is available in the browser and in the functions runtime, so no dependency and
 * no duplicated formatting is needed.
 */

import { SYDNEY } from './time'

const formatter = (options: Intl.DateTimeFormatOptions, timeZone: string): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('en-AU', { ...options, timeZone })

/** "Tuesday 14 October 2026" */
export const formatLongDate = (instant: Date, timeZone = SYDNEY): string =>
  formatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, timeZone).format(instant)

/** "Tue 14 Oct" */
export const formatShortDate = (instant: Date, timeZone = SYDNEY): string =>
  formatter({ weekday: 'short', day: 'numeric', month: 'short' }, timeZone).format(instant)

/** "9:30 am" */
export const formatTime = (instant: Date, timeZone = SYDNEY): string =>
  formatter({ hour: 'numeric', minute: '2-digit', hour12: true }, timeZone)
    .format(instant)
    .replace(/ /g, ' ')
    .toLowerCase()

/** "9:30 am – 11:00 am" */
export const formatTimeRange = (startsAt: Date, endsAt: Date, timeZone = SYDNEY): string =>
  `${formatTime(startsAt, timeZone)} – ${formatTime(endsAt, timeZone)}`

/** "Tuesday 14 October 2026, 9:30 am" */
export const formatDateTime = (instant: Date, timeZone = SYDNEY): string =>
  `${formatLongDate(instant, timeZone)}, ${formatTime(instant, timeZone)}`

/** "$239.00" from cents. */
export const formatMoneyCents = (cents: number, currency = 'AUD'): string =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  )

/** Minutes remaining, rounded up, for the checkout-hold countdown. */
export const minutesUntil = (target: Date, now: Date): number =>
  Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000))

/** "Thu" — the compact weekday on an available-date button. */
export const formatWeekday = (instant: Date, timeZone = SYDNEY): string =>
  formatter({ weekday: 'short' }, timeZone).format(instant)

/** "10 Sep" — the compact date on an available-date button. */
export const formatDayAndMonth = (instant: Date, timeZone = SYDNEY): string =>
  formatter({ day: 'numeric', month: 'short' }, timeZone).format(instant)
