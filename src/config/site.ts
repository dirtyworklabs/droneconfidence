/**
 * Non-secret site configuration.
 *
 * Every value here is public. Email, domain, social links and booking details
 * are read from this one place so they never get scattered through components.
 * Anything not yet supplied is left empty on purpose — the UI hides the
 * corresponding element rather than rendering a placeholder.
 */

const readString = (value: string | undefined, fallback = ''): string => {
  const trimmed = (value ?? '').trim()
  return trimmed.length > 0 ? trimmed : fallback
}

export const siteConfig = {
  businessName: 'Drone Confidence',
  tagline: 'Private one-on-one drone training in Sydney.',
  shortDescription:
    'Private one-on-one drone training in Sydney. Practical help with your own drone, from first take-off to confident flying and better aerial imagery.',

  /** Canonical production domain. DNS is not assumed to be configured yet. */
  siteUrl: readString(import.meta.env.VITE_SITE_URL, 'https://droneconfidence.com'),

  /** Leave empty until a real address exists — the footer row hides itself. */
  contactEmail: readString(import.meta.env.VITE_CONTACT_EMAIL),

  /** Optional. Hidden entirely when empty. */
  contactPhone: readString(import.meta.env.VITE_CONTACT_PHONE),
  instagramUrl: readString(import.meta.env.VITE_INSTAGRAM_URL),

  /** Service area used for copy and structured data. */
  serviceArea: 'Sydney, New South Wales, Australia',
  timezone: 'Australia/Sydney',
  currency: 'AUD',

  /**
   * Named in the privacy policy. These are the real processors behind the
   * first-party booking system.
   */
  providers: {
    hosting: 'Netlify',
    database: 'Supabase',
    payment: 'Stripe',
    email: 'Resend',
  },

  /** Year shown in the footer copyright line. */
  copyrightYear: 2026,
} as const

export const hasContactEmail = siteConfig.contactEmail.length > 0
export const hasInstagram = siteConfig.instagramUrl.length > 0
export const hasContactPhone = siteConfig.contactPhone.length > 0
