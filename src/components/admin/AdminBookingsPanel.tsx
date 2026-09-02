import { useCallback, useEffect, useState } from 'react'
import {
  CANCELLATION_OUTCOMES,
  cancellationOutcome,
  cancellationReasonLabel,
} from '@shared/booking/policy'
import {
  cancelFlowStep,
  cancellationPreview,
  type CancelEvent,
  type CancelStage,
} from '@shared/booking/cancellationConfirm'
import { experienceLabel } from '@shared/booking/experience'
import { formatDateTime, formatMoneyCents, formatTimeRange } from '@shared/booking/format'
import type {
  AdminBookingDetail,
  AdminBookingRow,
  AvailabilityDay,
  CancellationReason,
} from '@shared/booking/types'
import { Button } from '@/components/ui/Button'
import { AdminNotice, AdminPanel } from '@/components/admin/AdminShell'
import { CancelBookingDialog } from '@/components/admin/CancelBookingDialog'
import { type AdminRun, errorText } from '@/components/admin/types'
import { SelectField } from '@/components/forms/Fields'
import {
  adminSlots,
  cancelBooking,
  getBooking,
  listBookings,
  rescheduleBooking,
  type BookingView,
} from '@/lib/adminApi'
import { cn } from '@/lib/cn'

const VIEWS: Array<{ value: BookingView; label: string }> = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  expired: 'Expired',
  completed: 'Completed',
}

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  refunded: 'Refunded',
  partially_refunded: 'Part refunded',
  failed: 'Payment failed',
}

const Pill = ({ children, tone }: { children: string; tone: 'good' | 'warn' | 'quiet' }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium',
      tone === 'good'
        ? 'bg-sage/12 text-eucalyptus'
        : tone === 'warn'
          ? 'bg-amber-500/12 text-amber-800'
          : 'bg-ink/6 text-ink-muted',
    )}
  >
    {children}
  </span>
)

const statusTone = (status: string): 'good' | 'warn' | 'quiet' =>
  status === 'confirmed' ? 'good' : status === 'pending_payment' ? 'warn' : 'quiet'

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5 border-t border-ink/8 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
    <dt className="text-[0.82rem] uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
    <dd className="text-[0.95rem] text-ink sm:text-right">{value}</dd>
  </div>
)

/**
 * Bookings: the list, one booking's full record, and the two actions that change
 * a booking — cancel (with a policy-derived refund) and reschedule.
 *
 * The refund amount shown next to a cancellation reason is a preview of the
 * published policy. The amount actually refunded is recomputed on the server
 * from the booking's own start time and what has already been refunded; this
 * panel never sends an amount.
 */
export const AdminBookingsPanel = ({ run }: { run: AdminRun }) => {
  const [view, setView] = useState<BookingView>('upcoming')
  const [rows, setRows] = useState<AdminBookingRow[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(
    async (which: BookingView) => {
      setRows(null)
      setProblem(null)
      try {
        setRows(await run((token) => listBookings(token, which)))
      } catch (error) {
        setProblem(errorText(error))
      }
    },
    [run],
  )

  useEffect(() => {
    void load(view)
  }, [load, view])

  return (
    <div className="flex flex-col gap-5">
      <AdminPanel
        title="Bookings"
        description="Times are shown in Sydney time. Unpaid holds disappear on their own once they expire."
        actions={
          <div className="flex gap-1 rounded-[var(--radius-control)] border border-ink/10 p-1">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                aria-pressed={view === option.value}
                className={cn(
                  'min-h-9 rounded-[calc(var(--radius-control)-2px)] px-3 text-[0.85rem] font-medium transition-colors duration-200 ease-[var(--ease-calm)]',
                  view === option.value
                    ? 'bg-ink text-canvas'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {problem ? <AdminNotice tone="error">{problem}</AdminNotice> : null}

        {rows === null && problem === null ? (
          <p className="text-[0.92rem] text-ink-muted">Loading…</p>
        ) : null}

        {rows !== null && rows.length === 0 ? (
          <p className="text-[0.92rem] text-ink-muted">
            {view === 'upcoming'
              ? 'No upcoming bookings.'
              : view === 'past'
                ? 'No past bookings yet.'
                : 'No cancelled bookings.'}
          </p>
        ) : null}

        {rows !== null && rows.length > 0 ? (
          <ul className="flex flex-col">
            {rows.map((row) => {
              const startsAt = new Date(row.startsAt)
              const endsAt = new Date(row.endsAt)

              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-ink/8 py-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-[0.98rem] font-semibold tracking-[-0.01em]">
                      {formatDateTime(startsAt)} · {formatTimeRange(startsAt, endsAt)}
                    </span>
                    <span className="text-[0.87rem] text-ink-soft">
                      {row.customerName} · {row.sessionName} · {row.locationName}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Pill tone={statusTone(row.status)}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Pill>
                      <Pill tone={row.paymentState === 'paid' ? 'good' : 'quiet'}>
                        {PAYMENT_LABEL[row.paymentState] ?? row.paymentState}
                      </Pill>
                      <span className="text-[0.8rem] text-ink-muted">{row.reference}</span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="quiet"
                    size="compact"
                    onClick={() => setOpenId(openId === row.id ? null : row.id)}
                  >
                    {openId === row.id ? 'Close' : 'Open'}
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </AdminPanel>

      {openId ? (
        <BookingDetailPanel
          key={openId}
          bookingId={openId}
          run={run}
          onChanged={() => void load(view)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  )
}

interface BookingDetailPanelProps {
  bookingId: string
  run: AdminRun
  onChanged: () => void
  onClose: () => void
}

const BookingDetailPanel = ({ bookingId, run, onChanged, onClose }: BookingDetailPanelProps) => {
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [reason, setReason] = useState<string>('')
  const [cancelStage, setCancelStage] = useState<CancelStage>('idle')
  const [busy, setBusy] = useState(false)
  const [moving, setMoving] = useState(false)
  const [slotDays, setSlotDays] = useState<AvailabilityDay[] | null>(null)
  const [chosenSlot, setChosenSlot] = useState('')

  const load = useCallback(async () => {
    setProblem(null)
    try {
      setBooking(await run((token) => getBooking(token, bookingId)))
    } catch (error) {
      setProblem(errorText(error))
    }
  }, [run, bookingId])

  useEffect(() => {
    void load()
  }, [load])

  const submitCancellation = async () => {
    if (booking === null || reason === '') return
    setProblem(null)
    setOutcome(null)
    try {
      const result = await run((token) =>
        cancelBooking(token, booking.id, reason as CancellationReason),
      )
      const refunded =
        result.refundedCents > 0
          ? `${formatMoneyCents(result.refundedCents)} refunded.`
          : 'No refund was due.'
      setOutcome(
        [
          'Booking cancelled.',
          refunded,
          result.emailSent ? 'The customer has been emailed.' : 'The email could not be sent.',
          result.problem ?? '',
        ]
          .filter((part) => part.length > 0)
          .join(' '),
      )
      await load()
      onChanged()
    } catch (error) {
      setProblem(errorText(error))
    } finally {
      setCancelStage((current) => cancelFlowStep(current, 'settled').stage)
    }
  }

  /**
   * The only route to a cancellation. `cancelFlowStep` decides whether a step
   * merely opens the dialog or is the one that sends the request, so pressing
   * "Cancel booking" cannot mutate anything and a confirmed cancellation is
   * submitted once.
   */
  const stepCancel = (event: CancelEvent) => {
    if (booking === null || reason === '') return
    const next = cancelFlowStep(cancelStage, event)
    setCancelStage(next.stage)
    if (next.submit) void submitCancellation()
  }

  const openReschedule = async () => {
    if (booking === null) return
    setMoving(true)
    setSlotDays(null)
    setProblem(null)
    try {
      const result = await run((token) =>
        adminSlots(token, booking.sessionId, booking.locationId, booking.id),
      )
      setSlotDays(result.days)
    } catch (error) {
      setProblem(errorText(error))
    }
  }

  const handleReschedule = async () => {
    if (booking === null || chosenSlot === '') return
    setBusy(true)
    setProblem(null)
    setOutcome(null)
    try {
      const result = await run((token) => rescheduleBooking(token, booking.id, chosenSlot))
      setOutcome(
        `Moved to ${formatDateTime(new Date(result.startsAt))}. ${
          result.emailSent ? 'The customer has been emailed.' : 'The email could not be sent.'
        }`,
      )
      setMoving(false)
      setChosenSlot('')
      await load()
      onChanged()
    } catch (error) {
      setProblem(errorText(error))
    } finally {
      setBusy(false)
    }
  }

  if (problem !== null && booking === null) {
    return (
      <AdminPanel title="Booking" actions={<CloseButton onClose={onClose} />}>
        <AdminNotice tone="error">{problem}</AdminNotice>
      </AdminPanel>
    )
  }

  if (booking === null) {
    return (
      <AdminPanel title="Booking" actions={<CloseButton onClose={onClose} />}>
        <p className="text-[0.92rem] text-ink-muted">Loading…</p>
      </AdminPanel>
    )
  }

  const startsAt = new Date(booking.startsAt)
  const endsAt = new Date(booking.endsAt)
  const canAct = booking.status === 'confirmed' || booking.status === 'pending_payment'
  const slots = slotDays?.flatMap((day) => day.slots) ?? []
  const cancelling = cancelStage === 'submitting'
  // What the policy says would happen, restated for the owner before they
  // commit. The server recalculates it when the cancellation is submitted.
  const preview =
    reason === ''
      ? null
      : cancellationPreview({
          reason: reason as CancellationReason,
          startsAt,
          now: new Date(),
          amountPaidCents: booking.amountPaidCents,
          amountRefundedCents: booking.amountRefundedCents,
        })

  return (
    <AdminPanel
      title={`${booking.reference} · ${booking.customerName}`}
      description={`${booking.sessionName} · ${booking.locationName}`}
      actions={<CloseButton onClose={onClose} />}
    >
      <div className="flex flex-col gap-6">
        <dl className="flex flex-col">
          <DetailRow
            label="When"
            value={`${formatDateTime(startsAt, booking.timeZone)} · ${formatTimeRange(startsAt, endsAt, booking.timeZone)}`}
          />
          <DetailRow label="Status" value={STATUS_LABEL[booking.status] ?? booking.status} />
          <DetailRow
            label="Payment"
            value={`${PAYMENT_LABEL[booking.paymentState] ?? booking.paymentState} · ${formatMoneyCents(booking.amountPaidCents)} paid${
              booking.amountRefundedCents > 0
                ? ` · ${formatMoneyCents(booking.amountRefundedCents)} refunded`
                : ''
            }`}
          />
          <DetailRow label="Email" value={booking.email} />
          <DetailRow label="Mobile" value={booking.mobile} />
          <DetailRow label="Drone" value={booking.droneModel} />
          <DetailRow label="Experience" value={experienceLabel(booking.experienceCode)} />
          <DetailRow label="Wants help with" value={booking.helpWith} />
          {booking.notes ? <DetailRow label="Notes" value={booking.notes} /> : null}
          {booking.holdExpiresAt ? (
            <DetailRow label="Hold expires" value={formatDateTime(new Date(booking.holdExpiresAt))} />
          ) : null}
          {booking.cancellationReason ? (
            <DetailRow
              label="Cancelled because"
              value={cancellationReasonLabel(booking.cancellationReason)}
            />
          ) : null}
          <DetailRow label="Booked" value={formatDateTime(new Date(booking.createdAt))} />
        </dl>

        {outcome ? <AdminNotice tone="success">{outcome}</AdminNotice> : null}
        {problem ? <AdminNotice tone="error">{problem}</AdminNotice> : null}

        {canAct ? (
          <div className="flex flex-col gap-4 rounded-[var(--radius-control)] border border-ink/10 p-4">
            <SelectField
              id={`cancel-reason-${booking.id}`}
              name="reason"
              label="Cancel this booking"
              value={reason}
              onChange={setReason}
              placeholder="Choose a reason…"
              options={CANCELLATION_OUTCOMES.map((option) => ({
                value: option.reason,
                label: option.label,
              }))}
              hint="The refund is worked out from the policy and the booking's start time, on the server."
            />
            {reason !== '' ? (
              <p className="text-[0.87rem] text-ink-muted">
                Policy share for this reason:{' '}
                {Math.round(cancellationOutcome(reason as CancellationReason).refundShare * 100)}% of
                the amount paid. The exact figure is recalculated when you confirm.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => stepCancel('request')}
                disabled={busy || cancelling || reason === ''}
              >
                {cancelling ? 'Working…' : 'Cancel booking'}
              </Button>
              {booking.status === 'confirmed' ? (
                <Button
                  type="button"
                  variant="quiet"
                  size="compact"
                  onClick={moving ? () => setMoving(false) : openReschedule}
                  disabled={busy || cancelling}
                >
                  {moving ? 'Stop moving' : 'Reschedule'}
                </Button>
              ) : null}
            </div>

            {moving ? (
              <div className="flex flex-col gap-3 border-t border-ink/8 pt-4">
                {slotDays === null ? (
                  <p className="text-[0.9rem] text-ink-muted">Finding available times…</p>
                ) : slots.length === 0 ? (
                  <p className="text-[0.9rem] text-ink-muted">
                    There are no other available times for this session and training area. Add or
                    remove an availability block first.
                  </p>
                ) : (
                  <>
                    <SelectField
                      id={`reschedule-${booking.id}`}
                      name="slot"
                      label="Move to"
                      value={chosenSlot}
                      onChange={setChosenSlot}
                      placeholder="Choose a new time…"
                      options={slots.map((slot) => ({
                        value: slot.startsAt,
                        label: `${formatDateTime(new Date(slot.startsAt))} · ${formatTimeRange(
                          new Date(slot.startsAt),
                          new Date(slot.endsAt),
                        )}`,
                      }))}
                      hint="The notice period is waived for you. Same-day area and overlap rules still apply."
                    />
                    <div>
                      <Button
                        type="button"
                        size="compact"
                        onClick={handleReschedule}
                        disabled={busy || cancelling || chosenSlot === ''}
                      >
                        {busy ? 'Moving…' : 'Confirm new time'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {cancelStage !== 'idle' && preview !== null ? (
          <CancelBookingDialog
            preview={preview}
            busy={cancelling}
            onConfirm={() => stepCancel('confirm')}
            onDismiss={() => stepCancel('dismiss')}
          />
        ) : null}

        {booking.events.length > 0 ? (
          <div>
            <h3 className="text-[0.82rem] uppercase tracking-[0.12em] text-ink-muted">History</h3>
            <ul className="mt-2 flex flex-col gap-1.5 text-[0.87rem] text-ink-soft">
              {booking.events.map((event) => (
                <li key={event.id} className="flex flex-wrap gap-x-2">
                  <span className="text-ink-muted">{formatDateTime(new Date(event.createdAt))}</span>
                  <span className="font-medium">{event.eventType.replace(/_/g, ' ')}</span>
                  {event.actor ? <span className="text-ink-muted">by {event.actor}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </AdminPanel>
  )
}

const CloseButton = ({ onClose }: { onClose: () => void }) => (
  <Button type="button" variant="quiet" size="compact" onClick={onClose}>
    Close
  </Button>
)
