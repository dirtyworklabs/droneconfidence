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
  'supabase/migrations/0003_privilege_hardening.sql',
]

/** Every function the migrations define. All of them must be unreachable to PUBLIC. */
const BOOKING_FUNCTIONS = [
  'booking_weekdays_valid',
  'bookings_set_derived',
  'confirm_booking_payment',
  'expire_stale_holds',
  'generate_booking_reference',
  'reschedule_booking',
  'reserve_booking_hold',
  'touch_updated_at',
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

describe('function privileges', () => {
  it('defines exactly the functions the hardening list covers', async () => {
    const rows = await db.query<{ proname: string }>(
      `select p.proname from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.prokind = 'f'
         -- pgcrypto and btree_gist also live in public; only our own count.
         and not exists (
           select 1 from pg_depend d
            where d.objid = p.oid and d.deptype = 'e'
         )
       order by p.proname`,
    )
    // A new function added without being hardened fails here, not in production.
    expect(rows.rows.map((row) => row.proname)).toEqual(BOOKING_FUNCTIONS)
  })

  it('takes EXECUTE away from PUBLIC on every function', async () => {
    const rows = await db.query<{
      proname: string
      acl_is_default: boolean
      public_execute: boolean
    }>(
      `select p.proname,
              p.proacl is null as acl_is_default,
              exists (
                select 1 from aclexplode(p.proacl) a
                 where a.grantee = 0 and a.privilege_type = 'EXECUTE'
              ) as public_execute
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = any($1)
        order by p.proname`,
      [BOOKING_FUNCTIONS],
    )

    expect(rows.rows).toHaveLength(BOOKING_FUNCTIONS.length)
    for (const row of rows.rows) {
      // A null ACL is the Postgres default, and the default includes PUBLIC.
      expect(row.acl_is_default, `${row.proname} still has the default ACL`).toBe(false)
      expect(row.public_execute, `${row.proname} is executable by PUBLIC`).toBe(false)
    }
  })

  it('pins every function to an empty search path', async () => {
    const rows = await db.query<{ proname: string; proconfig: string[] | null }>(
      `select proname, proconfig from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = any($1)`,
      [BOOKING_FUNCTIONS],
    )

    expect(rows.rows).toHaveLength(BOOKING_FUNCTIONS.length)
    for (const row of rows.rows) {
      // 'search_path=public' would leave pg_temp implicitly searched first for
      // relation names, which a SECURITY DEFINER function must never allow.
      expect(row.proconfig, `${row.proname} has a mutable search path`).toEqual([
        'search_path=""',
      ])
    }
  })

  it('keeps the definer functions working with no search path', async () => {
    // The functions are only safe at '' because every reference inside them is
    // schema-qualified or lives in pg_catalog. Exercising one proves it.
    const created = await reserve({
      attempt: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      start: '2026-12-08T21:00:00Z',
    })
    expect(created.reference).toMatch(/^DC-/)

    const confirmed = await db.query<{ outcome: string }>(
      `select * from confirm_booking_payment($1, 'pi_search_path', 17900, 'aud')`,
      [created.booking_id],
    )
    expect(confirmed.rows[0]!.outcome).toBe('confirmed')

    const released = await db.query<{ n: number }>(`select expire_stale_holds(3) as n`)
    expect(released.rows[0]!.n).toBe(0)

    await db.query(
      `update bookings set status = 'cancelled', is_active = false where id = $1`,
      [created.booking_id],
    )
  })
})

describe('privileges with the Supabase roles present', () => {
  let roled: PGlite

  beforeAll(async () => {
    roled = await PGlite.create({ extensions: { btree_gist, pgcrypto } })
    // The migrations skip roles that don't exist, so the harness must supply the
    // three Supabase roles for the grants and revokes to be observable at all.
    await roled.exec(`create role anon; create role authenticated; create role service_role;`)
    for (const file of MIGRATIONS) {
      await roled.exec(readFileSync(file, 'utf8'))
    }
  })

  afterAll(async () => {
    await roled?.close()
  })

  it('refuses EXECUTE to anon and authenticated and allows it to service_role', async () => {
    const rows = await roled.query<{
      proname: string
      anon: boolean
      authenticated: boolean
      service_role: boolean
    }>(
      `select p.proname,
              has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
              has_function_privilege('service_role', p.oid, 'execute') as service_role
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = any($1)
        order by p.proname`,
      [BOOKING_FUNCTIONS],
    )

    expect(rows.rows).toHaveLength(BOOKING_FUNCTIONS.length)
    for (const row of rows.rows) {
      expect(row.anon, `${row.proname} is callable by anon`).toBe(false)
      expect(row.authenticated, `${row.proname} is callable by authenticated`).toBe(false)
      // The trusted Netlify Functions are the only intended caller.
      expect(row.service_role, `${row.proname} is not callable by service_role`).toBe(true)
    }
  })

  it('gives the browser roles no table privilege in either direction', async () => {
    const rows = await roled.query<{ relname: string; granted: boolean }>(
      `select c.relname,
              bool_or(has_table_privilege(r.rolname, c.oid, p.priv)) as granted
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        cross join (select unnest(array['anon', 'authenticated']) as rolname) r
        cross join (select unnest(array['select', 'insert', 'update', 'delete']) as priv) p
        where n.nspname = 'public' and c.relkind = 'r'
        group by c.relname
        order by c.relname`,
    )

    expect(rows.rows).not.toEqual([])
    for (const row of rows.rows) {
      expect(row.granted, `${row.relname} is reachable by a browser role`).toBe(false)
    }
  })

  it('still has row level security on with no policies', async () => {
    const unprotected = await roled.query<{ relname: string }>(
      `select relname from pg_class
       where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`,
    )
    expect(unprotected.rows).toEqual([])

    const policies = await roled.query<{ n: number }>(
      `select count(*)::int as n from pg_policies where schemaname = 'public'`,
    )
    expect(policies.rows[0]!.n).toBe(0)
  })
})

describe('booking_settings.weekdays', () => {
  const setWeekdays = (value: string) =>
    db.query(`update booking_settings set weekdays = $1::smallint[] where id = 1`, [value])

  afterAll(async () => {
    await db.query(`update booking_settings set weekdays = '{2,3,4}' where id = 1`)
  })

  it('accepts the seeded operating days', async () => {
    const row = await db.query<{ weekdays: number[] }>(
      `select weekdays from booking_settings where id = 1`,
    )
    expect(row.rows[0]!.weekdays).toEqual([2, 3, 4])
  })

  it('accepts any valid set of ISO weekdays', async () => {
    for (const value of ['{1}', '{7}', '{1,2,3,4,5,6,7}', '{4,1,6}']) {
      expect(await failure(() => setWeekdays(value)), value).toBeNull()
    }
  })

  it('rejects an empty array, an out-of-range day and a duplicate', async () => {
    // '{}' passed the old length check, because array_length('{}', 1) is NULL
    // and a NULL check expression is treated as satisfied.
    for (const value of ['{}', '{0}', '{0,1}', '{8}', '{1,8}', '{-1}', '{2,2}', '{1,2,1}']) {
      expect(await failure(() => setWeekdays(value)), value).toContain(
        'booking_settings_weekdays',
      )
    }
  })

  it('rejects a null element and more than seven days', async () => {
    expect(
      await failure(() =>
        db.query(`update booking_settings set weekdays = array[1, null]::smallint[] where id = 1`),
      ),
    ).toContain('booking_settings_weekdays')

    expect(await failure(() => setWeekdays('{1,2,3,4,5,6,7,7}'))).toContain(
      'booking_settings_weekdays',
    )
  })
})
