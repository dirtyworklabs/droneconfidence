/**
 * Supabase data access for bookings.
 *
 * Every read and write of booking state goes through here so the row shape, the
 * definition of "active", and the audit trail all live in one place. Nothing in
 * this module makes policy decisions — it reports what the database says.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BlockedRange, OccupiedRange } from '../../shared/booking/availability'
import { DEFAULT_BOOKING_SETTINGS, type BookingSettings } from '../../shared/booking/rules'
import type { BookingStatus, PaymentState } from '../../shared/booking/types'

export interface BookingRow {
  id: string
  reference: string
  attempt_id: string | null
  session_slug: string
  session_name: string
  duration_minutes: number
  price_cents: number
  location_slug: string
  location_name: string
  starts_at: string
  ends_at: string
  occupied_until: string
  booking_day: string
  time_zone: string
  customer_name: string
  email: string
  mobile: string
  drone_model: string
  /** Nullable: bookings taken before the controller was collected have none. */
  controller_model: string | null
  experience_code: string
  help_with: string
  notes: string | null
  status: BookingStatus
  is_active: boolean
  hold_expires_at: string | null
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  currency: string
  amount_paid_cents: number
  amount_refunded_cents: number
  payment_state: PaymentState
  stripe_refund_id: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  confirmed_at: string | null
  cancelled_at: string | null
}

export const BOOKING_COLUMNS =
  'id, reference, attempt_id, session_slug, session_name, duration_minutes, price_cents, ' +
  'location_slug, location_name, starts_at, ends_at, occupied_until, booking_day, time_zone, ' +
  'customer_name, email, mobile, drone_model, controller_model, experience_code, help_with, notes, ' +
  'status, is_active, hold_expires_at, stripe_checkout_session_id, stripe_payment_intent_id, ' +
  'currency, amount_paid_cents, amount_refunded_cents, payment_state, stripe_refund_id, ' +
  'cancellation_reason, created_at, updated_at, confirmed_at, cancelled_at'

interface SettingsRow {
  booking_enabled: boolean
  time_zone: string
  weekdays: number[]
  day_start_minutes: number
  day_end_minutes: number
  notice_days: number
  max_months_ahead: number
  slot_increment_minutes: number
  buffer_minutes: number
  checkout_hold_minutes: number
  hold_grace_minutes: number
}

export const toSettings = (row: SettingsRow): BookingSettings => ({
  bookingEnabled: row.booking_enabled,
  timeZone: row.time_zone,
  weekdays: [...row.weekdays].sort((a, b) => a - b),
  dayStartMinutes: row.day_start_minutes,
  dayEndMinutes: row.day_end_minutes,
  noticeDays: row.notice_days,
  maxMonthsAhead: row.max_months_ahead,
  slotIncrementMinutes: row.slot_increment_minutes,
  bufferMinutes: row.buffer_minutes,
  checkoutHoldMinutes: row.checkout_hold_minutes,
  holdGraceMinutes: row.hold_grace_minutes,
})

export const settingsToRow = (settings: BookingSettings): SettingsRow => ({
  booking_enabled: settings.bookingEnabled,
  time_zone: settings.timeZone,
  weekdays: settings.weekdays,
  day_start_minutes: settings.dayStartMinutes,
  day_end_minutes: settings.dayEndMinutes,
  notice_days: settings.noticeDays,
  max_months_ahead: settings.maxMonthsAhead,
  slot_increment_minutes: settings.slotIncrementMinutes,
  buffer_minutes: settings.bufferMinutes,
  checkout_hold_minutes: settings.checkoutHoldMinutes,
  hold_grace_minutes: settings.holdGraceMinutes,
})

/**
 * Reads the live settings. Returns null when the table isn't there yet, which
 * is how the public site stays up before the migration has been applied: the
 * availability step reports that booking is unavailable rather than erroring.
 */
export const loadSettings = async (client: SupabaseClient): Promise<BookingSettings | null> => {
  const { data, error } = await client.from('booking_settings').select('*').eq('id', 1).maybeSingle()
  if (error || !data) return null
  return toSettings(data as SettingsRow)
}

export const saveSettings = async (client: SupabaseClient, settings: BookingSettings): Promise<void> => {
  const { error } = await client
    .from('booking_settings')
    .update(settingsToRow(settings))
    .eq('id', 1)
  if (error) throw new Error(`settings update failed: ${error.message}`)
}

/**
 * Bookings and holds that can still block a slot, within a time window.
 *
 * `is_active` is the database's own record of what blocks; whether a hold has
 * outlived its grace is decided by the availability engine, which is why
 * `hold_expires_at` travels with each range.
 */
export const loadOccupancy = async (
  client: SupabaseClient,
  fromIso: string,
  toIso: string,
): Promise<OccupiedRange[]> => {
  const { data, error } = await client
    .from('bookings')
    .select('id, location_slug, starts_at, occupied_until, hold_expires_at, status')
    .eq('is_active', true)
    .gte('occupied_until', fromIso)
    .lte('starts_at', toIso)
  if (error) throw new Error(`occupancy read failed: ${error.message}`)

  return (data ?? []).map((row) => {
    const entry = row as {
      id: string
      location_slug: string
      starts_at: string
      occupied_until: string
      hold_expires_at: string | null
      status: BookingStatus
    }
    return {
      id: entry.id,
      locationId: entry.location_slug,
      startsAt: new Date(entry.starts_at),
      occupiedUntil: new Date(entry.occupied_until),
      holdExpiresAt:
        entry.status === 'pending_payment' && entry.hold_expires_at
          ? new Date(entry.hold_expires_at)
          : null,
    }
  })
}

/** Manual blocks in a window. The internal reason is deliberately not selected. */
export const loadBlocks = async (
  client: SupabaseClient,
  fromIso: string,
  toIso: string,
): Promise<BlockedRange[]> => {
  const { data, error } = await client
    .from('availability_blocks')
    .select('starts_at, ends_at, location_slug')
    .lte('starts_at', toIso)
    .gte('ends_at', fromIso)
  if (error) throw new Error(`blocks read failed: ${error.message}`)

  return (data ?? []).map((row) => {
    const entry = row as { starts_at: string; ends_at: string; location_slug: string | null }
    return {
      startsAt: new Date(entry.starts_at),
      endsAt: new Date(entry.ends_at),
      locationId: entry.location_slug,
    }
  })
}

export const findBookingById = async (
  client: SupabaseClient,
  id: string,
): Promise<BookingRow | null> => {
  const { data, error } = await client.from('bookings').select(BOOKING_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw new Error(`booking read failed: ${error.message}`)
  return (data as BookingRow | null) ?? null
}

export const findBookingByCheckoutSession = async (
  client: SupabaseClient,
  checkoutSessionId: string,
): Promise<BookingRow | null> => {
  const { data, error } = await client
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .eq('stripe_checkout_session_id', checkoutSessionId)
    .maybeSingle()
  if (error) throw new Error(`booking read failed: ${error.message}`)
  return (data as BookingRow | null) ?? null
}

export const recordEvent = async (
  client: SupabaseClient,
  bookingId: string,
  eventType: string,
  detail: Record<string, unknown> | null,
  actor: string,
): Promise<void> => {
  const { error } = await client
    .from('booking_events')
    .insert({ booking_id: bookingId, event_type: eventType, detail, actor })
  // An audit write must never take down the operation it describes.
  if (error) console.error(`[booking:event] ${eventType}: ${error.message}`)
}

/**
 * Records a Stripe event id before it is processed.
 *
 * Returns false when the id is already present, which is the whole webhook
 * idempotency mechanism: a redelivered event is acknowledged and dropped.
 */
export const claimStripeEvent = async (
  client: SupabaseClient,
  id: string,
  eventType: string,
): Promise<boolean> => {
  const { error } = await client.from('stripe_events').insert({ id, event_type: eventType })
  if (!error) return true
  // 23505 is unique_violation — the event has already been handled.
  if ((error as { code?: string }).code === '23505') return false
  throw new Error(`stripe event claim failed: ${error.message}`)
}

export const DEFAULT_SETTINGS = DEFAULT_BOOKING_SETTINGS
