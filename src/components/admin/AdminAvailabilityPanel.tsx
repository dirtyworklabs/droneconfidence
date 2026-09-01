import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { LOCATION_CATALOG } from '@shared/booking/catalog'
import { formatDateTime } from '@shared/booking/format'
import { clockToMinutes } from '@shared/booking/time'
import type { AdminAvailabilityBlock } from '@shared/booking/types'
import { Button } from '@/components/ui/Button'
import { AdminNotice, AdminPanel } from '@/components/admin/AdminShell'
import { type AdminRun, errorText } from '@/components/admin/types'
import { SelectField, TextField } from '@/components/forms/Fields'
import { createBlock, deleteBlock, listBlocks } from '@/lib/adminApi'

const emptyForm = { date: '', from: '', to: '', locationId: '', reason: '' }

/**
 * Availability blocks — the only way a date or a window is closed.
 *
 * Public holidays, personal days, venue closures and unsuitable weather are all
 * the same thing here: a block the owner adds. There is no holiday feed and no
 * hard-coded list of NSW public holidays, so nothing can silently disagree with
 * what the owner actually intends to work.
 *
 * The reason is internal. It is stored, shown here, and never returned by the
 * public availability endpoint.
 */
export const AdminAvailabilityPanel = ({ run }: { run: AdminRun }) => {
  const [blocks, setBlocks] = useState<AdminAvailabilityBlock[] | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [problem, setProblem] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setProblem(null)
    try {
      setBlocks(await run(listBlocks))
    } catch (error) {
      setProblem(errorText(error))
    }
  }, [run])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    setProblem(null)
    setOutcome(null)

    if (form.date === '') {
      setProblem('Choose the date to block.')
      return
    }
    if (form.reason.trim().length === 0) {
      setProblem('Add a short reason so you remember why this is blocked.')
      return
    }

    // A whole day is the default: midnight to midnight covers every slot on that
    // date. Times are Sydney wall clock, converted by the server.
    const fromMinutes = form.from === '' ? 0 : clockToMinutes(form.from)
    const toMinutes = form.to === '' ? 24 * 60 : clockToMinutes(form.to)
    if (fromMinutes === null || toMinutes === null) {
      setProblem('Enter the times as HH:MM, or leave them empty to block the whole day.')
      return
    }
    if (toMinutes <= fromMinutes) {
      setProblem('The end time has to be after the start time.')
      return
    }

    setBusy(true)
    try {
      await run((token) =>
        createBlock(token, {
          date: form.date,
          fromMinutes,
          toMinutes,
          locationId: form.locationId === '' ? null : form.locationId,
          reason: form.reason.trim(),
        }),
      )
      setForm(emptyForm)
      setOutcome('Block added. Those times are no longer offered.')
      await load()
    } catch (error) {
      setProblem(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    setProblem(null)
    setOutcome(null)
    setBusy(true)
    try {
      await run((token) => deleteBlock(token, id))
      setOutcome('Block removed. Those times are bookable again.')
      await load()
    } catch (error) {
      setProblem(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <AdminPanel
        title="Block times"
        description="Use this for public holidays, days off, venue closures and weather. Leave the times empty to block the whole day."
      >
        <form onSubmit={handleCreate} noValidate className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="block-date"
                className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]"
              >
                Date
              </label>
              <input
                id="block-date"
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="block-from"
                className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]"
              >
                From <span className="font-sans font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="block-from"
                type="time"
                value={form.from}
                onChange={(event) => setForm({ ...form, from: event.target.value })}
                className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="block-to"
                className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]"
              >
                To <span className="font-sans font-normal text-ink-muted">(optional)</span>
              </label>
              <input
                id="block-to"
                type="time"
                value={form.to}
                onChange={(event) => setForm({ ...form, to: event.target.value })}
                className="w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
              />
            </div>
          </div>

          <SelectField
            id="block-location"
            name="locationId"
            label="Training area"
            value={form.locationId}
            onChange={(value) => setForm({ ...form, locationId: value })}
            placeholder="Both areas"
            options={LOCATION_CATALOG.map((entry) => ({ value: entry.id, label: entry.name }))}
            hint="Leave as “Both areas” to close the window everywhere."
          />

          <TextField
            id="block-reason"
            name="reason"
            label="Reason (internal only)"
            value={form.reason}
            onChange={(value) => setForm({ ...form, reason: value })}
            hint="Never shown to customers or returned by the public availability endpoint."
            maxLength={200}
          />

          {problem ? <AdminNotice tone="error">{problem}</AdminNotice> : null}
          {outcome ? <AdminNotice tone="success">{outcome}</AdminNotice> : null}

          <div>
            <Button type="submit" size="compact" disabled={busy}>
              {busy ? 'Saving…' : 'Add block'}
            </Button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title="Current blocks" description="Times shown in Sydney time.">
        {blocks === null ? (
          <p className="text-[0.92rem] text-ink-muted">Loading…</p>
        ) : blocks.length === 0 ? (
          <p className="text-[0.92rem] text-ink-muted">Nothing is blocked.</p>
        ) : (
          <ul className="flex flex-col">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ink/8 py-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
                    {formatDateTime(new Date(block.startsAt))} → {formatDateTime(new Date(block.endsAt))}
                  </span>
                  <span className="text-[0.87rem] text-ink-soft">
                    {block.locationId
                      ? (LOCATION_CATALOG.find((entry) => entry.id === block.locationId)?.name ??
                        block.locationId)
                      : 'Both areas'}{' '}
                    · {block.reason}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="quiet"
                  size="compact"
                  onClick={() => void handleDelete(block.id)}
                  disabled={busy}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  )
}
