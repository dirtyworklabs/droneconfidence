import type { ReactNode } from 'react'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'
import { TopoBackdrop } from '@/components/visuals/TopoBackdrop'
import { cn } from '@/lib/cn'

interface PageHeroProps {
  eyebrow?: string
  title: string
  intro?: ReactNode
  actions?: ReactNode
  /** Narrow measure for policy and legal pages. */
  width?: 'wide' | 'text'
  className?: string
}

export const PageHero = ({ eyebrow, title, intro, actions, width = 'wide', className }: PageHeroProps) => (
  <section className={cn('relative overflow-hidden bg-canvas pt-12 pb-12 sm:pt-16 sm:pb-16', className)}>
    <TopoBackdrop className="opacity-60" />

    <Container width={width} className="relative">
      <Reveal className="flex flex-col gap-5">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="max-w-[22ch] text-[clamp(2.2rem,5.4vw,3.5rem)] font-bold leading-[1.04] tracking-[-0.035em]">
          {title}
        </h1>
        {intro ? (
          <div className="measure space-y-4 text-[1.06rem] leading-relaxed text-ink-soft">{intro}</div>
        ) : null}
        {actions ? <div className="flex flex-wrap items-center gap-3 pt-2">{actions}</div> : null}
      </Reveal>
    </Container>
  </section>
)
