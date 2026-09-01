import { useEffect, useRef } from 'react'
import { Clock, User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { formatDuration, formatPrice } from '@/content/sessions'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'
import type { Session } from '@/types'

interface SessionDetailProps {
  session: Session
  /** Alternates layout so the page keeps a varied rhythm. */
  index: number
}

export const SessionDetail = ({ session, index }: SessionDetailProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Fires once when the session block is genuinely on screen. Carries the
  // session id only — never anything the visitor typed.
  useEffect(() => {
    const node = headingRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track('session_viewed', { session: session.id })
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [session.id])

  const reversed = index % 2 === 1
  const tone = index % 2 === 1 ? 'canvas' : 'surface'

  return (
    <Section
      id={session.id}
      tone={tone}
      space="lg"
      aria-labelledby={`${session.id}-heading`}
      className="scroll-mt-24"
    >
      <Container>
        <div
          className={cn(
            'grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16',
            reversed && 'lg:[&>*:first-child]:order-2',
          )}
        >
          <Reveal className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.2em] text-sage">
                {session.label}
              </p>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <p className="font-display text-[clamp(2.4rem,5vw,3.2rem)] font-bold leading-none tracking-[-0.04em]">
                  {formatPrice(session.price)}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.95rem] text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {formatDuration(session.durationMinutes)}
                  </span>
                  <span aria-hidden="true" className="text-ink/20">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <User aria-hidden="true" className="size-3.5" />
                    One-on-one
                  </span>
                </p>
              </div>

              <h2
                ref={headingRef}
                id={`${session.id}-heading`}
                className="text-[clamp(1.7rem,3.4vw,2.35rem)]"
              >
                {session.tagline}
              </h2>
            </div>

            <div className="measure space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
              {session.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="rounded-[var(--radius-card)] border border-ink/8 bg-sage-soft/50 p-5">
              <p className="text-[0.96rem] text-ink-soft">
                <span className="font-display font-semibold text-ink">Best for </span>
                {session.bestFor}
              </p>
            </div>

            <div className="pt-1">
              <BookingCta sessionId={session.id} size="lg" context="sessions-page">
                {session.ctaLabel}
              </BookingCta>
            </div>
          </Reveal>

          <div className="flex flex-col gap-8">
            <Reveal delay={0.06}>
              <ImageFrame slot={session.imageSlot} ratio="aspect-[16/10]" rounded="panel" />
            </Reveal>

            <Reveal delay={0.1}>
              <h3 className="font-display text-[0.72rem] font-medium uppercase tracking-[0.2em] text-ink-muted">
                We can cover
              </h3>
              <RevealGroup as="ul" staggerChildren={0.02} className="mt-4 grid gap-x-8 sm:grid-cols-2">
                {session.covers.map((item) => (
                  <RevealItem
                    as="li"
                    key={item}
                    className="flex items-start gap-2.5 border-b border-ink/8 py-2.5 text-[0.95rem] text-ink-soft"
                  >
                    <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-sage/50" />
                    <span>{item}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  )
}
