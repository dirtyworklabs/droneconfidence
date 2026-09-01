import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'

export const NotALicence = () => (
  <Section tone="canvas" space="md" aria-labelledby="not-a-licence-heading">
    <Container>
      <Reveal className="overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-surface">
        <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:p-12">
          <div className="flex flex-col gap-5">
            <Eyebrow>What this is</Eyebrow>
            <h2 id="not-a-licence-heading" className="text-[clamp(1.7rem,3.4vw,2.35rem)]">
              Practical coaching, not a drone licence course.
            </h2>
            <div className="space-y-4 text-[1rem] leading-relaxed text-ink-soft">
              <p>Drone Confidence provides private practical coaching for everyday drone owners.</p>
              <p>
                We do not provide Remote Pilot Licence (RePL) qualifications, CASA certification or
                formal aviation qualifications.
              </p>
              <p>
                If your goal is to obtain a professional aviation qualification, we&rsquo;ll happily
                point you towards an appropriate certified training provider.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-5 rounded-[var(--radius-card)] bg-sage-soft/70 p-7 sm:p-8">
            <p className="text-[0.92rem] text-ink-soft">If your goal is:</p>
            <blockquote className="font-display text-[clamp(1.2rem,2.4vw,1.5rem)] font-semibold leading-snug tracking-[-0.02em] text-eucalyptus">
              &ldquo;I bought a drone. Can someone experienced just show me how to use it properly?&rdquo;
            </blockquote>
            <p className="font-display text-[1.1rem] font-semibold tracking-[-0.02em]">
              You&rsquo;re in the right place.
            </p>
          </div>
        </div>
      </Reveal>
    </Container>
  </Section>
)
