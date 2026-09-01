import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorSummary, Honeypot, SelectField, TextField, TextareaField } from '@/components/forms/Fields'
import { SuccessPanel } from '@/components/forms/SuccessPanel'
import { preferredSessionOptions } from '@/content/sessions'
import { experienceOptions, trainingAreaOptions } from '@/content/locations'
import { createSubmissionGuard, submitNetlifyForm, type SubmitState } from '@/lib/netlifyForms'
import {
  MAX,
  optionalLength,
  requireChoice,
  requireEmail,
  requireMobile,
  requireText,
  type FieldErrors,
} from '@/lib/validation'
import { track } from '@/lib/analytics'

const FORM_NAME = 'session-enquiry'

type FieldName =
  | 'name'
  | 'email'
  | 'mobile'
  | 'preferred_session'
  | 'training_area'
  | 'custom_location'
  | 'drone_model'
  | 'experience'
  | 'help_with'
  | 'notes'
  | 'preferred_timing'

const initialValues: Record<FieldName, string> = {
  name: '',
  email: '',
  mobile: '',
  preferred_session: '',
  training_area: '',
  custom_location: '',
  drone_model: '',
  experience: '',
  help_with: '',
  notes: '',
  preferred_timing: '',
}

const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'mobile',
  'preferred_session',
  'training_area',
  'custom_location',
  'drone_model',
  'experience',
  'help_with',
  'notes',
  'preferred_timing',
]

const CUSTOM_AREA = 'Custom location enquiry'

interface EnquiryFormProps {
  /** Recorded with the submission so replies have context. Never personal data. */
  sourcePage: string
  /** Pre-selects a session when arriving from a specific card. */
  defaultSession?: string
  defaultTrainingArea?: string
}

/**
 * Interest / enquiry form used on /book.
 *
 * It never implies a session has been booked — the success state only confirms
 * the enquiry was received. Handled by Netlify Forms; no CRM, no email service.
 */
export const EnquiryForm = ({ sourcePage, defaultSession, defaultTrainingArea }: EnquiryFormProps) => {
  const [values, setValues] = useState<Record<FieldName, string>>({
    ...initialValues,
    preferred_session: defaultSession ?? '',
    training_area: defaultTrainingArea ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors<FieldName>>({})
  const [state, setState] = useState<SubmitState>('idle')
  const [failureMessage, setFailureMessage] = useState<string>()
  const summaryRef = useRef<HTMLDivElement>(null)
  const guard = useRef(createSubmissionGuard())

  const set = (field: FieldName) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const customArea = values.training_area === CUSTOM_AREA

  const validate = (): FieldErrors<FieldName> => {
    const next: FieldErrors<FieldName> = {
      name: requireText(values.name, 'Name', MAX.name),
      email: requireEmail(values.email),
      mobile: requireMobile(values.mobile),
      preferred_session: requireChoice(values.preferred_session, 'a preferred session'),
      training_area: requireChoice(values.training_area, 'a preferred training area'),
      drone_model: requireText(values.drone_model, 'Drone model', MAX.shortText),
      experience: requireChoice(values.experience, 'your experience level'),
      help_with: requireText(values.help_with, 'What you’d like help with', MAX.message),
      notes: optionalLength(values.notes, 'Additional notes', MAX.notes),
      preferred_timing: optionalLength(values.preferred_timing, 'Preferred timing', MAX.shortText),
      custom_location: customArea
        ? requireText(values.custom_location, 'Suburb or location', MAX.shortText)
        : undefined,
    }

    return Object.fromEntries(
      Object.entries(next).filter(([, message]) => Boolean(message)),
    ) as FieldErrors<FieldName>
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    const payload: Record<string, string> = {
      name: values.name.trim(),
      email: values.email.trim(),
      mobile: values.mobile.trim(),
      preferred_session: values.preferred_session,
      training_area: values.training_area,
      custom_location: values.custom_location.trim(),
      drone_model: values.drone_model.trim(),
      experience: values.experience,
      help_with: values.help_with.trim(),
      notes: values.notes.trim(),
      preferred_timing: values.preferred_timing.trim(),
      source_page: sourcePage,
    }

    if (guard.current.isDuplicate(payload)) {
      setState('success')
      return
    }

    setState('submitting')
    setFailureMessage(undefined)

    const result = await submitNetlifyForm(FORM_NAME, payload)

    if (result.ok) {
      guard.current.remember(payload)
      setState('success')
      track('enquiry_submitted', { form: FORM_NAME, source: sourcePage })
      return
    }

    setState('error')
    setFailureMessage(result.message)
  }

  if (state === 'success') {
    return (
      <SuccessPanel
        title="Thanks — we’ll be in touch."
        onReset={() => {
          setValues({ ...initialValues })
          setState('idle')
        }}
        resetLabel="Send another enquiry"
      >
        <p>Your enquiry has been received.</p>
        <p>
          We&rsquo;ll reply with the information you asked for and let you know as soon as online booking
          is available.
        </p>
      </SuccessPanel>
    )
  }

  const summaryErrors = FIELD_ORDER.map((field) => errors[field]).filter(
    (message): message is string => Boolean(message),
  )

  return (
    <form
      name={FORM_NAME}
      method="POST"
      data-netlify="true"
      netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="form-name" value={FORM_NAME} />
      <input type="hidden" name="source_page" value={sourcePage} />
      <Honeypot />

      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        <ErrorSummary id="enquiry-errors" errors={summaryErrors} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="enquiry-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={set('name')}
          autoComplete="name"
          maxLength={MAX.name}
          error={errors.name}
        />
        <TextField
          id="enquiry-email"
          name="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={set('email')}
          autoComplete="email"
          maxLength={MAX.email}
          error={errors.email}
        />
        <TextField
          id="enquiry-mobile"
          name="mobile"
          type="tel"
          label="Mobile"
          value={values.mobile}
          onChange={set('mobile')}
          autoComplete="tel"
          maxLength={MAX.mobile}
          error={errors.mobile}
        />
        <TextField
          id="enquiry-drone"
          name="drone_model"
          label="Drone model"
          value={values.drone_model}
          onChange={set('drone_model')}
          maxLength={MAX.shortText}
          placeholder="e.g. DJI Mini 4 Pro"
          hint="Still deciding, or nothing yet? Just tell us that."
          error={errors.drone_model}
        />
        <SelectField
          id="enquiry-session"
          name="preferred_session"
          label="Preferred session"
          value={values.preferred_session}
          onChange={set('preferred_session')}
          options={preferredSessionOptions}
          error={errors.preferred_session}
        />
        <SelectField
          id="enquiry-area"
          name="training_area"
          label="Preferred training area"
          value={values.training_area}
          onChange={set('training_area')}
          options={trainingAreaOptions}
          error={errors.training_area}
        />
      </div>

      {customArea ? (
        <div className="grid gap-5 rounded-[var(--radius-control)] border border-sand/70 bg-sand-soft/60 p-5 sm:grid-cols-2">
          <p className="text-[0.92rem] leading-relaxed text-ink-soft sm:col-span-2">
            Other Sydney locations may be possible by arrangement. Additional travel, venue or permit
            costs may apply and will always be confirmed before you book.
          </p>
          <TextField
            id="enquiry-custom-location"
            name="custom_location"
            label="Preferred suburb or location"
            value={values.custom_location}
            onChange={set('custom_location')}
            maxLength={MAX.shortText}
            error={errors.custom_location}
          />
          <TextField
            id="enquiry-timing"
            name="preferred_timing"
            label="Preferred timing"
            value={values.preferred_timing}
            onChange={set('preferred_timing')}
            maxLength={MAX.shortText}
            placeholder="e.g. weekend mornings"
            optional
            error={errors.preferred_timing}
          />
        </div>
      ) : null}

      <SelectField
        id="enquiry-experience"
        name="experience"
        label="Experience level"
        value={values.experience}
        onChange={set('experience')}
        options={experienceOptions}
        error={errors.experience}
      />

      <TextareaField
        id="enquiry-help"
        name="help_with"
        label="What would you most like help with?"
        value={values.help_with}
        onChange={set('help_with')}
        maxLength={MAX.message}
        error={errors.help_with}
      />

      <TextareaField
        id="enquiry-notes"
        name="notes"
        label="Additional notes"
        value={values.notes}
        onChange={set('notes')}
        maxLength={MAX.notes}
        rows={3}
        optional
        error={errors.notes}
      />

      {state === 'error' && failureMessage ? (
        <p role="alert" className="text-[0.92rem] font-medium text-red-800">
          {failureMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={state === 'submitting'} withArrow>
          {state === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </Button>
        <p className="text-[0.87rem] text-ink-muted">
          Sending an enquiry doesn&rsquo;t book a session or take a payment.
        </p>
      </div>
    </form>
  )
}
