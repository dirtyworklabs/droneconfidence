import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { BookingCta } from '@/components/booking/BookingCta'
import { footerNav } from '@/components/layout/navigation'
import { useSeo } from '@/lib/seo'

const NotFound = () => {
  useSeo({
    title: 'Page not found | Drone Confidence',
    description:
      "That page doesn't exist. Find private drone lessons, training locations and booking here.",
    path: '/404',
    noIndex: true,
  })

  return (
    <Section tone="canvas" space="lg" className="overflow-hidden">
      <TopoBackdrop className="opacity-60" />

      <Container className="relative">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>Off course</Eyebrow>
          <h1 className="max-w-[24ch] text-[clamp(2.1rem,5vw,3.2rem)] font-bold leading-[1.06] tracking-[-0.035em]">
            This page has drifted out of range.
          </h1>
          <p className="measure text-[1.06rem] leading-relaxed text-ink-soft">
            The link may be old or slightly off. Everything on the site is one step away below.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <BookingCta size="lg" context="not-found">
              Book a Session
            </BookingCta>
            <LinkButton to="/" variant="secondary" size="lg">
              Back to Home
            </LinkButton>
          </div>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <nav aria-label="Site pages">
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {footerNav.map((link) => (
                <li key={link.to} className="border-t border-ink/10 pt-3">
                  <LinkButton to={link.to} variant="quiet">
                    {link.label}
                  </LinkButton>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
      </Container>
    </Section>
  )
}

export default NotFound
