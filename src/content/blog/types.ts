import type { SessionId } from '@/types'

export type BlogPostStatus = 'published' | 'draft'

export interface BlogSource {
  name: string
  url: string
  role: string
}

export interface BlogTable {
  headers: string[]
  rows: string[][]
}

export interface BlogSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
  numbered?: string[]
  table?: BlogTable
  callout?: string
}

export interface BlogCta {
  sessionId?: SessionId
  title: string
  body: string
  label: string
}

export interface BlogPost {
  slug: string
  status: BlogPostStatus
  title: string
  seoTitle: string
  description: string
  excerpt: string
  category: string
  /** Editorial targeting only. Deliberately not emitted as a meta-keywords tag. */
  targetQuery: string
  secondaryKeywords: string[]
  searchIntent: string
  readingMinutes: number
  author: string
  authorPath: string
  publishedAt: string | null
  reviewedAt: string
  quickAnswer: string
  keyPoints: string[]
  sections: BlogSection[]
  sources: BlogSource[]
  relatedSlugs: string[]
  cta: BlogCta
}
