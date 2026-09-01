import { describe, expect, it } from 'vitest'
import {
  type BlockedRange,
  type OccupiedRange,
  buildAvailability,
  findSlot,
  noticeFloor,
} from '@shared/booking/availability'
import { DEFAULT_BOOKING_SETTINGS } from '@shared/booking/rules'
import { instantAt, minutesOf, dayOf } from '@shared/booking/time'

const settings = { ...DEFAULT_BOOKING_SETTINGS, bookingEnabled: true }

/** A Tuesday well inside the horizon; 2026-10-06 is a Tuesday in Sydney. */
const NOW = new Date('2026-09-15T02:00:00Z') // Tue 15 Sep 2026, 12:00 Sydney

const build = (overrides: {
  durationMinutes?: number
  locationId?: string
  now?: Date
  occupied?: OccupiedRange[]
  blocked?: BlockedRange[]
  waiveNotice?: boolean
  excludeBookingId?: string
} = {}) =>
  buildAvailability({
    settings,
    durationMinutes: overrides.durationMinutes ?? 60,
    locationId: overrides.locationId ?? 'south-sydney',
    now: overrides.now ?? NOW,
    occupied: overrides.occupied ?? [],
    blocked: overrides.blocked ?? [],
    waiveNotice: overrides.waiveNotice,
    excludeBookingId: overrides.excludeBookingId,
  })

const times = (date: string, days = build()) =>
  (days.find((day) => day.date === date)?.slots ?? []).map((slot) =>
    new Date(slot.startsAt).toLocaleTimeString('en-AU', {
      timeZone: settings.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  )

describe('availability engine', () => {
  it('only offers Tuesday, Wednesday and Thursday', () => {
    const weekdays = new Set(
      build().map((day) => new Date(`${day.date}T00:00:00Z`).getUTCDay()),
    )
    // 2 Tue, 3 Wed, 4 Thu
    expect([...weekdays].sort()).toEqual([2, 3, 4])
  })

  it('runs a 60-minute lesson from 08:00 to a 14:00 last start', () => {
    const slots = times('2026-10-06')
    expect(slots[0]).toBe('08:00')
    expect(slots.at(-1)).toBe('14:00')
    expect(slots).toContain('13:30')
  })

  it('pulls the last start back to 13:30 for a 90-minute lesson', () => {
    const slots = times('2026-10-06', build({ durationMinutes: 90 }))
    expect(slots[0]).toBe('08:00')
    expect(slots.at(-1)).toBe('13:30')
  })

  it('steps starts every 30 minutes', () => {
    const slots = times('2026-10-06')
    expect(slots.slice(0, 4)).toEqual(['08:00', '08:30', '09:00', '09:30'])
  })

  it('honours the 7-day notice period in Sydney local time', () => {
    const floor = noticeFloor(settings, NOW)
    expect(dayOf(floor, settings.timeZone)).toBe('2026-09-22')
    expect(minutesOf(floor, settings.timeZone)).toBe(minutesOf(NOW, settings.timeZone))
    // Nothing before the floor is ever offered.
    const earliest = build()[0]!
    expect(new Date(earliest.slots[0]!.startsAt).getTime()).toBeGreaterThanOrEqual(floor.getTime())
  })

  it('stops at three calendar months, not a fixed 90 days', () => {
    const last = build().at(-1)!
    // Three calendar months from 15 Sep is 15 Dec; 90 days would be 14 Dec.
    expect(last.date <= '2026-12-15').toBe(true)
    expect(last.date > '2026-12-08').toBe(true)
  })

  it('waives notice for an admin lookup', () => {
    const days = build({ waiveNotice: true })
    expect(days[0]!.date < '2026-09-22').toBe(true)
  })

  it('keeps a 30-minute gap after a booked lesson but allows the exact buffer', () => {
    // Booked 08:00–09:00 Sydney, occupied (with buffer) until 09:30.
    const startsAt = instantAt('2026-10-06', 8 * 60, settings.timeZone)
    const occupied: OccupiedRange[] = [
      {
        id: 'b1',
        locationId: 'south-sydney',
        startsAt,
        occupiedUntil: new Date(startsAt.getTime() + 90 * 60_000),
        holdExpiresAt: null,
      },
    ]
    const slots = times('2026-10-06', build({ occupied }))
    expect(slots).not.toContain('08:00')
    expect(slots).not.toContain('09:00')
    // A candidate carries its own trailing buffer, so 06:30–07:30 + 30 = 08:00
    // touches the booking's start and is excluded; 09:30 is the first free start.
    expect(slots[0]).toBe('09:30')
  })

  it('lets the last lesson of the day finish exactly at 15:00', () => {
    const slots = times('2026-10-06')
    expect(slots).toContain('14:00')
    expect(slots).not.toContain('14:30')
  })

  it('locks a day to the training area already booked on it', () => {
    const startsAt = instantAt('2026-10-06', 8 * 60, settings.timeZone)
    const occupied: OccupiedRange[] = [
      {
        id: 'b1',
        locationId: 'north-sydney',
        startsAt,
        occupiedUntil: new Date(startsAt.getTime() + 90 * 60_000),
        holdExpiresAt: null,
      },
    ]
    expect(build({ occupied, locationId: 'south-sydney' }).some((d) => d.date === '2026-10-06')).toBe(
      false,
    )
    expect(build({ occupied, locationId: 'north-sydney' }).some((d) => d.date === '2026-10-06')).toBe(
      true,
    )
  })

  it('releases a day once an unpaid hold has expired past its grace', () => {
    const startsAt = instantAt('2026-10-06', 8 * 60, settings.timeZone)
    const lapsed: OccupiedRange = {
      id: 'hold',
      locationId: 'north-sydney',
      startsAt,
      occupiedUntil: new Date(startsAt.getTime() + 90 * 60_000),
      holdExpiresAt: new Date(NOW.getTime() - 60 * 60_000),
    }
    const live: OccupiedRange = { ...lapsed, holdExpiresAt: new Date(NOW.getTime() + 60_000) }

    expect(build({ occupied: [live], locationId: 'south-sydney' }).some((d) => d.date === '2026-10-06')).toBe(false)
    expect(build({ occupied: [lapsed], locationId: 'south-sydney' }).some((d) => d.date === '2026-10-06')).toBe(true)
  })

  it('excludes the booking being rescheduled from its own occupancy', () => {
    const startsAt = instantAt('2026-10-06', 8 * 60, settings.timeZone)
    const occupied: OccupiedRange[] = [
      {
        id: 'moving',
        locationId: 'south-sydney',
        startsAt,
        occupiedUntil: new Date(startsAt.getTime() + 90 * 60_000),
        holdExpiresAt: null,
      },
    ]
    expect(times('2026-10-06', build({ occupied }))).not.toContain('08:00')
    expect(times('2026-10-06', build({ occupied, excludeBookingId: 'moving' }))).toContain('08:00')
  })

  it('removes only the blocked window, and only for the blocked area', () => {
    const blocked: BlockedRange[] = [
      {
        startsAt: instantAt('2026-10-06', 8 * 60, settings.timeZone),
        endsAt: instantAt('2026-10-06', 10 * 60, settings.timeZone),
        locationId: 'south-sydney',
      },
    ]
    expect(times('2026-10-06', build({ blocked }))).not.toContain('08:00')
    expect(times('2026-10-06', build({ blocked }))).toContain('10:00')
    expect(times('2026-10-06', build({ blocked, locationId: 'north-sydney' }))).toContain('08:00')
  })

  it('drops a whole day when the owner blocks it with no area', () => {
    const blocked: BlockedRange[] = [
      {
        startsAt: instantAt('2026-10-06', 0, settings.timeZone),
        endsAt: instantAt('2026-10-07', 0, settings.timeZone),
        locationId: null,
      },
    ]
    expect(build({ blocked }).some((day) => day.date === '2026-10-06')).toBe(false)
  })

  it('keeps 08:00 starts across a DST transition', () => {
    // Sydney moves to AEDT on 4 October 2026. Local 08:00 must stay 08:00.
    const before = times('2026-09-29')
    const after = times('2026-10-06')
    expect(before[0]).toBe('08:00')
    expect(after[0]).toBe('08:00')
  })

  it('matches a requested start by exact instant only', () => {
    const days = build()
    const wanted = days[0]!.slots[0]!.startsAt
    expect(findSlot(days, wanted)?.startsAt).toBe(wanted)
    expect(findSlot(days, new Date(Date.parse(wanted) + 60_000).toISOString())).toBeNull()
    expect(findSlot(days, 'not-a-date')).toBeNull()
  })
})
