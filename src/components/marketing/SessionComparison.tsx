import { Container } from '@/components/ui/Container'
import { RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { formatDuration, formatPrice, sessions } from '@/content/sessions'

/** Concise at-a-glance comparison shown near the top of the sessions page. */
export const SessionComparison = () => (
  <Container>
    {/* The prices and durations below carry the meaning; this heading exists so
        the document outline doesn't jump from h1 straight to h3. */}
    <h2 id="at-a-glance-heading" className="sr-only">
      Sessions at a glance
    </h2>

    <RevealGroup
      as="ul"
      className="grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-ink/8 shadow-[var(--shadow-raise)] sm:grid-cols-3"
    >
      {sessions.map((session) => (
        <RevealItem as="li" key={session.id} className="bg-surface p-6 sm:p-7">
          <a
            href={`#${session.id}`}
            className="group flex h-full flex-col gap-4 rounded-[var(--radius-control)] transition-colors duration-200 ease-[var(--ease-calm)]"
          >
            <h3 className="text-[1.25rem] transition-colors duration-200 ease-[var(--ease-calm)] group-hover:text-eucalyptus">
              {session.name}
            </h3>

            <dl className="flex flex-col gap-2.5 text-[0.95rem]">
              <div className="flex items-baseline justify-between gap-4 border-b border-ink/8 pb-2.5">
                <dt className="text-ink-muted">Duration</dt>
                <dd className="font-medium">{formatDuration(session.durationMinutes)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-b border-ink/8 pb-2.5">
                <dt className="text-ink-muted">Price</dt>
                <dd className="font-display text-[1.15rem] font-bold tracking-[-0.03em]">
                  {formatPrice(session.price)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-ink-muted">Best for</dt>
                <dd className="text-right font-medium">{session.bestForShort}</dd>
              </div>
            </dl>
          </a>
        </RevealItem>
      ))}
    </RevealGroup>
  </Container>
)
