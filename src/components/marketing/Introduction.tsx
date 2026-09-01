import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'

export const Introduction = () => (
  <Section tone="canvas" space="lg" aria-labelledby="introduction-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <Reveal className="flex flex-col gap-5">
          <Eyebrow>Where we fit</Eyebrow>
          <h2 id="introduction-heading" className="text-[clamp(1.9rem,4vw,2.8rem)]">
            You don&rsquo;t need a whole drone course.
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="space-y-5 text-[1.06rem] leading-relaxed text-ink-soft">
          <p>Modern drones make getting airborne surprisingly easy.</p>
          <p>
            Knowing what your aircraft is doing, how to set it up properly, where you can fly, what to
            do when something unexpected happens and how to get good results takes a little more
            experience.
          </p>
          <p className="font-display text-[1.2rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
            That&rsquo;s where Drone Confidence comes in.
          </p>
          <p>
            These are private sessions built around you, your drone and what you actually want to learn.
          </p>
          <p>
            Whether your drone is still in the box or you&rsquo;ve already been flying for a while,
            we&rsquo;ll start at your level and spend the session working on the areas that matter most
            to you.
          </p>
        </Reveal>
      </div>
    </Container>
  </Section>
)
