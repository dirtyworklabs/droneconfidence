import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { BookingCta } from '@/components/booking/BookingCta'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { formatDuration, formatPrice, sessions } from '@/content/sessions'

export const FinalCta = () => (
  <Section tone="deep" space="lg" aria-labelledby="final-cta-heading" className="overflow-hidden">
    <TopoBackdrop tone="light" fade={false} className="opacity-50" />

    <Container className="relative">
      <div className="flex flex-col items-start gap-9 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <h2 id="final-cta-heading" className="text-canvas text-[clamp(2rem,4.4vw,3rem)]">
            Your drone is capable of a lot.
            <br />
            Get confident enough to use it.
          </h2>
          <p className="measure text-sage-soft/85">
            Private one-on-one drone training with a decade of industry experience behind it.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex shrink-0 flex-col gap-3">
          <BookingCta variant="onDark" size="lg" context="final-cta" withArrow>
            Book a Session
          </BookingCta>
          <p className="text-[0.9rem] text-sage-soft/70">South Sydney · North Sydney</p>
        </Reveal>
      </div>

      {/* Fine rules rather than three more filled cards. */}
      <Reveal as="ul" distance={10} className="mt-14 grid border-t border-sage/25 sm:grid-cols-3">
        {sessions.map((session) => (
          <li key={session.id} className="border-b border-sage/25 py-5 sm:border-b-0 sm:pr-8">
            <p className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-canvas">
              {session.name}
            </p>
            <p className="pt-1.5 text-[0.95rem] text-sage-soft/80">
              {formatPrice(session.price)} · {formatDuration(session.durationMinutes)}
            </p>
          </li>
        ))}
      </Reveal>
    </Container>
  </Section>
)
