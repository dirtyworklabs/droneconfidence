import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { BookingCta } from '@/components/booking/BookingCta'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { ASK_A_QUESTION_QUERY } from '@/lib/routes'

export const FinalCta = () => (
  <Section
    tone="deep"
    space="lg"
    aria-labelledby="final-cta-heading"
    className="overflow-hidden"
  >
    <TopoBackdrop
      tone="light"
      fade={false}
      className="opacity-50"
    />

    <Container className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
        {/* Message */}
        <Reveal className="flex max-w-2xl flex-col gap-5">
          <h2
            id="final-cta-heading"
            className="max-w-[14ch] text-[clamp(2.1rem,4.4vw,3.2rem)] text-canvas"
          >
            Fly with confidence.
          </h2>

          <p className="max-w-[38rem] text-[1.03rem] leading-relaxed text-sage-soft/80">
            Private one-on-one coaching in Sydney, built around your aircraft,
            your experience and what you want to improve.
          </p>
        </Reveal>

        {/* Actions */}
        <Reveal
          delay={0.1}
          className="flex w-full flex-col gap-4 sm:w-auto lg:items-start"
        >
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <BookingCta
              variant="onDark"
              size="lg"
              context="final-cta"
              withArrow
            >
              Book a Session
            </BookingCta>

            <Link
              to={ASK_A_QUESTION_QUERY}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-sage-soft/25 px-5 py-3 font-display text-[0.92rem] font-semibold text-sage-soft transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage-soft/45 hover:bg-sage-soft/10 hover:text-canvas"
            >
              Ask a Question

              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 ease-[var(--ease-calm)] group-hover:translate-x-1"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </Container>
  </Section>
)