-- Production privilege hardening.
--
-- 0001 enabled RLS with no policies and revoked table access from anon and
-- authenticated. That left three gaps that only matter on a real Supabase
-- project, and all three are closed here rather than by editing an applied
-- migration:
--
--   1. Postgres grants EXECUTE on every new function to PUBLIC. Revoking the
--      booking RPCs from anon and authenticated therefore did not make them
--      unreachable: any role that can reach the schema inherits the PUBLIC
--      grant. PUBLIC is now revoked explicitly, and service_role is granted
--      back the execution it actually needs.
--   2. `set search_path = public` on a SECURITY DEFINER function does not list
--      pg_temp, and Postgres searches the temp schema *implicitly first* for
--      relation names when it is not listed. The definer functions are pinned
--      to an empty search_path instead, which is possible because every
--      relation and type they touch is already schema-qualified.
--   3. booking_settings.weekdays only had its length checked, so '{0,9}' or
--      '{2,2}' were accepted by the database even though the admin API rejects
--      them (`validateSettings` in shared/booking/rules.ts). The constraint now
--      enforces the same rule set as the application.
--
-- Nothing about the booking architecture changes: no policy is added, no role
-- gains data access, and no function body is altered.

-- ---------------------------------------------------------------------------
-- weekdays: ISO 1–7, at least one, no duplicates, no nulls
-- ---------------------------------------------------------------------------
-- A CHECK constraint may not contain a subquery, and the duplicate test needs
-- one, so the rule lives in an immutable helper the constraint calls.
--
-- cardinality() is used rather than array_length(), because array_length() of
-- an empty array is NULL, and a NULL check expression *passes*. That is exactly
-- how the previous constraint let '{}' through.
create or replace function public.booking_weekdays_valid(p_weekdays smallint[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_weekdays is not null
    -- At least one, never more than the seven distinct ISO weekdays.
    and cardinality(p_weekdays) between 1 and 7
    and array_ndims(p_weekdays) = 1
    and array_position(p_weekdays, null) is null
    -- Every element is a valid ISO weekday: Monday = 1 … Sunday = 7.
    and p_weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
    -- Duplicates rejected: '{2,2}' would silently halve the offered days.
    and cardinality(p_weekdays) = (select count(distinct d) from unnest(p_weekdays) as d),
    false
  )
$$;

alter table public.booking_settings
  drop constraint if exists booking_settings_weekdays;

alter table public.booking_settings
  add constraint booking_settings_weekdays
  check (public.booking_weekdays_valid(weekdays));

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER search paths
-- ---------------------------------------------------------------------------
-- Pinned by ALTER rather than by re-declaring the bodies, so there is exactly
-- one copy of each function definition in this repository (0002).
--
-- Safe at '' because every function reference is either schema-qualified
-- (public.bookings, public.booking_events, public.expire_stale_holds) or lives
-- in pg_catalog, which Postgres searches even when the search path is empty.
alter function public.expire_stale_holds(integer)                 set search_path = '';
alter function public.confirm_booking_payment(uuid, text, integer, text)
                                                                  set search_path = '';
alter function public.reschedule_booking(
  uuid, timestamptz, timestamptz, timestamptz, text, text, integer, text)
                                                                  set search_path = '';
alter function public.reserve_booking_hold(
  uuid, text, text, integer, integer, text, text,
  timestamptz, timestamptz, timestamptz, text,
  text, text, text, text, text, text, text, integer, integer)
                                                                  set search_path = '';

-- Not SECURITY DEFINER, but a mutable search path is still a hazard worth
-- removing: a trigger function inherits whatever path the caller had.
alter function public.generate_booking_reference()                set search_path = '';
alter function public.bookings_set_derived()                      set search_path = '';
alter function public.touch_updated_at()                          set search_path = '';

-- ---------------------------------------------------------------------------
-- Execute and table privileges
-- ---------------------------------------------------------------------------
-- PUBLIC is revoked unconditionally, because the PUBLIC pseudo-role always
-- exists and always holds the default EXECUTE grant. anon, authenticated and
-- service_role are handled only when present, so this migration still applies
-- to a plain Postgres — the PGlite test harness has none of them.
do $$
declare
  v_fn text;
  v_role text;
begin
  for v_fn in
    select p.oid::regprocedure::text
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'generate_booking_reference', 'expire_stale_holds', 'reserve_booking_hold',
         'confirm_booking_payment', 'reschedule_booking',
         'bookings_set_derived', 'touch_updated_at', 'booking_weekdays_valid'
       )
  loop
    -- The default grant. Without this line the two revokes below achieve
    -- nothing, because anon and authenticated inherit EXECUTE from PUBLIC.
    execute format('revoke all on function %s from public', v_fn);

    foreach v_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = v_role) then
        execute format('revoke all on function %s from %I', v_fn, v_role);
      end if;
    end loop;

    -- The trusted Netlify Functions are the only caller, and they connect as
    -- service_role. Granted explicitly so the RPCs do not depend on the
    -- role also being the function owner.
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function %s to service_role', v_fn);
    end if;
  end loop;
end $$;

-- Tables are not granted to PUBLIC by default, but an explicit revoke costs
-- nothing and makes a stray grant from a console session impossible to keep.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'bookings', 'availability_blocks', 'booking_settings',
    'booking_events', 'booking_notifications', 'stripe_events'
  ] loop
    execute format('revoke all on table public.%I from public', v_table);
  end loop;
end $$;
