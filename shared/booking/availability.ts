/**
 * The availability engine.
 *
 * A pure function of the operational settings, the bookings and holds that are
 * genuinely active, and the owner's manual blocks. It invents nothing: if the
 * inputs say a day is empty, the day is simply absent from the result.
 *
 * The same function serves the public endpoint and the admin reschedule picker;
 * the only difference is that admin lookups may waive the customer notice
 * period and exclude the booking being moved from the occupancy it collides
 * with.
 */

import type { BookingSettings } from './rules'
import type { AvailabilityDay, AvailabilitySlot } from './types'
import {
  type DayIso,
  addCalendarMonths,
  addDays,
  compareDays,
  dayOf,
  instantAt,
  isoDayOfWeek,
  minutesOf,
} from './time'

/** An active booking or unpaid hold, as far as availability is concerned. */
export interface OccupiedRange {
  id: string
  locationId: string
  startsAt: Date
  /** End of the lesson plus the buffer that must follow it. */
  occupiedUntil: Date
  /** Set for unpaid holds only. A hold past its grace no longer blocks. */
  holdExpiresAt: Date | null
}

/** A manual block. `locationId === null` means every training area. */
export interface BlockedRange {
  startsAt: Date
  endsAt: Date
  locationId: string | null
}

export interface AvailabilityInput {
  settings: BookingSettings
  durationMinutes: number
  locationId: string
  now: Date
  occupied: OccupiedRange[]
  blocked: BlockedRange[]
  /** Admin reschedule: waive the customer notice period. */
  waiveNotice?: boolean
  /** Admin reschedule: the booking being moved must not block itself. */
  excludeBookingId?: string
}

const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean =>
  aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()

/** Drops holds that have passed their expiry plus grace, and the excluded booking. */
export const activeOccupancy = (input: AvailabilityInput): OccupiedRange[] => {
  const graceMs = input.settings.holdGraceMinutes * 60_000
  return input.occupied.filter((entry) => {
    if (input.excludeBookingId && entry.id === input.excludeBookingId) return false
    if (entry.holdExpiresAt === null) return true
    return entry.holdExpiresAt.getTime() + graceMs > input.now.getTime()
  })
}

/**
 * The training area a Sydney calendar day is locked to, or null when the day is
 * still free. Once anything active exists on a day, every other booking that day
 * must be in the same area — the instructor cannot be in two places.
 */
export const dayLocationLock = (
  occupancy: OccupiedRange[],
  day: DayIso,
  timeZone: string,
): string | null => {
  const match = occupancy.find((entry) => dayOf(entry.startsAt, timeZone) === day)
  return match ? match.locationId : null
}

/**
 * The earliest instant a lesson may start: the current Sydney wall-clock time,
 * moved forward by the notice period in calendar days. Expressed that way so a
 * DST transition inside the notice window doesn't shift the boundary by an hour.
 */
export const noticeFloor = (settings: BookingSettings, now: Date): Date =>
  instantAt(
    addDays(dayOf(now, settings.timeZone), settings.noticeDays),
    minutesOf(now, settings.timeZone),
    settings.timeZone,
  )

export const buildAvailability = (input: AvailabilityInput): AvailabilityDay[] => {
  const { settings, durationMinutes } = input
  const timeZone = settings.timeZone

  const floor = input.waiveNotice ? input.now : noticeFloor(settings, input.now)
  const firstDay = dayOf(floor, timeZone)
  const lastDay = addCalendarMonths(dayOf(input.now, timeZone), settings.maxMonthsAhead)
  if (compareDays(firstDay, lastDay) > 0) return []

  const occupancy = activeOccupancy(input)
  const days: AvailabilityDay[] = []

  for (let day = firstDay; compareDays(day, lastDay) <= 0; day = addDays(day, 1)) {
    if (!settings.weekdays.includes(isoDayOfWeek(day))) continue

    // Same-day location lock: a day already committed to the other training
    // area offers nothing at all, rather than slots that would be rejected.
    const lock = dayLocationLock(occupancy, day, timeZone)
    if (lock !== null && lock !== input.locationId) continue

    const slots: AvailabilitySlot[] = []
    const latestStart = settings.dayEndMinutes - durationMinutes

    for (
      let minutes = settings.dayStartMinutes;
      minutes <= latestStart;
      minutes += settings.slotIncrementMinutes
    ) {
      const startsAt = instantAt(day, minutes, timeZone)
      if (startsAt.getTime() < floor.getTime()) continue

      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000)
      // The buffer travels with the candidate as well as with what is already
      // booked, so a required gap is enforced on both sides of a lesson.
      const occupiedUntil = new Date(endsAt.getTime() + settings.bufferMinutes * 60_000)

      const clashesWithBooking = occupancy.some((entry) =>
        overlaps(startsAt, occupiedUntil, entry.startsAt, entry.occupiedUntil),
      )
      if (clashesWithBooking) continue

      const clashesWithBlock = input.blocked.some(
        (block) =>
          (block.locationId === null || block.locationId === input.locationId) &&
          overlaps(startsAt, endsAt, block.startsAt, block.endsAt),
      )
      if (clashesWithBlock) continue

      slots.push({
        id: startsAt.toISOString(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      })
    }

    if (slots.length > 0) days.push({ date: day, slots })
  }

  return days
}

/** Confirms a requested start is genuinely on offer, by exact instant. */
export const findSlot = (days: AvailabilityDay[], startsAtIso: string): AvailabilitySlot | null => {
  const target = Date.parse(startsAtIso)
  if (Number.isNaN(target)) return null
  for (const day of days) {
    const match = day.slots.find((slot) => Date.parse(slot.startsAt) === target)
    if (match) return match
  }
  return null
}
