import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { PageHero } from '@/components/marketing/PageHero'
import { Accordion } from '@/components/ui/Accordion'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { faqs } from '@/content/faqs'
import { ASK_A_QUESTION_QUERY } from '@/lib/routes'
import { useSeo } from '@/lib/seo'
import { faqPageSchema } from '@/lib/structuredData'
import { FinalCta } from '@/components/marketing/FinalCta'

const Faq = () => {
  useSeo({
    title: 'Drone Lesson FAQs | Drone Confidence Sydney',
    description:
      'Answers about private drone lessons in Sydney: beginners, which drones we train with, weather and wind, payment, meeting locations and custom locations.',
    path: '/faq',
    structuredData: [faqPageSchema()],
  })

  return (
    <>
      <PageHero
        eyebrow="FAQs"
        title="Questions, answered."
        intro={
          <p>
            Everything people usually want to know before booking a private session. If yours
            isn&rsquo;t here, just ask.
          </p>
        }
      />

      <Section tone="canvas" space="sm">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-16">
            <Reveal>
              <Accordion
                items={faqs}
                defaultOpenId={faqs[0]?.id}
                headingLevel="h2"
                renderLink={(link) => (
                  <Link
                    to={link.to}
                    className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                  >
                    {link.label}
                  </Link>
                )}
              />
            </Reveal>

            <Reveal delay={0.08}>
              <div className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-6 sm:p-7 lg:sticky lg:top-28">
                <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">
                  Still have a question?
                </h2>
                <p className="pt-2 text-[0.97rem] leading-relaxed text-ink-soft">
                  Tell us what you&rsquo;d like help with and we&rsquo;ll point you in the right
                  direction.
                </p>
                <div className="pt-5">
                  <LinkButton to={ASK_A_QUESTION_QUERY} variant="secondary" fullWidth>
                    Ask a Question
                  </LinkButton>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  )
}

export default Faq
