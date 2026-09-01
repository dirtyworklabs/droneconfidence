import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { formatLongDate, formatShortDate, formatTime } from '@shared/booking/format'
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
 * Two lists rather than a month grid: the days that genuinely have times, then
 * the times on the chosen day. Every value comes from the availability endpoint —
 * no date arithmetic happens here, and there is nothing to render when the
 * server returns nothing.
 *
 * Both lists are radio groups, so arrow keys move through them and the current
 * choice is announced. Selection is shown by fill, a tick and text.
 */
export const SlotPicker = ({ days, timeZone, selected, onSelect }: SlotPickerProps) => {
  const selectedDayFromSlot = useMemo(() => {
    if (selected === null) return null
    return days.find((day) => day.slots.some((slot) => slot.startsAt === selected))?.date ?? null
  }, [days, selected])

  const [activeDate, setActiveDate] = useState<string>(
    () => selectedDayFromSlot ?? days[0]?.date ?? '',
  )

  // Keep the visible day in step with the URL, and recover if the day the
  // customer was looking at disappears from a refreshed availability list.
  useEffect(() => {
    const stillThere = days.some((day) => day.date === activeDate)
    const next = selectedDayFromSlot ?? (stillThere ? activeDate : days[0]?.date ?? '')
    if (next !== activeDate) setActiveDate(next)
  }, [days, activeDate, selectedDayFromSlot])

  const activeDay = days.find((day) => day.date === activeDate) ?? days[0] ?? null
  if (!activeDay) return null

  return (
    <div className="flex flex-col gap-7">
      <fieldset className="flex flex-col gap-3">
        <legend className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
          Available dates
        </legend>
        <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {days.map((day) => {
            const isActive = day.date === activeDay.date
            const first = new Date(day.slots[0]!.startsAt)

            return (
              <label key={day.date} className="shrink-0 snap-start cursor-pointer">
                <input
                  type="radio"
                  name="booking-date"
                  value={day.date}
                  checked={isActive}
                  onChange={() => setActiveDate(day.date)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'flex min-h-11 flex-col justify-center rounded-[var(--radius-control)] border px-4 py-2 text-center transition-[border-color,background-color] duration-200 ease-[var(--ease-calm)]',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage',
                    isActive
                      ? 'border-sage/55 bg-sage-soft/50'
                      : 'border-ink/10 bg-surface hover:border-sage/30',
                  )}
                >
                  <span
                    className={cn(
                      'font-display text-[0.9rem] font-semibold tracking-[-0.01em] whitespace-nowrap',
                      isActive ? 'text-eucalyptus-deep' : 'text-ink',
                    )}
                  >
                    {formatShortDate(first, timeZone)}
                  </span>
                  <span className="text-[0.78rem] text-ink-muted">
                    {day.slots.length} {day.slots.length === 1 ? 'time' : 'times'}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
          Available times on {formatLongDate(new Date(activeDay.slots[0]!.startsAt), timeZone)}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {activeDay.slots.map((slot) => {
            const isSelected = slot.startsAt === selected

            return (
              <label key={slot.id} className="cursor-pointer">
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
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-2 font-display text-[0.95rem] font-semibold tracking-[-0.01em] transition-[border-color,background-color,color] duration-200 ease-[var(--ease-calm)]',
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
    </div>
  )
}
