/**
 * Public availability.
 *
 * GET /.netlify/functions/booking-availability?session=<id>&location=<id>
 *
 * The only source of bookable times for the browser. Slots are computed from the
 * live settings, real bookings and real holds — there are no sample times and no
 * fallback calendar. Responses are never cached: a slot can disappear between
 * two requests.
 */

import type { Context } from '@netlify/functions'
import { findBookableSession, findLocation } from '../../shared/booking/catalog'
import type { AvailabilityResponse } from '../../shared/booking/types'
import { lookupAvailability } from '../lib/availabilityService'
import { jsonResponse, logFailure, methodNotAllowed } from '../lib/http'
import { ConfigurationError, bookingBackendConfigured, serviceClient } from '../lib/supabase'

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'GET') return methodNotAllowed('GET')

  const url = new URL(request.url)
  // Public: only a currently bookable session. Retired ids are refused here, while
  // the admin reschedule search (admin-availability) still resolves them.
  const session = findBookableSession(url.searchParams.get('session'))
  const location = findLocation(url.searchParams.get('location'))

  if (!session || !location) {
    return jsonResponse({ status: 'error', message: 'Unknown session or training area.' }, 400)
  }

  // An unconfigured backend is reported as "unavailable", not as a crash, so the
  // marketing site and the rest of /book keep working.
  if (!bookingBackendConfigured()) {
    return jsonResponse({ status: 'disabled' } satisfies AvailabilityResponse)
  }

  try {
    const outcome = await lookupAvailability(serviceClient(), {
      sessionDurationMinutes: session.durationMinutes,
      locationId: location.id,
    })

    if (outcome.status === 'disabled' || outcome.status === 'unconfigured') {
      return jsonResponse({ status: 'disabled' } satisfies AvailabilityResponse)
    }

    const days = outcome.days.filter((day) => day.slots.length > 0)
    if (days.length === 0) {
      return jsonResponse({
        status: 'empty',
        timeZone: outcome.settings.timeZone,
      } satisfies AvailabilityResponse)
    }

    return jsonResponse({
      status: 'ok',
      days,
      timeZone: outcome.settings.timeZone,
    } satisfies AvailabilityResponse)
  } catch (error) {
    if (error instanceof ConfigurationError) {
      return jsonResponse({ status: 'disabled' } satisfies AvailabilityResponse)
    }
    logFailure('availability', error)
    return jsonResponse({ status: 'error', message: 'Availability is unavailable right now.' }, 502)
  }
}
