/**
 * Server-side validation of a booking submission.
 *
 * The browser sends what the customer typed and *which* session and training
 * area they chose — never what those cost or how long they run. Those are
 * resolved here from the catalogue, so a tampered payload cannot change the
 * price, the duration or the product name.
 */

import {
  type LocationCatalogEntry,
  type SessionCatalogEntry,
  findLocation,
  findSession,
} from '../../shared/booking/catalog'
import { isExperienceCode } from '../../shared/booking/experience'
import { MAX, validateBookingDetails } from '../../shared/booking/fields'

export interface ValidatedBooking {
  attemptId: string
  session: SessionCatalogEntry
  location: LocationCatalogEntry
  startsAt: Date
  customerName: string
  email: string
  mobile: string
  droneModel: string
  experienceCode: string
  helpWith: string
  notes: string | null
}

export type ValidationResult =
  | { ok: true; value: ValidatedBooking }
  | { ok: false; problems: string[] }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const str = (value: unknown, limit: number): string =>
  typeof value === 'string' ? value.trim().slice(0, limit) : ''

export const validateCheckoutRequest = (raw: unknown): ValidationResult => {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, problems: ['A booking submission is required.'] }
  }
  const body = raw as Record<string, unknown>
  const problems: string[] = []

  const attemptId = str(body.attemptId, 40)
  if (!UUID_PATTERN.test(attemptId)) problems.push('Invalid submission id.')

  // Arbitrary or unknown ids are rejected outright, never defaulted.
  const session = findSession(typeof body.sessionId === 'string' ? body.sessionId : null)
  if (!session) problems.push('Choose one of the available sessions.')

  const location = findLocation(typeof body.locationId === 'string' ? body.locationId : null)
  if (!location) problems.push('Choose one of the standard training areas.')

  const startsAtRaw = str(body.startsAt, 40)
  const startsAt = new Date(startsAtRaw)
  if (startsAtRaw.length === 0 || Number.isNaN(startsAt.getTime())) {
    problems.push('Choose an available time.')
  }

  const details = {
    customerName: str(body.customerName, MAX.name + 1),
    email: str(body.email, MAX.email + 1),
    mobile: str(body.mobile, MAX.mobile + 1),
    droneModel: str(body.droneModel, MAX.droneModel + 1),
    experienceCode: str(body.experienceCode, 40),
    helpWith: str(body.helpWith, MAX.helpWith + 1),
    notes: str(body.notes, MAX.notes + 1),
    policyAccepted: body.policyAccepted === true,
  }

  const fieldErrors = validateBookingDetails(details, isExperienceCode)
  problems.push(...Object.values(fieldErrors).filter((value): value is string => Boolean(value)))

  if (problems.length > 0 || !session || !location) return { ok: false, problems }

  return {
    ok: true,
    value: {
      attemptId,
      session,
      location,
      startsAt,
      customerName: details.customerName,
      email: details.email.toLowerCase(),
      mobile: details.mobile,
      droneModel: details.droneModel,
      experienceCode: details.experienceCode,
      helpWith: details.helpWith,
      notes: details.notes.length > 0 ? details.notes : null,
    },
  }
}
