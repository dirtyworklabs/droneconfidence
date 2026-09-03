import { ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BlogPost } from '@/content/blog'
import { blogPostPath } from '@/lib/routes'
import { cn } from '@/lib/cn'

interface BlogCardProps {
  post: BlogPost
  compact?: boolean
}

export const BlogCard = ({ post, compact = false }: BlogCardProps) => (
  <article className="h-full">
    <Link
      to={blogPostPath(post.slug)}
      className={cn(
        'group flex h-full flex-col rounded-[var(--radius-card)] border border-ink/8 bg-surface shadow-[var(--shadow-raise)] transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)]',
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-7',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.76rem] font-medium uppercase tracking-[0.12em] text-ink-muted">
        <span className="text-sage">{post.category}</span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
          <Clock aria-hidden="true" className="size-3.5" />
          {post.readingMinutes} min read
        </span>
      </div>

      <h3
        className={cn(
          'mt-4 max-w-[22ch] transition-colors duration-200 ease-[var(--ease-calm)] group-hover:text-eucalyptus',
          compact ? 'text-[1.2rem]' : 'text-[clamp(1.35rem,2.5vw,1.7rem)]',
        )}
      >
        {post.title}
      </h3>

      <p
        className={cn(
          'mt-4 leading-relaxed text-ink-soft',
          compact ? 'text-[0.9rem]' : 'text-[0.96rem]',
        )}
      >
        {post.excerpt}
      </p>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 font-display text-[0.9rem] font-semibold text-eucalyptus">
        Read guide
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-[var(--ease-calm)] group-hover:translate-x-1"
        />
      </span>
    </Link>
  </article>
)
