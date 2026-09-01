import { type FormEvent, useCallback, useEffect, useState } from 'react'
import {
  SETTINGS_LIMITS,
  STRIPE_MIN_CHECKOUT_HOLD_MINUTES,
  type BookingSettings,
  validateSettings,
} from '@shared/booking/rules'
import { minutesToClock, clockToMinutes } from '@shared/booking/time'
import { Button } from '@/components/ui/Button'
import { AdminNotice, AdminPanel } from '@/components/admin/AdminShell'
import { type AdminRun, errorText } from '@/components/admin/types'
import { getSettings, saveSettings } from '@/lib/adminApi'
import { cn } from '@/lib/cn'

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]

const NumberField = ({
  id,
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
      {label}
    </label>
    {hint ? <p className="text-[0.85rem] leading-snug text-ink-muted">{hint}</p> : null}
    <input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
    />
  </div>
)

const TimeField = ({
  id,
  label,
  minutes,
  onChange,
}: {
  id: string
  label: string
  minutes: number
  onChange: (minutes: number) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
      {label}
    </label>
    <input
      id={id}
      type="time"
      value={minutesToClock(minutes)}
      onChange={(event) => {
        const parsed = clockToMinutes(event.target.value)
        if (parsed !== null) onChange(parsed)
      }}
      className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
    />
  </div>
)

/**
 * Booking settings, including the master switch.
 *
 * The switch is the only thing that makes /book able to sell anything, and it is
 * seeded off. Everything here is validated again on the server with the same
 * shared rules, so an edit the engine could not honour is refused rather than
 * quietly clamped. The time zone is fixed at Australia/Sydney and is not
 * editable — every other rule is expressed in that zone.
 */
export const AdminSettingsPanel = ({ run }: { run: AdminRun }) => {
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [outcome, setOutcome] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setProblem(null)
    try {
      setSettings(await run(getSettings))
    } catch (error) {
      setProblem(errorText(error))
    }
  }, [run])

  useEffect(() => {
    void load()
  }, [load])

  const patch = (change: Partial<BookingSettings>) =>
    setSettings((current) => (current ? { ...current, ...change } : current))

  const toggleWeekday = (day: number) =>
    setSettings((current) => {
      if (!current) return current
      const has = current.weekdays.includes(day)
      const weekdays = has
        ? current.weekdays.filter((value) => value !== day)
        : [...current.weekdays, day].sort((a, b) => a - b)
      return { ...current, weekdays }
    })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (settings === null || busy) return
    setProblem(null)
    setOutcome(null)

    const found = validateSettings(settings)
    setProblems(found)
    if (found.length > 0) return

    setBusy(true)
    try {
      const saved = await run((token) => saveSettings(token, settings))
      setSettings(saved)
      setOutcome('Saved. The public booking flow now uses these rules.')
    } catch (error) {
      setProblem(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  if (problem !== null && settings === null) {
    return (
      <AdminPanel title="Booking settings">
        <AdminNotice tone="error">{problem}</AdminNotice>
      </AdminPanel>
    )
  }

  if (settings === null) {
    return (
      <AdminPanel title="Booking settings">
        <p className="text-[0.92rem] text-ink-muted">Loading…</p>
      </AdminPanel>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <AdminPanel
        title="Online booking"
        description="While this is off, /book shows every step but reports that online booking is unavailable at the date and time step. Nothing can be paid for."
      >
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={settings.bookingEnabled}
            onChange={(event) => patch({ bookingEnabled: event.target.checked })}
            className="mt-0.5 size-5 shrink-0 rounded-[6px] border border-ink/25 accent-sage"
          />
          <span className="text-[0.95rem] leading-relaxed text-ink-soft">
            Accept online bookings and payments
          </span>
        </label>
      </AdminPanel>

      <AdminPanel title="When you work" description={`All times are ${settings.timeZone}.`}>
        <div className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
              Bookable days
            </legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const on = settings.weekdays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    aria-pressed={on}
                    className={cn(
                      'min-h-11 min-w-14 rounded-[var(--radius-control)] border px-3 text-[0.9rem] font-medium transition-colors duration-200 ease-[var(--ease-calm)]',
                      on
                        ? 'border-sage bg-sage/12 text-eucalyptus'
                        : 'border-ink/12 text-ink-muted hover:border-ink/25 hover:text-ink',
                    )}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <TimeField
              id="settings-day-start"
              label="Earliest start"
              minutes={settings.dayStartMinutes}
              onChange={(minutes) => patch({ dayStartMinutes: minutes })}
            />
            <TimeField
              id="settings-day-end"
              label="Latest finish"
              minutes={settings.dayEndMinutes}
              onChange={(minutes) => patch({ dayEndMinutes: minutes })}
            />
          </div>
          <p className="text-[0.87rem] leading-relaxed text-ink-muted">
            A lesson has to finish by the latest finish time, so a longer session simply has an
            earlier last start.
          </p>
        </div>
      </AdminPanel>

      <AdminPanel title="Booking rules">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="settings-notice"
            label="Minimum notice (days)"
            value={settings.noticeDays}
            min={SETTINGS_LIMITS.noticeDays.min}
            max={SETTINGS_LIMITS.noticeDays.max}
            onChange={(value) => patch({ noticeDays: value })}
          />
          <NumberField
            id="settings-horizon"
            label="How far ahead (calendar months)"
            value={settings.maxMonthsAhead}
            min={SETTINGS_LIMITS.maxMonthsAhead.min}
            max={SETTINGS_LIMITS.maxMonthsAhead.max}
            onChange={(value) => patch({ maxMonthsAhead: value })}
          />
          <NumberField
            id="settings-increment"
            label="Start times every (minutes)"
            hint={`One of ${SETTINGS_LIMITS.slotIncrementMinutes.join(', ')}.`}
            value={settings.slotIncrementMinutes}
            min={15}
            max={60}
            onChange={(value) => patch({ slotIncrementMinutes: value })}
          />
          <NumberField
            id="settings-buffer"
            label="Gap between lessons (minutes)"
            hint="Not required before the first lesson of the day."
            value={settings.bufferMinutes}
            min={SETTINGS_LIMITS.bufferMinutes.min}
            max={SETTINGS_LIMITS.bufferMinutes.max}
            onChange={(value) => patch({ bufferMinutes: value })}
          />
          <NumberField
            id="settings-hold"
            label="Checkout hold (minutes)"
            hint={`Stripe will not accept less than ${STRIPE_MIN_CHECKOUT_HOLD_MINUTES}.`}
            value={settings.checkoutHoldMinutes}
            min={SETTINGS_LIMITS.checkoutHoldMinutes.min}
            max={SETTINGS_LIMITS.checkoutHoldMinutes.max}
            onChange={(value) => patch({ checkoutHoldMinutes: value })}
          />
          <NumberField
            id="settings-grace"
            label="Grace after a hold expires (minutes)"
            hint="Lets a payment that lands moments late still be honoured."
            value={settings.holdGraceMinutes}
            min={SETTINGS_LIMITS.holdGraceMinutes.min}
            max={SETTINGS_LIMITS.holdGraceMinutes.max}
            onChange={(value) => patch({ holdGraceMinutes: value })}
          />
        </div>
      </AdminPanel>

      {problems.length > 0 ? (
        <AdminNotice tone="error">
          <span className="block font-medium">These settings can&rsquo;t be saved yet:</span>
          <span className="mt-1 block">{problems.join(' ')}</span>
        </AdminNotice>
      ) : null}
      {problem ? <AdminNotice tone="error">{problem}</AdminNotice> : null}
      {outcome ? <AdminNotice tone="success">{outcome}</AdminNotice> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="compact" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </Button>
        <Button type="button" variant="quiet" size="compact" onClick={() => void load()} disabled={busy}>
          Discard changes
        </Button>
      </div>
    </form>
  )
}
