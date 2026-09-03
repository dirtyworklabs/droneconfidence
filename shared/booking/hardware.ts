/**
 * Canonical aircraft and controller catalogue.
 *
 * The booking form, the shared field validation and the Netlify Function that
 * reserves a hold all read compatibility from this one module, so the browser
 * cannot claim two devices go together and the server cannot disagree with what
 * the customer was actually offered. Like the rest of `shared/booking/`, it has
 * no React and no `import.meta`.
 *
 * Stored values are the human-readable model names — "DJI Mini 4 Pro", "DJI RC
 * 2" — because the owner reads them in the admin dashboard and in the
 * new-booking email, where an opaque id would need translating back.
 *
 * The lists below are the *currently* supported pairings taken from DJI's
 * compatibility matrix. Two deliberate omissions:
 *
 *   - **DJI RC Pro 2 + DJI Avata 360** is marked in the matrix as "support in
 *     future updates". It is therefore not listed as compatible here, is not
 *     offered in the form, and is rejected server-side. When DJI ships it, add
 *     `'DJI RC Pro 2'` to the Avata 360 entry and nothing else changes.
 *   - **DJI RC-N Series RC Cable** is an accessory, not a controller, so it is
 *     not a selectable controller at all.
 */

/**
 * Sentinel for "my hardware isn't in the list".
 *
 * Chosen so it cannot collide with a model name: every real value in this
 * catalogue starts with "DJI ".
 */
export const OTHER_HARDWARE = 'other' as const

export const OTHER_HARDWARE_LABEL = 'Other / not listed'

export interface AircraftEntry {
  /** Human-readable model name. Stored verbatim on the booking. */
  name: string
  /** Currently compatible controllers, in the order they are offered. */
  controllers: readonly string[]
}

export interface AircraftFamily {
  /** DJI product family, used as the `<optgroup>` label. */
  name: string
  aircraft: readonly AircraftEntry[]
}

/** Grouped in the order the booking form presents them. */
export const AIRCRAFT_FAMILIES: readonly AircraftFamily[] = [
  {
    name: 'DJI Lito Series',
    aircraft: [
      { name: 'DJI Lito X1', controllers: ['DJI RC 2', 'DJI RC-N3', 'DJI RC-N2'] },
      { name: 'DJI Lito 1', controllers: ['DJI RC 2', 'DJI RC-N3', 'DJI RC-N2'] },
    ],
  },
  {
    name: 'DJI Mavic Series',
    aircraft: [
      { name: 'DJI Mavic 4 Pro', controllers: ['DJI RC Pro 2', 'DJI RC 2'] },
      {
        name: 'DJI Mavic 3 Pro',
        controllers: ['DJI RC', 'DJI RC Pro', 'DJI RC-N1', 'DJI RC Motion 2'],
      },
      {
        name: 'DJI Mavic 3',
        controllers: ['DJI RC', 'DJI RC Pro', 'DJI RC-N1', 'DJI RC Motion 2'],
      },
    ],
  },
  {
    name: 'DJI Air Series',
    aircraft: [
      {
        name: 'DJI Air 3S',
        controllers: ['DJI RC Pro 2', 'DJI RC 2', 'DJI RC-N3', 'DJI RC-N2'],
      },
      {
        name: 'DJI Air 3',
        controllers: [
          'DJI RC Pro 2',
          'DJI RC 2',
          'DJI RC-N3',
          'DJI RC-N2',
          'DJI RC Motion 2',
          'DJI RC Motion 3',
        ],
      },
      {
        name: 'DJI Air 2S',
        controllers: ['DJI RC', 'DJI RC Pro', 'DJI Smart Controller', 'DJI RC-N1'],
      },
    ],
  },
  {
    name: 'DJI Mini Series',
    aircraft: [
      {
        name: 'DJI Mini 5 Pro',
        controllers: ['DJI RC Pro 2', 'DJI RC 2', 'DJI RC-N3', 'DJI RC-N2'],
      },
      {
        name: 'DJI Mini 4 Pro',
        controllers: [
          'DJI RC Pro 2',
          'DJI RC 2',
          'DJI RC-N3',
          'DJI RC-N2',
          'DJI RC Motion 2',
          'DJI RC Motion 3',
        ],
      },
      { name: 'DJI Mini 4K', controllers: ['DJI RC-N1', 'DJI RC-N1C'] },
      {
        name: 'DJI Mini 3 Pro',
        controllers: ['DJI RC', 'DJI RC Pro', 'DJI RC-N1', 'DJI RC Motion 2'],
      },
      { name: 'DJI Mini 3', controllers: ['DJI RC', 'DJI RC-N1'] },
      { name: 'DJI Mini 2', controllers: ['DJI Smart Controller', 'DJI RC-N1'] },
      { name: 'DJI Mini 2 SE', controllers: ['DJI RC-N1'] },
    ],
  },
  {
    name: 'DJI Flip Series',
    aircraft: [{ name: 'DJI Flip', controllers: ['DJI RC 2', 'DJI RC-N3', 'DJI RC-N2'] }],
  },
  {
    name: 'DJI Neo Series',
    aircraft: [
      {
        name: 'DJI Neo 2',
        controllers: [
          'DJI RC 2',
          'DJI RC-N3',
          'DJI RC-N2',
          'DJI FPV Remote Controller 3',
          'DJI RC Motion 3',
        ],
      },
      {
        name: 'DJI Neo',
        controllers: [
          'DJI RC 2',
          'DJI RC-N3',
          'DJI RC-N2',
          'DJI FPV Remote Controller 3',
          'DJI RC Motion 3',
        ],
      },
    ],
  },
  {
    name: 'DJI Avata Series',
    aircraft: [
      {
        // 'DJI RC Pro 2' is future-update support in the matrix, so it is
        // deliberately absent rather than offered early.
        name: 'DJI Avata 360',
        controllers: [
          'DJI RC 2',
          'DJI RC-N3',
          'DJI RC-N2',
          'DJI FPV Remote Controller 3',
          'DJI RC Motion 3',
        ],
      },
      {
        name: 'DJI Avata 2',
        controllers: [
          'DJI FPV Remote Controller 2',
          'DJI FPV Remote Controller 3',
          'DJI RC Motion 2',
          'DJI RC Motion 3',
        ],
      },
      {
        name: 'DJI Avata',
        controllers: [
          'DJI FPV Remote Controller 2',
          'DJI Motion Controller',
          'DJI RC Motion 2',
        ],
      },
    ],
  },
]

const ALL_AIRCRAFT: readonly AircraftEntry[] = AIRCRAFT_FAMILIES.flatMap(
  (family) => family.aircraft,
)

/**
 * Every controller named anywhere in the catalogue.
 *
 * Used to tell "a DJI controller we know about" apart from free text a customer
 * typed, which is the difference between rejecting an incompatible pairing and
 * accepting genuinely unlisted hardware.
 */
export const ALL_CONTROLLERS: readonly string[] = [
  ...new Set(ALL_AIRCRAFT.flatMap((aircraft) => aircraft.controllers)),
]

export const findAircraft = (name: string | null | undefined): AircraftEntry | null =>
  ALL_AIRCRAFT.find((aircraft) => aircraft.name === name) ?? null

export const isKnownAircraft = (name: string | null | undefined): boolean =>
  findAircraft(name) !== null

export const isKnownController = (name: string | null | undefined): boolean =>
  typeof name === 'string' && ALL_CONTROLLERS.includes(name)

/** Compatible controllers for an aircraft, or empty for one we don't know. */
export const compatibleControllers = (name: string | null | undefined): readonly string[] =>
  findAircraft(name)?.controllers ?? []

/**
 * True only for a pairing the catalogue currently lists.
 *
 * Both sides must be known: an unlisted aircraft or a controller we have never
 * heard of has no compatibility to assert either way, so callers decide what to
 * do with `false` (see `hardwarePairing` in `fields.ts`).
 */
export const isCompatiblePair = (
  aircraftName: string | null | undefined,
  controllerName: string | null | undefined,
): boolean => compatibleControllers(aircraftName).includes(controllerName ?? '')
