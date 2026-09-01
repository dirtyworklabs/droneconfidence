import { RevealGroup, RevealItem } from '@/components/ui/Reveal'

interface PolicyRow {
  when: string
  outcome: string
  detail?: string
}

/** Single source of truth for the published cancellation outcomes. */
export const cancellationRows: PolicyRow[] = [
  {
    when: 'More than 24 hours before your booking',
    outcome: 'Full refund',
    detail: 'Cancel or reschedule more than 24 hours before the session.',
  },
  {
    when: 'Within 24 hours',
    outcome: '50% refunded · 50% retained',
    detail: 'Cancel within 24 hours of the session.',
  },
  {
    when: 'No-show',
    outcome: '50% refunded · 50% retained',
    detail: 'Failure to attend a confirmed booking.',
  },
  {
    when: 'Weather or unsuitable conditions determined by Drone Confidence',
    outcome: 'Free reschedule or full refund — your choice',
    detail: 'No cancellation fee.',
  },
]

export const CancellationPolicy = ({ heading = 'Cancellation & refunds' }: { heading?: string }) => (
  <div className="rounded-[var(--radius-card)] border border-ink/8 bg-canvas p-6 sm:p-8">
    <h3 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">{heading}</h3>

    <RevealGroup as="dl" staggerChildren={0.05} className="mt-5 flex flex-col">
      {cancellationRows.map((row) => (
        <RevealItem key={row.when} className="border-t border-ink/8 py-4 first:border-t-0 first:pt-0">
          <dt className="font-display text-[0.98rem] font-semibold tracking-[-0.01em] text-ink">
            {row.when}
          </dt>
          <dd className="pt-1 text-[0.96rem] text-ink-soft">
            <span className="font-medium text-eucalyptus">{row.outcome}</span>
            {row.detail ? <span className="block pt-0.5 text-ink-muted">{row.detail}</span> : null}
          </dd>
        </RevealItem>
      ))}
    </RevealGroup>

    <p className="mt-5 border-t border-ink/8 pt-4 text-[0.9rem] leading-relaxed text-ink-muted">
      Refunds are returned through the original payment method and may take several business days to
      appear, depending on your bank or payment provider.
    </p>
  </div>
)
