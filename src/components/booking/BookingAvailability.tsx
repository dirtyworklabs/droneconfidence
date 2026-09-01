import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { AvailabilityDay, AvailabilityResponse } from '@shared/booking/types'
import { Button } from '@/components/ui/Button'
import { BookingUnavailable } from '@/components/booking/BookingUnavailable'
import { SlotPicker } from '@/components/booking/SlotPicker'
import { fetchAvailability } from '@/lib/bookingService'
import { track } from '@/lib/analytics'
import type { LocationId, SessionId } from '@/types'

interface BookingAvailabilityProps {
  sessionId: SessionId
  locationId: LocationId
  selected: string | null
  onSelect: (startsAtIso: string) => void
  /** Bumped by the flow to force a fresh lookup after a rejected slot. */
  refreshToken?: number
  /** Reports the zone the server formats times in, so later steps agree with it. */
  onTimeZone?: (timeZone: string) => void
}

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; days: AvailabilityDay[]; timeZone: string }
  | { kind: 'empty' }
  | { kind: 'unavailable' }

/**
 * Step 3 — real availability.
 *
 * The only thing this component knows is how to ask the availability endpoint and
 * render what comes back. There is no local calendar, no sample data and no
 * client-side idea of opening hours: if the server returns no days, the step says
 * so. Selecting a time is not a reservation — the slot is reserved when the
 * customer continues to payment, and re-checked then.
 */
export const BookingAvailability = ({
  sessionId,
  locationId,
  selected,
  onSelect,
  refreshToken = 0,
  onTimeZone,
}: BookingAvailabilityProps) => {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [reloadCount, setReloadCount] = useState(0)
  // Only the first unavailable render per selection is worth an event.
  const reported = useRef('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setState({ kind: 'loading' })

    fetchAvailability({ sessionId, locationId }, controller.signal)
      .then((response: AvailabilityResponse) => {
        if (!active) return
        if (response.status === 'ok') {
          setState({ kind: 'ok', days: response.days, timeZone: response.timeZone })
          onTimeZone?.(response.timeZone)
        } else if (response.status === 'empty') {
          setState({ kind: 'empty' })
          onTimeZone?.(response.timeZone)
        } else {
          setState({ kind: 'unavailable' })
        }
      })
      .catch(() => {
        if (active) setState({ kind: 'unavailable' })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [sessionId, locationId, refreshToken, reloadCount, onTimeZone])

  const key = `${sessionId}:${locationId}:${state.kind}`
  useEffect(() => {
    if (state.kind !== 'unavailable' && state.kind !== 'empty') return
    if (reported.current === key) return
    reported.current = key
    track('booking_unavailable_shown', {
      session: sessionId,
      location: locationId,
      reason: state.kind,
    })
  }, [key, state.kind, sessionId, locationId])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  if (state.kind === 'loading') {
    return (
      <p aria-live="polite" className="text-[0.97rem] leading-relaxed text-ink-soft">
        Checking available times…
      </p>
    )
  }

  if (state.kind === 'empty') {
    return (
      <div className="flex flex-col gap-4">
        <BookingUnavailable body="There are no available times for this session and training area at the moment. Send us a message and we’ll let you know as soon as more times open up." />
        <div>
          <Button type="button" variant="quiet" onClick={reload}>
            Check again
          </Button>
        </div>
      </div>
    )
  }

  if (state.kind === 'unavailable') {
    return (
      <div className="flex flex-col gap-4">
        <BookingUnavailable />
        <div>
          <Button type="button" variant="quiet" onClick={reload}>
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <SlotPicker
        days={state.days}
        timeZone={state.timeZone}
        selected={selected}
        onSelect={onSelect}
      />
      <p className="flex items-center gap-2 text-[0.85rem] text-ink-muted">
        <RefreshCw aria-hidden="true" className="size-3.5 shrink-0" />
        Times can be taken by someone else while you&rsquo;re booking.{' '}
        <Button type="button" variant="quiet" size="compact" onClick={reload} className="min-h-0">
          Refresh times
        </Button>
      </p>
    </div>
  )
}
