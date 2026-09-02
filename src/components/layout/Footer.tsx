import { Link } from 'react-router-dom'
import { Instagram, Mail } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Wordmark } from '@/components/layout/Wordmark'
import { footerNav } from '@/components/layout/navigation'
import { hasContactEmail, hasInstagram, siteConfig } from '@/config/site'

export const Footer = () => (
  <footer className="border-t border-ink/8 bg-canvas-deep">
    <Container className="py-14 sm:py-16">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Wordmark />
          <p className="measure text-ink-soft">
            Private one-on-one drone training in Sydney.
          </p>

          {hasContactEmail || hasInstagram ? (
            <ul className="flex flex-col gap-2 pt-1 text-[0.95rem]">
              {hasContactEmail ? (
                <li>
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="inline-flex min-h-11 items-center gap-2 text-ink-soft transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                  >
                    <Mail aria-hidden="true" className="size-4" />
                    {siteConfig.contactEmail}
                  </a>
                </li>
              ) : null}
              {hasInstagram ? (
                <li>
                  <a
                    href={siteConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-ink-soft transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                  >
                    <Instagram aria-hidden="true" className="size-4" />
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="pt-1 text-[0.95rem] text-ink-muted">
              Questions?{' '}
              <Link
                to="/contact"
                className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
              >
                Send us an enquiry
              </Link>
              .
            </p>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.2em] text-ink-muted">
            Explore
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6">
            {footerNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center text-[0.95rem] text-ink-soft transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-ink/8 pt-8 text-sm text-ink-muted">
        <p className="max-w-[70ch]">
          Drone Confidence provides practical drone coaching and does not provide Remote Pilot Licence
          (RePL) certification or CASA-issued qualifications.
        </p>
        <p>
          &copy; {siteConfig.copyrightYear} {siteConfig.businessName}. All rights reserved.
        </p>
      </div>
    </Container>
  </footer>
)
