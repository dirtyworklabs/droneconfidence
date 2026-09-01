import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { RevealItem } from '@/components/ui/Reveal'
import { formatDuration, formatPrice } from '@/content/sessions'
import type { Session } from '@/types'

export const SessionCard = ({ session }: { session: Session }) => (
  <RevealItem
    as="li"
    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-surface shadow-[var(--shadow-raise)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-1 hover:border-sage/25 hover:shadow-[var(--shadow-lift)]"
  >
    <ImageFrame slot={session.imageSlot} ratio="aspect-[16/10]" rounded="none" className="border-0 border-b border-ink/8" />

    <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
      <div className="flex flex-col gap-3">
        <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.2em] text-sage">
          {session.label}
        </p>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-display text-[2rem] font-bold leading-none tracking-[-0.035em]">
            {formatPrice(session.price)}
          </p>
          <p className="inline-flex items-center gap-1.5 text-[0.92rem] text-ink-muted">
            <Clock aria-hidden="true" className="size-3.5" />
            {formatDuration(session.durationMinutes)} · One-on-one
          </p>
        </div>

        <h3 className="text-[1.3rem] leading-snug">{session.tagline}</h3>
      </div>

      <p className="text-[0.99rem] leading-relaxed text-ink-soft">{session.summary}</p>

      <div className="mt-auto flex flex-col gap-4 border-t border-ink/8 pt-5">
        <p className="text-[0.92rem] text-ink-soft">
          <span className="font-display font-semibold text-ink">Best for </span>
          {session.bestFor}
        </p>

        <BookingCta sessionId={session.id} fullWidth context="home-session-card">
          {session.ctaLabel}
        </BookingCta>

        <Link
          to={`/sessions#${session.id}`}
          className="group/link inline-flex items-center gap-1.5 self-start text-[0.92rem] font-medium text-sage transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
        >
          See what we can cover
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-[var(--ease-calm)] group-hover/link:translate-x-1"
          />
        </Link>
      </div>
    </div>
  </RevealItem>
)
