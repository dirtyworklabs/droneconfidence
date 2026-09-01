/**
 * Hourly 24-hour reminders.
 *
 * Runs on a schedule and sends the reminder email to every confirmed booking
 * starting in the next 24 hours. The `booking_notifications` row is claimed
 * before each send, so a booking receives exactly one reminder however many
 * times this function runs — no reminder is ever sent twice, and an overlapping
 * run sends nothing.
 *
 * This function makes no decision about the weather. Go/no-go stays with the
 * owner, through the admin dashboard.
 */

import type { Config } from '@netlify/functions'
import { logFailure } from '../lib/http'
import { reminderEmail } from '../lib/email/templates'
import { emailConfigured, sendOnce } from '../lib/email/send'
import { BOOKING_COLUMNS, type BookingRow } from '../lib/store'
import { bookingBackendConfigured, serviceClient } from '../lib/supabase'

const HOURS_24 = 24 * 60 * 60 * 1000

export default async (): Promise<Response> => {
  if (!bookingBackendConfigured() || !emailConfigured()) {
    // Nothing to do, and nothing worth failing the schedule over.
    return new Response(null, { status: 204 })
  }

  try {
    const client = serviceClient()
    const now = Date.now()

    const { data, error } = await client
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('status', 'confirmed')
      .gte('starts_at', new Date(now).toISOString())
      .lte('starts_at', new Date(now + HOURS_24).toISOString())
      .order('starts_at', { ascending: true })
    if (error) throw new Error(error.message)

    const bookings = (data ?? []) as unknown as BookingRow[]
    let sent = 0

    for (const booking of bookings) {
      const outcome = await sendOnce(
        client,
        booking.id,
        'reminder_24h',
        booking.email,
        reminderEmail(booking),
      )
      if (outcome.sent) sent += 1
    }

    // Counts only — no addresses, names or references in the logs.
    console.log(`[booking:reminders] considered=${bookings.length} sent=${sent}`)
    return new Response(null, { status: 204 })
  } catch (caught) {
    logFailure('reminders', caught)
    return new Response(null, { status: 500 })
  }
}

export const config: Config = {
  // Hourly, so a booking made less than a day ahead still gets its reminder.
  schedule: '@hourly',
}
