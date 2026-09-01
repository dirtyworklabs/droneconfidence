/**
 * Owner booking settings.
 *
 * GET  /.netlify/functions/admin-settings
 * PUT  /.netlify/functions/admin-settings   { settings }
 *
 * The master booking switch lives here. It ships off, and only the authenticated
 * owner can turn it on. Every value is validated against `SETTINGS_LIMITS`
 * server-side — including the 30-minute floor on the checkout hold, which Stripe
 * requires — so an out-of-range value can't be written from a browser.
 */

import type { Config, Context } from '@netlify/functions'
import { type BookingSettings, validateSettings } from '../../shared/booking/rules'
import { requireAdmin } from '../lib/adminAuth'
import { jsonResponse, logFailure, methodNotAllowed, readJson } from '../lib/http'
import { loadSettings, saveSettings } from '../lib/store'
import { ConfigurationError, serviceClient } from '../lib/supabase'

const intOr = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback

/** Builds a settings object from a request body, ignoring anything unexpected. */
const merge = (current: BookingSettings, body: Record<string, unknown>): BookingSettings => ({
  bookingEnabled: typeof body.bookingEnabled === 'boolean' ? body.bookingEnabled : current.bookingEnabled,
  // The time zone is deliberately not editable: every rule in the system is
  // written in Sydney local time.
  timeZone: current.timeZone,
  weekdays: Array.isArray(body.weekdays)
    ? [...new Set(body.weekdays.filter((day): day is number => typeof day === 'number' && day >= 1 && day <= 7))].sort(
        (a, b) => a - b,
      )
    : current.weekdays,
  dayStartMinutes: intOr(body.dayStartMinutes, current.dayStartMinutes),
  dayEndMinutes: intOr(body.dayEndMinutes, current.dayEndMinutes),
  noticeDays: intOr(body.noticeDays, current.noticeDays),
  maxMonthsAhead: intOr(body.maxMonthsAhead, current.maxMonthsAhead),
  slotIncrementMinutes: intOr(body.slotIncrementMinutes, current.slotIncrementMinutes),
  bufferMinutes: intOr(body.bufferMinutes, current.bufferMinutes),
  checkoutHoldMinutes: intOr(body.checkoutHoldMinutes, current.checkoutHoldMinutes),
  holdGraceMinutes: intOr(body.holdGraceMinutes, current.holdGraceMinutes),
})

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'PUT') return methodNotAllowed('GET, PUT')

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const client = serviceClient()
    const current = await loadSettings(client)
    if (!current) {
      return jsonResponse(
        {
          status: 'error',
          message: 'The booking tables are not there yet. Apply the Supabase migrations first.',
        },
        503,
      )
    }

    if (request.method === 'GET') {
      return jsonResponse({ status: 'ok', settings: current })
    }

    const body = await readJson<Record<string, unknown>>(request)
    if (!body) return jsonResponse({ status: 'error', message: 'Nothing to save.' }, 400)

    const next = merge(current, body)
    const problems = validateSettings(next)
    if (problems.length > 0) {
      return jsonResponse({ status: 'error', message: problems[0], problems }, 400)
    }

    await saveSettings(client, next)
    return jsonResponse({ status: 'ok', settings: next })
  } catch (caught) {
    if (caught instanceof ConfigurationError) {
      return jsonResponse({ status: 'error', message: 'The booking backend is not configured.' }, 503)
    }
    logFailure('admin-settings', caught)
    return jsonResponse({ status: 'error', message: 'Something went wrong.' }, 500)
  }
}

export const config: Config = { path: '/.netlify/functions/admin-settings' }
