import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const dist = path.join(root, 'dist')
const posts = JSON.parse(await readFile(path.join(root, 'src/content/blog/posts.json'), 'utf8'))
const published = posts.filter((post) => post.status === 'published')
const drafts = posts.filter((post) => post.status === 'draft')
const siteUrl = (process.env.VITE_SITE_URL || 'https://droneconfidence.com').replace(/\/+$/, '')
const errors = []

const exists = async (filePath) => {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

const read = (filePath) => readFile(filePath, 'utf8')
const postPath = (post) => `/blog/${post.slug}`
const absolute = (pathname) => `${siteUrl}${pathname}`

const blogIndexPath = path.join(dist, 'blog', 'index.html')
if (!(await exists(blogIndexPath))) errors.push('Missing dist/blog/index.html.')

for (const post of published) {
  const filePath = path.join(dist, 'blog', post.slug, 'index.html')
  if (!(await exists(filePath))) {
    errors.push(`Missing prerendered article: ${post.slug}`)
    continue
  }

  const html = await read(filePath)
  const expectations = [
    `<title>${post.seoTitle}</title>`,
    `content="${post.description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`,
    `<link rel="canonical" href="${absolute(postPath(post))}"`,
    '<meta property="og:type" content="article"',
    '"@type":"BlogPosting"',
    `<h1>${post.title.replaceAll('&', '&amp;')}</h1>`,
    'Sources &amp; checking',
  ]

  for (const expected of expectations) {
    if (!html.includes(expected)) errors.push(`${post.slug}: prerendered HTML is missing ${expected.slice(0, 80)}.`)
  }
}

for (const post of drafts) {
  if (await exists(path.join(dist, 'blog', post.slug, 'index.html'))) {
    errors.push(`Draft article was prerendered: ${post.slug}`)
  }
}

const sitemap = await read(path.join(dist, 'sitemap.xml'))
const rss = await read(path.join(dist, 'rss.xml'))

if (!sitemap.includes(`<loc>${absolute('/blog')}</loc>`)) errors.push('Sitemap is missing /blog.')
for (const post of published) {
  const url = absolute(postPath(post))
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`Sitemap missing published article: ${post.slug}`)
  if (!rss.includes(`<link>${url}</link>`)) errors.push(`RSS missing published article: ${post.slug}`)
}
for (const post of drafts) {
  if (sitemap.includes(post.slug)) errors.push(`Sitemap leaks draft slug: ${post.slug}`)
  if (rss.includes(post.slug)) errors.push(`RSS leaks draft slug: ${post.slug}`)
}

// The browser imports published-posts.generated.json, not posts.json. Scan Vite's
// shipped assets as a hard check that draft content did not enter the client bundle.
const assetsDir = path.join(dist, 'assets')
for (const filename of await readdir(assetsDir)) {
  if (!/\.(?:js|css|json|map)$/i.test(filename)) continue
  const content = await read(path.join(assetsDir, filename))
  for (const post of drafts) {
    if (content.includes(post.slug) || content.includes(post.title)) {
      errors.push(`Public asset ${filename} contains draft content: ${post.slug}`)
    }
  }
}

if (errors.length) {
  console.error('\nBlog production-output verification failed:')
  for (const error of [...new Set(errors)]) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(`Blog production output verified: ${published.length} published pages; ${drafts.length} drafts excluded from pages, sitemap, RSS and browser assets.`)
