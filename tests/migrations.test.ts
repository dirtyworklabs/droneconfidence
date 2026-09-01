import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * The migrations, genuinely applied.
 *
 * PGlite is real Postgres compiled to WebAssembly, so the same DDL that Supabase
 * will run is executed here — exclusion constraints, advisory locks, plpgsql and
 * all. These are the concurrency rules that cannot be tested from the browser or
 * mocked usefully: two customers racing for one slot, a repeated checkout attempt,
 * a webhook delivered twice, and the same-day training-area lock.
 *
 * A hold is a row. Its serialised behaviour is the product, so it is asserted at
 * the database, not at the API.
 */

const MIGRATIONS = [
  'supabase/migrations/0001_booking_core.sql',
  'supabase/migrations/0002_booking_functions.sql',
]

let db: PGlite

const GRACE = 3

/** Sydney is UTC+11 in October, so 22:00Z is 09:00 the following local day. */
const OCT_6_2026_0800_SYDNEY = '2026-10-05T21:00:00Z'

interface ReserveOptions {
  attempt: string
  start: string
  locationSlug?: string
  durationMinutes?: number
  holdMinutes?: number
}

const reserve = async ({
  attempt,
  start,
  locationSlug = 'south-sydney',
  durationMinutes = 60,
  holdMinutes = 30,
}: ReserveOptions) => {
  const startsAt = new Date(start)
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000)
  const occupiedUntil = new Date(endsAt.getTime() + 30 * 60_000)

  const result = await db.query<{ booking_id: string; reference: string }>(
    `select * from reserve_booking_hold(
       $1, 'first-flight', 'First Flight', $2, 17900,
       $3, 'South Sydney', $4, $5, $6, 'Australia/Sydney',
       'Test Customer', 'test@example.com', '0400000000', 'DJI Mini 4K',
       'new', 'Confidence in the air', null, $7, $8)`,
    [
      attempt,
      durationMinutes,
      locationSlug,
      startsAt.toISOString(),
      endsAt.toISOString(),
      occupiedUntil.toISOString(),
      holdMinutes,
      GRACE,
    ],
  )
  return result.rows[0]!
}

/** Returns the error message, or null when the call succeeded. */
const failure = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run()
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

const rawInsert = (locationSlug: string, name: string, start: string, reference: string) =>
  db.query(
    `insert into bookings (
       reference, session_slug, session_name, duration_minutes, price_cents,
       location_slug, location_name, starts_at, ends_at, occupied_until,
       customer_name, email, mobile, drone_model, experience_code, help_with)
     values ($1, 'first-flight', 'First Flight', 60, 17900, $2, $3, $4,
       $4::timestamptz + interval '60 minutes',
       $4::timestamptz + interval '90 minutes',
       'Test Customer', 'test@example.com', '0400000000', 'DJI Mini 4K', 'new', 'Help')`,
    [reference, locationSlug, name, start],
  )

beforeAll(async () => {
  db = await PGlite.create({ extensions: { btree_gist, pgcrypto } })
  for (const file of MIGRATIONS) {
    await db.exec(readFileSync(file, 'utf8'))
  }
})

afterAll(async () => {
  await db?.close()
})

describe('schema', () => {
  it('applies both migrations cleanly', async () => {
    const tables = await db.query<{ relname: string }>(
      `select relname from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname`,
    )
    expect(tables.rows.map((row) => row.relname)).toEqual([
      'availability_blocks',
      'booking_events',
      'booking_notifications',
      'booking_settings',
      'bookings',
      'stripe_events',
    ])
  })

  it('ships the booking master switch turned off', async () => {
    const settings = await db.query<{ booking_enabled: boolean }>(
      `select booking_enabled from booking_settings`,
    )
    expect(settings.rows).toHaveLength(1)
    expect(settings.rows[0]!.booking_enabled).toBe(false)
  })

  it('enables row level security on every table and grants no policy', async () => {
    const unprotected = await db.query<{ relname: string }>(
      `select relname from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`,
    )
    expect(unprotected.rows).toEqual([])

    const policies = await db.query<{ n: number }>(
      `select count(*)::int as n from pg_policies where schemaname = 'public'`,
    )
    // Default deny: the service-role key is the only way in.
    expect(policies.rows[0]!.n).toBe(0)
  })

  it('never makes an index predicate depend on now()', async () => {
    const indexes = await db.query<{ indexdef: string }>(
      `select indexdef from pg_indexes where schemaname = 'public'`,
    )
    for (const { indexdef } of indexes.rows) {
      expect(indexdef.toLowerCase()).not.toContain('now()')
    }
  })

  it('derives the booking day in Sydney local time', async () => {
    const created = await reserve({
      attempt: '00000000-0000-4000-8000-000000000001',
      start: '2026-10-06T22:00:00Z',
    })
    const row = await db.query<{ d: string }>(
      `select booking_day::text as d from bookings where reference = $1`,
      [created.reference],
    )
    // 22:00Z on 6 October is 09:00 on 7 October in Sydney.
    expect(row.rows[0]!.d).toBe('2026-10-07')
    await db.query(`delete from bookings where reference = $1`, [created.reference])
  })
})

describe('reserve_booking_hold', () => {
  it('creates a hold with a human-readable reference', async () => {
    const created = await reserve({
      attempt: '11111111-1111-4111-8111-111111111111',
      start: OCT_6_2026_0800_SYDNEY,
    })
    expect(created.reference).toMatch(/^DC-[0-9A-Z]+$/)

    const row = await db.query<{ status: string; payment_state: string; hold_expires_at: string }>(
      `select status, payment_state, hold_expires_at from bookings where id = $1`,
      [created.booking_id],
    )
    expect(row.rows[0]!.status).toBe('pending_payment')
    expect(row.rows[0]!.payment_state).toBe('unpaid')
    expect(row.rows[0]!.hold_expires_at).not.toBeNull()
  })

  it('returns the same booking for a repeated attempt id', async () => {
    const again = await reserve({
      attempt: '11111111-1111-4111-8111-111111111111',
      start: OCT_6_2026_0800_SYDNEY,
    })
    const rows = await db.query<{ n: number }>(
      `select count(*)::int as n from bookings where attempt_id = $1`,
      ['11111111-1111-4111-8111-111111111111'],
    )
    // A resubmitted form must not create a second hold or a second charge.
    expect(rows.rows[0]!.n).toBe(1)
    expect(again.reference).toMatch(/^DC-/)
  })

  it('rejects a second customer taking the same slot', async () => {
    const message = await failure(() =>
      reserve({
        attempt: '22222222-2222-4222-8222-222222222222',
        start: OCT_6_2026_0800_SYDNEY,
      }),
    )
    expect(message).toContain('slot_taken')
  })

  it('rejects a start inside the 30-minute buffer', async () => {
    // The 08:00 lesson ends at 09:00 and is occupied until 09:30.
    const message = await failure(() =>
      reserve({ attempt: '33333333-3333-4333-8333-333333333333', start: '2026-10-05T22:00:00Z' }),
    )
    expect(message).toContain('slot_taken')
  })

  it('accepts a start exactly one buffer later', async () => {
    const message = await failure(() =>
      reserve({ attempt: '44444444-4444-4444-8444-444444444444', start: '2026-10-05T22:30:00Z' }),
    )
    expect(message).toBeNull()
  })

  it('locks the rest of the Sydney day to the training area already taken', async () => {
    const message = await failure(() =>
      reserve({
        attempt: '55555555-5555-4555-8555-555555555555',
        locationSlug: 'north-sydney',
        start: '2026-10-06T02:00:00Z',
      }),
    )
    // The reason names the committed area so the customer can be told which one.
    expect(message).toContain('location_locked:south-sydney')
  })

  it('leaves other days free to use the other training area', async () => {
    const message = await failure(() =>
      reserve({
        attempt: '66666666-6666-4666-8666-666666666666',
        locationSlug: 'north-sydney',
        start: '2026-10-06T21:00:00Z',
      }),
    )
    expect(message).toBeNull()
  })
})

describe('database constraints as the backstop', () => {
  it('blocks an overlapping row inserted outside the RPC', async () => {
    const message = await failure(() =>
      rawInsert('south-sydney', 'South Sydney', '2026-10-05T21:15:00Z', 'DC-RAW001'),
    )
    expect(message).toContain('bookings_no_overlap')
  })

  it('blocks a second training area on a committed day inserted outside the RPC', async () => {
    const message = await failure(() =>
      rawInsert('north-sydney', 'North Sydney', '2026-10-06T02:00:00Z', 'DC-RAW002'),
    )
    expect(message).toContain('bookings_single_location_per_day')
  })
})

describe('expire_stale_holds', () => {
  it('leaves live holds alone', async () => {
    const released = await db.query<{ n: number }>(`select expire_stale_holds($1) as n`, [GRACE])
    expect(released.rows[0]!.n).toBe(0)
  })

  it('releases the slot once the hold has lapsed past the grace period', async () => {
    await db.query(
      `update bookings set hold_expires_at = now() - interval '10 minutes'
       where attempt_id = '11111111-1111-4111-8111-111111111111'`,
    )
    const released = await db.query<{ n: number }>(`select expire_stale_holds($1) as n`, [GRACE])
    expect(released.rows[0]!.n).toBe(1)

    const message = await failure(() =>
      reserve({ attempt: '77777777-7777-4777-8777-777777777777', start: OCT_6_2026_0800_SYDNEY }),
    )
    expect(message).toBeNull()
  })

  it('keeps the expired row for the record but out of the way', async () => {
    const row = await db.query<{ status: string; is_active: boolean }>(
      `select status, is_active from bookings
       where attempt_id = '11111111-1111-4111-8111-111111111111'`,
    )
    expect(row.rows[0]!.status).toBe('expired')
    // is_active, not a now() predicate, is what the constraints index on.
    expect(row.rows[0]!.is_active).toBe(false)
  })

  it('does not expire a hold that is only just past its deadline', async () => {
    const created = await reserve({
      attempt: '88888888-8888-4888-8888-888888888888',
      start: '2026-11-03T21:00:00Z',
    })
    await db.query(
      `update bookings set hold_expires_at = now() - interval '1 minute' where id = $1`,
      [created.booking_id],
    )
    const released = await db.query<{ n: number }>(`select expire_stale_holds($1) as n`, [GRACE])
    // Within the grace window a webhook may still be in flight, so the row stays.
    expect(released.rows[0]!.n).toBe(0)
  })
})

describe('confirm_booking_payment', () => {
  let bookingId = ''

  beforeAll(async () => {
    const row = await db.query<{ id: string }>(
      `select id from bookings where attempt_id = '77777777-7777-4777-8777-777777777777'`,
    )
    bookingId = row.rows[0]!.id
  })

  it('confirms the booking and records what was actually paid', async () => {
    const result = await db.query<{ outcome: string }>(
      `select * from confirm_booking_payment($1, 'pi_test_1', 17900, 'aud')`,
      [bookingId],
    )
    expect(result.rows[0]!.outcome).toBe('confirmed')

    const row = await db.query<{
      status: string
      payment_state: string
      amount_paid_cents: number
      confirmed_at: string | null
    }>(
      `select status, payment_state, amount_paid_cents, confirmed_at
       from bookings where id = $1`,
      [bookingId],
    )
    expect(row.rows[0]).toMatchObject({
      status: 'confirmed',
      payment_state: 'paid',
      amount_paid_cents: 17900,
    })
    expect(row.rows[0]!.confirmed_at).not.toBeNull()
  })

  it('is idempotent when Stripe delivers the same event twice', async () => {
    const result = await db.query<{ outcome: string }>(
      `select * from confirm_booking_payment($1, 'pi_test_1', 17900, 'aud')`,
      [bookingId],
    )
    expect(result.rows[0]!.outcome).toBe('already_confirmed')

    const events = await db.query<{ n: number }>(
      `select count(*)::int as n from booking_events
       where booking_id = $1 and event_type = 'payment_confirmed'`,
      [bookingId],
    )
    expect(events.rows[0]!.n).toBe(1)
  })

  it('confirms a hold whose deadline passed while the payment was in flight', async () => {
    const created = await reserve({
      attempt: '99999999-9999-4999-8999-999999999999',
      start: '2026-11-10T21:00:00Z',
    })
    await db.query(
      `update bookings set hold_expires_at = now() - interval '2 minutes' where id = $1`,
      [created.booking_id],
    )
    const result = await db.query<{ outcome: string }>(
      `select * from confirm_booking_payment($1, 'pi_test_2', 17900, 'aud')`,
      [created.booking_id],
    )
    // The money arrived; a few seconds of clock skew must not lose the booking.
    expect(result.rows[0]!.outcome).toBe('confirmed')
  })
})

describe('reschedule_booking', () => {
  let bookingId = ''

  beforeAll(async () => {
    const row = await db.query<{ id: string }>(
      `select id from bookings where attempt_id = '77777777-7777-4777-8777-777777777777'`,
    )
    bookingId = row.rows[0]!.id
  })

  it('refuses a move onto a day committed to the other training area', async () => {
    const result = await db.query<{ outcome: string }>(
      `select * from reschedule_booking($1, '2026-10-06T21:00:00Z', '2026-10-06T22:00:00Z',
         '2026-10-06T22:30:00Z', 'south-sydney', 'South Sydney', $2, 'owner')`,
      [bookingId, GRACE],
    )
    expect(result.rows[0]!.outcome).toBe('location_locked')
  })

  it('moves the booking, keeps the payment and records the previous time', async () => {
    const result = await db.query<{ outcome: string }>(
      `select * from reschedule_booking($1, '2026-11-17T21:00:00Z', '2026-11-17T22:00:00Z',
         '2026-11-17T22:30:00Z', 'north-sydney', 'North Sydney', $2, 'owner')`,
      [bookingId, GRACE],
    )
    expect(result.rows[0]!.outcome).toBe('rescheduled')

    const row = await db.query<{
      payment_state: string
      amount_paid_cents: number
      location_slug: string
      booking_day: string
    }>(
      `select payment_state, amount_paid_cents, location_slug, booking_day::text as booking_day
       from bookings where id = $1`,
      [bookingId],
    )
    expect(row.rows[0]).toMatchObject({
      payment_state: 'paid',
      amount_paid_cents: 17900,
      location_slug: 'north-sydney',
      booking_day: '2026-11-18',
    })

    const events = await db.query<{ detail: { previous_starts_at?: string } }>(
      `select detail from booking_events
       where booking_id = $1 and event_type = 'rescheduled'`,
      [bookingId],
    )
    expect(events.rows).toHaveLength(1)
    expect(events.rows[0]!.detail.previous_starts_at).toBeTruthy()
  })

  it('refuses a move onto a slot another booking already occupies', async () => {
    await reserve({
      attempt: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      locationSlug: 'north-sydney',
      start: '2026-11-24T21:00:00Z',
    })
    const result = await db.query<{ outcome: string }>(
      `select * from reschedule_booking($1, '2026-11-24T21:00:00Z', '2026-11-24T22:00:00Z',
         '2026-11-24T22:30:00Z', 'north-sydney', 'North Sydney', $2, 'owner')`,
      [bookingId, GRACE],
    )
    expect(result.rows[0]!.outcome).toBe('slot_taken')
  })
})

describe('cancelling a booking', () => {
  it('frees the day and keeps the row', async () => {
    const created = await reserve({
      attempt: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      locationSlug: 'south-sydney',
      start: '2026-12-01T21:00:00Z',
    })
    await db.query(`select * from confirm_booking_payment($1, 'pi_test_3', 17900, 'aud')`, [
      created.booking_id,
    ])

    const locked = await failure(() =>
      reserve({
        attempt: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        locationSlug: 'north-sydney',
        start: '2026-12-01T23:00:00Z',
      }),
    )
    expect(locked).toContain('location_locked')

    // Cancellation is an ordinary update from the admin function, not an RPC —
    // what matters here is that the constraints stop treating the row as live.
    await db.query(
      `update bookings set status = 'cancelled', is_active = false,
         hold_expires_at = null, cancelled_at = now() where id = $1`,
      [created.booking_id],
    )

    const freed = await failure(() =>
      reserve({
        attempt: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        locationSlug: 'north-sydney',
        start: '2026-12-01T23:00:00Z',
      }),
    )
    // The lock belongs to live bookings only.
    expect(freed).toBeNull()

    const row = await db.query<{ status: string; is_active: boolean }>(
      `select status, is_active from bookings where id = $1`,
      [created.booking_id],
    )
    expect(row.rows[0]).toMatchObject({ status: 'cancelled', is_active: false })
  })
})
