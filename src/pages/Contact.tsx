import { useSearchParams } from 'react-router-dom'
import { Clock3, Mail, MapPin } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/ui/Reveal'
import { PageHero } from '@/components/marketing/PageHero'
import { ContactForm, CUSTOM_LOCATION_ENQUIRY } from '@/components/forms/ContactForm'
import { customLocationCopy } from '@/content/locations'
import { hasContactEmail, siteConfig } from '@/config/site'
import { useSeo } from '@/lib/seo'

/** `?reason=` presets, so links elsewhere on the site arrive with the right intent. */
const reasonToEnquiryType: Record<string, string> = {
  'custom-location': CUSTOM_LOCATION_ENQUIRY,
  'which-session': 'Which session should I choose?',
  drone: 'Is my drone suitable?',
  booking: 'Booking question',
}

const Contact = () => {
  useSeo({
    title: 'Contact Drone Confidence | Drone Lessons Sydney',
    description:
      'Ask a question about private drone lessons in Sydney — which session suits you, whether your drone is suitable, or a custom training location.',
    path: '/contact',
  })

  const [params] = useSearchParams()
  const reason = params.get('reason') ?? ''
  const defaultEnquiryType = reasonToEnquiryType[reason]
  const isCustomLocationRequest = defaultEnquiryType === CUSTOM_LOCATION_ENQUIRY

  return (
    <>
      <PageHero
        eyebrow={isCustomLocationRequest ? 'Custom location' : 'Contact'}
        title={isCustomLocationRequest ? 'Request a custom location.' : 'Have a question?'}
        intro={
          isCustomLocationRequest ? (
            <>
              <p>
                Tell us where you&rsquo;d like to fly and we&rsquo;ll let you know whether it can
                work.
              </p>
              <p className="text-[0.97rem] text-ink-muted">{customLocationCopy}</p>
            </>
          ) : (
            <p>Tell us what you need help with and we&rsquo;ll get back to you.</p>
          )
        }
      />

      <Section tone="canvas" space="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-16">
            <Reveal>
              <div className="rounded-[var(--radius-panel)] border border-ink/8 bg-surface p-6 shadow-[var(--shadow-raise)] sm:p-9">
                <ContactForm sourcePage="/contact" defaultEnquiryType={defaultEnquiryType} />
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col gap-6">
              <div className="rounded-[var(--radius-card)] border border-ink/8 bg-canvas-deep/60 p-6 sm:p-7">
                <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
                  Good to know
                </h2>

                <dl className="mt-5 flex flex-col gap-5 text-[0.96rem] leading-relaxed">
                  <div className="flex items-start gap-3">
                    <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
                    <div>
                      <dt className="font-medium text-ink">Replies</dt>
                      <dd className="text-ink-soft">
                        Enquiries are answered personally by Tom, usually within a day or two.
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
                    <div>
                      <dt className="font-medium text-ink">Training areas</dt>
                      <dd className="text-ink-soft">
                        Sessions are based around Taren Point in Sydney&rsquo;s south and North Ryde
                        in Sydney&rsquo;s north. Other Sydney locations may be possible by
                        arrangement.
                      </dd>
                    </div>
                  </div>

                  {hasContactEmail ? (
                    <div className="flex items-start gap-3">
                      <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sage" />
                      <div>
                        <dt className="font-medium text-ink">Email</dt>
                        <dd>
                          <a
                            href={`mailto:${siteConfig.contactEmail}`}
                            className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                          >
                            {siteConfig.contactEmail}
                          </a>
                        </dd>
                      </div>
                    </div>
                  ) : null}
                </dl>
              </div>

              <p className="text-[0.9rem] leading-relaxed text-ink-muted">
                Sending a message doesn&rsquo;t book a session or take a payment. We&rsquo;ll always
                confirm details with you first.
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  )
}

export default Contact
