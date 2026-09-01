import { motion, useReducedMotion } from 'motion/react'
import { MapPin } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { LinkButton } from '@/components/ui/Button'
import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { calm, EASE_CALM } from '@/lib/motion'
import { formatPrice, lowestSessionPrice } from '@/content/sessions'

/** Load sequence: heading, supporting text, CTAs, then the visual. */
const sequence = (reduced: boolean, delay: number, distance = 16) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: distance },
        animate: { opacity: 1, y: 0 },
        transition: calm(0.7, delay),
      }

const TracedArc = () => {
  const reduced = useReducedMotion()

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 720 220"
      className="pointer-events-none absolute -left-16 bottom-4 h-32 w-[46rem] max-w-none opacity-70 sm:h-40"
      fill="none"
    >
      {reduced ? (
        <path
          d="M8 196C120 176 196 96 330 88s210 44 382-24"
          stroke="#337667"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="6 9"
        />
      ) : (
        <motion.path
          d="M8 196C120 176 196 96 330 88s210 44 382-24"
          stroke="#337667"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="6 9"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 2.2, delay: 0.7, ease: EASE_CALM },
            opacity: { duration: 0.5, delay: 0.7 },
          }}
        />
      )}
    </svg>
  )
}

export const Hero = () => {
  const reduced = useReducedMotion() ?? false
  const step = (delay: number) => sequence(reduced, delay)

  return (
    <section className="relative overflow-hidden bg-canvas pt-10 pb-16 sm:pt-16 sm:pb-24">
      <TopoBackdrop className="opacity-70" />
      <TracedArc />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <motion.div {...step(0)}>
              <Eyebrow>Private drone training · Sydney</Eyebrow>
            </motion.div>

            <motion.h1
              {...step(0.08)}
              className="max-w-[18ch] text-[clamp(2.6rem,7.4vw,4.4rem)] font-bold leading-[1.02] tracking-[-0.035em]"
            >
              Fly your drone with confidence.
            </motion.h1>

            <motion.p
              {...step(0.18)}
              className="max-w-[34ch] font-display text-[clamp(1.15rem,2.4vw,1.45rem)] font-medium leading-snug tracking-[-0.02em] text-eucalyptus"
            >
              Private one-on-one drone training in Sydney.
            </motion.p>

            <motion.div {...step(0.26)} className="measure space-y-4 text-[1.05rem] leading-relaxed text-ink-soft">
              <p>
                Bought a drone but still not completely comfortable flying it? Get practical,
                one-on-one help with your own drone — from your first take-off to smoother flying and
                better camera work.
              </p>
              <p className="text-ink">
                No classroom. No group course. Just an experienced drone operator beside you while you
                fly.
              </p>
            </motion.div>

            <motion.div {...step(0.36)} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <BookingCta size="lg" context="hero" withArrow>
                  Book a Session
                </BookingCta>
                <LinkButton to="/sessions" variant="secondary" size="lg">
                  View Sessions
                </LinkButton>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.95rem] text-ink-muted">
                <span className="font-display font-semibold text-ink">
                  Sessions from {formatPrice(lowestSessionPrice)}
                </span>
                <span aria-hidden="true" className="hidden h-4 w-px bg-ink/12 sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden="true" className="size-4 text-sage" />
                  South Sydney + North Sydney training locations
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            {...(reduced
              ? {}
              : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: calm(0.9, 0.42) })}
            className="relative"
          >
            <ImageFrame
              slot="hero"
              ratio="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
              rounded="panel"
              priority
              className="shadow-[var(--shadow-lift)]"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
