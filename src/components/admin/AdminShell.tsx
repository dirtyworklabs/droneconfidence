import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

interface AdminShellProps {
  /** Shown in the header, e.g. the signed-in owner's email. */
  identity?: string | null
  onSignOut?: () => void
  children: ReactNode
}

/**
 * The admin chrome — deliberately not the marketing layout.
 *
 * No site navigation, no footer, no hero: this is a working surface, so it is
 * compact, dense and quiet. It reuses the design tokens so it still looks like
 * the same product, but nothing here is shared with the public pages, and the
 * marketing header can never link into it.
 */
export const AdminShell = ({ identity, onSignOut, children }: AdminShellProps) => (
  <div className="min-h-dvh bg-canvas">
    <header className="border-b border-ink/8 bg-surface">
      <div className="mx-auto flex max-w-[72rem] flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[1rem] font-semibold tracking-[-0.02em]">
            Drone Confidence
          </span>
          <span className="text-[0.72rem] uppercase tracking-[0.18em] text-sage">Bookings</span>
        </div>
        <div className="flex items-center gap-4 text-[0.85rem] text-ink-muted">
          {identity ? <span className="hidden sm:inline">{identity}</span> : null}
          <Link
            to={ROUTES.home}
            className="underline decoration-ink/20 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-ink"
          >
            View site
          </Link>
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-9 rounded-[var(--radius-control)] border border-ink/12 px-3 font-medium text-ink-soft transition-colors duration-200 ease-[var(--ease-calm)] hover:border-ink/25 hover:text-ink"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-[72rem] px-5 py-8 sm:px-8 sm:py-10">{children}</main>
  </div>
)

interface AdminPanelProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** A titled block of admin content. */
export const AdminPanel = ({
  title,
  description,
  actions,
  children,
  className,
}: AdminPanelProps) => (
  <section
    className={cn(
      'rounded-[var(--radius-card)] border border-ink/8 bg-surface p-5 sm:p-6',
      className,
    )}
  >
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
    <div className="mt-5">{children}</div>
  </section>
)

/** Inline status line: a problem, a confirmation, or nothing. */
export const AdminNotice = ({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'info'
  children: ReactNode
}) => (
  <p
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'rounded-[var(--radius-control)] border p-3 text-[0.9rem] leading-relaxed',
      tone === 'error'
        ? 'border-red-800/25 bg-red-50/70 text-red-900'
        : tone === 'success'
          ? 'border-sage/30 bg-sage/8 text-ink-soft'
          : 'border-ink/10 bg-canvas text-ink-soft',
    )}
  >
    {children}
  </p>
)
