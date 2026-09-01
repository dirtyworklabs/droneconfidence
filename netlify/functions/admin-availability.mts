/**
 * Owner availability management.
 *
 * GET    /.netlify/functions/admin-availability                       → blocks
 * GET    /.netlify/functions/admin-availability?slots=1&session=&location=&exclude=
 * POST   /.netlify/functions/admin-availability   { date, fromMinutes, toMinutes, locationId, reason }
 * DELETE /.netlify/functions/admin-availability?id=<uuid>
 *
 * Public holidays, personal commitments and closed days are all handled here as
 * blocks — there is no holiday API and no hard-coded list of NSW dates. Block
 * reasons are internal: this endpoint is the only place they are ever returned,
 * and only to the authenticated owner.
 *
 * `slots=1` reuses the public availability engine with the customer notice
 * period waived, so the reschedule picker offers real times.
 *
 * A block is submitted as a Sydney wall clock — a calendar date plus minutes
 * past local midnight — and converted here using the configured booking time
 * zone. It is never parsed from a bare `YYYY-MM-DDTHH:mm` string, which a server
 * running in UTC would read as UTC and silently shift by 10 or 11 hours.
 */

import type { Config, Context } from '@netlify/functions'
import { findLocation, findSession } from '../../shared/booking/catalog'
import type { AdminAvailabilityBlock, LocationId } from '../../shared/booking/types'
import { requireAdmin } from '../lib/adminAuth'
import { lookupAvailability } from '../lib/availabilityService'
import { instantAt, isDayIso } from '../../shared/booking/time'
import { jsonResponse, logFailure, methodNotAllowed, readJson } from '../lib/http'
import { loadSettings } from '../lib/store'
import { ConfigurationError, serviceClient } from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const MAX_REASON = 200

const listBlocks = async (client: SupabaseClient): Promise<AdminAvailabilityBlock[]> => {
  // Everything from a day ago onwards: past blocks are history, not tooling.
  const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await client
    .from('availability_blocks')
    .select('id, starts_at, ends_at, location_slug, reason, created_at')
    .gte('ends_at', from)
    .order('starts_at', { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const entry = row as {
      id: string
      starts_at: string
      ends_at: string
      location_slug: string | null
      reason: string
      created_at: string
    }
    return {
      id: entry.id,
      startsAt: entry.starts_at,
      endsAt: entry.ends_at,
      locationId: (entry.location_slug as LocationId | null) ?? null,
      reason: entry.reason,
      createdAt: entry.created_at,
    }
  })
}

export default async (request: Request, _context: Context): Promise<Response> => {
  const allowed = 'GET, POST, DELETE'
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return methodNotAllowed(allowed)

  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const client = serviceClient()
    const url = new URL(request.url)

    if (request.method === 'GET') {
      if (url.searchParams.get('slots') === '1') {
        const session = findSession(url.searchParams.get('session'))
        const location = findLocation(url.searchParams.get('location'))
        if (!session || !location) {
          return jsonResponse({ status: 'error', message: 'Unknown session or training area.' }, 400)
        }
        const exclude = url.searchParams.get('exclude') ?? undefined
        const outcome = await lookupAvailability(client, {
          sessionDurationMinutes: session.durationMinutes,
          locationId: location.id,
          waiveNotice: true,
          excludeBookingId: exclude,
        })
        if (outcome.status !== 'ok') {
          return jsonResponse({ status: 'error', message: 'Availability is unavailable right now.' }, 503)
        }
        return jsonResponse({
          status: 'ok',
          days: outcome.days.filter((day) => day.slots.length > 0),
          timeZone: outcome.settings.timeZone,
        })
      }

      return jsonResponse({ status: 'ok', blocks: await listBlocks(client) })
    }

    if (request.method === 'POST') {
      const body = await readJson<Record<string, unknown>>(request)
      const settings = await loadSettings(client)
      if (!settings) {
        return jsonResponse(
          { status: 'error', message: 'Apply the Supabase migrations first.' },
          503,
        )
      }

      const date = typeof body?.date === 'string' ? body.date : ''
      const fromMinutes = typeof body?.fromMinutes === 'number' ? body.fromMinutes : 0
      const toMinutes = typeof body?.toMinutes === 'number' ? body.toMinutes : 24 * 60
      const reason = (typeof body?.reason === 'string' ? body.reason : '').trim().slice(0, MAX_REASON)
      const locationId =
        typeof body?.locationId === 'string' && body.locationId.length > 0 ? body.locationId : null

      if (!isDayIso(date)) {
        return jsonResponse({ status: 'error', message: 'Enter a valid date.' }, 400)
      }
      if (
        !Number.isInteger(fromMinutes) ||
        !Number.isInteger(toMinutes) ||
        fromMinutes < 0 ||
        toMinutes > 24 * 60 ||
        toMinutes <= fromMinutes
      ) {
        return jsonResponse({ status: 'error', message: 'The block must end after it starts.' }, 400)
      }
      if (reason.length === 0) {
        return jsonResponse({ status: 'error', message: 'Add a short reason so you remember why.' }, 400)
      }
      if (locationId !== null && !findLocation(locationId)) {
        return jsonResponse({ status: 'error', message: 'Unknown training area.' }, 400)
      }

      const startsAt = instantAt(date, fromMinutes, settings.timeZone)
      const endsAt = instantAt(date, toMinutes, settings.timeZone)

      const { data, error } = await client
        .from('availability_blocks')
        .insert({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          location_slug: locationId,
          reason,
          created_by: auth.identity.email,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      return jsonResponse({ status: 'ok', id: (data as { id: string }).id })
    }

    const id = url.searchParams.get('id') ?? ''
    if (id.length === 0) return jsonResponse({ status: 'error', message: 'Missing block id.' }, 400)

    const { error } = await client.from('availability_blocks').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return jsonResponse({ status: 'ok' })
  } catch (caught) {
    if (caught instanceof ConfigurationError) {
      return jsonResponse({ status: 'error', message: 'The booking backend is not configured.' }, 503)
    }
    logFailure('admin-availability', caught)
    return jsonResponse({ status: 'error', message: 'Something went wrong.' }, 500)
  }
}

export const config: Config = { path: '/.netlify/functions/admin-availability' }
