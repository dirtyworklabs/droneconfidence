import { siteConfig } from '@/config/site'
import { sessions } from '@/content/sessions'
import { faqs } from '@/content/faqs'
import { absoluteUrl } from '@/lib/seo'

/**
 * Conservative, truthful structured data only.
 *
 * No invented office address, no review scores, no awards, no certifications
 * and no opening hours — none of those have been supplied.
 */

const BUSINESS_ID = `${siteConfig.siteUrl.replace(/\/+$/, '')}/#business`

export const localBusinessSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': BUSINESS_ID,
  name: siteConfig.businessName,
  description: siteConfig.shortDescription,
  url: absoluteUrl('/'),
  image: `${siteConfig.siteUrl.replace(/\/+$/, '')}/social-card.svg`,
  priceRange: `$${Math.min(...sessions.map((s) => s.price))}–$${Math.max(...sessions.map((s) => s.price))}`,
  currenciesAccepted: siteConfig.currency,
  areaServed: {
    '@type': 'City',
    name: 'Sydney',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'NSW',
      addressCountry: 'AU',
    },
  },
  ...(siteConfig.contactEmail ? { email: siteConfig.contactEmail } : {}),
  ...(siteConfig.contactPhone ? { telephone: siteConfig.contactPhone } : {}),
  ...(siteConfig.instagramUrl ? { sameAs: [siteConfig.instagramUrl] } : {}),
  makesOffer: sessions.map((session) => ({
    '@type': 'Offer',
    name: session.name,
    price: session.price,
    priceCurrency: siteConfig.currency,
    availability: 'https://schema.org/InStock',
    itemOffered: {
      '@type': 'Service',
      name: `${session.name} — private drone training`,
      serviceType: 'Private drone training session',
      description: session.summary,
    },
  })),
})

export const websiteSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.businessName,
  url: absoluteUrl('/'),
  inLanguage: 'en-AU',
  publisher: { '@id': BUSINESS_ID },
})

export const serviceSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Private one-on-one drone training in Sydney',
  serviceType: 'Drone training',
  provider: { '@id': BUSINESS_ID },
  areaServed: { '@type': 'City', name: 'Sydney' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Drone Confidence sessions',
    itemListElement: sessions.map((session) => ({
      '@type': 'Offer',
      name: session.name,
      price: session.price,
      priceCurrency: siteConfig.currency,
      itemOffered: {
        '@type': 'Service',
        name: session.name,
        description: session.summary,
      },
    })),
  },
})

export const faqPageSchema = (): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer.join(' '),
    },
  })),
})
