import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { Reveal } from '@/components/ui/Reveal'
import { formatDuration, formatPrice } from '@/content/sessions'
import type { Session } from '@/types'

/** How many "we can cover" points the homepage previews; /sessions lists them all. */
const PREVIEW_COVERS = 6

/**
 * Homepage feature card for the one public lesson.
 *
 * A single, intentional offering rather than a grid: the photograph sits beside
 * the details on wide screens and above them on phones. The full coverage list
 * lives on /sessions, so this previews the first few points and links there.
 */
export const SessionCard = ({ session }: { session: Session }) => (
  <Reveal
    as="article"
    className="group grid overflow-hidden rounded-[var(--radius-card)] border border-ink/8 bg-surface transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
  >
    <ImageFrame
      slot={session.imageSlot}
      ratio="aspect-[16/10] lg:aspect-auto lg:min-h-[26rem]"
      rounded="none"
      // On wide screens the photograph fills its column at whatever height the
      // details need, rather than letting the image's own size drive the row.
      className="border-0 border-b border-ink/8 lg:border-r lg:border-b-0 lg:[&>img]:absolute lg:[&>img]:inset-0"
    />

    <div className="flex flex-col p-6 sm:p-8 lg:p-10">
      <p className="font-display text-[0.75rem] font-semibold tracking-[0.12em] text-sage">
        {session.label}
      </p>

      <h3 className="mt-3 text-[clamp(1.6rem,3.4vw,2rem)] tracking-[-0.03em]">{session.name}</h3>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-display text-[1.75rem] font-bold leading-none tracking-[-0.035em] text-ink">
          {formatPrice(session.price)}
        </span>
        <span className="text-[0.95rem] text-ink-muted">
          {formatDuration(session.durationMinutes)} · private one-on-one · your own drone
        </span>
      </p>

      <p className="mt-5 text-[0.98rem] leading-relaxed text-ink-soft">{session.summary}</p>

      <ul className="mt-5 grid gap-x-6 gap-y-2.5 border-t border-ink/8 pt-5 sm:grid-cols-2">
        {session.covers.slice(0, PREVIEW_COVERS).map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[0.92rem] leading-snug text-ink-soft">
            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[0.92rem] leading-relaxed text-ink-soft">
        <span className="font-display font-semibold text-ink">Best for </span>
        {session.bestFor}
      </p>

      <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row sm:items-center sm:gap-6">
        <BookingCta sessionId={session.id} context="home-session-card">
          {session.ctaLabel}
        </BookingCta>

        <Link
          to={`/sessions#${session.id}`}
          className="group/link inline-flex items-center gap-1.5 self-start text-[0.88rem] text-ink-muted transition-colors duration-200 ease-[var(--ease-calm)] hover:text-sage sm:self-center"
        >
          See everything we can cover
          <ArrowRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-200 ease-[var(--ease-calm)] group-hover/link:translate-x-1"
          />
        </Link>
      </div>
    </div>
  </Reveal>
)
