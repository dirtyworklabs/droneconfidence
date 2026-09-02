import { useEffect, useRef } from 'react'
import { Clock, User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { formatDuration, formatPrice } from '@/content/sessions'
import { cn } from '@/lib/cn'
import { track } from '@/lib/analytics'
import type { Session } from '@/types'

interface SessionDetailProps {
  session: Session
  /** Alternates the desktop layout while preserving one mobile hierarchy. */
  index: number
}

export const SessionDetail = ({
  session,
  index,
}: SessionDetailProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const node = headingRef.current

    if (!node || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track('session_viewed', {
            session: session.id,
          })

          observer.disconnect()
        }
      },
      {
        threshold: 0.4,
      },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [session.id])

  const reversed = index % 2 === 1
  const tone = reversed ? 'canvas' : 'surface'

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
            'grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-16 xl:gap-x-20',
            reversed && 'lg:[&>*:first-child]:order-2',
          )}
        >
          {/* Session introduction */}
          <Reveal className="flex flex-col lg:col-span-5">
            <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.2em] text-sage">
              {session.label}
            </p>

            <h2
              ref={headingRef}
              id={`${session.id}-heading`}
              className="mt-3 max-w-[13ch] text-[clamp(2rem,3.8vw,2.7rem)]"
            >
              {session.tagline}
            </h2>

            <div className="measure mt-5 space-y-3 text-[1.01rem] leading-relaxed text-ink-soft">
              {session.intro.map((paragraph) => (
                <p key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Best for */}
            <div className="mt-6 border-l border-eucalyptus/20 pl-4">
              <p className="font-display text-[0.66rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/60">
                Best for
              </p>

              <p className="mt-1.5 max-w-[30rem] text-[0.96rem] leading-relaxed text-ink-soft">
                {session.bestFor}
              </p>
            </div>

            {/* Compact session facts */}
            <div className="mt-7 border-y border-ink/10">
              <div className="grid grid-cols-[auto_1fr_1fr] divide-x divide-ink/10">
                <div className="py-4 pr-5">
                  <p className="font-display text-[1.75rem] font-bold leading-none tracking-[-0.04em] text-ink sm:text-[1.9rem]">
                    {formatPrice(session.price)}
                  </p>
                </div>

                <div className="flex items-center px-4 py-4 sm:px-5">
                  <div>
                    <Clock
                      aria-hidden="true"
                      className="mb-1.5 size-3.5 text-eucalyptus/60"
                    />

                    <p className="text-[0.84rem] leading-tight text-ink-soft">
                      {formatDuration(session.durationMinutes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center pl-4 py-4 sm:pl-5">
                  <div>
                    <User
                      aria-hidden="true"
                      className="mb-1.5 size-3.5 text-eucalyptus/60"
                    />

                    <p className="text-[0.84rem] leading-tight text-ink-soft">
                      One-on-one
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <BookingCta
                sessionId={session.id}
                size="lg"
                context="sessions-page"
              >
                {session.ctaLabel}
              </BookingCta>
            </div>
          </Reveal>

          {/* Image + inclusions */}
          <div className="flex flex-col gap-7 lg:col-span-7">
            <Reveal delay={0.06}>
              <ImageFrame
                slot={session.imageSlot}
                ratio="aspect-[16/10]"
                rounded="panel"
              />
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex items-end justify-between gap-6 border-b border-ink/10 pb-3">
                <div>
                  <p className="font-display text-[0.68rem] font-bold uppercase tracking-[0.16em] text-eucalyptus/60">
                    We can cover
                  </p>

                  <p className="mt-1.5 max-w-[32rem] text-[0.88rem] leading-relaxed text-ink-muted">
                    We&rsquo;ll prioritise the areas that are most useful to
                    you rather than trying to work through a fixed syllabus.
                  </p>
                </div>
              </div>

              <ul className="mt-2 columns-1 gap-x-8 sm:columns-2 xl:columns-3">
                {session.covers.map((item) => (
                  <li
                    key={item}
                    className="group break-inside-avoid border-b border-ink/8 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-[0.58rem] h-px w-3 shrink-0 bg-eucalyptus/30 transition-[width,background-color] duration-200 ease-[var(--ease-calm)] group-hover:w-4 group-hover:bg-eucalyptus/55"
                      />

                      <span className="text-[0.9rem] leading-snug text-ink-soft transition-colors duration-200 group-hover:text-ink">
                        {item}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  )
}