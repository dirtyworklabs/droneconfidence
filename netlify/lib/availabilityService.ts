/**
 * Availability, assembled from the database.
 *
 * The rules live in `shared/booking/availability.ts` as a pure function; this
 * module's only job is to fetch the settings, the active occupancy and the
 * manual blocks for the right window and hand them over. Nothing is invented
 * and nothing is cached.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildAvailability, noticeFloor } from '../../shared/booking/availability'
import type { BookingSettings } from '../../shared/booking/rules'
import { addCalendarMonths, addDays, dayOf, instantAt } from '../../shared/booking/time'
import type { AvailabilityDay } from '../../shared/booking/types'
import { publicBookingAllowed } from './bookingAccess'
import { loadBlocks, loadOccupancy, loadSettings } from './store'

export interface AvailabilityLookup {
  sessionDurationMinutes: number
  locationId: string
  now?: Date
  /** Admin reschedule only: waive the customer notice period. */
  waiveNotice?: boolean
  /** Admin reschedule only: don't let a booking block itself. */
  excludeBookingId?: string
}

export type AvailabilityOutcome =
  | { status: 'ok'; days: AvailabilityDay[]; settings: BookingSettings }
  | { status: 'disabled' }
  | { status: 'unconfigured' }

export const lookupAvailability = async (
  client: SupabaseClient,
  input: AvailabilityLookup,
): Promise<AvailabilityOutcome> => {
  const settings = await loadSettings(client)
  // No settings row means the migration hasn't been applied. The site keeps
  // working; booking simply reports itself unavailable.
  if (!settings) return { status: 'unconfigured' }
  // A customer lookup needs public booking to be open — the database switch, or
  // the narrow local test override in `bookingAccess`. An admin lookup already
  // waives the notice period and is authorised upstream, so it is unaffected.
  if (!input.waiveNotice && !publicBookingAllowed(settings.bookingEnabled)) {
    return { status: 'disabled' }
  }

  const now = input.now ?? new Date()
  const floor = input.waiveNotice ? now : noticeFloor(settings, now)
  const lastDay = addCalendarMonths(dayOf(now, settings.timeZone), settings.maxMonthsAhead)
  // One day of slack at each end so a booking that starts just outside the
  // window but reaches into it is still taken into account.
  const windowFrom = new Date(floor.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const windowTo = instantAt(addDays(lastDay, 1), 0, settings.timeZone).toISOString()

  const [occupied, blocked] = await Promise.all([
    loadOccupancy(client, windowFrom, windowTo),
    loadBlocks(client, windowFrom, windowTo),
  ])

  const days = buildAvailability({
    settings,
    durationMinutes: input.sessionDurationMinutes,
    locationId: input.locationId,
    now,
    occupied,
    blocked,
    waiveNotice: input.waiveNotice,
    excludeBookingId: input.excludeBookingId,
  })

  return { status: 'ok', days, settings }
}
