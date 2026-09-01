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
            Private drone training
            <br />
            with a decade of industry experience behind it.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="flex shrink-0 flex-col gap-3">
          <BookingCta variant="onDark" size="lg" context="final-cta" withArrow>
            Book a Session
          </BookingCta>
          <p className="text-[0.9rem] text-sage-soft/70">South Sydney · North Sydney</p>
        </Reveal>
      </div>
    </Container>
  </Section>
)
