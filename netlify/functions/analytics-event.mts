/**
 * First-party analytics collector.
 *
 * POST /.netlify/functions/analytics-event
 *
 * The only writer to `public.analytics_events`. The browser posts a small,
 * already-sanitised JSON object; this function sanitises it again, because the
 * server is authoritative, and inserts it with the service-role key.
 *
 * What is deliberately never read, let alone stored:
 *
 *   - the request headers, in full or in part
 *   - the client IP address, from any header or from the Netlify context
 *   - the User-Agent
 *   - any URL beyond a pathname, and never a query string
 *   - any client-supplied timestamp — `occurred_at` is stamped by the database
 *
 * There is no field a name, email, phone number, drone model, note, booking
 * reference or Stripe identifier could arrive in: the accepted keys are a fixed
 * list of short slug-shaped labels, and anything else is discarded rather than
 * persisted.
 *
 * Analytics is best effort. Every outcome except a wrong method returns quickly
 * and never asks the browser to do anything about it.
 */

import type { Context } from '@netlify/functions'
import { parseAnalyticsEvent } from '../../shared/analytics/events'
import { logFailure, methodNotAllowed, readJson } from '../lib/http'
import { ConfigurationError, bookingBackendConfigured, serviceClient } from '../lib/supabase'

/** Accepted, stored or not. The browser has nothing useful to do with the difference. */
const accepted = (): Response =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'POST') return methodNotAllowed('POST')

  const body = await readJson<unknown>(request)
  const event = parseAnalyticsEvent(body)
  // An unrecognised event name, a missing id or a rejected field is dropped
  // silently: there is no analytics error worth showing a visitor.
  if (!event) return accepted()

  if (!bookingBackendConfigured()) return accepted()

  try {
    const { error } = await serviceClient().from('analytics_events').insert(event)
    if (error) {
      // 23505 is unique_violation: the same event id has already been stored,
      // which is exactly what a retried beacon should do — nothing.
      if ((error as { code?: string }).code !== '23505') {
        logFailure('analytics', new Error(error.message))
      }
    }
  } catch (error) {
    if (!(error instanceof ConfigurationError)) logFailure('analytics', error)
  }

  return accepted()
}
