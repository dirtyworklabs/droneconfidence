import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Reveal } from '@/components/ui/Reveal'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  id?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'onDark'
  size?: 'md' | 'lg'
  className?: string
  level?: 'h2' | 'h3'
}

export const SectionHeading = ({
  eyebrow,
  title,
  intro,
  id,
  align = 'left',
  tone = 'default',
  size = 'md',
  className,
  level: Heading = 'h2',
}: SectionHeadingProps) => (
  <Reveal
    className={cn(
      'flex flex-col gap-4',
      align === 'center' && 'items-center text-center',
      className,
    )}
  >
    {eyebrow ? <Eyebrow tone={tone}>{eyebrow}</Eyebrow> : null}
    <Heading
      id={id}
      className={cn(
        'max-w-[24ch]',
        size === 'lg'
          ? 'text-[clamp(2.1rem,4.6vw,3.1rem)]'
          : 'text-[clamp(1.75rem,3.4vw,2.45rem)]',
        tone === 'onDark' && 'text-canvas',
        align === 'center' && 'mx-auto',
      )}
    >
      {title}
    </Heading>
    {intro ? (
      <div
        className={cn(
          'measure text-[1.05rem] leading-relaxed',
          tone === 'onDark' ? 'text-sage-soft/85' : 'text-ink-soft',
          align === 'center' && 'mx-auto',
        )}
      >
        {intro}
      </div>
    ) : null}
  </Reveal>
)
