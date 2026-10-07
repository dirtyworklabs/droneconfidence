import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { locations } from '@/content/locations'
import { isBookableSessionId } from '@shared/booking/catalog'
import { activeSession } from '@/content/sessions'
import { BOOKING_PARAM } from '@/lib/routes'
import { track } from '@/lib/analytics'
import type { LocationId, Session, TrainingLocation } from '@/types'

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
 *
 * There is one public lesson, so the session is never asked for: it is always
 * First Flight. `?session=first-flight` from an older link is accepted as-is. A
 * retired or unknown `?session=` is removed and never re-enables that product —
 * and any `?slot=` travelling with it goes too, because it may have been chosen
 * against a different lesson length.
 */

const isLocationId = (value: string | null): value is LocationId =>
  value !== null && locations.some((location) => location.id === value)

/** 1 Training area · 2 Date & time · 3 Details & payment. */
export const BOOKING_STEPS = ['Training area', 'Date & time', 'Details & payment'] as const

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
  /** Always the active lesson. Not a customer choice. */
  session: Session
  location: TrainingLocation | null
  /** ISO start instant of the chosen slot, or null. */
  slot: string | null
  /** The furthest step the current selection has unlocked. */
  currentStep: number
  selectLocation: (id: LocationId) => void
  selectSlot: (startsAtIso: string) => void
  clearSlot: () => void
}

export const useBookingSelection = (): BookingSelectionState => {
  const [params, setParams] = useSearchParams()

  const rawSession = params.get(BOOKING_PARAM.session)
  const rawLocation = params.get(BOOKING_PARAM.location)
  const rawSlot = params.get(BOOKING_PARAM.slot)

  const locationId = isLocationId(rawLocation) ? rawLocation : null
  const slot = isSlotIso(rawSlot) ? rawSlot : null

  // An unrecognised value is ignored, then tidied out of the URL so a shared
  // link doesn't keep propagating it.
  useEffect(() => {
    const sessionInvalid = rawSession !== null && !isBookableSessionId(rawSession)
    const locationInvalid = rawLocation !== null && locationId === null
    // A slot without an area can't be interpreted, and one that arrived with an
    // obsolete session may have been computed for another duration, so it goes
    // too — the duration and the training area are what make a time meaningful.
    const slotInvalid =
      rawSlot !== null && (slot === null || sessionInvalid || locationId === null)
    if (!sessionInvalid && !locationInvalid && !slotInvalid) return

    const next = new URLSearchParams(params)
    if (sessionInvalid) next.delete(BOOKING_PARAM.session)
    if (locationInvalid) next.delete(BOOKING_PARAM.location)
    if (slotInvalid) next.delete(BOOKING_PARAM.slot)
    setParams(next, { replace: true, preventScrollReset: true })
  }, [params, setParams, rawSession, rawLocation, rawSlot, locationId, slot])

  const session = activeSession
  const location = useMemo(
    () => locations.find((item) => item.id === locationId) ?? null,
    [locationId],
  )

  // Changing the area changes which days are open, so an already-chosen time
  // can no longer be assumed valid. It is dropped rather than silently carried
  // forward.
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
      track('booking_slot_selected', { session: session.id, location: locationId ?? '' })
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set(BOOKING_PARAM.slot, startsAtIso)
          return next
        },
        { preventScrollReset: true },
      )
    },
    [slot, session.id, locationId, setParams],
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

  const currentStep = location === null ? 1 : slot === null ? 2 : 3

  return { session, location, slot, currentStep, selectLocation, selectSlot, clearSlot }
}
