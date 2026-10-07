import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Check, Lock, ShieldCheck } from 'lucide-react'
import { EXPERIENCE_LEVELS, isExperienceCode } from '@shared/booking/experience'
import {
  GUEST_ATTENDANCE_OPTIONS,
  type GuestAttendanceCode,
  isGuestAttendanceCode,
} from '@shared/booking/guest'
import {
  BOOKING_FIELD_ORDER,
  MAX,
  type BookingDetailField,
  type BookingDetailValues,
  type FieldErrors,
  emptyBookingDetails,
  firstErrorKey,
  validateBookingDetails,
} from '@shared/booking/fields'
import {
  AIRCRAFT_FAMILIES,
  OTHER_HARDWARE,
  OTHER_HARDWARE_LABEL,
  compatibleControllers,
} from '@shared/booking/hardware'
import { formatLongDate, formatTimeRange } from '@shared/booking/format'
import type { CheckoutResponse } from '@shared/booking/types'
import { findLocation } from '@shared/booking/catalog'
import { Button } from '@/components/ui/Button'
import {
  CheckboxField,
  ErrorSummary,
  SelectField,
  TextField,
  TextareaField,
} from '@/components/forms/Fields'
import { cn } from '@/lib/cn'
import { formatDuration, formatPrice } from '@/content/sessions'
import { track } from '@/lib/analytics'
import { ROUTES } from '@/lib/routes'
import { newAttemptId, startCheckout } from '@/lib/bookingService'
import type { Session, TrainingLocation } from '@/types'

interface BookingDetailsFormProps {
  session: Session
  location: TrainingLocation
  /** ISO start instant of the chosen slot. */
  slot: string
  timeZone: string
  /** Called when the server says the chosen time is gone, so the date & time step reopens. */
  onSlotRejected: () => void
}

const FIELD_IDS: Record<BookingDetailField, string> = {
  firstName: 'booking-first-name',
  lastName: 'booking-last-name',
  email: 'booking-email',
  mobile: 'booking-mobile',
  guestAttendance: 'booking-guest',
  droneModel: 'booking-aircraft',
  controllerModel: 'booking-controller',
  experienceCode: 'booking-experience',
  helpWith: 'booking-help',
  notes: 'booking-notes',
  policyAccepted: 'booking-policy',
}

/**
 * The two "Other / not listed" text inputs.
 *
 * `droneModel` and `controllerModel` are each collected by either a select or a
 * text input depending on the escape hatch, so error focus has to follow
 * whichever control is on screen.
 */
const OTHER_IDS = {
  aircraft: 'booking-aircraft-other',
  controller: 'booking-controller-other',
} as const

/** DJI families as real `<optgroup>`s, in catalogue order. */
const AIRCRAFT_GROUPS = AIRCRAFT_FAMILIES.map((family) => ({
  label: family.name,
  options: family.aircraft.map((aircraft) => aircraft.name),
}))

const OTHER_OPTION = [{ value: OTHER_HARDWARE, label: OTHER_HARDWARE_LABEL }]

interface GuestAttendanceFieldProps {
  id: string
  value: string
  onChange: (code: GuestAttendanceCode) => void
  error?: string
}

/**
 * "Will anyone be coming with you?" — two real radios in a real fieldset.
 *
 * Deliberately modest: this is one operational answer, not a step of its own,
 * so it borrows the form's own label, hint and error treatment rather than
 * becoming another card. Nothing is pre-selected, because an untouched default
 * would record an answer the customer never gave, and the first radio carries
 * `id` so the same first-error focus flow as every other details-step field reaches
 * it. No detail about the guest is asked for anywhere.
 */
const GuestAttendanceField = ({ id, value, onChange, error }: GuestAttendanceFieldProps) => (
  // `min-w-0` because a fieldset defaults to min-content width, which would let
  // it push the grid wider than the viewport on a narrow screen. The fieldset is
  // left as a plain block so the legend renders as a legend in every browser
  // rather than being treated as a flex item.
  <fieldset className="min-w-0 sm:col-span-2">
    <legend className="mb-1.5 font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
      Will anyone be coming with you?
    </legend>
    <p id={`${id}-hint`} className="text-[0.87rem] leading-snug text-ink-muted">
      The session remains one-on-one and focused on the person who booked. You&rsquo;re welcome to
      bring one guest if the session remains suitable and safe.
    </p>
    <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
      {GUEST_ATTENDANCE_OPTIONS.map((option, index) => {
        const selected = value === option.code
        return (
          <label key={option.code} className="block cursor-pointer">
            <input
              // Only the first option owns the field id: a radio group is one
              // field, and that is where an error sends focus.
              id={index === 0 ? id : `${id}-${option.code}`}
              type="radio"
              name="guestAttendance"
              value={option.code}
              checked={selected}
              onChange={() => onChange(option.code)}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
              className="peer sr-only"
            />
            <span
              className={cn(
                'flex min-h-12 items-center gap-2.5 rounded-[var(--radius-control)] border px-4 py-3 text-[0.95rem] transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--ease-calm)]',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage',
                selected
                  ? 'border-sage/55 bg-sage-soft/40 font-medium text-eucalyptus'
                  : 'border-ink/12 bg-surface text-ink-soft hover:border-sage/30',
                error && !selected ? 'border-red-700/45' : '',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-[1.15rem] shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ease-[var(--ease-calm)]',
                  selected ? 'border-sage bg-sage' : 'border-ink/25 bg-surface',
                )}
              >
                {selected ? <Check className="size-3 text-surface" /> : null}
              </span>
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
    {error ? (
      <p
        id={`${id}-error`}
        className="mt-1.5 flex items-start gap-1.5 text-[0.87rem] font-medium text-red-800"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    ) : null}
  </fieldset>
)

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4 border-t border-ink/8 py-2.5 first:border-t-0 first:pt-0">
    <dt className="text-[0.9rem] text-ink-soft">{label}</dt>
    <dd className="text-right font-display text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">
      {value}
    </dd>
  </div>
)

/**
 * Step 3 — details, review, then hosted payment.
 *
 * The form collects what the lesson needs, shows the customer exactly what they
 * are about to pay for, and requires an explicit, unticked-by-default
 * acknowledgement of the booking policy. Pressing the button reserves the slot
 * server-side and redirects to Stripe's hosted Checkout page.
 *
 * No card details are collected, displayed or transmitted here — the entire
 * payment happens on Stripe. The price shown is read from the session content,
 * and the price charged is resolved independently on the server from the same
 * catalogue, so the two cannot disagree.
 */
export const BookingDetailsForm = ({
  session,
  location,
  slot,
  timeZone,
  onSlotRejected,
}: BookingDetailsFormProps) => {
  const [values, setValues] = useState<BookingDetailValues>(emptyBookingDetails)
  // What the two equipment selects are showing. The stored values live in
  // `values.droneModel` / `values.controllerModel`, which is what is submitted —
  // these only decide whether that value came from the list or from a text box.
  const [aircraftChoice, setAircraftChoice] = useState('')
  const [controllerChoice, setControllerChoice] = useState('')
  const [errors, setErrors] = useState<FieldErrors<BookingDetailField>>({})
  const [submitting, setSubmitting] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)
  // Reused across retries so a repeated submission can't create a second hold
  // or a second charge. Replaced only once a submission is genuinely finished.
  const attemptRef = useRef(newAttemptId())

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    track('booking_details_started', { session: session.id, location: location.id })
  }, [session.id, location.id])

  const startsAt = new Date(slot)
  const endsAt = new Date(startsAt.getTime() + session.durationMinutes * 60000)

  const update = useCallback(
    <K extends keyof BookingDetailValues>(key: K, value: BookingDetailValues[K]) => {
      setValues((current) => ({ ...current, [key]: value }))
      setErrors((current) => {
        if (!current[key as BookingDetailField]) return current
        const next = { ...current }
        delete next[key as BookingDetailField]
        return next
      })
    },
    [],
  )

  const aircraftIsOther = aircraftChoice === OTHER_HARDWARE
  const controllerIsOther = controllerChoice === OTHER_HARDWARE
  const aircraftChosen = aircraftChoice.length > 0

  /**
   * Changing the aircraft invalidates the controller.
   *
   * A controller that suited the previous aircraft must not survive the change,
   * so both the selection and the stored value are cleared — `update` also drops
   * the field's validation error.
   */
  const handleAircraftChange = (next: string) => {
    setAircraftChoice(next)
    update('droneModel', next === OTHER_HARDWARE ? '' : next)
    setControllerChoice('')
    update('controllerModel', '')
  }

  const handleControllerChange = (next: string) => {
    setControllerChoice(next)
    update('controllerModel', next === OTHER_HARDWARE ? '' : next)
  }

  /** Where to send focus for a field whose control depends on the escape hatch. */
  const focusId = (key: BookingDetailField): string => {
    if (key === 'droneModel' && aircraftIsOther) return OTHER_IDS.aircraft
    if (key === 'controllerModel' && (aircraftIsOther || controllerIsOther)) {
      return OTHER_IDS.controller
    }
    return FIELD_IDS[key]
  }

  const failWith = (message: string) => {
    setProblem(message)
    setSubmitting(false)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const found = validateBookingDetails(values, isExperienceCode)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setProblem(null)
      const firstKey = firstErrorKey(found, BOOKING_FIELD_ORDER)
      requestAnimationFrame(() => {
        if (firstKey) document.getElementById(focusId(firstKey))?.focus()
      })
      return
    }

    setSubmitting(true)
    setProblem(null)
    track('booking_checkout_started', { session: session.id, location: location.id })

    const response: CheckoutResponse = await startCheckout({
      attemptId: attemptRef.current,
      sessionId: session.id,
      locationId: location.id,
      startsAt: startsAt.toISOString(),
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      mobile: values.mobile,
      // Narrowed by the shared validation that has already run above.
      guestAttendance: values.guestAttendance as GuestAttendanceCode,
      droneModel: values.droneModel,
      controllerModel: values.controllerModel,
      experienceCode: values.experienceCode,
      helpWith: values.helpWith,
      notes: values.notes.trim().length > 0 ? values.notes : undefined,
      policyAccepted: values.policyAccepted,
    })

    if (response.status === 'ok') {
      // Leaving the site for Stripe's hosted page. Nothing further runs here.
      window.location.assign(response.url)
      return
    }

    track('booking_checkout_failed', {
      session: session.id,
      location: location.id,
      code: response.code,
    })

    if (response.code === 'slot_taken' || response.code === 'unavailable') {
      // A new attempt id, because the next submission is a genuinely new booking
      // for a different time.
      attemptRef.current = newAttemptId()
      setSubmitting(false)
      onSlotRejected()
      return
    }

    if (response.code === 'location_locked') {
      const locked = findLocation(response.lockedLocationId ?? null)
      attemptRef.current = newAttemptId()
      failWith(
        locked
          ? `That date is already committed to ${locked.name}. Choose another date, or the same training area.`
          : response.message,
      )
      onSlotRejected()
      return
    }

    failWith(response.message)
  }

  const summaryErrors = Object.values(errors).filter((value): value is string => Boolean(value))

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {/*
          The four contact fields read as a deliberate 2 x 2 grid on desktop —
          first and last name on one row, email and mobile on the next — and
          stack in the same order on mobile.
        */}
        <TextField
          id={FIELD_IDS.firstName}
          name="firstName"
          label="First name"
          value={values.firstName}
          onChange={(value) => update('firstName', value)}
          error={errors.firstName}
          autoComplete="given-name"
          maxLength={MAX.name}
        />
        <TextField
          id={FIELD_IDS.lastName}
          name="lastName"
          label="Last name"
          value={values.lastName}
          onChange={(value) => update('lastName', value)}
          error={errors.lastName}
          autoComplete="family-name"
          maxLength={MAX.name}
        />
        <TextField
          id={FIELD_IDS.email}
          name="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={(value) => update('email', value)}
          error={errors.email}
          autoComplete="email"
          maxLength={MAX.email}
          hint="Your confirmation and reminder are sent here."
        />
        <TextField
          id={FIELD_IDS.mobile}
          name="mobile"
          type="tel"
          label="Mobile number"
          value={values.mobile}
          onChange={(value) => update('mobile', value)}
          error={errors.mobile}
          autoComplete="tel"
          maxLength={MAX.mobile}
          hint="So we can reach you on the day."
        />
        <GuestAttendanceField
          id={FIELD_IDS.guestAttendance}
          value={values.guestAttendance}
          onChange={(code) => update('guestAttendance', code)}
          error={errors.guestAttendance}
        />
        {/*
          Equipment. The aircraft decides which controllers exist, so the two
          read as a pair: side by side on desktop, stacked on mobile, with each
          "Other / not listed" text field directly beneath its own control.
        */}
        <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
          <div className="flex flex-col gap-5">
            <SelectField
              id={FIELD_IDS.droneModel}
              name="aircraft"
              label="Aircraft model"
              value={aircraftChoice}
              onChange={handleAircraftChange}
              groups={AIRCRAFT_GROUPS}
              options={OTHER_OPTION}
              placeholder="Choose your aircraft…"
              hint="Choose the drone you’ll bring to your session."
              error={aircraftIsOther ? undefined : errors.droneModel}
            />
            {aircraftIsOther ? (
              <TextField
                id={OTHER_IDS.aircraft}
                name="droneModel"
                label="Aircraft make and model"
                value={values.droneModel}
                onChange={(value) => update('droneModel', value)}
                error={errors.droneModel}
                maxLength={MAX.droneModel}
                hint="The make and model as the manufacturer names it."
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            {aircraftIsOther ? (
              // Outside the catalogue there is no compatibility to calculate,
              // so the controller is asked for plainly rather than guessed at.
              <TextField
                id={OTHER_IDS.controller}
                name="controllerModel"
                label="Controller / RC make and model"
                value={values.controllerModel}
                onChange={(value) => update('controllerModel', value)}
                error={errors.controllerModel}
                maxLength={MAX.controllerModel}
                hint="Whatever you fly it with."
              />
            ) : (
              <>
                <SelectField
                  id={FIELD_IDS.controllerModel}
                  name="controller"
                  label="Controller / RC"
                  value={controllerChoice}
                  onChange={handleControllerChange}
                  options={
                    aircraftChosen
                      ? [...compatibleControllers(aircraftChoice), ...OTHER_OPTION]
                      : []
                  }
                  placeholder={
                    aircraftChosen ? 'Choose your controller…' : 'Choose your aircraft first…'
                  }
                  disabled={!aircraftChosen}
                  hint="Only controllers compatible with this aircraft are shown."
                  error={controllerIsOther ? undefined : errors.controllerModel}
                />
                {controllerIsOther ? (
                  <TextField
                    id={OTHER_IDS.controller}
                    name="controllerModel"
                    label="Controller / RC model"
                    value={values.controllerModel}
                    onChange={(value) => update('controllerModel', value)}
                    error={errors.controllerModel}
                    maxLength={MAX.controllerModel}
                    hint="Tell us what it says on the controller."
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
        <SelectField
          id={FIELD_IDS.experienceCode}
          name="experienceCode"
          label="Experience level"
          value={values.experienceCode}
          onChange={(value) => update('experienceCode', value)}
          options={EXPERIENCE_LEVELS.map((level) => ({ value: level.code, label: level.label }))}
          error={errors.experienceCode}
          className="sm:col-span-2"
        />
        <TextareaField
          id={FIELD_IDS.helpWith}
          name="helpWith"
          label="What you’d like help with"
          value={values.helpWith}
          onChange={(value) => update('helpWith', value)}
          error={errors.helpWith}
          maxLength={MAX.helpWith}
          hint="The more specific you are, the more we can tailor the session."
          className="sm:col-span-2"
        />
        <TextareaField
          id={FIELD_IDS.notes}
          name="notes"
          label="Additional notes"
          value={values.notes}
          onChange={(value) => update('notes', value)}
          error={errors.notes}
          maxLength={MAX.notes}
          optional
          rows={3}
          className="sm:col-span-2"
        />
      </div>

      <section
        aria-labelledby="booking-review-heading"
        className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-5 sm:p-6"
      >
        <h3
          id="booking-review-heading"
          className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]"
        >
          Review your booking
        </h3>
        <dl className="mt-4 flex flex-col">
          <ReviewRow label="Session" value={session.name} />
          <ReviewRow label="Length" value={formatDuration(session.durationMinutes)} />
          <ReviewRow label="Date" value={formatLongDate(startsAt, timeZone)} />
          <ReviewRow label="Time" value={formatTimeRange(startsAt, endsAt, timeZone)} />
          <ReviewRow label="Training area" value={location.enquiryValue} />
          {isGuestAttendanceCode(values.guestAttendance) ? (
            <ReviewRow
              label="Attending"
              value={values.guestAttendance === 'one-guest' ? 'Me + one guest' : 'Just me'}
            />
          ) : null}
          {/* A last chance to notice the wrong aircraft or controller was picked. */}
          {values.droneModel.trim().length > 0 ? (
            <ReviewRow label="Aircraft" value={values.droneModel} />
          ) : null}
          {values.controllerModel.trim().length > 0 ? (
            <ReviewRow label="Controller / RC" value={values.controllerModel} />
          ) : null}
          <ReviewRow label="Total due today" value={formatPrice(session.price)} />
        </dl>
        <p className="mt-4 text-[0.87rem] leading-relaxed text-ink-muted">
          Your exact meeting point is confirmed with your booking. Specific parks can&rsquo;t be
          guaranteed, and the flying area within a training area may be adjusted on the day.
        </p>
      </section>

      <CheckboxField
        id={FIELD_IDS.policyAccepted}
        name="policyAccepted"
        checked={values.policyAccepted}
        onChange={(checked) => update('policyAccepted', checked)}
        error={errors.policyAccepted}
      >
        I&rsquo;ve read and accept the{' '}
        <Link
          to={ROUTES.bookingPolicy}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
        >
          Booking &amp; Cancellation Policy
        </Link>
        , including the cancellation and weather terms.
      </CheckboxField>

      <ErrorSummary errors={summaryErrors} id="booking-error-summary" />

      {problem ? (
        <div
          ref={summaryRef}
          role="alert"
          tabIndex={-1}
          className="rounded-[var(--radius-control)] border border-red-800/25 bg-red-50/70 p-4 text-[0.93rem] leading-relaxed text-red-900"
        >
          {problem}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Taking you to secure payment…' : 'Continue to secure payment'}
          </Button>
        </div>
        <p className="flex items-start gap-2 text-[0.87rem] leading-relaxed text-ink-muted">
          <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-sage" />
          Payment is completed on Stripe&rsquo;s secure checkout page. Card details are never entered
          on, or stored by, this website.
        </p>
        <p className="flex items-start gap-2 text-[0.87rem] leading-relaxed text-ink-muted">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-sage" />
          Your time is held while you complete payment. If you don&rsquo;t finish, the hold is
          released and the time becomes available again.
        </p>
      </div>
    </form>
  )
}
