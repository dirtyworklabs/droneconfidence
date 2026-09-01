import { Lock } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { CancellationPolicy } from '@/components/marketing/CancellationPolicy'

export const BookingPaymentInfo = () => (
  <Section tone="surface" space="lg" aria-labelledby="booking-payment-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Booking & payment"
            id="booking-payment-heading"
            title="Book and pay online. Simple and secure."
            size="lg"
          />

          <Reveal className="space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
            <p>
              Your appointment reserves private one-on-one training time specifically for you.
            </p>
            <p>
              Once online booking is enabled, full payment is required at the time of booking to
              confirm your session.
            </p>
            <p className="flex items-start gap-2.5 text-[0.95rem] text-ink-muted">
              <Lock aria-hidden="true" className="mt-1 size-4 shrink-0 text-sage" />
              Payment will be processed securely by the external booking/payment provider.
            </p>
          </Reveal>
        </div>

        <CancellationPolicy />
      </div>
    </Container>
  </Section>
)
