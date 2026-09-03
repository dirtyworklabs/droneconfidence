import rawPublishedPosts from './published-posts.generated.json'
import type { BlogPost } from './types'

/**
 * Public runtime content only.
 *
 * scripts/prepare-blog.mjs generates this file from posts.json before every
 * production build, including only entries whose status is "published". This
 * keeps completed drafts in the repository without shipping their copy in the
 * browser bundle.
 */
export const publishedBlogPosts = (rawPublishedPosts as BlogPost[])
  .slice()
  .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))

export const getPublishedBlogPost = (slug: string | undefined): BlogPost | null =>
  publishedBlogPosts.find((post) => post.slug === slug) ?? null

export const getRelatedPublishedPosts = (post: BlogPost, limit = 3): BlogPost[] => {
  const related = post.relatedSlugs
    .map((slug) => publishedBlogPosts.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is BlogPost => Boolean(candidate))

  if (related.length >= limit) return related.slice(0, limit)

  const used = new Set([post.slug, ...related.map((candidate) => candidate.slug)])
  const sameCategory = publishedBlogPosts.filter(
    (candidate) => !used.has(candidate.slug) && candidate.category === post.category,
  )
  for (const candidate of sameCategory) used.add(candidate.slug)

  const anyCategory = publishedBlogPosts.filter((candidate) => !used.has(candidate.slug))

  return [...related, ...sameCategory, ...anyCategory].slice(0, limit)
}

export type { BlogPost, BlogSection, BlogSource } from './types'
