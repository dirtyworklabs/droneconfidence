export interface AboutGalleryImage {
  src: string
  alt: string
  /** Intrinsic pixel size — keeps the lightbox from upscaling past the source. */
  width: number
  height: number
  /**
   * Tuned `object-position` for the 4:3 preview crop. Omitted where the
   * source already frames well from the centre.
   */
  objectPosition?: string
}

/**
 * The five About-page photographs, in editorial order.
 *
 * Alt text describes what is visible and nothing more — no client, project or
 * location claims beyond what the page already establishes.
 */
export const aboutGalleryImages: AboutGalleryImage[] = [
  {
    src: '/images/about/tom-drone-operations.jpg',
    alt: 'Tom Gerrard discussing a drone operation with a colleague in the field',
    width: 5472,
    height: 3648,
  },
  {
    src: '/images/about/in-motion-aero-commercial-operations.jpg',
    alt: 'Tom Gerrard and a colleague preparing a large commercial drone at a work site',
    width: 2736,
    height: 1824,
  },
  {
    src: '/images/about/tom-commercial-drone-preflight.jpg',
    alt: 'Tom Gerrard inspecting a large commercial multirotor drone before flight',
    width: 993,
    height: 1323,
    // Portrait source in a 4:3 window: bias low so the aircraft and Tom both
    // stay in frame rather than being cut by a centre crop.
    objectPosition: '50% 85%',
  },
  {
    src: '/images/about/commercial-drone-field-setup.jpg',
    alt: 'A commercial drone field team preparing a large multirotor aircraft and ground equipment',
    width: 4608,
    height: 3456,
  },
  {
    src: '/images/about/drone-flight-operation.jpg',
    alt: 'A large camera drone flying above the coast during a commercial operation',
    width: 3123,
    height: 2499,
    // Slightly taller than 4:3 — hold the lower edge so the operator below the
    // aircraft is not trimmed.
    objectPosition: '50% 90%',
  },
]
