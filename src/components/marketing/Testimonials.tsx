import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/ui/Reveal'
import { testimonials } from '@/content/testimonials'

/**
 * Renders nothing at all until genuine testimonials exist in
 * src/content/testimonials.ts. No sample quotes, no invented names, no ratings.
 */
export const Testimonials = () => {
  if (testimonials.length === 0) return null

  return (
    <Section tone="sage" space="lg" aria-labelledby="testimonials-heading">
      <Container>
        <SectionHeading eyebrow="In their words" id="testimonials-heading" title="What customers say." size="lg" />

        <RevealGroup as="ul" className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <RevealItem
              as="li"
              key={`${testimonial.firstName}-${testimonial.quote.slice(0, 24)}`}
              className="flex h-full flex-col gap-5 rounded-[var(--radius-card)] border border-ink/8 bg-surface p-7"
            >
              <blockquote className="flex-1 text-[1.02rem] leading-relaxed text-ink-soft">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <footer className="border-t border-ink/8 pt-4 text-[0.9rem] text-ink-muted">
                <p className="font-display font-semibold text-ink">
                  {testimonial.firstName}
                  {testimonial.suburb ? `, ${testimonial.suburb}` : ''}
                </p>
                <p className="pt-0.5">
                  {testimonial.session}
                  {testimonial.trainingArea ? ` · ${testimonial.trainingArea}` : ''}
                </p>
              </footer>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  )
}
