import { Check } from 'lucide-react'

interface SuccessPanelProps {
  title: string
  children: React.ReactNode
  onReset?: () => void
  resetLabel?: string
}

export const SuccessPanel = ({ title, children, onReset, resetLabel }: SuccessPanelProps) => (
  <div
    role="status"
    className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-sage/25 bg-sage-soft/60 p-7 sm:p-9"
  >
    <span className="grid size-11 place-items-center rounded-full bg-eucalyptus text-canvas">
      <Check aria-hidden="true" className="size-5" />
    </span>
    <h3 className="text-[1.4rem]">{title}</h3>
    <div className="measure space-y-2 text-ink-soft">{children}</div>
    {onReset ? (
      <button
        type="button"
        onClick={onReset}
        className="self-start text-[0.95rem] font-medium text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
      >
        {resetLabel ?? 'Send another message'}
      </button>
    ) : null}
  </div>
)
