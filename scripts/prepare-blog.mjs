import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const sourcePath = path.join(root, 'src/content/blog/posts.json')
const outputPath = path.join(root, 'src/content/blog/published-posts.generated.json')

const posts = JSON.parse(await readFile(sourcePath, 'utf8'))
const publishedSlugs = new Set(posts.filter((post) => post.status === 'published').map((post) => post.slug))

/**
 * posts.json keeps forward-looking relatedSlugs so a second-wave guide starts
 * linking the moment it is published. Those entries must not reach the browser
 * while the target is still a draft: the generated file is imported by the app,
 * so an unpublished slug in it would ship a draft address in the public bundle.
 * Drop them here rather than in the editorial source or at render time.
 */
const published = posts
  .filter((post) => post.status === 'published')
  .map((post) => ({
    ...post,
    relatedSlugs: (post.relatedSlugs ?? []).filter((slug) => publishedSlugs.has(slug)),
  }))

await writeFile(outputPath, `${JSON.stringify(published, null, 2)}\n`)
console.log(`Prepared ${published.length} published blog posts for the public bundle.`)
