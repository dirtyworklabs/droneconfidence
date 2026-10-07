import { Hero } from '@/components/marketing/Hero'
import { Introduction } from '@/components/marketing/Introduction'
import { SessionsOverview } from '@/components/marketing/SessionsOverview'
import { Differentiator } from '@/components/marketing/Differentiator'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { AboutTrust } from '@/components/marketing/AboutTrust'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FaqPreview } from '@/components/marketing/FaqPreview'
import { FinalCta } from '@/components/marketing/FinalCta'
import { useSeo } from '@/lib/seo'
import { localBusinessSchema, serviceSchema, websiteSchema } from '@/lib/structuredData'

const Home = () => {
  useSeo({
    title: 'Drone Lessons Sydney | Private 1-on-1 Training',
    description:
      'Private one-on-one beginner drone lessons in Sydney. Learn to fly your own drone confidently with practical help on setup, controls, take-off, landing, Return-to-Home, safety and everyday drone rules.',
    path: '/',
    socialTitle: 'Drone Confidence | Private Drone Training Sydney',
    socialDescription:
        'Learn to fly your drone with confidence. Private one-on-one training in Sydney from an experienced drone operator and professional photographer.',
    structuredData: [localBusinessSchema(), websiteSchema(), serviceSchema()],
  })

  /**
   * Deliberate order: what this is, how it works, why a full course is
   * unnecessary, the beginner lesson itself, then trust and the booking CTA.
   * Training areas live on /locations and the experience strip on /about.
   */
  return (
    <>
      <Hero />
      <Introduction />
      <HowItWorks />
      <SessionsOverview />
      <Differentiator />
      <AboutTrust />
      <Testimonials />
      <FaqPreview />
      <FinalCta />
    </>
  )
}

export default Home
