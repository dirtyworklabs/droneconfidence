import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { formatDuration, formatPrice } from '@/content/sessions'
import { ROUTES } from '@/lib/routes'
import { calm } from '@/lib/motion'
import type { Session, TrainingLocation } from '@/types'

interface BookingSummaryProps {
  session: Session | null
  location: TrainingLocation | null
}

/** Values fade in as they change; static under prefers-reduced-motion. */
const Value = ({ children }: { children: string }) => {
  const reduced = useReducedMotion()

  if (reduced) {
    return <span className="font-display font-semibold text-ink">{children}</span>
  }

  return (
    <motion.span
      key={children}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={calm(0.25)}
      className="font-display font-semibold text-ink"
    >
      {children}
    </motion.span>
  )
}

const Row = ({ label, value }: { label: string; value: string | null }) => (
  <div className="flex items-baseline justify-between gap-4 border-t border-ink/8 py-2.5 first:border-t-0 first:pt-0">
    <dt className="text-[0.9rem] text-ink-soft">{label}</dt>
    <dd className="text-right text-[0.95rem]">
      {value === null ? (
        <span className="text-ink-muted">Not chosen yet</span>
      ) : (
        <Value>{value}</Value>
      )}
    </dd>
  </div>
)

/**
 * Running summary of the current selection.
 *
 * Deliberately light: a sticky sidebar on wide screens, and a compact panel in
 * the normal document flow on phones. Every value is read from the session and
 * location content through the shared formatters — nothing is duplicated.
 */
export const BookingSummary = ({ session, location }: BookingSummaryProps) => (
  <aside aria-labelledby="booking-summary-heading" className="lg:sticky lg:top-24">
    <div className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-5 sm:p-6">
      <h2
        id="booking-summary-heading"
        className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]"
      >
        Your session
      </h2>

      <dl className="mt-4 flex flex-col">
        <Row label="Session" value={session?.name ?? null} />
        <Row label="Duration" value={session ? formatDuration(session.durationMinutes) : null} />
        <Row label="Price" value={session ? formatPrice(session.price) : null} />
        <Row label="Training area" value={location?.area ?? null} />
      </dl>

      <div className="mt-5 flex flex-col gap-2.5 border-t border-ink/8 pt-4 text-[0.87rem] leading-relaxed text-ink-muted">
        <p>Private one-on-one training for a fixed session length.</p>
        <p>
          If conditions aren&rsquo;t suitable, you can reschedule at no cost or take a full refund.
        </p>
        <p>
          <Link
            to={ROUTES.bookingPolicy}
            className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
          >
            Booking &amp; cancellation policy
          </Link>
        </p>
      </div>
    </div>
  </aside>
)
