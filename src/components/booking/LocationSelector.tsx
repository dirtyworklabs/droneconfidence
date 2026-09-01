import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { BookingChoice } from '@/components/booking/BookingChoice'
import { locationDisclaimer, locations } from '@/content/locations'
import { CUSTOM_LOCATION_QUERY } from '@/lib/routes'
import type { LocationId, TrainingLocation } from '@/types'

interface LocationSelectorProps {
  selectedId: LocationId | null
  onSelect: (id: LocationId) => void
}

const LocationOption = ({
  location,
  selected,
  onSelect,
}: {
  location: TrainingLocation
  selected: boolean
  onSelect: () => void
}) => {
  // Named suburbs only; catch-all phrases like "and surrounding suburbs" stay
  // on their own muted line rather than pretending to be a suburb.
  const named = location.suburbs.filter((suburb) => !suburb.startsWith('and '))

  return (
    <BookingChoice
      name="booking-location"
      value={location.id}
      selected={selected}
      onSelect={onSelect}
      className="h-full"
    >
      <span className="flex flex-col gap-1.5">
        <span className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.2em] text-sage">
          {location.label}
        </span>
        <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-ink">
          {location.area}
        </span>
      </span>

      <span className="flex flex-col gap-2">
        <span className="flex items-start gap-2 text-[0.94rem] leading-relaxed text-ink-soft">
          <MapPin aria-hidden="true" className="mt-1 size-3.5 shrink-0 text-sage" />
          <span>Sessions {location.reference}.</span>
        </span>
        <span className="text-[0.88rem] leading-relaxed text-ink-muted">{named.join(' · ')}</span>
      </span>
    </BookingChoice>
  )
}

/**
 * Step 2. Only the two standard training areas are instantly bookable. Custom
 * Sydney locations stay a request, because travel, venue or permit costs may
 * need checking before a session can be confirmed.
 */
export const LocationSelector = ({ selectedId, onSelect }: LocationSelectorProps) => (
  <div className="flex flex-col gap-5">
    <fieldset>
      <legend className="sr-only">Choose your training area</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        {locations.map((location) => (
          <LocationOption
            key={location.id}
            location={location}
            selected={location.id === selectedId}
            onSelect={() => onSelect(location.id)}
          />
        ))}
      </div>
    </fieldset>

    <p className="measure text-[0.88rem] leading-relaxed text-ink-muted">{locationDisclaimer}</p>

    <p className="text-[0.94rem] text-ink-soft">
      Need another Sydney location?{' '}
      <Link
        to={CUSTOM_LOCATION_QUERY}
        className="text-sage underline decoration-sage/30 underline-offset-4 transition-colors duration-200 ease-[var(--ease-calm)] hover:text-eucalyptus"
      >
        Request a custom location
      </Link>
    </p>
  </div>
)
