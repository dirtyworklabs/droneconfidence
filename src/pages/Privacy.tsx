import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHero } from '@/components/marketing/PageHero'
import { hasContactEmail, siteConfig } from '@/config/site'
import { bookingConfig } from '@/config/booking'
import { useSeo } from '@/lib/seo'

interface PrivacySection {
  id: string
  heading: string
  body: ReactNode
}

const { scheduling, payment, hosting } = siteConfig.providers

/**
 * Written to match what the site actually does today. The scheduling and
 * payment provider names come from `siteConfig.providers`, and the paragraph
 * about them only appears once booking is enabled — so the policy never
 * describes processing that isn't happening yet.
 */
const privacySections: PrivacySection[] = [
  {
    id: 'what-we-collect',
    heading: 'Information we collect',
    body: (
      <>
        <p>When you send an enquiry through this website, we collect:</p>
        <ul>
          <li>your name</li>
          <li>your email address</li>
          <li>your mobile number, where you provide it</li>
          <li>the content of your enquiry, including what you&rsquo;d like help with</li>
          <li>drone and experience details you choose to tell us</li>
          <li>your preferred session, training area or location, where you select one</li>
        </ul>
        <p>
          Our hosting provider ({hosting}) also processes standard technical information such as IP
          address, browser type and request logs in order to serve the website and protect it from
          abuse.
        </p>
        <p>
          This website does not collect card numbers, CVV or expiry dates, and does not run
          advertising trackers.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    heading: 'How we use it',
    body: (
      <>
        <p>We use the information you provide to:</p>
        <ul>
          <li>respond to your enquiry</li>
          <li>prepare and arrange bookings</li>
          <li>deliver your session</li>
          <li>maintain ordinary business records</li>
          <li>protect the security and integrity of this website</li>
        </ul>
        <p>
          We don&rsquo;t use enquiry information for marketing unless you&rsquo;ve given us
          appropriate consent to do so.
        </p>
      </>
    ),
  },
  {
    id: 'service-providers',
    heading: 'Service providers',
    body: (
      <>
        <p>
          Website hosting and form submissions are handled by {hosting}. Form submissions are stored
          with that provider so we can read and reply to them.
        </p>
        {bookingConfig.bookingEnabled ? (
          <p>
            Session scheduling is handled by {scheduling}, and payments are processed by {payment}.
            When you book, the details you enter are provided to those services so your booking and
            payment can be completed. Their own privacy terms apply to the information they hold.
          </p>
        ) : (
          <p>
            Online booking and payment are not yet enabled on this website. When they are, this
            policy will be updated to name the scheduling and payment providers involved and explain
            what they receive.
          </p>
        )}
        <p>
          These providers may process information outside Australia. We can&rsquo;t claim that all
          data stays within Australia, or that no international processing occurs.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    body: (
      <p>
        We keep enquiries and booking records for as long as needed to respond, deliver services and
        meet ordinary business and record-keeping obligations, and then remove them when they are no
        longer required. We haven&rsquo;t set fixed retention periods, so we won&rsquo;t state one
        here.
      </p>
    ),
  },
  {
    id: 'access-correction',
    heading: 'Access, correction and complaints',
    body: (
      <p>
        You can ask us what information we hold about you, ask us to correct it, or ask us to delete
        it. Contact us using the details below and we&rsquo;ll respond within a reasonable time. If
        you&rsquo;re unhappy with how we&rsquo;ve handled your information, tell us first so we have
        a chance to put it right.
      </p>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <>
        <p>
          For any privacy question, please use our{' '}
          <Link
            to="/contact"
            className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
          >
            contact form
          </Link>
          {hasContactEmail ? (
            <>
              {' '}
              or email{' '}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
              >
                {siteConfig.contactEmail}
              </a>
            </>
          ) : null}
          .
        </p>
        <p>
          If this policy changes, the updated version will be published on this page with a new
          revision date.
        </p>
      </>
    ),
  },
]

const Privacy = () => {
  useSeo({
    title: 'Privacy Policy | Drone Confidence',
    description:
      'How Drone Confidence collects, uses and protects the information you provide through this website.',
    path: '/privacy',
  })

  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy policy."
        width="text"
        intro={
          <p>
            What we collect, why we collect it and what happens to it. Last updated September 2026.
          </p>
        }
      />

      <Section tone="canvas" space="sm">
        <Container width="text">
          <div className="flex flex-col gap-10">
            {privacySections.map((section, index) => (
              <Reveal key={section.id} delay={Math.min(index, 3) * 0.04}>
                <section aria-labelledby={`${section.id}-heading`}>
                  <h2
                    id={`${section.id}-heading`}
                    className="font-display text-[1.3rem] font-semibold tracking-[-0.025em]"
                  >
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-[1.01rem] leading-relaxed text-ink-soft [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                    {section.body}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}

export default Privacy
