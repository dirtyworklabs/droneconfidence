import { Link, useParams } from 'react-router-dom'
import { BlogArticle } from '@/components/blog/BlogArticle'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { getPublishedBlogPost } from '@/content/blog'
import type { BlogPost } from '@/content/blog'
import { blogPostPath, ROUTES } from '@/lib/routes'
import { useSeo } from '@/lib/seo'
import { blogPostingSchema, breadcrumbSchema } from '@/lib/structuredData'

const PublishedBlogPost = ({ post }: { post: BlogPost }) => {
  const path = blogPostPath(post.slug)
  const publishedAt = post.publishedAt ?? undefined
  const modifiedAt =
    publishedAt && post.reviewedAt >= publishedAt ? post.reviewedAt : undefined

  useSeo({
    title: post.seoTitle,
    description: post.description,
    path,
    type: 'article',
    publishedTime: publishedAt,
    modifiedTime: modifiedAt,
    structuredData: [
      blogPostingSchema(post),
      breadcrumbSchema([
        { name: 'Home', path: ROUTES.home },
        { name: 'Guides', path: ROUTES.blog },
        { name: post.title, path },
      ]),
    ],
  })

  return <BlogArticle post={post} />
}

const MissingBlogPost = () => {
  useSeo({
    title: 'Guide Not Found | Drone Confidence',
    description: 'That Drone Confidence guide could not be found.',
    path: ROUTES.blog,
    noIndex: true,
  })

  return (
    <Section tone="canvas" space="lg">
      <Container width="text">
        <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sage">
          Guides
        </p>
        <h1 className="mt-5 text-[clamp(2rem,6vw,3.5rem)]">That guide isn&rsquo;t published.</h1>
        <p className="mt-5 text-ink-soft">
          It may still be in review, or the address may have changed.
        </p>
        <Link
          to={ROUTES.blog}
          className="mt-7 inline-flex text-eucalyptus underline decoration-sage/30 underline-offset-4 hover:text-eucalyptus-deep"
        >
          Browse published guides
        </Link>
      </Container>
    </Section>
  )
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const post = getPublishedBlogPost(slug)
  return post ? <PublishedBlogPost post={post} /> : <MissingBlogPost />
}

export default BlogPostPage
