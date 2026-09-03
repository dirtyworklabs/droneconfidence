import { BlogCard } from '@/components/blog/BlogCard'
import { FinalCta } from '@/components/marketing/FinalCta'
import { PageHero } from '@/components/marketing/PageHero'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import { publishedBlogPosts } from '@/content/blog'
import { useSeo } from '@/lib/seo'
import { blogCollectionSchema, breadcrumbSchema } from '@/lib/structuredData'
import { ROUTES } from '@/lib/routes'

const Blog = () => {
  useSeo({
    title: 'Drone Guides Australia | Drone Confidence',
    description:
      'Plain-English drone guides for Australian beginners: CASA rules, Sydney flying locations, first flights, Return-to-Home, choosing a drone and crash recovery.',
    path: ROUTES.blog,
    structuredData: [
      blogCollectionSchema(publishedBlogPosts),
      breadcrumbSchema([
        { name: 'Home', path: ROUTES.home },
        { name: 'Guides', path: ROUTES.blog },
      ]),
    ],
  })

  return (
    <>
      <PageHero
        eyebrow="Drone Confidence Guides"
        title="Learn more before you fly."
        width="text"
        intro={
          <>
            <p>
              Practical, plain-English guides for Australian drone owners covering flying,
              safety, the rules, aircraft features and choosing the right drone.
            </p>
            <p className="text-[0.92rem] text-ink-muted">
              Written and fact checked by Tom Gerrard. Regulation guides are checked against
              current CASA and government sources before publication.
            </p>
          </>
        }
      />

      <Section tone="canvas" space="md" aria-labelledby="all-guides-heading" className="border-t border-ink/8">
        <Container>
          <Reveal className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>Guide library</Eyebrow>
              <h2 id="all-guides-heading" className="mt-4 text-[clamp(1.8rem,4vw,2.5rem)]">
                Start with what you need today.
              </h2>
            </div>
            <p className="text-[0.88rem] text-ink-muted">{publishedBlogPosts.length} guides</p>
          </Reveal>

          <div className="grid gap-5 md:grid-cols-2">
            {publishedBlogPosts.map((post, index) => (
              <Reveal key={post.slug} delay={(index % 2) * 0.05}>
                <BlogCard post={post} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCta />
    </>
  )
}

export default Blog
