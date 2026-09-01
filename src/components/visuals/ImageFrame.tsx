import { getImageSlot } from '@/content/images'
import type { ImageSlotKey } from '@/types'
import { Treatment } from '@/components/visuals/Treatments'
import { cn } from '@/lib/cn'

interface ImageFrameProps {
  slot: ImageSlotKey
  className?: string
  /** Aspect ratio utility, e.g. 'aspect-[4/3]'. */
  ratio?: string
  /** Hero-level images load eagerly; everything else is lazy. */
  priority?: boolean
  rounded?: 'card' | 'panel' | 'none'
}

const radii = {
  card: 'rounded-[var(--radius-card)]',
  panel: 'rounded-[var(--radius-panel)]',
  none: '',
}

/**
 * One component for every intentional image slot.
 *
 * When a slot has real photography it renders a responsive, lazily loaded
 * image. When it doesn't, it renders the designed treatment for that slot at
 * exactly the same size — so dropping photos in later changes nothing about
 * the layout, and no empty boxes ever appear.
 */
export const ImageFrame = ({
  slot,
  className,
  ratio = 'aspect-[4/3]',
  priority = false,
  rounded = 'card',
}: ImageFrameProps) => {
  const image = getImageSlot(slot)
  const hasSource = image.src.trim().length > 0

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden border border-ink/8 bg-canvas-deep',
        radii[rounded],
        ratio,
        className,
      )}
    >
      {hasSource ? (
        <img
          src={image.src}
          srcSet={image.srcSet}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="size-full object-cover"
        />
      ) : (
        <Treatment variant={image.fallback} caption={image.fallbackCaption} />
      )}
    </div>
  )
}
