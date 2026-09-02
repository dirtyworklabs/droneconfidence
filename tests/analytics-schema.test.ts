import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Migration 0005, genuinely applied.
 *
 * Two things can only be verified in a real Postgres: that the analytics table
 * is unreachable from a browser role and that the reporting views compute the
 * Sydney periods and the money the way the business reads them. Both are
 * asserted here, against the same DDL Supabase will run.
 *
 * The browser roles are created first so the grants and revokes in 0003, 0004
 * and 0005 all take their real production path rather than being skipped.
 */

const MIGRATIONS = [
  'supabase/migrations/0001_booking_core.sql',
  'supabase/migrations/0002_booking_functions.sql',
  'supabase/migrations/0003_privilege_hardening.sql',
  'supabase/migrations/0004_service_role_table_grants.sql',
  'supabase/migrations/0005_first_party_analytics.sql',
]

const REPORTING_VIEWS = [
  'booking_mix_monthly',
  'cancellation_reasons_monthly',
  'current_health',
  'daily_snapshot',
  'monthly_snapshot',
  'page_performance_daily',
  'period_snapshot',
  'traffic_sources_daily',
  'weekly_snapshot',
]

let db: PGlite

/** Sydney is UTC+10 in September 2026: 13:59Z is 23:59 the same local day. */
const SEP_30_LATE = '2026-09-30T13:59:00Z'
/** …and 14:01Z has already become 1 October in Sydney. */
const OCT_1_EARLY = '2026-09-30T14:01:00Z'

const SESSION_A = '11111111-1111-4111-8111-111111111111'
const SESSION_B = '22222222-2222-4222-8222-222222222222'

let eventCounter = 0
const eventId = () => `${(eventCounter += 1).toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`

/**
 * Inserts an analytics row and then backdates it, because `occurred_at` is
 * stamped by the server on insert and cannot be supplied.
 */
const analyticsEvent = async (
  sessionId: string,
  eventName: string,
  occurredAt: string,
  extra: Record<string, string> = {},
) => {
  const columns = ['id', 'session_id', 'event_name', ...Object.keys(extra)]
  const values = [eventId(), sessionId, eventName, ...Object.values(extra)]
  await db.query(
    `insert into analytics_events (${columns.join(', ')})
     values (${values.map((_, index) => `$${index + 1}`).join(', ')})`,
    values,
  )
  await db.query(`update analytics_events set occurred_at = $2 where id = $1`, [values[0], occurredAt])
}

const booking = async (
  reference: string,
  paidCents: number,
  refundedCents = 0,
  startsAt = '2026-10-20T21:00:00Z',
) => {
  const result = await db.query<{ id: string }>(
    `insert into bookings (
       reference, session_slug, session_name, duration_minutes, price_cents,
       location_slug, location_name, starts_at, ends_at, occupied_until,
       customer_name, email, mobile, drone_model, experience_code, help_with,
       status, amount_paid_cents, amount_refunded_cents, payment_state)
     values ($1, 'first-flight', 'First Flight', 60, 17900,
       'south-sydney', 'South Sydney', $4::timestamptz,
       $4::timestamptz + interval '60 minutes',
       $4::timestamptz + interval '90 minutes',
       'Test Customer', 'test@example.com', '0400000000', 'DJI Mini 4K', 'new', 'Help',
       'confirmed', $2, $3, 'paid')
     returning id`,
    [reference, paidCents, refundedCents, startsAt],
  )
  return result.rows[0]!.id
}

const bookingEvent = async (
  bookingId: string,
  eventType: string,
  createdAt: string,
  detail: Record<string, unknown> | null = null,
) => {
  await db.query(
    `insert into booking_events (booking_id, event_type, detail) values ($1, $2, $3)`,
    [bookingId, eventType, detail === null ? null : JSON.stringify(detail)],
  )
  await db.query(
    `update booking_events set created_at = $3
      where booking_id = $1 and event_type = $2 and created_at > now() - interval '1 minute'`,
    [bookingId, eventType, createdAt],
  )
}

/** Returns the SQLSTATE of a failed statement, or null when it succeeded. */
const sqlState = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run()
    return null
  } catch (error) {
    return (error as { code?: string }).code ?? 'unknown'
  }
}

beforeAll(async () => {
  db = await PGlite.create({ extensions: { btree_gist, pgcrypto } })
  // The Supabase roles, so every revoke and grant in the migrations is exercised.
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec(`create role ${role} nologin`)
  }
  for (const file of MIGRATIONS) {
    await db.exec(readFileSync(file, 'utf8'))
  }
})

afterAll(async () => {
  await db?.close()
})

describe('analytics_events', () => {
  it('is locked down: RLS on, no policies, nothing for a browser role', async () => {
    const table = await db.query<{ relrowsecurity: boolean; policies: number }>(
      `select c.relrowsecurity,
              (select count(*) from pg_policy p where p.polrelid = c.oid)::int as policies
         from pg_class c
        where c.oid = 'public.analytics_events'::regclass`,
    )
    expect(table.rows[0]).toEqual({ relrowsecurity: true, policies: 0 })

    const grants = await db.query<{ role: string; action: string; allowed: boolean }>(
      `select role, action, has_table_privilege(role, 'public.analytics_events', action) as allowed
         from unnest(array['anon', 'authenticated', 'service_role']) as role,
              unnest(array['select', 'insert', 'update', 'delete']) as action`,
    )
    const allowed = grants.rows.filter((row) => row.allowed).map((row) => `${row.role}:${row.action}`)
    // The collector appends and nothing more. No role can read, amend or
    // delete an event, and the browser roles cannot touch it at all.
    expect(allowed).toEqual(['service_role:insert'])
  })

  it('lets the server set occurred_at, and ignores whatever a client sends', async () => {
    const before = new Date()
    await db.query(
      `insert into analytics_events (id, session_id, event_name, occurred_at)
       values ($1, $2, 'page_viewed', '1999-01-01T00:00:00Z')`,
      [eventId(), SESSION_A],
    )
    const row = await db.query<{ occurred_at: Date }>(
      `select occurred_at from analytics_events order by occurred_at desc limit 1`,
    )
    expect(new Date(row.rows[0]!.occurred_at).getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    await db.query(`delete from analytics_events`)
  })

  it('refuses an unsupported event name, a query string and an oversized label', async () => {
    const insert = (columns: string, values: unknown[]) =>
      db.query(
        `insert into analytics_events (id, session_id, ${columns})
         values ($1, $2, ${values.map((_, index) => `$${index + 3}`).join(', ')})`,
        [eventId(), SESSION_A, ...values],
      )

    // 23514 is a check constraint violation.
    expect(await sqlState(() => insert('event_name', ['customer_email_captured']))).toBe('23514')
    expect(await sqlState(() => insert('event_name, path', ['page_viewed', '/booking-confirmed?session_id=cs_test_1']))).toBe('23514')
    expect(await sqlState(() => insert('event_name, path', ['page_viewed', 'https://droneconfidence.com.au/book']))).toBe('23514')
    expect(await sqlState(() => insert('event_name, reason', ['page_viewed', 'x'.repeat(65)]))).toBe('23514')
    expect(await sqlState(() => insert('event_name, referrer_host', ['page_viewed', 'google.com/search']))).toBe('23514')
    expect(await sqlState(() => insert('event_name, path', ['page_viewed', '/book']))).toBeNull()
    await db.query(`delete from analytics_events`)
  })

  it('treats a repeated beacon as a duplicate rather than a second event', async () => {
    const id = eventId()
    const write = () =>
      db.query(`insert into analytics_events (id, session_id, event_name) values ($1, $2, 'page_viewed')`, [id, SESSION_A])
    expect(await sqlState(write)).toBeNull()
    // 23505 is the unique violation the collector swallows as success.
    expect(await sqlState(write)).toBe('23505')
    await db.query(`delete from analytics_events`)
  })
})

describe('reporting schema', () => {
  it('exists, is owner-only, and holds only the documented views', async () => {
    const views = await db.query<{ viewname: string }>(
      `select c.relname as viewname from pg_class c
        where c.relnamespace = 'reporting'::regnamespace and c.relkind = 'v'
        order by c.relname`,
    )
    expect(views.rows.map((row) => row.viewname)).toEqual(REPORTING_VIEWS)

    const schema = await db.query<{ role: string; allowed: boolean }>(
      `select role, has_schema_privilege(role, 'reporting', 'usage') as allowed
         from unnest(array['anon', 'authenticated']) as role`,
    )
    expect(schema.rows.every((row) => !row.allowed)).toBe(true)

    const reads = await db.query<{ role: string; view: string; allowed: boolean }>(
      `select role, view, has_table_privilege(role, format('reporting.%I', view), 'select') as allowed
         from unnest(array['anon', 'authenticated']) as role,
              unnest($1::text[]) as view`,
      [REPORTING_VIEWS],
    )
    expect(reads.rows.filter((row) => row.allowed)).toEqual([])
  })

  it('has no column that could hold a customer identity or a Stripe id', async () => {
    const columns = await db.query<{ column_name: string }>(
      `select distinct a.attname as column_name
         from pg_attribute a
         join pg_class c on c.oid = a.attrelid
        where c.relnamespace = 'reporting'::regnamespace and c.relkind = 'v' and a.attnum > 0`,
    )
    const names = columns.rows.map((row) => row.column_name).join(' ')
    // The permitted matches are all counters and public catalogue labels:
    // session_name and location_name are the session and training-area names,
    // not a person's, and the *_emails_sent columns are volumes, not addresses.
    const permitted = [
      'session_name',
      'location_name',
      'cancellation_emails_sent',
      'reschedule_emails_sent',
      'customer_confirmations_sent',
      // The time the last webhook arrived, not an identifier from it.
      'last_stripe_event_at',
    ]
    for (const forbidden of ['name', 'email', 'mobile', 'phone', 'drone', 'notes', 'reference', 'stripe', 'customer']) {
      const offenders = columns.rows
        .map((row) => row.column_name)
        .filter((column) => column.includes(forbidden))
        .filter((column) => !permitted.includes(column))
      expect(offenders, `reporting exposes ${forbidden} via ${names}`).toEqual([])
    }
  })
})

describe('reporting figures', () => {
  beforeAll(async () => {
    await db.query(`delete from analytics_events`)
    await db.query(`delete from bookings`)

    // Session A: two page views and a booking-page view, split across the
    // Sydney midnight between 30 September and 1 October.
    await analyticsEvent(SESSION_A, 'session_started', SEP_30_LATE, {
      path: '/',
      referrer_host: 'www.google.com',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring',
    })
    await analyticsEvent(SESSION_A, 'page_viewed', SEP_30_LATE, { path: '/' })
    await analyticsEvent(SESSION_A, 'page_viewed', SEP_30_LATE, { path: '/sessions' })
    await analyticsEvent(SESSION_A, 'page_viewed', OCT_1_EARLY, { path: '/book' })
    await analyticsEvent(SESSION_A, 'booking_page_viewed', OCT_1_EARLY)
    // Three clicks, one visitor.
    await analyticsEvent(SESSION_A, 'booking_clicked', SEP_30_LATE, { source_page: 'home' })
    await analyticsEvent(SESSION_A, 'booking_clicked', SEP_30_LATE, { source_page: 'home' })
    await analyticsEvent(SESSION_A, 'booking_clicked', SEP_30_LATE, { source_page: 'sessions' })
    await analyticsEvent(SESSION_A, 'booking_checkout_started', OCT_1_EARLY)

    // Session B: arrived with no referrer and no campaign, and left at step 1.
    await analyticsEvent(SESSION_B, 'session_started', SEP_30_LATE, { path: '/pricing' })
    await analyticsEvent(SESSION_B, 'page_viewed', SEP_30_LATE, { path: '/pricing' })

    // Authoritative money: one payment on 30 September Sydney, one cancellation
    // with a partial refund on 1 October Sydney.
    const paid = await booking('DC-1001', 17_900)
    await bookingEvent(paid, 'hold_created', SEP_30_LATE)
    await bookingEvent(paid, 'payment_confirmed', SEP_30_LATE, { amount_paid_cents: 17_900 })
    // A different start time: the database refuses two overlapping bookings.
    const cancelled = await booking('DC-1002', 23_900, 11_950, '2026-10-20T23:00:00Z')
    await bookingEvent(cancelled, 'payment_confirmed', SEP_30_LATE, { amount_paid_cents: 23_900 })
    // A real policy reason code, with the 50% share the policy defines for it.
    await bookingEvent(cancelled, 'cancelled', OCT_1_EARLY, {
      reason: 'customer_within_24h',
      refunded_cents: 11_950,
    })
  })

  it('splits days on Sydney midnight, not UTC midnight', async () => {
    const days = await db.query<{ period_start: string; sessions: number; page_views: number }>(
      `select period_start::text, sessions, page_views
         from reporting.daily_snapshot order by period_start`,
    )
    expect(days.rows).toEqual([
      // 30 September Sydney: both visitors, three page views.
      { period_start: '2026-09-30', sessions: 2, page_views: 3 },
      // 1 October Sydney: session A only, one page view.
      { period_start: '2026-10-01', sessions: 1, page_views: 1 },
    ])
  })

  it('counts a repeated click as one visitor, not three', async () => {
    const day = await db.query<{ booking_cta_sessions: number }>(
      `select booking_cta_sessions from reporting.daily_snapshot where period_start = '2026-09-30'`,
    )
    expect(day.rows[0]!.booking_cta_sessions).toBe(1)
  })

  it('takes money from the booking records and leaves an empty ratio as NULL', async () => {
    const rows = await db.query<{
      period_start: string
      confirmed_bookings: number
      gross_booked_aud: string
      refunded_aud: string
      net_retained_aud: string
      average_booking_value_aud: string | null
      checkout_to_paid_pct: string | null
    }>(
      `select period_start::text, confirmed_bookings, gross_booked_aud, refunded_aud,
              net_retained_aud, average_booking_value_aud, checkout_to_paid_pct
         from reporting.daily_snapshot order by period_start`,
    )

    expect(rows.rows[0]).toEqual({
      period_start: '2026-09-30',
      confirmed_bookings: 2,
      gross_booked_aud: '418.00',
      refunded_aud: '0.00',
      net_retained_aud: '418.00',
      average_booking_value_aud: '209.00',
      // Nobody started checkout that day, so the ratio has no denominator and
      // reads as "no data" rather than 0%.
      checkout_to_paid_pct: null,
    })
    // The refund lands on the Sydney day it was issued, not the booking's day.
    expect(rows.rows[1]!.refunded_aud).toBe('119.50')
    expect(rows.rows[1]!.net_retained_aud).toBe('-119.50')
    expect(rows.rows[1]!.average_booking_value_aud).toBeNull()
  })

  it('reports weekly Monday-to-Sunday and monthly Sydney calendar periods', async () => {
    const weeks = await db.query<{ period_start: string; sessions: number }>(
      `select period_start::text, sessions from reporting.weekly_snapshot order by period_start`,
    )
    // 30 September 2026 is a Wednesday; its Sydney week starts Monday 28 September.
    expect(weeks.rows.map((row) => row.period_start)).toEqual(['2026-09-28'])
    expect(weeks.rows[0]!.sessions).toBe(2)

    const months = await db.query<{ period_start: string; gross_booked_aud: string }>(
      `select period_start::text, gross_booked_aud from reporting.monthly_snapshot order by period_start`,
    )
    expect(months.rows.map((row) => row.period_start)).toEqual(['2026-09-01', '2026-10-01'])
    expect(months.rows[0]!.gross_booked_aud).toBe('418.00')
  })

  it('keeps daily, weekly and monthly column names identical', async () => {
    const columns = async (view: string) => {
      const result = await db.query<{ attname: string }>(
        `select a.attname from pg_attribute a
          where a.attrelid = format('reporting.%I', $1::text)::regclass and a.attnum > 0
          order by a.attnum`,
        [view],
      )
      return result.rows.map((row) => row.attname)
    }
    const daily = await columns('daily_snapshot')
    expect(await columns('weekly_snapshot')).toEqual(daily)
    expect(await columns('monthly_snapshot')).toEqual(daily)
    expect(daily[0]).toBe('period_start')
  })

  it('attributes traffic without inventing a source', async () => {
    const rows = await db.query<{
      referrer_host: string | null
      utm_source: string | null
      sessions: number
      booking_page_sessions: number
    }>(
      `select referrer_host, utm_source, sessions, booking_page_sessions
         from reporting.traffic_sources_daily order by sessions desc`,
    )
    expect(rows.rows).toEqual([
      { referrer_host: 'www.google.com', utm_source: 'google', sessions: 1, booking_page_sessions: 1 },
      // Unreported, and left that way rather than labelled "(direct)".
      { referrer_host: null, utm_source: null, sessions: 1, booking_page_sessions: 0 },
    ])
  })

  it('ranks pages by pathname only', async () => {
    const rows = await db.query<{ path: string; page_views: number }>(
      `select path, page_views from reporting.page_performance_daily order by path`,
    )
    expect(rows.rows.map((row) => row.path)).toEqual(['/', '/book', '/pricing', '/sessions'])
    expect(rows.rows.every((row) => !row.path.includes('?'))).toBe(true)
  })

  it('reports the booking mix and cancellation reasons', async () => {
    const mix = await db.query<{ session_slug: string; confirmed_bookings: number; gross_booked_aud: string }>(
      `select session_slug, confirmed_bookings, gross_booked_aud from reporting.booking_mix_monthly`,
    )
    expect(mix.rows).toEqual([
      { session_slug: 'first-flight', confirmed_bookings: 2, gross_booked_aud: '418.00' },
    ])

    const reasons = await db.query<{
      cancellation_reason: string
      cancelled_bookings: number
      amount_refunded_aud: string
      amount_retained_aud: string
    }>(
      `select cancellation_reason, cancelled_bookings, amount_refunded_aud, amount_retained_aud
         from reporting.cancellation_reasons_monthly`,
    )
    expect(reasons.rows).toEqual([
      {
        cancellation_reason: 'customer_within_24h',
        cancelled_bookings: 1,
        amount_refunded_aud: '119.50',
        amount_retained_aud: '119.50',
      },
    ])
  })

  it('answers the health question in one row without changing anything', async () => {
    const before = await db.query<{ count: number }>(`select count(*)::int from bookings`)
    const health = await db.query<{
      booking_enabled: boolean
      upcoming_confirmed_bookings: number
      active_pending_holds: number
      stale_active_holds: number
      analytics_events_last_24h: number
    }>(`select * from reporting.current_health`)

    expect(health.rows).toHaveLength(1)
    expect(health.rows[0]!.booking_enabled).toBe(false)
    expect(health.rows[0]!.active_pending_holds).toBe(0)
    expect(health.rows[0]!.stale_active_holds).toBe(0)

    // The 24-hour counters track the real clock, so they are checked by moving
    // it: one fresh event, one more in the last day.
    const baseline = health.rows[0]!.analytics_events_last_24h
    await db.query(
      `insert into analytics_events (id, session_id, event_name) values ($1, $2, 'page_viewed')`,
      [eventId(), SESSION_A],
    )
    const updated = await db.query<{ analytics_events_last_24h: number }>(
      `select analytics_events_last_24h from reporting.current_health`,
    )
    expect(updated.rows[0]!.analytics_events_last_24h).toBe(baseline + 1)

    const after = await db.query<{ count: number }>(`select count(*)::int from bookings`)
    expect(after.rows[0]!.count).toBe(before.rows[0]!.count)
  })

  it('counts a stale hold as one expire_stale_holds would release', async () => {
    const stale = await booking('DC-1003', 0, 0, '2026-10-21T01:00:00Z')
    await db.query(
      `update bookings set status = 'pending_payment', payment_state = 'unpaid',
              hold_expires_at = now() - interval '10 minutes' where id = $1`,
      [stale],
    )
    const health = await db.query<{ active_pending_holds: number; stale_active_holds: number }>(
      `select active_pending_holds, stale_active_holds from reporting.current_health`,
    )
    // Past its expiry by more than the 3-minute configured grace period.
    expect(health.rows[0]).toEqual({ active_pending_holds: 1, stale_active_holds: 1 })

    await db.query(
      `update bookings set hold_expires_at = now() + interval '10 minutes' where id = $1`,
      [stale],
    )
    const fresh = await db.query<{ stale_active_holds: number }>(
      `select stale_active_holds from reporting.current_health`,
    )
    expect(fresh.rows[0]!.stale_active_holds).toBe(0)
    await db.query(`delete from bookings where id = $1`, [stale])
  })
})

describe('the new function is hardened like the rest', () => {
  it('is unreachable to PUBLIC and pinned to an empty search path', async () => {
    const rows = await db.query<{ proname: string; config: string[] | null; public_execute: number }>(
      `select p.proname, p.proconfig as config,
              -- grantee 0 is the PUBLIC pseudo-role: the default EXECUTE grant
              -- Postgres adds to every new function, and the whole reason
              -- 0003 exists.
              (select count(*)::int from aclexplode(p.proacl) a
                where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_execute
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where (n.nspname = 'public' and p.proname = 'analytics_events_stamp')
           or n.nspname = 'reporting'
        order by p.proname`,
    )
    expect(rows.rows.map((row) => row.proname)).toEqual(['analytics_events_stamp', 'sydney_period'])
    for (const row of rows.rows) {
      expect(row.config).toContain('search_path=""')
      expect(row.public_execute).toBe(0)
    }
  })
})
