export interface NavLinkItem {
  label: string
  to: string
}

/** Primary navigation. Kept deliberately short. */
export const primaryNav: NavLinkItem[] = [
  { label: 'Sessions', to: '/sessions' },
  { label: 'Locations', to: '/locations' },
  { label: 'Guides', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'FAQs', to: '/faq' },
]

export const footerNav: NavLinkItem[] = [
  { label: 'Sessions', to: '/sessions' },
  { label: 'Locations', to: '/locations' },
  { label: 'Guides', to: '/blog' },
  { label: 'About', to: '/about' },
  { label: 'FAQs', to: '/faq' },
  { label: 'Book', to: '/book' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Booking Policy', to: '/booking-policy' },
]
