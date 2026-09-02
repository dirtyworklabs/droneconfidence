import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import {
  Reveal,
  RevealGroup,
  RevealItem,
} from '@/components/ui/Reveal'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ASK_A_QUESTION_QUERY } from '@/lib/routes'

interface DroneFamilyItem {
  id: string
  eyebrow: string
  title: string
  body: string
  image: string
  alt: string
}

const families: DroneFamilyItem[] = [
  {
    id: 'mini',
    eyebrow: 'Compact',
    title: 'DJI Mini family',
    body: 'Small, lightweight camera drones that are especially popular with newer and recreational pilots.',
    image: '/images/dji-mini-family.png',
    alt: 'Technical illustration of a DJI Mini family camera drone',
  },
  {
    id: 'air',
    eyebrow: 'All-rounder',
    title: 'DJI Air family',
    body: 'Portable camera drones with more performance, features and creative flexibility.',
    image: '/images/dji-air-family.png',
    alt: 'Technical illustration of a DJI Air family camera drone',
  },
  {
    id: 'mavic',
    eyebrow: 'Advanced',
    title: 'DJI Mavic family',
    body: 'Larger camera drones with more advanced imaging capability and a more substantial airframe.',
    image: '/images/dji-mavic-family.png',
    alt: 'Technical illustration of a DJI Mavic family camera drone',
  },
  {
    id: 'neo-flip',
    eyebrow: 'Small & simple',
    title: 'DJI Neo & Flip family',
    body: 'Compact consumer drones with protected propellers, approachable controls and simplified flying features.',
    image: '/images/dji-neo-flip-family.png',
    alt: 'Technical illustrations of DJI Neo and DJI Flip family drones',
  },
]

export const DroneFamilies = () => (
  <Section
    tone="surface"
    space="lg"
    aria-labelledby="drone-families-heading"
    className="overflow-hidden"
  >
    <Container>
      {/* Introduction */}
      <Reveal className="max-w-3xl">
        <Eyebrow>Your drone</Eyebrow>

        <h2
          id="drone-families-heading"
          className="mt-4 max-w-[14ch] text-[clamp(2rem,4vw,2.8rem)]"
        >
          Bring the drone you actually own.
        </h2>

        <p className="mt-5 max-w-[42rem] text-[1.03rem] leading-relaxed text-ink-soft">
          Drone Confidence is built around your aircraft. We can work with many
          popular DJI consumer drones and similar camera drones, so you can
          learn on the equipment you&rsquo;ll actually keep flying.
        </p>
      </Reveal>

      {/* Drone families */}
      <RevealGroup
        as="ul"
        className="mt-10 grid gap-4 md:grid-cols-2"
        staggerChildren={0.07}
      >
        {families.map((family) => (
          <RevealItem
            key={family.id}
            as="li"
            className="group relative flex min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-canvas transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-eucalyptus/25 hover:bg-surface hover:shadow-[var(--shadow-lift)]"
          >
            {/* Technical illustration area */}
            <div className="relative flex min-h-[18rem] flex-1 items-center justify-center overflow-hidden px-5 pb-3 pt-7 sm:min-h-[20rem] sm:px-8 sm:pt-8">
              {/* Quiet technical backdrop */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.055]"
              >
                <div className="absolute left-1/2 top-1/2 h-px w-[80%] -translate-x-1/2 bg-eucalyptus" />
                <div className="absolute left-1/2 top-1/2 h-[70%] w-px -translate-y-1/2 bg-eucalyptus" />

                <div className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-eucalyptus" />

                <div className="absolute left-1/2 top-1/2 size-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-eucalyptus" />
              </div>

              {/* Corner marks */}
              <span
                aria-hidden="true"
                className="absolute left-5 top-5 size-5 border-l border-t border-eucalyptus/10"
              />

              <span
                aria-hidden="true"
                className="absolute right-5 top-5 size-5 border-r border-t border-eucalyptus/10"
              />

              <span
                aria-hidden="true"
                className="absolute bottom-5 left-5 size-5 border-b border-l border-eucalyptus/10"
              />

              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 size-5 border-b border-r border-eucalyptus/10"
              />

              <img
                src={family.image}
                alt={family.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="relative z-10 max-h-[17rem] w-full object-contain transition-[transform,filter] duration-500 ease-[var(--ease-calm)] group-hover:-translate-y-1 group-hover:scale-[1.025] sm:max-h-[19rem]"
              />
            </div>

            {/* Family information */}
            <div className="relative border-t border-ink/8 px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
              <div className="flex items-center gap-3">
                <p className="font-display text-[0.64rem] font-bold uppercase tracking-[0.15em] text-eucalyptus/55">
                  {family.eyebrow}
                </p>

                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-eucalyptus/10 transition-colors duration-300 group-hover:bg-eucalyptus/20"
                />
              </div>

              <h3 className="mt-2.5 font-display text-[1.22rem] font-semibold tracking-[-0.025em] text-ink">
                {family.title}
              </h3>

              <p className="mt-2 max-w-[34rem] text-[0.94rem] leading-relaxed text-ink-muted">
                {family.body}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* Model enquiry */}
      <Reveal
        delay={0.12}
        className="mt-7 flex flex-col gap-4 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      >
        <div>
          <p className="font-display text-[1.04rem] font-semibold tracking-[-0.02em] text-ink">
            Not sure whether your drone is suitable?
          </p>

          <p className="mt-1 text-[0.9rem] leading-relaxed text-ink-muted">
            Tell us the exact model and we&rsquo;ll confirm before you book.
          </p>
        </div>

        <Link
          to={ASK_A_QUESTION_QUERY}
          className="group/link inline-flex shrink-0 items-center gap-2 self-start font-display text-[0.9rem] font-semibold text-eucalyptus transition-colors duration-200 ease-[var(--ease-calm)] hover:text-sage sm:self-auto"
        >
          Ask about your drone

          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-[var(--ease-calm)] group-hover/link:translate-x-1"
          />
        </Link>
      </Reveal>
    </Container>
  </Section>
)