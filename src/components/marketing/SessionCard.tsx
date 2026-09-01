import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { RevealItem } from '@/components/ui/Reveal'
import { formatDuration, formatPrice } from '@/content/sessions'
import type { Session } from '@/types'

/**
 * Homepage session card.
 *
 * Reading order is deliberate: session name, price and duration, tagline, one
 * explanation, who it suits, then a single primary action. The section above
 * already establishes that every session is one-on-one, so the cards don't
 * repeat it, and the price never appears twice.
 */
export const SessionCard = ({ session }: { session: Session }) => (
  <RevealItem
    as="li"
    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-surface transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)]"
  >
    <ImageFrame slot={session.imageSlot} ratio="aspect-[16/10]" rounded="none" className="border-0 border-b border-ink/8" />

    <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[1.45rem] tracking-[-0.03em]">{session.name}</h3>

        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="font-display text-[1.55rem] font-bold leading-none tracking-[-0.035em] text-ink">
            {formatPrice(session.price)}
          </span>
          <span className="text-[0.92rem] text-ink-muted">{formatDuration(session.durationMinutes)}</span>
        </p>

        <p className="font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-eucalyptus">
          {session.tagline}
        </p>
      </div>

      <p className="text-[0.99rem] leading-relaxed text-ink-soft">{session.summary}</p>

      <div className="mt-auto flex flex-col gap-4 pt-2">
        <p className="border-t border-ink/8 pt-4 text-[0.92rem] text-ink-soft">
          <span className="font-display font-semibold text-ink">Best for </span>
          {session.bestFor}
        </p>

        <BookingCta sessionId={session.id} fullWidth context="home-session-card">
          {session.ctaLabel}
        </BookingCta>

        <Link
          to={`/sessions#${session.id}`}
          className="group/link inline-flex items-center gap-1.5 self-start text-[0.88rem] text-ink-muted transition-colors duration-200 ease-[var(--ease-calm)] hover:text-sage"
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
