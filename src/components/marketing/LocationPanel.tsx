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
}: LocationPanelProps) => (
  <RevealItem
    as="li"
    className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-ink/8 bg-surface shadow-[var(--shadow-raise)] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:border-sage/25 hover:shadow-[var(--shadow-lift)]"
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

      <ul className="flex flex-wrap gap-x-2 gap-y-2">
        {location.suburbs.map((suburb) => (
          <li
            key={suburb}
            className="rounded-[var(--radius-chip)] border border-ink/8 bg-canvas px-3 py-1.5 text-[0.85rem] text-ink-soft"
          >
            {suburb}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2">
        <BookingCta context={`location-${location.id}`}>{location.ctaLabel}</BookingCta>
      </div>
    </div>
  </RevealItem>
)
