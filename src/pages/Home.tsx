import { Hero } from '@/components/marketing/Hero'
import { ExperienceStrip } from '@/components/marketing/ExperienceStrip'
import { Introduction } from '@/components/marketing/Introduction'
import { SessionsOverview } from '@/components/marketing/SessionsOverview'
import { Differentiator } from '@/components/marketing/Differentiator'
import { WhyOneOnOne } from '@/components/marketing/WhyOneOnOne'
import { LocationsPreview } from '@/components/marketing/LocationsPreview'
import { CustomLocationCallout } from '@/components/marketing/CustomLocationCallout'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { SafetyTrust } from '@/components/marketing/SafetyTrust'
import { AboutPreview } from '@/components/marketing/AboutPreview'
import { NotALicence } from '@/components/marketing/NotALicence'
import { Weather } from '@/components/marketing/Weather'
import { Testimonials } from '@/components/marketing/Testimonials'
import { FaqPreview } from '@/components/marketing/FaqPreview'
import { FinalCta } from '@/components/marketing/FinalCta'
import { useSeo } from '@/lib/seo'
import { localBusinessSchema, serviceSchema, websiteSchema } from '@/lib/structuredData'

const Home = () => {
  useSeo({
    title: 'Drone Lessons Sydney | Private 1-on-1 Training',
    description:
      'Private one-on-one drone lessons in Sydney. Learn to fly confidently or capture better aerial photo/video. Sessions from $179.',
    path: '/',
    socialTitle: 'Drone Confidence | Private Drone Training Sydney',
    socialDescription:
      'Learn to fly your drone with confidence. Private one-on-one training in Sydney from an experienced commercial drone operator.',
    structuredData: [localBusinessSchema(), websiteSchema(), serviceSchema()],
  })

  return (
    <>
      <Hero />
      <ExperienceStrip />
      <Introduction />
      <SessionsOverview />
      <Differentiator />
      <WhyOneOnOne />
      <LocationsPreview />
      <CustomLocationCallout />
      <HowItWorks />
      <SafetyTrust />
      <AboutPreview />
      <NotALicence />
      <Weather />
      <Testimonials />
      <FaqPreview />
      <FinalCta />
    </>
  )
}

export default Home
