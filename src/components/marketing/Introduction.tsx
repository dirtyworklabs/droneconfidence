import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'

export const Introduction = () => (
  <Section tone="canvas" space="sm" aria-labelledby="introduction-heading">
    <Container>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <Reveal>
          <h2 id="introduction-heading" className="text-[clamp(1.9rem,4vw,2.8rem)]">
            You don&rsquo;t need a whole drone course.
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="space-y-5 text-[1.06rem] leading-relaxed text-ink-soft">
          <p>
            Getting airborne is surprisingly easy. Knowing what your aircraft is
            doing, where you can fly and what to do when something unexpected happens takes a little
            more experience.
          </p>
          <p className="font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
            These are private sessions built around you, your drone and what you actually want to
            learn.
          </p>
          <p>
            Whether your drone is still in the box or you&rsquo;ve been flying for a while, we start
            at your level.
          </p>
        </Reveal>
      </div>
    </Container>
  </Section>
)
