import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatDayAndMonth,
  formatLongDate,
  formatTime,
  formatWeekday,
} from '@shared/booking/format'
import {
  activeDayOf,
  dateForMonth,
  findMonth,
  formatMonthKey,
  groupDaysByMonth,
  initialMonthView,
  monthKeyOf,
  reconcileMonthView,
  stepMonthKey,
  type MonthView,
} from '@shared/booking/months'
import type { AvailabilityDay } from '@shared/booking/types'
import { cn } from '@/lib/cn'

interface SlotPickerProps {
  days: AvailabilityDay[]
  timeZone: string
  selected: string | null
  onSelect: (startsAtIso: string) => void
}

/**
 * Date and time selection.
 *
 * One month at a time, then the times on the chosen day. Only dates the server
 * says are bookable are rendered — there are no greyed-out squares, no month is
 * reachable unless the availability response contains it, and no date arithmetic
 * happens here.
 *
 * Changing month is a view change and nothing else: it starts no booking, holds
 * no slot, contacts nothing and leaves the selected time exactly as it was, so
 * the summary keeps showing the real booking until a time is explicitly chosen.
 *
 * Both lists are radio groups, so arrow keys move through them and the current
 * choice is announced. Every control is a flexible grid cell rather than a
 * horizontal strip, so the whole step stays inside the content column.
 */
export const SlotPicker = ({ days, timeZone, selected, onSelect }: SlotPickerProps) => {
  const months = useMemo(() => groupDaysByMonth(days), [days])

  const selectedDate = useMemo(() => {
    if (selected === null) return null
    return days.find((day) => day.slots.some((slot) => slot.startsAt === selected))?.date ?? null
  }, [days, selected])

  const [view, setView] = useState<MonthView>(() => initialMonthView(months, selectedDate))
  // What the flow last told us was selected. Lets an external change — a deep
  // link, ?slot=, or a released hold — move the view, while a month the
  // customer browsed to deliberately is left alone.
  const lastSelectedDate = useRef(selectedDate)

  useEffect(() => {
    if (selectedDate !== lastSelectedDate.current) {
      lastSelectedDate.current = selectedDate
      if (selectedDate !== null && findMonth(months, monthKeyOf(selectedDate)) !== null) {
        setView({ monthKey: monthKeyOf(selectedDate), activeDate: selectedDate })
        return
      }
    }
    // Availability refreshed. Stay put where that is still possible.
    setView((current) => reconcileMonthView(months, selectedDate, current))
  }, [months, selectedDate])

  const showMonth = (monthKey: string | null) => {
    if (monthKey === null) return
    setView({ monthKey, activeDate: dateForMonth(months, monthKey, selectedDate) })
  }

  if (months.length === 0) return null

  const month = findMonth(months, view.monthKey) ?? months[0]!
  const previousKey = stepMonthKey(months, month.key, -1)
  const nextKey = stepMonthKey(months, month.key, 1)
  const activeDay = activeDayOf(months, { ...view, monthKey: month.key })

  return (
    <div className="flex min-w-0 flex-col gap-7">
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
          Available dates
        </legend>

        <div className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-ink/10 bg-surface p-1.5">
          <MonthArrow
            direction="previous"
            monthKey={previousKey}
            onClick={() => showMonth(previousKey)}
          />
          {/* Announced on change, so the month is not a visual-only cue. */}
          <p
            aria-live="polite"
            className="min-w-0 flex-1 truncate text-center font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-ink"
          >
            {formatMonthKey(month.key)}
          </p>
          <MonthArrow direction="next" monthKey={nextKey} onClick={() => showMonth(nextKey)} />
        </div>

        {month.days.length === 0 ? (
          <p className="text-[0.93rem] leading-relaxed text-ink-soft">
            No available dates this month.
          </p>
        ) : (
          // auto-fill, so the number of columns follows the width of the
          // booking column itself rather than an assumption about the device.
          <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            {month.days.map((day) => {
              const isActive = day.date === activeDay?.date
              const first = new Date(day.slots[0]!.startsAt)
              const times = `${day.slots.length} ${day.slots.length === 1 ? 'time' : 'times'}`

              return (
                <label key={day.date} className="min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="booking-date"
                    value={day.date}
                    checked={isActive}
                    onChange={() => setView({ monthKey: month.key, activeDate: day.date })}
                    // The compact face reads "Thu / 10 Sep"; this is the whole date.
                    aria-label={`${formatLongDate(first, timeZone)}, ${times} available`}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex min-h-11 flex-col justify-center rounded-[var(--radius-control)] border px-3 py-2 text-center transition-[border-color,background-color] duration-200 ease-[var(--ease-calm)]',
                      'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage',
                      isActive
                        ? 'border-sage/55 bg-sage-soft/50'
                        : 'border-ink/10 bg-surface hover:border-sage/30',
                    )}
                  >
                    <span
                      className={cn(
                        'font-display text-[0.9rem] font-semibold tracking-[-0.01em]',
                        isActive ? 'text-eucalyptus-deep' : 'text-ink',
                      )}
                    >
                      <span aria-hidden="true">{formatWeekday(first, timeZone)} </span>
                      <span aria-hidden="true">{formatDayAndMonth(first, timeZone)}</span>
                    </span>
                    <span aria-hidden="true" className="text-[0.78rem] text-ink-muted">
                      {times}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </fieldset>

      {activeDay ? (
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
            Available times on {formatLongDate(new Date(activeDay.slots[0]!.startsAt), timeZone)}
          </legend>
          <div className="grid min-w-0 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
            {activeDay.slots.map((slot) => {
              const isSelected = slot.startsAt === selected

              return (
                <label key={slot.id} className="min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="booking-time"
                    value={slot.startsAt}
                    checked={isSelected}
                    onChange={() => onSelect(slot.startsAt)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border px-2 py-2 font-display text-[0.95rem] font-semibold tracking-[-0.01em] whitespace-nowrap transition-[border-color,background-color,color] duration-200 ease-[var(--ease-calm)]',
                      'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage',
                      isSelected
                        ? 'border-sage/55 bg-sage-soft/50 text-eucalyptus-deep'
                        : 'border-ink/10 bg-surface text-ink hover:border-sage/30',
                    )}
                  >
                    {isSelected ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
                    {formatTime(new Date(slot.startsAt), timeZone)}
                  </span>
                </label>
              )
            })}
          </div>
          <p className="text-[0.85rem] leading-relaxed text-ink-muted">
            All times are Sydney time. Your session runs for its full booked length from the time you
            choose, and the last lesson of the day finishes by 3:00&nbsp;pm.
          </p>
        </fieldset>
      ) : null}
    </div>
  )
}

interface MonthArrowProps {
  direction: 'previous' | 'next'
  /** The month this arrow moves to, or null at the bounds. */
  monthKey: string | null
  onClick: () => void
}

/**
 * Month navigation, bounded by the availability data.
 *
 * Disabled — not hidden — when there is no further month with times, so the
 * control keeps its place and the customer can see the range has an end.
 */
const MonthArrow = ({ direction, monthKey, onClick }: MonthArrowProps) => {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  const label =
    monthKey === null
      ? `No ${direction === 'previous' ? 'earlier' : 'later'} available dates`
      : `Show ${formatMonthKey(monthKey)}`

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={monthKey === null}
      aria-label={label}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border transition-[border-color,background-color,color] duration-200 ease-[var(--ease-calm)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage',
        monthKey === null
          ? 'cursor-not-allowed border-ink/8 text-ink-muted/50'
          : 'border-ink/10 text-ink hover:border-sage/40 hover:bg-sage-soft/30',
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )
}
