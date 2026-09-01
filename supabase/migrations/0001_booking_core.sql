-- Drone Confidence — first-party booking schema.
--
-- Supabase is the canonical store for bookings, availability blocks and the
-- operational settings the availability engine reads. The browser never touches
-- these tables: RLS is enabled with no policies, so only the service role used
-- by trusted Netlify Functions can read or write them.
--
-- Public booking is seeded OFF at the bottom of this file. Applying this
-- migration cannot start taking live bookings.

create extension if not exists pgcrypto;
-- btree_gist gives GiST index support for scalar `=` and `<>`, which the two
-- exclusion constraints below need alongside the range overlap operator.
create extension if not exists btree_gist;

do $$ begin
  create type public.booking_status as enum
    ('pending_payment', 'confirmed', 'cancelled', 'expired', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_state as enum
    ('unpaid', 'paid', 'refunded', 'partially_refunded', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
-- Session and location facts are stored as snapshots (name, duration, price)
-- so a historical booking still reads correctly after public pricing changes.
--
-- `occupied_until` is the end of the lesson plus the buffer that must follow
-- it. Overlap is therefore checked against a single range, which also means the
-- buffer is naturally not required before the first lesson of a day, and the
-- last lesson may finish exactly at the end of the operating window.
--
-- `is_active` is the one flag that decides whether a row blocks availability.
-- It is maintained explicitly (never derived from now()) precisely so the
-- exclusion constraints below can be indexed: a partial index whose predicate
-- called now() would be silently wrong.
create table if not exists public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  reference                 text not null unique,
  -- Client-generated per submit attempt: a duplicate submit or network retry
  -- returns the hold it already created instead of making a second one.
  attempt_id                uuid unique,

  session_slug              text not null,
  session_name              text not null,
  duration_minutes          integer not null check (duration_minutes > 0),
  price_cents               integer not null check (price_cents >= 0),

  location_slug             text not null,
  location_name             text not null,

  starts_at                 timestamptz not null,
  ends_at                   timestamptz not null,
  occupied_until            timestamptz not null,
  -- The Australia/Sydney calendar day, maintained by trigger. The same-day
  -- location lock and the day advisory lock both key off this.
  booking_day               date not null,
  time_zone                 text not null default 'Australia/Sydney',

  customer_name             text not null,
  email                     text not null,
  mobile                    text not null,
  drone_model               text not null,
  experience_code           text not null,
  help_with                 text not null,
  notes                     text,

  status                    public.booking_status not null default 'pending_payment',
  is_active                 boolean not null default true,
  hold_expires_at           timestamptz,

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id  text,
  currency                  text not null default 'aud',
  amount_paid_cents         integer not null default 0 check (amount_paid_cents >= 0),
  amount_refunded_cents     integer not null default 0 check (amount_refunded_cents >= 0),
  payment_state             public.payment_state not null default 'unpaid',
  stripe_refund_id          text,

  cancellation_reason       text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  confirmed_at              timestamptz,
  cancelled_at              timestamptz,

  constraint bookings_time_order
    check (ends_at > starts_at and occupied_until >= ends_at),
  constraint bookings_refund_within_paid
    check (amount_refunded_cents <= amount_paid_cents)
);

create or replace function public.bookings_set_derived()
returns trigger language plpgsql as $$
begin
  new.booking_day := (new.starts_at at time zone new.time_zone)::date;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists bookings_set_derived on public.bookings;
create trigger bookings_set_derived
  before insert or update on public.bookings
  for each row execute function public.bookings_set_derived();

-- The database is the final race-condition protection, not the application.
do $$ begin
  alter table public.bookings
    add constraint bookings_no_overlap
    exclude using gist (tstzrange(starts_at, occupied_until, '[)') with &&)
    where (is_active);
exception when duplicate_object then null; end $$;

-- Same-day location lock: once a day holds anything active, every other active
-- booking that day must be in the same training area. Two customers cannot
-- concurrently claim opposite areas on the same otherwise-empty date, because
-- the second insert violates this constraint rather than losing a check race.
do $$ begin
  alter table public.bookings
    add constraint bookings_single_location_per_day
    exclude using gist (booking_day with =, location_slug with <>)
    where (is_active);
exception when duplicate_object then null; end $$;

create index if not exists bookings_active_starts_at_idx
  on public.bookings (starts_at) where is_active;
create index if not exists bookings_active_day_idx
  on public.bookings (booking_day) where is_active;
create index if not exists bookings_status_idx
  on public.bookings (status, starts_at);
-- Time-independent predicate on purpose: the expiry comparison happens in the
-- query, never in the index definition.
create index if not exists bookings_pending_hold_idx
  on public.bookings (hold_expires_at) where status = 'pending_payment';
create index if not exists bookings_email_idx on public.bookings (lower(email));

-- ---------------------------------------------------------------------------
-- Availability blocks
-- ---------------------------------------------------------------------------
-- The owner's manual mechanism for NSW public holidays, personal unavailable
-- days and venue closures. `reason` is internal and is never returned by the
-- public availability endpoint.
create table if not exists public.availability_blocks (
  id            uuid primary key default gen_random_uuid(),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  -- null means every training area.
  location_slug text,
  -- Internal only. Never returned by the public availability endpoint.
  reason        text not null default '',
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint availability_blocks_time_order check (ends_at > starts_at),
  constraint availability_blocks_location
    check (location_slug is null or location_slug in ('south-sydney', 'north-sydney'))
);

create index if not exists availability_blocks_range_idx
  on public.availability_blocks (starts_at, ends_at);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists availability_blocks_touch on public.availability_blocks;
create trigger availability_blocks_touch
  before update on public.availability_blocks
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Booking settings (singleton) — the live operational configuration
-- ---------------------------------------------------------------------------
create table if not exists public.booking_settings (
  id                     smallint primary key default 1 check (id = 1),
  booking_enabled        boolean not null default false,
  time_zone              text not null default 'Australia/Sydney',
  -- ISO weekdays: Monday = 1 … Sunday = 7. Tuesday/Wednesday/Thursday.
  weekdays               smallint[] not null default '{2,3,4}',
  day_start_minutes      integer not null default 480,
  day_end_minutes        integer not null default 900,
  notice_days            integer not null default 7,
  max_months_ahead       integer not null default 3,
  slot_increment_minutes integer not null default 30,
  buffer_minutes         integer not null default 30,
  -- Stripe Checkout will not accept an expiry closer than 30 minutes.
  checkout_hold_minutes  integer not null default 30 check (checkout_hold_minutes >= 30),
  hold_grace_minutes     integer not null default 3 check (hold_grace_minutes between 0 and 30),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  constraint booking_settings_window check (day_end_minutes > day_start_minutes),
  constraint booking_settings_weekdays check (array_length(weekdays, 1) between 1 and 7)
);

drop trigger if exists booking_settings_touch on public.booking_settings;
create trigger booking_settings_touch
  before update on public.booking_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Audit trail, email idempotency and Stripe event de-duplication
-- ---------------------------------------------------------------------------
create table if not exists public.booking_events (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  event_type text not null,
  detail     jsonb,
  actor      text,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_idx
  on public.booking_events (booking_id, created_at desc);

-- One row per (booking, message kind). The unique constraint is what stops a
-- repeated webhook or a re-run of the hourly reminder sending twice.
create table if not exists public.booking_notifications (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings (id) on delete cascade,
  kind                text not null,
  -- Claimed before the send, stamped after it. The unique constraint below is
  -- what stops a message going out twice.
  claimed_at          timestamptz not null default now(),
  sent_at             timestamptz,
  provider_message_id text,
  unique (booking_id, kind)
);

create table if not exists public.stripe_events (
  id          text primary key,
  event_type  text not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Enabled with no policies at all: anon and authenticated get nothing, in
-- either direction. Trusted Netlify Functions use the service role, which
-- bypasses RLS. Admin browser sessions authenticate with Supabase Auth but
-- still reach data only through authenticated Netlify Functions.
alter table public.bookings              enable row level security;
alter table public.availability_blocks   enable row level security;
alter table public.booking_settings      enable row level security;
alter table public.booking_events        enable row level security;
alter table public.booking_notifications enable row level security;
alter table public.stripe_events         enable row level security;

-- Belt and braces on top of RLS. Guarded so the migration also applies to a
-- plain Postgres (a local test harness) where the Supabase roles don't exist.
do $$
declare
  v_role text;
  v_table text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    if not exists (select 1 from pg_roles where rolname = v_role) then continue; end if;
    foreach v_table in array array[
      'bookings', 'availability_blocks', 'booking_settings',
      'booking_events', 'booking_notifications', 'stripe_events'
    ] loop
      execute format('revoke all on table public.%I from %I', v_table, v_role);
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
-- Booking stays disabled until the owner turns it on from /admin after launch
-- verification. Every other value is the locked operational rule set.
insert into public.booking_settings (id) values (1) on conflict (id) do nothing;
