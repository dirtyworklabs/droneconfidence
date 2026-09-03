import { readFile } from 'node:fs/promises'
import { TZDate } from '@date-fns/tz'

const SYDNEY_TIME_ZONE = 'Australia/Sydney'
const pad2 = (value) => String(value).padStart(2, '0')

// Editorial publishing is judged against Sydney's calendar date, not the build
// server's. Netlify runs in UTC, where Sydney is already on the next day for
// 10-11 hours of every date, so a UTC truncation would reject a post published
// "today" in Sydney as being in the future.
const nowSydney = TZDate.tz(SYDNEY_TIME_ZONE)
const today = `${nowSydney.getFullYear()}-${pad2(nowSydney.getMonth() + 1)}-${pad2(nowSydney.getDate())}`

const posts = JSON.parse(await readFile(new URL('../src/content/blog/posts.json', import.meta.url), 'utf8'))
const errors = []
const warnings = []
const slugs = new Set()
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const wordsIn = (post) => {
  const text = [
    post.title,
    post.excerpt,
    post.quickAnswer,
    ...(post.keyPoints ?? []),
    ...(post.sections ?? []).flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
      ...(section.numbered ?? []),
      section.callout ?? '',
      ...(section.table?.headers ?? []),
      ...(section.table?.rows ?? []).flat(),
    ]),
  ].join(' ')
  return (text.match(/\b[\p{L}\p{N}][\p{L}\p{N}’'-]*\b/gu) ?? []).length
}

const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')

if (!Array.isArray(posts)) {
  errors.push('posts.json must contain an array.')
} else {
  for (const post of posts) {
    if (!post.slug || !slugPattern.test(post.slug)) errors.push(`Invalid slug: ${post.slug ?? '(missing)'}`)
    if (slugs.has(post.slug)) errors.push(`Duplicate slug: ${post.slug}`)
    slugs.add(post.slug)

    if (!['published', 'draft'].includes(post.status)) errors.push(`${post.slug}: status must be published or draft.`)
    if (post.status === 'published' && !post.publishedAt) errors.push(`${post.slug}: published posts need publishedAt.`)
    if (post.status === 'draft' && post.publishedAt) warnings.push(`${post.slug}: draft has publishedAt; leave it null until publication.`)
    if (post.publishedAt && !validDate(post.publishedAt)) errors.push(`${post.slug}: publishedAt must be YYYY-MM-DD.`)
    if (!validDate(post.reviewedAt)) errors.push(`${post.slug}: reviewedAt must be YYYY-MM-DD.`)
    if (post.status === 'published' && post.publishedAt > today) errors.push(`${post.slug}: publishedAt ${post.publishedAt} is in the future (${today}).`)
    if (post.publishedAt && post.reviewedAt < post.publishedAt) errors.push(`${post.slug}: reviewedAt cannot be before publishedAt.`)

    if (!post.author || !post.authorPath) errors.push(`${post.slug}: author/byline fields are required.`)
    if (!post.seoTitle || post.seoTitle.length > 65) warnings.push(`${post.slug}: SEO title is ${post.seoTitle?.length ?? 0} characters (aim <=65).`)
    if (!post.description || post.description.length < 110 || post.description.length > 165) {
      warnings.push(`${post.slug}: meta description is ${post.description?.length ?? 0} characters (aim 110–165).`)
    }
    if (!post.excerpt || !post.quickAnswer) errors.push(`${post.slug}: excerpt and quickAnswer are required.`)
    if (!Array.isArray(post.sections) || post.sections.length < 3) errors.push(`${post.slug}: needs at least three substantive sections.`)
    if (!Array.isArray(post.sources) || post.sources.length < 2) errors.push(`${post.slug}: needs at least two sources for cross-checking.`)
    if (!Array.isArray(post.keyPoints) || post.keyPoints.length < 3) errors.push(`${post.slug}: needs at least three key points.`)
    if (!Array.isArray(post.relatedSlugs)) errors.push(`${post.slug}: relatedSlugs must be an array.`)
    if (!post.cta?.title || !post.cta?.body || !post.cta?.label) errors.push(`${post.slug}: CTA fields are incomplete.`)
    if (post.readingMinutes < 3 || post.readingMinutes > 7) errors.push(`${post.slug}: readingMinutes must stay between 3 and 7.`)

    const words = wordsIn(post)
    if (words < 600) warnings.push(`${post.slug}: only ~${words} words; check that it earns a 3-minute read.`)
    if (words > 2100) warnings.push(`${post.slug}: ~${words} words; consider tightening before publishing.`)
    const calculatedMinutes = Math.max(1, Math.ceil(words / 220))
    if (Math.abs(calculatedMinutes - post.readingMinutes) > 2) {
      warnings.push(`${post.slug}: declared ${post.readingMinutes} min but ~${words} words suggests about ${calculatedMinutes} min.`)
    }

    const sourceHosts = new Set()
    for (const source of post.sources ?? []) {
      if (!source.name || !source.role) errors.push(`${post.slug}: every source needs a name and role.`)
      try {
        const url = new URL(source.url)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol')
        sourceHosts.add(url.hostname.replace(/^www\./, ''))
      } catch {
        errors.push(`${post.slug}: invalid source URL: ${source.url}`)
      }
    }
    if (sourceHosts.size < 2) {
      warnings.push(`${post.slug}: sources all come from one host; add an independent/secondary cross-check where practical.`)
    }
  }

  for (const post of posts) {
    for (const relatedSlug of post.relatedSlugs ?? []) {
      if (!slugs.has(relatedSlug)) errors.push(`${post.slug}: unknown related slug ${relatedSlug}.`)
      if (relatedSlug === post.slug) errors.push(`${post.slug}: cannot relate to itself.`)
    }
  }
}

const published = Array.isArray(posts) ? posts.filter((post) => post.status === 'published') : []
const drafts = Array.isArray(posts) ? posts.filter((post) => post.status === 'draft') : []
if (published.length !== 8) warnings.push(`Launch plan currently has ${published.length} published posts; intended launch set is 8.`)
if (drafts.length !== 6) warnings.push(`Second-wave queue currently has ${drafts.length} drafts; intended queue is 6.`)

if (warnings.length) {
  console.warn('\nBlog content warnings:')
  for (const warning of warnings) console.warn(`  - ${warning}`)
}

if (errors.length) {
  console.error('\nBlog content errors:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`Blog check passed: ${published.length} published + ${drafts.length} draft guides.`)
