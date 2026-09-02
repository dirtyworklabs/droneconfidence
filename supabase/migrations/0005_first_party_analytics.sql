-- Drone Confidence — first-party analytics and private SQL reporting.
--
-- Two things are added, and neither touches booking behaviour:
--
--   1. `public.analytics_events`, an append-only table of anonymous, aggregate
--      website telemetry written by exactly one trusted Netlify Function.
--   2. the `reporting` schema: owner-only views that join that telemetry to the
--      *authoritative* booking, payment and notification records already in this
--      database, reported on Australia/Sydney calendar periods.
--
-- The privacy boundary is in the column list. There is no name, email, phone
-- number, drone model, free text, note, booking reference, booking id, Stripe
-- identifier, IP address, User-Agent, full URL, query string or persistent
-- cross-visit identifier — no column any of those could be stored in, and no
-- JSON column to hide them in either. The session id is a random UUID held in
-- the browser's sessionStorage for one tab session and is not linkable to a
-- person or to a later visit.
--
-- Money is never taken from analytics. Every financial figure in `reporting`
-- comes from `public.bookings` and `public.booking_events`.

-- ---------------------------------------------------------------------------
-- Analytics events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  -- Browser-generated per event, which makes a retried beacon a no-op insert.
  id            uuid primary key,
  -- Anonymous, per browser-tab session. sessionStorage only: no cookie, no
  -- localStorage, no cross-visit identity.
  session_id    uuid not null,
  event_name    text not null,
  -- Set by the server, never accepted from a client. See the trigger below.
  occurred_at   timestamptz not null default now(),

  -- Pathname only. A query string is rejected by constraint as well as by the
  -- collector, because /booking-confirmed carries a Stripe session id and /book
  -- carries selection parameters.
  path          text,

  -- Short slug-shaped context, all of it developer-defined and public.
  session_slug  text,
  location_slug text,
  context       text,
  reason        text,
  code          text,
  form_name     text,
  source_page   text,

  -- Attribution. Referrer is reduced to a hostname before it ever leaves the
  -- page, and only these three UTM parameters are read from a query string.
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,

  -- The supported event vocabulary. An unknown name is not storable.
  constraint analytics_events_name check (event_name in (
    'session_started',
    'page_viewed',
    'session_viewed',
    'booking_clicked',
    'booking_page_viewed',
    'booking_session_selected',
    'booking_location_selected',
    'booking_slot_selected',
    'booking_details_started',
    'booking_checkout_started',
    'booking_checkout_failed',
    'booking_confirmed_viewed',
    'booking_unavailable_shown',
    'enquiry_submitted'
  )),

  -- A rooted path, no query string, no fragment, no absolute URL.
  constraint analytics_events_path check (
    path is null or (
      length(path) between 1 and 128
      and path like '/%'
      and path not like '%?%'
      and path not like '%#%'
      and path not like '%://%'
    )
  ),

  -- Length caps mirroring shared/analytics/events.ts. A capped short label
  -- cannot hold prose, an address or a message.
  constraint analytics_events_session_slug  check (session_slug  is null or length(session_slug)  <= 64),
  constraint analytics_events_location_slug check (location_slug is null or length(location_slug) <= 64),
  constraint analytics_events_context       check (context       is null or length(context)       <= 64),
  constraint analytics_events_reason        check (reason        is null or length(reason)        <= 64),
  constraint analytics_events_code          check (code          is null or length(code)          <= 64),
  constraint analytics_events_form_name     check (form_name     is null or length(form_name)     <= 64),
  constraint analytics_events_source_page   check (source_page   is null or length(source_page)   <= 64),
  constraint analytics_events_referrer_host check (
    referrer_host is null or (length(referrer_host) <= 128 and referrer_host not like '%/%')
  ),
  constraint analytics_events_utm_source    check (utm_source    is null or length(utm_source)    <= 64),
  constraint analytics_events_utm_medium    check (utm_medium    is null or length(utm_medium)    <= 64),
  constraint analytics_events_utm_campaign  check (utm_campaign  is null or length(utm_campaign)  <= 64)
);

-- The server owns the clock. A client cannot backdate, post-date or skew a
-- reporting period, whatever it sends.
create or replace function public.analytics_events_stamp()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.occurred_at := now();
  return new;
end $$;

drop trigger if exists analytics_events_stamp on public.analytics_events;
create trigger analytics_events_stamp
  before insert on public.analytics_events
  for each row execute function public.analytics_events_stamp();

create index if not exists analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_name_occurred_idx
  on public.analytics_events (event_name, occurred_at desc);
create index if not exists analytics_events_session_occurred_idx
  on public.analytics_events (session_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Analytics security
-- ---------------------------------------------------------------------------
-- Same posture as every other table here: RLS on, zero policies, default deny.
-- The browser posts to a Netlify Function; it never reaches Supabase.
alter table public.analytics_events enable row level security;

do $$
declare
  v_role text;
begin
  revoke all on table public.analytics_events from public;

  foreach v_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on table public.analytics_events from %I', v_role);
    end if;
  end loop;

  -- The collector only ever appends. It has no reason to read, amend or delete
  -- an event, so it is not granted SELECT, UPDATE or DELETE.
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant insert on table public.analytics_events to service_role;
  end if;
end $$;

-- Postgres grants EXECUTE on a new function to PUBLIC. Same treatment as
-- 0003_privilege_hardening.sql: revoke PUBLIC first, then grant back narrowly.
do $$
declare
  v_fn text;
  v_role text;
begin
  for v_fn in
    select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'analytics_events_stamp'
  loop
    execute format('revoke all on function %s from public', v_fn);
    foreach v_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = v_role) then
        execute format('revoke all on function %s from %I', v_fn, v_role);
      end if;
    end loop;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Private reporting schema
-- ---------------------------------------------------------------------------
-- For the owner in the Supabase SQL Editor, and nobody else. A browser role has
-- no USAGE on the schema and no privilege on any view in it, so none of this is
-- reachable through the public application.
create schema if not exists reporting;

do $$
declare
  v_role text;
begin
  revoke all on schema reporting from public;
  foreach v_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on schema reporting from %I', v_role);
    end if;
  end loop;
end $$;

-- One definition of "which Sydney period does this instant belong to".
--
-- Daily is the Sydney calendar day, weekly is Monday–Sunday in Sydney
-- (date_trunc('week') is Monday-based), monthly is the Sydney calendar month.
-- Netlify and Postgres both run in UTC, so the conversion is explicit
-- everywhere and never inherited from a session TimeZone setting.
create or replace function reporting.sydney_period(p_at timestamptz, p_grain text)
returns date
language sql
immutable
set search_path = ''
as $$
  select case p_grain
    when 'day'   then (p_at at time zone 'Australia/Sydney')::date
    when 'week'  then (date_trunc('week',  p_at at time zone 'Australia/Sydney'))::date
    when 'month' then (date_trunc('month', p_at at time zone 'Australia/Sydney'))::date
  end
$$;

do $$
declare
  v_fn text;
  v_role text;
begin
  for v_fn in
    select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'reporting'
  loop
    execute format('revoke all on function %s from public', v_fn);
    foreach v_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = v_role) then
        execute format('revoke all on function %s from %I', v_fn, v_role);
      end if;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- reporting.period_snapshot — the one definition behind daily/weekly/monthly
-- ---------------------------------------------------------------------------
-- Every metric is defined once here and exposed three times below, so the three
-- snapshots cannot drift apart. `grain` is the last column and is a constant
-- label in each of the three views.
--
-- Attribution rule: an event, a booking event or a sent email belongs to the
-- Sydney period its own timestamp falls in. A browsing session that crosses
-- local midnight therefore appears in both days, which is what makes every
-- column in a row describe the same window of time.
--
-- Traffic and funnel figures are session-based — count(distinct session_id) —
-- so a visitor pressing the same button three times is one visitor, not three.
-- `page_views` is the deliberate exception: it counts events.
create or replace view reporting.period_snapshot
with (security_invoker = true) as
with grain (grain) as (values ('day'), ('week'), ('month')),

analytics as (
  select g.grain,
         reporting.sydney_period(e.occurred_at, g.grain) as period_start,
         count(distinct e.session_id)                                                          as sessions,
         count(*) filter (where e.event_name = 'page_viewed')                                  as page_views,
         count(distinct e.session_id) filter (where e.event_name = 'booking_page_viewed')       as booking_page_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_clicked')           as booking_cta_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'enquiry_submitted')         as enquiry_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_session_selected')  as session_selected_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_location_selected') as location_selected_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_slot_selected')     as slot_selected_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_details_started')   as details_started_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_checkout_started')  as checkout_started_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_checkout_failed')   as checkout_failed_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_confirmed_viewed')  as booking_confirmed_view_sessions,
         count(distinct e.session_id) filter (where e.event_name = 'booking_unavailable_shown') as booking_unavailable_sessions
    from public.analytics_events e
   cross join grain g
   group by 1, 2
),

-- Authoritative booking activity. These are the audit rows the booking engine
-- writes, so the counts are of business actions, not of page interactions.
--
-- `confirmed_bookings` counts 'payment_confirmed', which confirm_booking_payment
-- writes exactly once per booking that actually transitions to confirmed — a
-- redelivered Stripe event returns 'already_confirmed' and writes nothing.
-- A cancellation writes one 'cancelled' row; the Stripe refund it triggers does
-- not write a second one, so a cancellation is never double counted.
booking as (
  select g.grain,
         reporting.sydney_period(ev.created_at, g.grain) as period_start,
         count(*) filter (where ev.event_type = 'hold_created')      as holds_created,
         count(*) filter (where ev.event_type = 'hold_expired')      as holds_expired,
         count(*) filter (where ev.event_type = 'hold_released')     as holds_released,
         count(*) filter (where ev.event_type = 'payment_confirmed') as confirmed_bookings,
         count(*) filter (where ev.event_type = 'payment_conflict')  as payment_conflicts,
         count(*) filter (where ev.event_type = 'cancelled')         as cancelled_bookings,
         count(*) filter (where ev.event_type = 'rescheduled')       as reschedules,
         -- A refund made directly in the Stripe dashboard. Counted, but not
         -- added to refunded_aud: 'refund_recorded' carries the charge's
         -- cumulative refunded total, not the amount of this refund, so an
         -- exact periodised figure cannot be reconstructed from it. See
         -- docs/reporting.md.
         count(*) filter (where ev.event_type = 'refund_recorded')   as external_refunds_recorded,
         coalesce(sum((ev.detail ->> 'amount_paid_cents')::numeric) filter (
           where ev.event_type = 'payment_confirmed'
             and jsonb_typeof(ev.detail -> 'amount_paid_cents') = 'number'
         ), 0) as gross_booked_cents,
         -- Refunds this application issued, at the moment it issued them. The
         -- amount is the one Stripe was actually asked for.
         coalesce(sum((ev.detail ->> 'refunded_cents')::numeric) filter (
           where ev.event_type = 'cancelled'
             and jsonb_typeof(ev.detail -> 'refunded_cents') = 'number'
         ), 0) as refunded_cents
    from public.booking_events ev
   cross join grain g
   group by 1, 2
),

-- Transactional email that genuinely went out, by the time it went out.
email as (
  select g.grain,
         reporting.sydney_period(n.sent_at, g.grain) as period_start,
         count(*) filter (where n.kind = 'reminder_24h')          as reminders_sent,
         count(*) filter (where n.kind = 'customer_confirmation') as customer_confirmations_sent,
         count(*) filter (where n.kind = 'owner_notification')    as owner_notifications_sent,
         count(*) filter (where n.kind = 'cancellation')          as cancellation_emails_sent,
         count(*) filter (where n.kind = 'reschedule')            as reschedule_emails_sent
    from public.booking_notifications n
   cross join grain g
   where n.sent_at is not null
   group by 1, 2
),

periods as (
  select grain, period_start from analytics
  union
  select grain, period_start from booking
  union
  select grain, period_start from email
)

select p.period_start,

       -- Traffic
       coalesce(a.sessions, 0)              as sessions,
       coalesce(a.page_views, 0)            as page_views,
       coalesce(a.booking_page_sessions, 0) as booking_page_sessions,
       coalesce(a.booking_cta_sessions, 0)  as booking_cta_sessions,
       coalesce(a.enquiry_sessions, 0)      as enquiry_sessions,

       -- Funnel, by distinct anonymous session
       coalesce(a.session_selected_sessions, 0)       as session_selected_sessions,
       coalesce(a.location_selected_sessions, 0)      as location_selected_sessions,
       coalesce(a.slot_selected_sessions, 0)          as slot_selected_sessions,
       coalesce(a.details_started_sessions, 0)        as details_started_sessions,
       coalesce(a.checkout_started_sessions, 0)       as checkout_started_sessions,
       coalesce(a.checkout_failed_sessions, 0)        as checkout_failed_sessions,
       coalesce(a.booking_confirmed_view_sessions, 0) as booking_confirmed_view_sessions,

       -- Authoritative booking activity
       coalesce(b.holds_created, 0)      as holds_created,
       coalesce(b.holds_expired, 0)      as holds_expired,
       coalesce(b.holds_released, 0)     as holds_released,
       coalesce(b.confirmed_bookings, 0) as confirmed_bookings,
       coalesce(b.cancelled_bookings, 0) as cancelled_bookings,
       coalesce(b.reschedules, 0)        as reschedules,
       coalesce(b.payment_conflicts, 0)  as payment_conflicts,

       -- Financial, from booking and payment records only
       round(coalesce(b.gross_booked_cents, 0) / 100.0, 2) as gross_booked_aud,
       round(coalesce(b.refunded_cents, 0) / 100.0, 2)     as refunded_aud,
       round((coalesce(b.gross_booked_cents, 0) - coalesce(b.refunded_cents, 0)) / 100.0, 2)
                                                           as net_retained_aud,
       round((coalesce(b.gross_booked_cents, 0) / 100.0)
             / nullif(coalesce(b.confirmed_bookings, 0), 0), 2)
                                                           as average_booking_value_aud,
       coalesce(b.external_refunds_recorded, 0)            as external_refunds_recorded,

       -- Functionality
       coalesce(a.booking_unavailable_sessions, 0)  as booking_unavailable_sessions,
       coalesce(m.reminders_sent, 0)                as reminders_sent,
       coalesce(m.customer_confirmations_sent, 0)   as customer_confirmations_sent,
       coalesce(m.owner_notifications_sent, 0)      as owner_notifications_sent,
       coalesce(m.cancellation_emails_sent, 0)      as cancellation_emails_sent,
       coalesce(m.reschedule_emails_sent, 0)        as reschedule_emails_sent,

       -- Conversion, as percentages of the stage before it. nullif keeps a
       -- zero denominator as NULL rather than dividing by zero, so an empty
       -- period reads as "no data" instead of 0%.
       --
       -- Every percentage here is a *browser funnel* figure: numerator and
       -- denominator are both counts of anonymous sessions. The last two end on
       -- booking_confirmed_view_sessions, which means "a browser came back from
       -- Stripe and successfully loaded a confirmed booking" — not "a payment
       -- was taken". A customer who pays and then closes the Stripe tab, loses
       -- connectivity or never returns is a confirmed booking that these two
       -- percentages never see, so they are named for the confirmation *view*
       -- and nothing else. `confirmed_bookings` above, from
       -- public.booking_events, is the authoritative paid count. The two are
       -- deliberately not divided into one another: analytics sessions carry no
       -- booking, customer or Stripe identifier, so an exact anonymous-session
       -- to paid-booking rate is not calculable here, and that privacy boundary
       -- is worth more than the ratio. See docs/reporting.md.
       round(100.0 * a.booking_page_sessions / nullif(a.sessions, 0), 2)
         as site_to_booking_page_pct,
       round(100.0 * a.slot_selected_sessions / nullif(a.booking_page_sessions, 0), 2)
         as booking_page_to_slot_pct,
       round(100.0 * a.checkout_started_sessions / nullif(a.slot_selected_sessions, 0), 2)
         as slot_to_checkout_pct,
       round(100.0 * a.booking_confirmed_view_sessions / nullif(a.checkout_started_sessions, 0), 2)
         as checkout_to_confirmation_view_pct,
       round(100.0 * a.booking_confirmed_view_sessions / nullif(a.sessions, 0), 2)
         as site_to_confirmation_view_pct,

       p.grain
  from periods p
  left join analytics a on a.grain = p.grain and a.period_start = p.period_start
  left join booking   b on b.grain = p.grain and b.period_start = p.period_start
  left join email     m on m.grain = p.grain and m.period_start = p.period_start;

create or replace view reporting.daily_snapshot with (security_invoker = true) as
  select * from reporting.period_snapshot where grain = 'day';

create or replace view reporting.weekly_snapshot with (security_invoker = true) as
  select * from reporting.period_snapshot where grain = 'week';

create or replace view reporting.monthly_snapshot with (security_invoker = true) as
  select * from reporting.period_snapshot where grain = 'month';

-- ---------------------------------------------------------------------------
-- Page performance
-- ---------------------------------------------------------------------------
create or replace view reporting.page_performance_daily
with (security_invoker = true) as
select reporting.sydney_period(e.occurred_at, 'day') as period_start,
       e.path,
       count(distinct e.session_id) as sessions,
       count(*)                     as page_views
  from public.analytics_events e
 where e.event_name = 'page_viewed'
   and e.path is not null
 group by 1, 2;

-- ---------------------------------------------------------------------------
-- Traffic sources
-- ---------------------------------------------------------------------------
-- Attribution is taken from the one `session_started` event per anonymous
-- session, and the session's own later behaviour decides whether it reached the
-- booking page or started Checkout. A NULL referrer host or NULL UTM value is
-- left as NULL: it means "not reported by the browser", which is not the same
-- claim as "direct".
create or replace view reporting.traffic_sources_daily
with (security_invoker = true) as
with started as (
  select e.session_id,
         reporting.sydney_period(e.occurred_at, 'day') as period_start,
         e.referrer_host,
         e.utm_source,
         e.utm_medium,
         e.utm_campaign
    from public.analytics_events e
   where e.event_name = 'session_started'
),
behaviour as (
  select e.session_id,
         bool_or(e.event_name = 'booking_page_viewed')      as reached_booking_page,
         bool_or(e.event_name = 'booking_checkout_started') as started_checkout
    from public.analytics_events e
   group by 1
)
select s.period_start,
       s.referrer_host,
       s.utm_source,
       s.utm_medium,
       s.utm_campaign,
       count(distinct s.session_id)                                              as sessions,
       count(distinct s.session_id) filter (where b.reached_booking_page)         as booking_page_sessions,
       count(distinct s.session_id) filter (where b.started_checkout)             as checkout_started_sessions
  from started s
  left join behaviour b on b.session_id = s.session_id
 group by 1, 2, 3, 4, 5;

-- ---------------------------------------------------------------------------
-- Booking mix
-- ---------------------------------------------------------------------------
-- Grouped by the Sydney month the payment was confirmed in, using the session
-- and training-area snapshots stored on the booking itself.
--
-- The two refund columns are booking-cohort figures, and their names say so:
-- they are the refund position *to date* of the bookings confirmed in that
-- month, not refunds issued during it. Use reporting.monthly_snapshot for
-- refunds attributed to the period they were issued in.
create or replace view reporting.booking_mix_monthly
with (security_invoker = true) as
select reporting.sydney_period(ev.created_at, 'month') as period_start,
       bk.session_slug,
       bk.session_name,
       bk.location_slug,
       bk.location_name,
       count(*)                                              as confirmed_bookings,
       round(sum(bk.amount_paid_cents) / 100.0, 2)           as gross_booked_aud,
       round(sum(bk.amount_refunded_cents) / 100.0, 2)       as refunded_to_date_aud,
       round(sum(bk.amount_paid_cents - bk.amount_refunded_cents) / 100.0, 2)
                                                             as net_retained_to_date_aud
  from public.booking_events ev
  join public.bookings bk on bk.id = ev.booking_id
 where ev.event_type = 'payment_confirmed'
 group by 1, 2, 3, 4, 5;

-- ---------------------------------------------------------------------------
-- Cancellations
-- ---------------------------------------------------------------------------
-- Keyed on the internal cancellation reason code recorded in the audit event.
-- The codes, not the customer-facing labels, are reported deliberately: the
-- display wording lives in the application, and duplicating it here would
-- create a second source of truth for it.
create or replace view reporting.cancellation_reasons_monthly
with (security_invoker = true) as
select reporting.sydney_period(ev.created_at, 'month') as period_start,
       ev.detail ->> 'reason' as cancellation_reason,
       count(*)               as cancelled_bookings,
       round(coalesce(sum((ev.detail ->> 'refunded_cents')::numeric) filter (
         where jsonb_typeof(ev.detail -> 'refunded_cents') = 'number'
       ), 0) / 100.0, 2) as amount_refunded_aud,
       round(greatest(
         sum(bk.amount_paid_cents) - coalesce(sum((ev.detail ->> 'refunded_cents')::numeric) filter (
           where jsonb_typeof(ev.detail -> 'refunded_cents') = 'number'
         ), 0),
         0
       ) / 100.0, 2) as amount_retained_aud
  from public.booking_events ev
  join public.bookings bk on bk.id = ev.booking_id
 where ev.event_type = 'cancelled'
 group by 1, 2;

-- ---------------------------------------------------------------------------
-- Live diagnostics
-- ---------------------------------------------------------------------------
-- One row, read-only, no side effects. `stale_active_holds` uses the configured
-- grace period, so it counts exactly the pending holds that expire_stale_holds()
-- would release: past expiry plus grace, but still flagged active.
--
-- There is no scheduled sweep, and none is needed. expire_stale_holds() runs
-- inside reserve_booking_hold() and reschedule_booking(), so booking traffic
-- clears lapsed holds, and the availability engine already applies the same
-- expiry-plus-grace rule when it reads occupancy — a lapsed hold stops blocking
-- a slot whether or not its row has been swept yet. A quiet period can therefore
-- show a non-zero count harmlessly; a count that stays non-zero across booking
-- activity is worth investigating.
create or replace view reporting.current_health
with (security_invoker = true) as
select s.booking_enabled,
       (select count(*) from public.bookings b
         where b.status = 'confirmed' and b.starts_at > now())          as upcoming_confirmed_bookings,
       (select count(*) from public.bookings b
         where b.status = 'pending_payment' and b.is_active)            as active_pending_holds,
       (select count(*) from public.bookings b
         where b.status = 'pending_payment'
           and b.is_active
           and b.hold_expires_at is not null
           and b.hold_expires_at
               + make_interval(mins => greatest(s.hold_grace_minutes, 0)) <= now())
                                                                        as stale_active_holds,
       (select count(*) from public.booking_notifications n
         where n.sent_at is null)                                       as notifications_claimed_but_unsent,
       (select count(*) from public.booking_events e
         where e.event_type = 'payment_conflict'
           and e.created_at > now() - interval '24 hours')              as payment_conflicts_last_24h,
       -- Analytics-sourced: a failed Checkout start is a browser outcome, and
       -- the booking tables have no row for an attempt that never held a slot.
       (select count(*) from public.analytics_events a
         where a.event_name = 'booking_checkout_failed'
           and a.occurred_at > now() - interval '24 hours')             as checkout_failures_last_24h,
       (select count(*) from public.analytics_events a
         where a.occurred_at > now() - interval '24 hours')             as analytics_events_last_24h,
       (select max(a.occurred_at) from public.analytics_events a)       as last_analytics_event_at,
       (select max(e.received_at) from public.stripe_events e)          as last_stripe_event_at,
       (select max(b.created_at) from public.bookings b)                as last_booking_created_at
  from public.booking_settings s
 where s.id = 1;

-- Owner-only, once more, now that the views exist. A browser role has no USAGE
-- on the schema; this makes a stray grant impossible to keep as well.
do $$
declare
  v_role text;
begin
  revoke all on all tables in schema reporting from public;
  foreach v_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on all tables in schema reporting from %I', v_role);
    end if;
  end loop;
end $$;
