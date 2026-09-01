import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ErrorSummary, Honeypot, SelectField, TextField, TextareaField } from '@/components/forms/Fields'
import { SuccessPanel } from '@/components/forms/SuccessPanel'
import { preferredSessionOptions } from '@/content/sessions'
import { createSubmissionGuard, submitNetlifyForm, type SubmitState } from '@/lib/netlifyForms'
import {
  MAX,
  optionalLength,
  requireChoice,
  requireEmail,
  requireText,
  type FieldErrors,
} from '@/lib/validation'
import { track } from '@/lib/analytics'

const FORM_NAME = 'contact'

export const CUSTOM_LOCATION_ENQUIRY = 'Custom location'

export const enquiryTypes = [
  'Which session should I choose?',
  'Is my drone suitable?',
  CUSTOM_LOCATION_ENQUIRY,
  'Booking question',
  'Other',
]

type FieldName = 'name' | 'email' | 'mobile' | 'enquiry_type' | 'custom_location' | 'preferred_session' | 'message'

const initialValues: Record<FieldName, string> = {
  name: '',
  email: '',
  mobile: '',
  enquiry_type: '',
  custom_location: '',
  preferred_session: '',
  message: '',
}

const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'mobile',
  'enquiry_type',
  'custom_location',
  'preferred_session',
  'message',
]

interface ContactFormProps {
  sourcePage: string
  defaultEnquiryType?: string
}

export const ContactForm = ({ sourcePage, defaultEnquiryType }: ContactFormProps) => {
  const [values, setValues] = useState<Record<FieldName, string>>({
    ...initialValues,
    enquiry_type: defaultEnquiryType ?? '',
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

  const isCustomLocation = values.enquiry_type === CUSTOM_LOCATION_ENQUIRY

  const validate = (): FieldErrors<FieldName> => {
    const next: FieldErrors<FieldName> = {
      name: requireText(values.name, 'Name', MAX.name),
      email: requireEmail(values.email),
      mobile: optionalLength(values.mobile, 'Mobile', MAX.mobile),
      enquiry_type: requireChoice(values.enquiry_type, 'an enquiry type'),
      message: requireText(values.message, 'Message', MAX.message),
      custom_location: optionalLength(values.custom_location, 'Preferred suburb or location', MAX.shortText),
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
      enquiry_type: values.enquiry_type,
      custom_location: isCustomLocation ? values.custom_location.trim() : '',
      preferred_session: isCustomLocation ? values.preferred_session : '',
      message: values.message.trim(),
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
      >
        <p>Your enquiry has been received.</p>
        <p>We&rsquo;ll get back to you with an answer as soon as we can.</p>
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
        <ErrorSummary id="contact-errors" errors={summaryErrors} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contact-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={set('name')}
          autoComplete="name"
          maxLength={MAX.name}
          error={errors.name}
        />
        <TextField
          id="contact-email"
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
          id="contact-mobile"
          name="mobile"
          type="tel"
          label="Mobile"
          value={values.mobile}
          onChange={set('mobile')}
          autoComplete="tel"
          maxLength={MAX.mobile}
          optional
          error={errors.mobile}
        />
        <SelectField
          id="contact-type"
          name="enquiry_type"
          label="Enquiry type"
          value={values.enquiry_type}
          onChange={set('enquiry_type')}
          options={enquiryTypes}
          error={errors.enquiry_type}
        />
      </div>

      {isCustomLocation ? (
        <div className="grid gap-5 rounded-[var(--radius-control)] border border-sand/70 bg-sand-soft/60 p-5 sm:grid-cols-2">
          <p className="text-[0.92rem] leading-relaxed text-ink-soft sm:col-span-2">
            Other Sydney locations may be possible by arrangement. Additional travel, venue or permit
            costs may apply and will always be confirmed before you book.
          </p>
          <TextField
            id="contact-location"
            name="custom_location"
            label="Preferred suburb or location"
            value={values.custom_location}
            onChange={set('custom_location')}
            maxLength={MAX.shortText}
            optional
            error={errors.custom_location}
          />
          <SelectField
            id="contact-session"
            name="preferred_session"
            label="Preferred session"
            value={values.preferred_session}
            onChange={set('preferred_session')}
            options={preferredSessionOptions}
            placeholder="Optional — if you know"
          />
        </div>
      ) : null}

      <TextareaField
        id="contact-message"
        name="message"
        label="Message"
        value={values.message}
        onChange={set('message')}
        maxLength={MAX.message}
        rows={5}
        hint="Tell us about your drone, your experience so far and what you’d like help with."
        error={errors.message}
      />

      {state === 'error' && failureMessage ? (
        <p role="alert" className="text-[0.92rem] font-medium text-red-800">
          {failureMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={state === 'submitting'} withArrow>
          {state === 'submitting' ? 'Sending…' : 'Send message'}
        </Button>
        <p className="text-[0.87rem] text-ink-muted">
          Sending a message doesn&rsquo;t book a session or take a payment.
        </p>
      </div>
    </form>
  )
}
