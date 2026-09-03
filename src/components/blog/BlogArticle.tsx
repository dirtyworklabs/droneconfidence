import { ArrowUpRight, Check, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BookingCta } from '@/components/booking/BookingCta'
import { BlogCard } from '@/components/blog/BlogCard'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { BlogPost } from '@/content/blog'
import { getRelatedPublishedPosts } from '@/content/blog'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/routes'

interface BlogArticleProps {
  post: BlogPost
}

const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))

const slugifyHeading = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const BlogTable = ({
  headers,
  rows,
  className,
}: {
  headers: string[]
  rows: string[][]
  className?: string
}) => (
  <div
    className={cn(
      'overflow-x-auto rounded-[var(--radius-control)] border border-ink/10 bg-surface',
      className,
    )}
  >
    <table className="w-full min-w-[36rem] border-collapse text-left text-[0.92rem]">
      <thead className="bg-canvas-deep">
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              scope="col"
              className="border-b border-ink/10 px-4 py-3 font-display font-semibold"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={`${rowIndex}-${row[0] ?? ''}`}
            className="border-b border-ink/8 last:border-b-0"
          >
            {row.map((cell, cellIndex) => (
              <td
                key={`${cellIndex}-${cell}`}
                className="px-4 py-3 align-top text-ink-soft"
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const BlogArticle = ({ post }: BlogArticleProps) => {
  const relatedPosts = getRelatedPublishedPosts(post)

  const headings = post.sections.map((section) => ({
    label: section.heading,
    id: slugifyHeading(section.heading),
  }))

  return (
    <article>
      <Section
        tone="canvas"
        space="lg"
        className="overflow-hidden border-b border-ink/8"
      >
        <Container width="text">
          <Reveal>
            <nav
              aria-label="Breadcrumb"
              className="mb-7 text-[0.86rem] text-ink-muted"
            >
              <Link
                to={ROUTES.blog}
                className="transition-colors hover:text-eucalyptus"
              >
                Guides
              </Link>

              <span aria-hidden="true" className="px-2">
                /
              </span>

              <span>{post.category}</span>
            </nav>

            <Eyebrow>{post.category}</Eyebrow>

            <h1 className="mt-5 text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.99]">
              {post.title}
            </h1>

            <p className="mt-6 text-[clamp(1.05rem,2vw,1.22rem)] leading-relaxed text-ink-soft">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ink/10 pt-5 text-[0.86rem] text-ink-muted">
              <span>
                By{' '}
                <Link
                  to={post.authorPath}
                  className="font-medium text-ink-soft underline decoration-ink/15 underline-offset-4 hover:text-eucalyptus"
                >
                  {post.author}
                </Link>
              </span>

              {post.publishedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                </>
              ) : null}

              <span aria-hidden="true">·</span>

              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden="true" className="size-3.5" />
                {post.readingMinutes} min read
              </span>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section tone="surface" space="sm">
        <Container width="text">
          <Reveal>
            <div className="rounded-[var(--radius-card)] border border-sage/20 bg-sage-soft/55 p-6 sm:p-8">
              <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-eucalyptus">
                Quick answer
              </p>

              <p className="mt-3 text-[1.04rem] leading-relaxed text-ink">
                {post.quickAnswer}
              </p>
            </div>

            <div className="mt-9 grid gap-8 border-t border-ink/8 pt-8 md:grid-cols-[minmax(0,1.15fr)_minmax(14rem,0.85fr)]">
              <div>
                <h2 className="text-[1.35rem]">The important bits</h2>

                <ul className="mt-5 space-y-3">
                  {post.keyPoints.map((point) => (
                    <li
                      key={point}
                      className="flex gap-3 text-[0.98rem] leading-relaxed text-ink-soft"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-sage"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <nav
                aria-label="On this page"
                className="rounded-[var(--radius-control)] border border-ink/8 bg-canvas p-5"
              >
                <p className="font-display text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  On this page
                </p>

                <ol className="mt-4 space-y-2.5 text-[0.86rem] leading-snug text-ink-soft">
                  {headings.map((heading, index) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="transition-colors hover:text-eucalyptus"
                      >
                        {index + 1}. {heading.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section tone="canvas" space="md">
        <Container width="text">
          {post.sections.map((section, sectionIndex) => {
            const id = slugifyHeading(section.heading)

            const hasParagraphs = section.paragraphs.length > 0
            const hasBullets = Boolean(section.bullets?.length)
            const hasNumbered = Boolean(section.numbered?.length)
            const hasTable = Boolean(section.table)

            const isFirstSection = sectionIndex === 0
            const isLastSection = sectionIndex === post.sections.length - 1

            return (
              <Reveal key={section.heading}>
                <section
                  aria-labelledby={id}
                  className={cn(
                    'border-b border-ink/8',
                    isFirstSection
                      ? 'pb-10 sm:pb-12'
                      : 'py-10 sm:py-12',
                    isLastSection && 'border-b-0 pb-0 sm:pb-0',
                  )}
                >
                  <h2
                    id={id}
                    className="scroll-mt-28 text-[clamp(1.55rem,3vw,2rem)]"
                  >
                    {section.heading}
                  </h2>

                  {/*
                   * One structural wrapper owns the heading-to-content gap.
                   *
                   * This makes the editorial rhythm consistent regardless of
                   * whether the section begins with paragraphs, bullets,
                   * numbered steps, a table or a callout.
                   *
                   * 40px mobile / 48px from sm upward.
                   */}
                  <div className="mt-10 sm:mt-12">
                    {hasParagraphs ? (
                      <div className="space-y-5 text-[1.02rem] leading-[1.78] text-ink-soft">
                        {section.paragraphs.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    ) : null}

                    {section.bullets ? (
                      <ul
                        className={cn(
                          hasParagraphs && 'mt-6',
                          'space-y-3 pl-0',
                        )}
                      >
                        {section.bullets.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 leading-relaxed text-ink-soft"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-[0.72em] size-1.5 shrink-0 rounded-full bg-sage"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {section.numbered ? (
                      <ol
                        className={cn(
                          (hasParagraphs || hasBullets) && 'mt-6',
                          'space-y-4 pl-6 text-ink-soft marker:font-display marker:font-semibold marker:text-eucalyptus',
                        )}
                      >
                        {section.numbered.map((item) => (
                          <li key={item} className="pl-2 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ol>
                    ) : null}

                    {section.table ? (
                      <BlogTable
                        headers={section.table.headers}
                        rows={section.table.rows}
                        className={cn(
                          (hasParagraphs || hasBullets || hasNumbered) &&
                            'mt-8',
                          'mb-8',
                        )}
                      />
                    ) : null}

                    {section.callout ? (
                      <aside
                        className={cn(
                          (hasParagraphs ||
                            hasBullets ||
                            hasNumbered ||
                            hasTable) &&
                            'mt-7',
                          'rounded-[var(--radius-control)] border-l-2 border-sage bg-sage-soft/50 px-5 py-4 text-[0.97rem] leading-relaxed text-ink-soft',
                        )}
                      >
                        {section.callout}
                      </aside>
                    ) : null}
                  </div>
                </section>
              </Reveal>
            )
          })}
        </Container>
      </Section>

      <Section
        tone="sage"
        space="sm"
        aria-labelledby="article-cta-heading"
      >
        <Container width="text">
          <Reveal>
            <Eyebrow>Practical help</Eyebrow>

            <h2
              id="article-cta-heading"
              className="mt-4 text-[clamp(1.6rem,3vw,2.15rem)]"
            >
              {post.cta.title}
            </h2>

            <p className="mt-4 measure text-ink-soft">{post.cta.body}</p>

            <div className="mt-6">
              <BookingCta
                sessionId={post.cta.sessionId}
                size="lg"
                withArrow
                context={`blog:${post.slug}`}
              >
                {post.cta.label}
              </BookingCta>
            </div>
          </Reveal>
        </Container>
      </Section>

      <Section
        tone="surface"
        space="sm"
        aria-labelledby="sources-heading"
      >
        <Container width="text">
          <Reveal>
            <h2 id="sources-heading" className="text-[1.45rem]">
              Sources &amp; checking
            </h2>

            <p className="mt-3 text-[0.92rem] leading-relaxed text-ink-muted">
              This guide was checked against the sources below on{' '}
              {formatDate(post.reviewedAt)}. Rules, product features and local
              restrictions can change, so check the linked primary source when
              a decision depends on it.
            </p>

            <ul className="mt-5 space-y-4">
              {post.sources.map((source) => (
                <li key={source.url} className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex max-w-full items-start gap-2 break-words text-[0.9rem] leading-relaxed text-eucalyptus underline decoration-sage/30 underline-offset-4 hover:text-eucalyptus-deep"
                  >
                    <span>{source.name}</span>

                    <ArrowUpRight
                      aria-hidden="true"
                      className="mt-1 size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>

                  <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-muted">
                    {source.role}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[0.84rem] leading-relaxed text-ink-muted">
              General information only. Drone Confidence provides practical
              coaching, not legal advice, CASA certification or Remote Pilot
              Licence training.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Section
        tone="canvas"
        space="sm"
        aria-labelledby="author-heading"
      >
        <Container width="text">
          <Reveal>
            <div className="rounded-[var(--radius-card)] border border-ink/8 bg-surface p-6 sm:p-7">
              <Eyebrow>About the author</Eyebrow>

              <h2 id="author-heading" className="mt-4 text-[1.35rem]">
                {post.author}
              </h2>

              <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-soft">
                Tom has worked with drones since 2016 across commercial,
                government and photography projects. Drone Confidence turns
                that experience into practical one-on-one help for everyday
                drone owners in Sydney.
              </p>

              <Link
                to={post.authorPath}
                className="mt-4 inline-flex text-[0.9rem] font-medium text-eucalyptus underline decoration-sage/30 underline-offset-4 hover:text-eucalyptus-deep"
              >
                About Tom and Drone Confidence
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>

      {relatedPosts.length > 0 ? (
        <Section
          tone="canvas"
          space="md"
          aria-labelledby="related-guides-heading"
          className="border-t border-ink/8"
        >
          <Container>
            <Reveal>
              <Eyebrow>Keep learning</Eyebrow>

              <h2
                id="related-guides-heading"
                className="mt-4 text-[clamp(1.7rem,3.5vw,2.3rem)]"
              >
                Related guides
              </h2>
            </Reveal>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {relatedPosts.map((related, index) => (
                <Reveal key={related.slug} delay={index * 0.05}>
                  <BlogCard post={related} compact />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}
    </article>
  )
}