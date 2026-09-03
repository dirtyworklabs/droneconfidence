import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TZDate } from '@date-fns/tz'

const SYDNEY_TIME_ZONE = 'Australia/Sydney'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const dist = path.join(root, 'dist')
const sourcePath = path.join(root, 'src/content/blog/posts.json')
const siteUrl = (process.env.VITE_SITE_URL || 'https://droneconfidence.com').replace(/\/+$/, '')
const posts = JSON.parse(await readFile(sourcePath, 'utf8'))
const published = posts.filter((post) => post.status === 'published')
const template = await readFile(path.join(dist, 'index.html'), 'utf8')

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const escapeXml = escapeHtml
const safeJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')
const absolute = (pathname) => pathname === '/' ? `${siteUrl}/` : `${siteUrl}${pathname}`
const postPath = (post) => `/blog/${post.slug}`
const publishedDate = (post) => post.publishedAt
const modifiedDate = (post) => post.reviewedAt >= post.publishedAt ? post.reviewedAt : post.publishedAt

// publishedAt stays an editorial YYYY-MM-DD, so RSS has to resolve it to a real
// instant. A fixed +10:00 is wrong for half the year: Sydney is AEDT (+11:00)
// from October to April. TZDate applies whichever offset that date actually had.
const rssPublicationDate = (publishedAt) => {
  const [year, month, day] = publishedAt.split('-').map(Number)
  return new TZDate(year, month - 1, day, SYDNEY_TIME_ZONE).toUTCString()
}

const upsertMeta = (html, key, content, { property = false } = {}) => {
  const attr = property ? 'property' : 'name'
  const pattern = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`)
}

const upsertCanonical = (html, href) => {
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `    ${tag}\n  </head>`)
}

const ensureRssLink = (html) => {
  if (/rel=["']alternate["'][^>]*type=["']application\/rss\+xml["']/i.test(html)) return html
  const tag = `<link rel="alternate" type="application/rss+xml" title="Drone Confidence Guides" href="/rss.xml" />`
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

const removeStaticStructuredData = (html) => html.replace(
  /\s*<script\s+type=["']application\/ld\+json["']\s+id=["']dc-static-structured-data["']>[\s\S]*?<\/script>/gi,
  '',
)

const removeArticleMeta = (html) => html
  .replace(/\s*<meta\s+property=["']article:published_time["'][^>]*>/gi, '')
  .replace(/\s*<meta\s+property=["']article:modified_time["'][^>]*>/gi, '')

const applyHead = ({ html, title, description, pathname, type = 'website', publishedAt, modifiedAt, jsonLd }) => {
  const canonical = absolute(pathname)
  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  next = upsertMeta(next, 'description', description)
  next = upsertCanonical(next, canonical)
  next = upsertMeta(next, 'robots', 'index, follow')
  next = upsertMeta(next, 'og:type', type, { property: true })
  next = upsertMeta(next, 'og:title', title, { property: true })
  next = upsertMeta(next, 'og:description', description, { property: true })
  next = upsertMeta(next, 'og:url', canonical, { property: true })
  next = upsertMeta(next, 'twitter:title', title)
  next = upsertMeta(next, 'twitter:description', description)
  next = removeArticleMeta(next)
  next = removeStaticStructuredData(next)
  next = ensureRssLink(next)

  if (publishedAt) {
    next = next.replace('</head>', `    <meta property="article:published_time" content="${escapeHtml(publishedAt)}" />\n  </head>`)
  }
  if (modifiedAt) {
    next = next.replace('</head>', `    <meta property="article:modified_time" content="${escapeHtml(modifiedAt)}" />\n  </head>`)
  }
  if (jsonLd) {
    next = next.replace(
      '</head>',
      `    <script type="application/ld+json" id="dc-static-structured-data">${safeJson(jsonLd)}</script>\n  </head>`,
    )
  }

  return next
}

const articleJsonLd = (post) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      url: absolute(postPath(post)),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': absolute(postPath(post)),
      },
      inLanguage: 'en-AU',
      datePublished: publishedDate(post),
      dateModified: modifiedDate(post),
      author: {
        '@type': 'Person',
        name: post.author,
        url: absolute(post.authorPath),
      },
      publisher: {
        '@type': 'Organization',
        '@id': `${absolute('/')}#business`,
        name: 'Drone Confidence',
        url: absolute('/'),
      },
      image: `${siteUrl}/social-card.png`,
      articleSection: post.category,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absolute('/') },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: absolute('/blog') },
        { '@type': 'ListItem', position: 3, name: post.title, item: absolute(postPath(post)) },
      ],
    },
  ],
})

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'Drone Confidence Guides',
      description: 'Plain-English drone guides for Australian drone owners.',
      url: absolute('/blog'),
      inLanguage: 'en-AU',
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: published.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: post.title,
          url: absolute(postPath(post)),
        })),
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absolute('/') },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: absolute('/blog') },
      ],
    },
  ],
}

const renderSection = (section) => `
<section>
  <h2>${escapeHtml(section.heading)}</h2>
  ${(section.paragraphs ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n  ')}
  ${section.bullets?.length ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  ${section.numbered?.length ? `<ol>${section.numbered.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>` : ''}
  ${section.table ? `<table><thead><tr>${section.table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
  ${section.callout ? `<aside><p>${escapeHtml(section.callout)}</p></aside>` : ''}
</section>`

const staticArticle = (post) => {
  const sources = post.sources.map((source) => (
    `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.name)}</a> — ${escapeHtml(source.role)}</li>`
  )).join('')

  return `<main id="dc-static-blog-content">
  <article>
    <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog">Guides</a> / ${escapeHtml(post.title)}</nav>
    <header>
      <p>${escapeHtml(post.category)}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p>${escapeHtml(post.excerpt)}</p>
      <p>By <a href="${escapeHtml(post.authorPath)}">${escapeHtml(post.author)}</a> · ${post.readingMinutes} min read · Published ${escapeHtml(post.publishedAt)}</p>
    </header>
    <section><h2>Quick answer</h2><p>${escapeHtml(post.quickAnswer)}</p></section>
    <section><h2>The important bits</h2><ul>${post.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul></section>
    ${post.sections.map(renderSection).join('\n')}
    <section><h2>Sources &amp; checking</h2><ul>${sources}</ul></section>
    <p>Drone rules, airspace and local operating requirements can change. This guide is general information, not legal or aviation advice. Check current CASA information, a CASA-verified drone safety app and the rules for the place you plan to fly.</p>
  </article>
</main>`
}

const staticIndex = () => `<main id="dc-static-blog-content">
  <header><p>Drone Confidence Guides</p><h1>Learn more before you fly.</h1><p>Practical, plain-English guides for everyday drone owners covering flying, safety, Australian drone rules, aircraft features and choosing the right drone.</p></header>
  <section aria-labelledby="guide-list-heading"><h2 id="guide-list-heading">Latest guides</h2>
    ${published.map((post) => `<article><p>${escapeHtml(post.category)} · ${post.readingMinutes} min read</p><h3><a href="${postPath(post)}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.excerpt)}</p></article>`).join('\n')}
  </section>
</main>`

const writePrerendered = async (pathname, rootHtml, head) => {
  const directory = path.join(dist, pathname.replace(/^\//, ''))
  await mkdir(directory, { recursive: true })
  let html = applyHead({ html: template, pathname, ...head })
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('Could not find the Vite root element while prerendering blog HTML.')
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)
  await writeFile(path.join(directory, 'index.html'), html)
}

await writePrerendered('/blog', staticIndex(), {
  title: 'Drone Guides Australia | Drone Confidence',
  description: 'Plain-English drone guides for Australian beginners: CASA rules, Sydney flying locations, first flights, Return-to-Home, choosing a drone and crash recovery.',
  jsonLd: collectionJsonLd,
})

for (const post of published) {
  await writePrerendered(postPath(post), staticArticle(post), {
    title: post.seoTitle,
    description: post.description,
    type: 'article',
    publishedAt: publishedDate(post),
    modifiedAt: modifiedDate(post),
    jsonLd: articleJsonLd(post),
  })
}

// Preserve every existing public sitemap entry and append the blog URLs. This avoids
// duplicating the site's canonical page catalogue in JavaScript.
const sitemapPath = path.join(dist, 'sitemap.xml')
let sitemap = await readFile(sitemapPath, 'utf8')
// public/sitemap.xml contains launch-time fallback blog entries so the repository
// is self-describing. Remove those blog URL blocks here and regenerate them from
// current published content so lastmod and newly published posts never go stale.
sitemap = sitemap.replace(/\s*<url>[\s\S]*?<\/url>/g, (block) =>
  /<loc>[^<]*\/blog(?:\/[^<]*)?<\/loc>/.test(block) ? '' : block,
)
const blogEntries = [
  {
    loc: absolute('/blog'),
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: published.reduce((latest, post) => modifiedDate(post) > latest ? modifiedDate(post) : latest, ''),
  },
  ...published.map((post) => ({
    loc: absolute(postPath(post)),
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: modifiedDate(post),
  })),
]

for (const entry of blogEntries) {
  const xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n${entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n` : ''}    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>\n`
  sitemap = sitemap.replace('</urlset>', `${xml}</urlset>`)
}
await writeFile(sitemapPath, sitemap)

const rssItems = [...published]
  .sort((a, b) => `${b.publishedAt}:${b.slug}`.localeCompare(`${a.publishedAt}:${a.slug}`))
  .map((post) => `    <item>\n      <title>${escapeXml(post.title)}</title>\n      <link>${escapeXml(absolute(postPath(post)))}</link>\n      <guid isPermaLink="true">${escapeXml(absolute(postPath(post)))}</guid>\n      <pubDate>${rssPublicationDate(post.publishedAt)}</pubDate>\n      <description>${escapeXml(post.description)}</description>\n    </item>`)
  .join('\n')

const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Drone Confidence Guides</title>\n    <link>${escapeXml(absolute('/blog'))}</link>\n    <description>Plain-English drone guides for Australian drone owners.</description>\n    <language>en-au</language>\n${rssItems}\n  </channel>\n</rss>\n`
await writeFile(path.join(dist, 'rss.xml'), rss)

console.log(`Prerendered /blog and ${published.length} published article pages; generated sitemap.xml and rss.xml.`)
