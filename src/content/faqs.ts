import { bookingConfig } from '@/config/booking'
import type { Faq } from '@/types'

const allFaqs: Faq[] = [
  {
    id: 'never-flown',
    question: 'I’ve never flown a drone before. Is that okay?',
    answer: [
      'Absolutely.',
      'First Flight is designed specifically for people starting from zero. You don’t need to practise beforehand.',
    ],
    featured: true,
  },
  {
    id: 'own-drone',
    question: 'Do I need to bring my own drone?',
    answer: [
      'These sessions are primarily designed around learning on your own aircraft. That’s the best way to leave knowing how the drone you’ll actually use behaves.',
      'Tell us your model when booking.',
    ],
    featured: true,
  },
  {
    id: 'supported-drones',
    question: 'Which drones do you train with?',
    answer: [
      'Most modern consumer camera drones are suitable, particularly common DJI models including the Mini, Air and Mavic families.',
      'If you’re unsure, send us the exact model before booking.',
    ],
  },
  {
    id: 'setup',
    question: 'My drone isn’t set up yet. Can you help?',
    answer: [
      'Yes. Initial setup can be incorporated into a First Flight session.',
      'However, lengthy firmware downloads and account setup can reduce flying time, so we may send you a few simple preparation steps before the lesson.',
    ],
  },
  {
    id: 'repl',
    question: 'Do you provide RePL training?',
    answer: [
      'No.',
      'Drone Confidence offers practical one-on-one coaching, not Remote Pilot Licence training or CASA qualifications.',
    ],
    featured: true,
  },
  {
    id: 'commercial',
    question: 'Can you teach me to fly commercially?',
    answer: [
      'We can help improve your practical flying, aircraft familiarity and camera skills, but Drone Confidence does not issue commercial aviation qualifications.',
      'Commercial operators are responsible for ensuring they hold any registrations, accreditation, licences and approvals required for their operations.',
    ],
  },
  {
    id: 'rain',
    question: 'What happens if it rains?',
    answer: [
      'We’ll reschedule you at no cost, or refund you in full if a suitable alternative time can’t be found.',
      'We don’t want you spending your lesson standing under an umbrella while your drone stays in its case.',
    ],
    featured: true,
  },
  {
    id: 'wind',
    question: 'What if it’s windy?',
    answer: [
      'That depends on the conditions, location, aircraft and type of session.',
      'We’ll assess the forecast and conditions rather than using one arbitrary wind number for every drone. If conditions aren’t appropriate, we’ll reschedule or refund you as described above.',
    ],
  },
  {
    id: 'payment',
    question: 'Do I pay on the day?',
    answer: [
      'No.',
      'Full payment is taken online when you book, so there’s nothing to arrange or pay for when we meet — just bring your drone and gear.',
    ],
    featured: true,
  },
  {
    id: 'meeting-location',
    question: 'Where exactly do we meet?',
    answer: [
      'Your meeting point is provided with your confirmed booking.',
      'Our standard training areas are around Taren Point in Sydney’s south and North Ryde in Sydney’s north.',
    ],
  },
  {
    id: 'custom-location',
    question: 'Can you come to my local park?',
    answer: [
      'Possibly.',
      'Custom locations can be considered, provided the site, airspace, local rules and operating conditions are suitable.',
      'Additional travel or venue charges may apply and will be confirmed with you before you book.',
    ],
    link: { label: 'Request a Custom Location', to: '/contact?reason=custom-location' },
  },
  {
    id: 'guest',
    question: 'Can someone come with me?',
    answer: [
      'Generally yes, provided the session remains suitable and safe.',
      'The training itself is one-on-one and designed around the person who booked. Let us know beforehand if someone else will be attending.',
    ],
  },
  {
    id: 'photography',
    question: 'Can you help me with photography as well as flying?',
    answer: [
      'Yes. That’s exactly what the Photo & Video session is designed for.',
      'We’ll work on both aircraft movement and camera technique.',
    ],
  },
  {
    id: 'one-hour',
    question: 'Is one hour enough for a complete beginner?',
    answer: [
      'For most people, yes.',
      'First Flight is designed to get you through setup, essential safety information and the fundamental flying skills you’ll need to continue practising independently.',
    ],
  },
]

/**
 * How payment works is only a real answer once online booking is live. Until
 * then the question is dropped everywhere at once — FAQ page, homepage preview
 * and FAQPage structured data — rather than answered with a caveat.
 */
export const faqs: Faq[] = bookingConfig.bookingEnabled
  ? allFaqs
  : allFaqs.filter((faq) => faq.id !== 'payment')

export const featuredFaqs = faqs.filter((faq) => faq.featured)
