import { BookingCta } from '@/components/booking/BookingCta'
import { ImageFrame } from '@/components/visuals/ImageFrame'
import { RevealItem } from '@/components/ui/Reveal'
import type { TrainingLocation } from '@/types'

interface LocationPanelProps {
  location: TrainingLocation
  /** Compact variant used in the homepage preview. */
  compact?: boolean
  /**
   * Heading level for the area name. 'h2' on the locations page, where the
   * panels are the first content under the h1; 'h3' under a section heading.
   */
  headingLevel?: 'h2' | 'h3'
}

export const LocationPanel = ({
  location,
  compact = false,
  headingLevel: Heading = 'h3',
}: LocationPanelProps) => {
  // A clean editorial line reads more maturely than a cloud of suburb pills.
  // Trailing catch-all phrases ("and surrounding suburbs") sit on their own
  // muted line rather than pretending to be another suburb.
  const named = location.suburbs.filter((suburb) => !suburb.startsWith('and '))
  const trailing = location.suburbs.filter((suburb) => suburb.startsWith('and '))

  return (
    <RevealItem
      as="li"
      className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-surface transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)]"
    >
      <ImageFrame
        slot={location.imageSlot}
        ratio={compact ? 'aspect-[16/9]' : 'aspect-[16/8]'}
        rounded="none"
        className="border-0 border-b border-ink/8"
      />

      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col gap-2">
          <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.2em] text-sage">
            {location.label}
          </p>
          <Heading className="text-[1.7rem] tracking-[-0.03em]">{location.area}</Heading>
        </div>

        <p className="text-[1rem] leading-relaxed text-ink-soft">{location.description}</p>

        <div className="text-[0.95rem] leading-relaxed">
          <p className="text-ink-soft">{named.join(' · ')}</p>
          {trailing.length > 0 ? <p className="pt-1 text-ink-muted">{trailing.join(' · ')}</p> : null}
        </div>

        <div className="mt-auto pt-2">
          <BookingCta locationId={location.id} context={`location-${location.id}`}>
            {location.ctaLabel}
          </BookingCta>
        </div>
      </div>
    </RevealItem>
  )
}
