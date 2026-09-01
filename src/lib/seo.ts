import { useEffect } from 'react'
import { siteConfig } from '@/config/site'

export interface SeoInput {
  title: string
  description: string
  /** Path only, e.g. '/sessions'. Combined with the canonical site URL. */
  path: string
  socialTitle?: string
  socialDescription?: string
  /** JSON-LD objects. Keep these conservative and truthful. */
  structuredData?: Array<Record<string, unknown>>
  noIndex?: boolean
}

const upsertMeta = (key: 'name' | 'property', value: string, content: string): void => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(key, value)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const upsertCanonical = (href: string): void => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

const STRUCTURED_DATA_ID = 'dc-structured-data'

const upsertStructuredData = (data: Array<Record<string, unknown>>): void => {
  const existing = document.getElementById(STRUCTURED_DATA_ID)
  if (existing) existing.remove()
  if (data.length === 0) return

  const script = document.createElement('script')
  script.id = STRUCTURED_DATA_ID
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data.length === 1 ? data[0] : data)
  document.head.appendChild(script)
}

/** Canonical absolute URL for a route path. */
export const absoluteUrl = (path: string): string => {
  const base = siteConfig.siteUrl.replace(/\/+$/, '')
  if (path === '/' || path === '') return `${base}/`
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export const useSeo = ({
  title,
  description,
  path,
  socialTitle,
  socialDescription,
  structuredData = [],
  noIndex = false,
}: SeoInput): void => {
  // Serialised so callers can pass inline JSON-LD literals without re-running
  // the effect on every render.
  const structuredDataKey = JSON.stringify(structuredData)

  useEffect(() => {
    const canonical = absoluteUrl(path)
    const ogTitle = socialTitle ?? title
    const ogDescription = socialDescription ?? description
    const image = `${siteConfig.siteUrl.replace(/\/+$/, '')}/social-card.png`

    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noIndex ? 'noindex, follow' : 'index, follow')
    upsertCanonical(canonical)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', siteConfig.businessName)
    upsertMeta('property', 'og:locale', 'en_AU')
    upsertMeta('property', 'og:title', ogTitle)
    upsertMeta('property', 'og:description', ogDescription)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', image)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', ogTitle)
    upsertMeta('name', 'twitter:description', ogDescription)
    upsertMeta('name', 'twitter:image', image)

    upsertStructuredData(JSON.parse(structuredDataKey) as Array<Record<string, unknown>>)
  }, [title, description, path, socialTitle, socialDescription, structuredDataKey, noIndex])
}
