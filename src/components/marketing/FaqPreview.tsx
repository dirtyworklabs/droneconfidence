import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { LinkButton } from '@/components/ui/Button'
import { Accordion } from '@/components/ui/Accordion'
import { featuredFaqs } from '@/content/faqs'
import { ROUTES } from '@/lib/routes'

export const FaqPreview = () => (
  <Section tone="canvas" space="lg" aria-labelledby="faq-preview-heading">
    <Container>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow="Common questions" id="faq-preview-heading" title="Good to know." size="lg" />
          <Reveal delay={0.06}>
            <LinkButton to={ROUTES.faq} variant="secondary">
              All FAQs
            </LinkButton>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <Accordion
            items={featuredFaqs}
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
      </div>
    </Container>
  </Section>
)
