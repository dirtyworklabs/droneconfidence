import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const controlClass =
  'w-full min-h-12 rounded-[var(--radius-control)] border border-ink/12 bg-surface px-4 py-3 text-[1rem] text-ink transition-[border-color,box-shadow] duration-200 ease-[var(--ease-calm)] placeholder:text-ink-muted/70 hover:border-ink/20 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25 aria-[invalid=true]:border-red-700/60 aria-[invalid=true]:ring-red-700/15'

interface FieldShellProps {
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

const FieldShell = ({ id, label, error, hint, optional, children, className }: FieldShellProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label htmlFor={id} className="font-display text-[0.95rem] font-semibold tracking-[-0.01em]">
      {label}
      {optional ? <span className="pl-1.5 font-sans font-normal text-ink-muted">(optional)</span> : null}
    </label>
    {hint ? (
      <p id={`${id}-hint`} className="text-[0.87rem] leading-snug text-ink-muted">
        {hint}
      </p>
    ) : null}
    {children}
    {error ? (
      <p id={`${id}-error`} className="flex items-start gap-1.5 text-[0.87rem] font-medium text-red-800">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    ) : null}
  </div>
)

const describedBy = (id: string, error?: string, hint?: string): string | undefined => {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

interface TextFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  error?: string
  hint?: string
  optional?: boolean
  autoComplete?: string
  maxLength?: number
  placeholder?: string
  className?: string
}

export const TextField = ({
  id,
  name,
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  optional,
  autoComplete,
  maxLength,
  placeholder,
  className,
}: TextFieldProps) => (
  <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={controlClass}
    />
  </FieldShell>
)

/**
 * A select option. A plain string is both the value and the label; the object
 * form is for fields that store a stable code — booking experience levels are
 * saved as `new`/`some`/… so the wording can change without rewriting bookings.
 */
export type SelectOption = string | { value: string; label: string }

const optionValue = (option: SelectOption): string =>
  typeof option === 'string' ? option : option.value

const optionLabel = (option: SelectOption): string =>
  typeof option === 'string' ? option : option.label

/**
 * A labelled set of options, rendered as a real `<optgroup>`.
 *
 * Additive: a field that passes only `options` behaves exactly as before. When
 * both are given, groups render first and `options` after them, which is how
 * the booking aircraft field puts "Other / not listed" beneath the DJI families.
 */
export interface SelectOptionGroup {
  label: string
  options: ReadonlyArray<SelectOption>
}

const Choice = ({ option }: { option: SelectOption }) => (
  <option value={optionValue(option)}>{optionLabel(option)}</option>
)

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'id' | 'name'> {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  options?: ReadonlyArray<SelectOption>
  groups?: ReadonlyArray<SelectOptionGroup>
  placeholder?: string
  error?: string
  hint?: string
  className?: string
}

export const SelectField = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  groups,
  placeholder = 'Please choose…',
  error,
  hint,
  className,
  ...rest
}: SelectFieldProps) => (
  <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
    <select
      id={id}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={cn(
        controlClass,
        'appearance-none bg-[length:16px] pr-10 disabled:cursor-not-allowed disabled:border-ink/8 disabled:bg-canvas disabled:text-ink-muted',
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2366716D' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
      }}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {groups?.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <Choice key={optionValue(option)} option={option} />
          ))}
        </optgroup>
      ))}
      {options?.map((option) => (
        <Choice key={optionValue(option)} option={option} />
      ))}
    </select>
  </FieldShell>
)

interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'id' | 'name'> {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  optional?: boolean
  className?: string
}

export const TextareaField = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  className,
  rows = 4,
  ...rest
}: TextareaFieldProps) => (
  <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
    <textarea
      id={id}
      name={name}
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hint)}
      className={cn(controlClass, 'min-h-28 resize-y leading-relaxed')}
      {...rest}
    />
  </FieldShell>
)

interface CheckboxFieldProps {
  id: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string
  children: ReactNode
  className?: string
}

/**
 * A single acknowledgement checkbox.
 *
 * Always renders unticked from its `checked` prop — a policy acknowledgement is
 * never pre-selected — and the label content is passed in so it can carry a link.
 */
export const CheckboxField = ({
  id,
  name,
  checked,
  onChange,
  error,
  children,
  className,
}: CheckboxFieldProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-0.5 size-5 shrink-0 rounded-[6px] border border-ink/25 accent-sage focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
      />
      <label htmlFor={id} className="text-[0.95rem] leading-relaxed text-ink-soft">
        {children}
      </label>
    </div>
    {error ? (
      <p id={`${id}-error`} className="flex items-start gap-1.5 pl-8 text-[0.87rem] font-medium text-red-800">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>{error}</span>
      </p>
    ) : null}
  </div>
)

/** Hidden field bots fill in. Kept out of the tab order and the a11y tree. */
export const Honeypot = () => (
  <p className="hidden" aria-hidden="true">
    <label>
      Leave this field empty
      <input name="bot-field" tabIndex={-1} autoComplete="off" />
    </label>
  </p>
)

interface ErrorSummaryProps {
  errors: string[]
  id: string
}

export const ErrorSummary = ({ errors, id }: ErrorSummaryProps) => {
  if (errors.length === 0) return null

  return (
    <div
      id={id}
      role="alert"
      tabIndex={-1}
      className="rounded-[var(--radius-control)] border border-red-800/25 bg-red-50/70 p-4"
    >
      <p className="flex items-center gap-2 font-display text-[0.95rem] font-semibold text-red-900">
        <AlertCircle aria-hidden="true" className="size-4" />
        {errors.length === 1 ? 'One field needs attention' : `${errors.length} fields need attention`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-8 text-[0.9rem] text-red-900/90">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
