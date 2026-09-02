import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  activeDayOf,
  dateForMonth,
  formatMonthKey,
  groupDaysByMonth,
  initialMonthView,
  monthKeyOf,
  reconcileMonthView,
  stepMonthKey,
} from '../shared/booking/months'
import type { AvailabilityDay } from '../shared/booking/types'

/**
 * The month browser behind step 3.
 *
 * The interaction has one rule that matters more than the layout: browsing is a
 * view change and never a booking change. That is a property of these pure
 * functions, so it is tested here rather than through a browser.
 */

/** 10:00 and 11:30 Sydney on the given date, in the shape the endpoint returns. */
const day = (date: string, count = 2): AvailabilityDay => ({
  date: date as AvailabilityDay['date'],
  slots: Array.from({ length: count }, (_, index) => ({
    id: `${date}-${index}`,
    startsAt: `${date}T${String(8 + index).padStart(2, '0')}:00:00+10:00`,
    endsAt: `${date}T${String(9 + index).padStart(2, '0')}:00:00+10:00`,
  })),
})

const DAYS = [
  day('2026-09-10'),
  day('2026-09-15'),
  day('2026-09-22'),
  day('2026-10-06'),
  day('2026-10-13'),
  day('2026-12-01'),
]

const MONTHS = groupDaysByMonth(DAYS)

describe('grouping real availability into months', () => {
  it('produces one month per Sydney calendar month present in the data', () => {
    expect(MONTHS.map((month) => month.key)).toEqual(['2026-09', '2026-10', '2026-12'])
    expect(MONTHS[0]!.days.map((entry) => entry.date)).toEqual([
      '2026-09-10',
      '2026-09-15',
      '2026-09-22',
    ])
  })

  it('shows only dates that have times, never a placeholder day', () => {
    const withEmpty = groupDaysByMonth([day('2026-09-10'), day('2026-09-11', 0)])
    expect(withEmpty).toHaveLength(1)
    expect(withEmpty[0]!.days.map((entry) => entry.date)).toEqual(['2026-09-10'])
    // Nothing is invented either: no data, no months, and the picker renders nothing.
    expect(groupDaysByMonth([])).toEqual([])
  })

  it('labels a month from its own key', () => {
    expect(formatMonthKey('2026-09')).toBe('September 2026')
    expect(formatMonthKey('2027-01')).toBe('January 2027')
    expect(monthKeyOf('2026-12-01')).toBe('2026-12')
  })
})

describe('navigation bounds', () => {
  it('stops at the ends of the availability the server returned', () => {
    expect(stepMonthKey(MONTHS, '2026-09', -1)).toBeNull()
    expect(stepMonthKey(MONTHS, '2026-12', 1)).toBeNull()
  })

  it('never lands on a month that has no availability', () => {
    // November has no bookable days, so October steps straight to December.
    expect(stepMonthKey(MONTHS, '2026-10', 1)).toBe('2026-12')
    expect(stepMonthKey(MONTHS, '2026-12', -1)).toBe('2026-10')
    for (const step of [-1, 1] as const) {
      for (const month of MONTHS) {
        const next = stepMonthKey(MONTHS, month.key, step)
        if (next !== null) expect(MONTHS.map((entry) => entry.key)).toContain(next)
      }
    }
  })
})

describe('selection state while browsing', () => {
  it('opens on the first available month when nothing is selected', () => {
    expect(initialMonthView(MONTHS, null)).toEqual({
      monthKey: '2026-09',
      activeDate: '2026-09-10',
    })
  })

  it('opens on the selected booking’s month and day', () => {
    expect(initialMonthView(MONTHS, '2026-10-13')).toEqual({
      monthKey: '2026-10',
      activeDate: '2026-10-13',
    })
  })

  it('leaves the selected booking untouched when the customer changes month', () => {
    const selected = '2026-09-15'
    // Browsing to December picks a day to list times for, and says nothing
    // about the booking: dateForMonth is a view value, and `selected` is the
    // caller's, unchanged.
    expect(dateForMonth(MONTHS, '2026-12', selected)).toBe('2026-12-01')
    // Coming back returns to the selected day rather than the month's first.
    expect(dateForMonth(MONTHS, '2026-09', selected)).toBe('2026-09-15')
    expect(dateForMonth(MONTHS, '2026-10', selected)).toBe('2026-10-06')
  })

  it('keeps the browsed month across an availability refresh', () => {
    const browsed = { monthKey: '2026-12', activeDate: '2026-12-01' }
    // The same list again: the view must not snap back to the selected day's month.
    expect(reconcileMonthView(MONTHS, '2026-09-15', browsed)).toBe(browsed)

    // A day disappears from the month being viewed: stay in the month.
    const refreshed = groupDaysByMonth([day('2026-09-10'), day('2026-09-22'), day('2026-12-01')])
    expect(reconcileMonthView(refreshed, null, { monthKey: '2026-09', activeDate: '2026-09-15' }))
      .toEqual({ monthKey: '2026-09', activeDate: '2026-09-10' })
  })

  it('recovers to a real month when the viewed one empties out', () => {
    const refreshed = groupDaysByMonth([day('2026-10-06'), day('2026-10-13')])
    expect(reconcileMonthView(refreshed, null, { monthKey: '2026-09', activeDate: '2026-09-15' }))
      .toEqual({ monthKey: '2026-10', activeDate: '2026-10-06' })
    // With a booking selected, recovery lands on the booking's own month.
    expect(
      reconcileMonthView(refreshed, '2026-10-13', { monthKey: '2026-09', activeDate: '2026-09-15' }),
    ).toEqual({ monthKey: '2026-10', activeDate: '2026-10-13' })
  })

  it('lists the times of the active day, and nothing when there are none', () => {
    expect(activeDayOf(MONTHS, { monthKey: '2026-10', activeDate: '2026-10-13' })?.date)
      .toBe('2026-10-13')
    // A day from another month is not reachable from this month's view.
    expect(activeDayOf(MONTHS, { monthKey: '2026-10', activeDate: '2026-09-15' })).toBeNull()
    expect(activeDayOf([], { monthKey: '2026-10', activeDate: '2026-10-13' })).toBeNull()
  })
})

describe('the step 3 markup', () => {
  const source = readFileSync('src/components/booking/SlotPicker.tsx', 'utf8')

  it('has no horizontally scrolling date strip', () => {
    expect(source).not.toContain('overflow-x')
    expect(source).not.toContain('snap-x')
    // Both lists are flexible grids, sized by the content column.
    expect(source).toContain('grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]')
    expect(source).toContain('grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))]')
  })

  it('only reports a slot selection when a time is chosen', () => {
    // onSelect is the analytics and booking path. It appears in the time radio's
    // handler and nowhere near the month controls.
    expect(source.match(/onSelect\(/g)).toHaveLength(1)
    expect(source).toContain('onChange={() => onSelect(slot.startsAt)}')
    // Month navigation only ever sets the view.
    expect(source).toContain('const showMonth = (monthKey: string | null)')
    expect(source).not.toContain('track(')
  })

  it('keeps every control keyboard reachable with a visible focus ring', () => {
    expect(source.match(/peer-focus-visible:outline-sage/g)).toHaveLength(2)
    expect(source).toContain('focus-visible:outline-offset-2 focus-visible:outline-sage')
    // 44px touch targets on the date buttons, time buttons and month arrows.
    expect(source.match(/min-h-11|size-11/g)?.length).toBe(3)
  })

  it('gives every compact date button the full date as its accessible name', () => {
    expect(source).toContain('aria-label={`${formatLongDate(first, timeZone)}, ${times} available`}')
  })
})
