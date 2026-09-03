import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHero } from '@/components/marketing/PageHero'
import { hasContactEmail, siteConfig } from '@/config/site'
import { useSeo } from '@/lib/seo'

interface PrivacySection {
  id: string
  heading: string
  body: ReactNode
}

const { hosting, database, payment, email } = siteConfig.providers

/**
 * Written for the operating business. Provider names are read from
 * `siteConfig.providers`, never typed into the copy, so changing a provider is a
 * configuration change rather than a rewrite of this page.
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
          When you book a session, we store the booking details you provide — your name, email
          address, mobile number, chosen session, training area, appointment time, aircraft make and
          model, controller/RC model, experience level, what you&rsquo;d like help with and any
          notes you add — so the session can be arranged and delivered. We also store the payment
          status of your booking and the reference our payment provider gives us for it.
        </p>
        <p>
          Our hosting provider ({hosting}) also processes standard technical information such as IP
          address, browser type and request logs in order to serve the website and protect it from
          abuse.
        </p>
        <p>
          This website does not collect card numbers, CVV or expiry dates, does not ask you to create
          an account, and does not run advertising trackers. We don&rsquo;t put your personal details
          into web addresses or into the anonymous usage events the site records.
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
          <li>create, confirm, reschedule and cancel bookings</li>
          <li>take payment for a booked session and issue any refund you&rsquo;re entitled to</li>
          <li>send you a booking confirmation and a reminder before your session</li>
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
          Website hosting and enquiry form submissions are handled by {hosting}. Enquiry submissions
          are stored with that provider so we can read and reply to them.
        </p>
        <p>
          Booking records are stored in a {database} database that only we can access. Payments are
          processed by {payment} on its own secure checkout page, and booking emails — your
          confirmation, reminder and any change or cancellation notice — are sent through {email}.
          Each of these providers receives only what it needs for that purpose, and their own privacy
          terms apply to the information they hold.
        </p>
        <p>
          Card details are entered on, and processed by, {payment}. They are never collected,
          transmitted or stored by this website, and Drone Confidence never sees or stores your card
          number, CVV or expiry date. We receive only the amount paid, the payment status and a
          reference for the transaction. We don&rsquo;t send your enquiry notes or contact details to
          the payment provider beyond the email address needed for your receipt.
        </p>
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
        We keep enquiries and booking records for as long as needed to respond, deliver services,
        handle refunds and meet ordinary business, tax and record-keeping obligations, and then
        remove them when they are no longer required. We haven&rsquo;t set fixed retention periods,
        so we won&rsquo;t state one here.
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
