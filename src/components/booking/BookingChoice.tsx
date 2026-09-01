import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface BookingChoiceProps {
  /** Radio group name — shared by every choice in a step. */
  name: string
  value: string
  selected: boolean
  onSelect: () => void
  children: ReactNode
  className?: string
}

/**
 * A selectable booking card.
 *
 * It is a real radio input inside a label, so arrow keys move between options,
 * the group is announced correctly and focus is visible. Selection is shown
 * three ways — border and fill, a tick, and the word "Selected" — so it never
 * depends on colour or animation alone.
 */
export const BookingChoice = ({
  name,
  value,
  selected,
  onSelect,
  children,
  className,
}: BookingChoiceProps) => (
  <label className={cn('group block cursor-pointer', className)}>
    <input
      type="radio"
      name={name}
      value={value}
      checked={selected}
      onChange={onSelect}
      className="peer sr-only"
    />

    <span
      className={cn(
        'flex h-full flex-col gap-4 rounded-[var(--radius-card)] border p-5 transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--ease-calm)] sm:p-6',
        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sage',
        selected
          ? 'border-sage/55 bg-sage-soft/40 shadow-[var(--shadow-raise)]'
          : 'border-ink/8 bg-surface hover:border-sage/30 hover:shadow-[var(--shadow-raise)]',
      )}
    >
      {children}

      <span
        className={cn(
          'mt-auto flex min-h-6 items-center gap-1.5 border-t pt-3.5 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ease-[var(--ease-calm)]',
          selected ? 'border-sage/25 text-sage' : 'border-ink/8 text-ink-muted',
        )}
      >
        {selected ? (
          <>
            <Check aria-hidden="true" className="size-3.5 shrink-0" />
            Selected
          </>
        ) : (
          'Select'
        )}
      </span>
    </span>
  </label>
)
