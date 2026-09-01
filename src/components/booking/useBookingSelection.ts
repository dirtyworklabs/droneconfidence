import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { locations } from '@/content/locations'
import { sessions } from '@/content/sessions'
import { BOOKING_PARAM } from '@/lib/routes'
import { track } from '@/lib/analytics'
import type { LocationId, Session, SessionId, TrainingLocation } from '@/types'

/**
 * Public booking state for /book.
 *
 * State is React state plus the URL search parameters — nothing more is needed,
 * and nothing personal is ever put in the URL. Values arriving in the query are
 * validated against the real session and location content; anything else is
 * ignored and quietly removed from the URL.
 *
 * Selections are pushed onto the history stack so back and forward step through
 * the choices, and deep links from marketing CTAs arrive preselected.
 */

const isSessionId = (value: string | null): value is SessionId =>
  value !== null && sessions.some((session) => session.id === value)

const isLocationId = (value: string | null): value is LocationId =>
  value !== null && locations.some((location) => location.id === value)

/** 1 Session · 2 Location · 3 Date & time · 4 Details & payment. */
export const BOOKING_STEPS = ['Session', 'Location', 'Date & time', 'Details & payment'] as const

/**
 * A chosen slot is the ISO start instant returned by the availability endpoint.
 * It is a public appointment time, not personal data, so it is safe in the URL —
 * and the server re-validates it against live availability before taking money,
 * so a stale or hand-edited value can only ever be rejected.
 */
const isSlotIso = (value: string | null): boolean => {
  if (value === null) return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

export interface BookingSelectionState {
  session: Session | null
  location: TrainingLocation | null
  /** ISO start instant of the chosen slot, or null. */
  slot: string | null
  /** The furthest step the current selection has unlocked. */
  currentStep: number
  selectSession: (id: SessionId) => void
  selectLocation: (id: LocationId) => void
  selectSlot: (startsAtIso: string) => void
  clearSlot: () => void
}

export const useBookingSelection = (): BookingSelectionState => {
  const [params, setParams] = useSearchParams()

  const rawSession = params.get(BOOKING_PARAM.session)
  const rawLocation = params.get(BOOKING_PARAM.location)
  const rawSlot = params.get(BOOKING_PARAM.slot)

  const sessionId = isSessionId(rawSession) ? rawSession : null
  const locationId = isLocationId(rawLocation) ? rawLocation : null
  const slot = isSlotIso(rawSlot) ? rawSlot : null

  // An unrecognised value is ignored, then tidied out of the URL so a shared
  // link doesn't keep propagating it.
  useEffect(() => {
    const sessionInvalid = rawSession !== null && sessionId === null
    const locationInvalid = rawLocation !== null && locationId === null
    // A slot without both a session and an area can't be interpreted, so it goes
    // too — the duration and the training area are what make a time meaningful.
    const slotInvalid =
      rawSlot !== null && (slot === null || sessionId === null || locationId === null)
    if (!sessionInvalid && !locationInvalid && !slotInvalid) return

    const next = new URLSearchParams(params)
    if (sessionInvalid) next.delete(BOOKING_PARAM.session)
    if (locationInvalid) next.delete(BOOKING_PARAM.location)
    if (slotInvalid) next.delete(BOOKING_PARAM.slot)
    setParams(next, { replace: true, preventScrollReset: true })
  }, [params, setParams, rawSession, rawLocation, rawSlot, sessionId, locationId, slot])

  const session = useMemo(
    () => sessions.find((item) => item.id === sessionId) ?? null,
    [sessionId],
  )
  const location = useMemo(
    () => locations.find((item) => item.id === locationId) ?? null,
    [locationId],
  )

  // Changing the session changes the duration, and changing the area changes
  // which days are open, so an already-chosen time can no longer be assumed
  // valid. It is dropped rather than silently carried forward.
  const selectSession = useCallback(
    (id: SessionId) => {
      if (id === sessionId) return
      track('booking_session_selected', { session: id })
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set(BOOKING_PARAM.session, id)
          next.delete(BOOKING_PARAM.slot)
          return next
        },
        { preventScrollReset: true },
      )
    },
    [sessionId, setParams],
  )

  const selectLocation = useCallback(
    (id: LocationId) => {
      if (id === locationId) return
      track('booking_location_selected', { location: id })
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set(BOOKING_PARAM.location, id)
          next.delete(BOOKING_PARAM.slot)
          return next
        },
        { preventScrollReset: true },
      )
    },
    [locationId, setParams],
  )

  const selectSlot = useCallback(
    (startsAtIso: string) => {
      if (startsAtIso === slot) return
      track('booking_slot_selected', { session: sessionId ?? '', location: locationId ?? '' })
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set(BOOKING_PARAM.slot, startsAtIso)
          return next
        },
        { preventScrollReset: true },
      )
    },
    [slot, sessionId, locationId, setParams],
  )

  const clearSlot = useCallback(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(BOOKING_PARAM.slot)
        return next
      },
      { replace: true, preventScrollReset: true },
    )
  }, [setParams])

  const currentStep = session === null ? 1 : location === null ? 2 : slot === null ? 3 : 4

  return { session, location, slot, currentStep, selectSession, selectLocation, selectSlot, clearSlot }
}
