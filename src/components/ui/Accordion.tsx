import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface AccordionItemData {
  id: string
  question: string
  answer: string[]
  link?: { label: string; to: string }
}

interface AccordionProps {
  items: AccordionItemData[]
  /** Renders the answer for the given id open on first paint. */
  defaultOpenId?: string
  renderLink?: (link: { label: string; to: string }) => React.ReactNode
  className?: string
  /**
   * Heading level wrapping each question. Use 'h2' when the accordion is the
   * page's first content after the h1, 'h3' when it sits under a section
   * heading, so the document outline never skips a level.
   */
  headingLevel?: 'h2' | 'h3'
}

/**
 * Disclosure accordion.
 *
 * Answers stay in the document at all times so they remain indexable, and are
 * marked inert while collapsed so keyboard and screen-reader users only reach
 * the content they've opened. Height animates with CSS grid rows, which the
 * global reduced-motion rule flattens automatically.
 */
export const Accordion = ({
  items,
  defaultOpenId,
  renderLink,
  className,
  headingLevel: Heading = 'h3',
}: AccordionProps) => {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : [])
  const baseId = useId()

  const toggle = (id: string) =>
    setOpenIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )

  return (
    <div className={cn('divide-y divide-ink/8 border-y border-ink/8', className)}>
      {items.map((item) => {
        const open = openIds.includes(item.id)
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`

        return (
          <div key={item.id}>
            <Heading className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left transition-colors duration-200 ease-[var(--ease-calm)] hover:text-sage"
              >
                <span className="font-display text-[1.05rem] font-semibold leading-snug tracking-[-0.015em] sm:text-[1.15rem]">
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-surface text-sage transition-[transform,background-color,border-color] duration-200 ease-[var(--ease-calm)] group-hover:border-sage/30 group-hover:bg-sage-soft',
                    open && 'rotate-45 border-sage/30 bg-sage-soft',
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </Heading>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-calm)]"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden" inert={!open}>
                <div className="measure space-y-3 pb-6 pr-10 text-ink-soft">
                  {item.answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {item.link && renderLink ? <div className="pt-1">{renderLink(item.link)}</div> : null}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
