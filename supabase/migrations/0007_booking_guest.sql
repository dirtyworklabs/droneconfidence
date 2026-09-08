-- Guest attendance on a booking.
--
-- Step 4 of the booking form now asks, in plain words, whether anyone will be
-- coming along. The lesson itself is unchanged — one-on-one, built around the
-- person who booked — but knowing in advance that a second person will be on
-- site is operational information the owner needs, and asking for it in the form
-- is better than asking customers to remember to mention it separately.
--
-- Two things are deliberate here:
--
--   1. `guest_attending` is **nullable, with no default**. `not null default
--      false` would silently assert that every booking taken before this
--      migration answered "just me", which none of them did. Null means "not
--      recorded", and the admin dashboard and the emails say exactly that.
--      New bookings always carry true or false, because the browser and the
--      server both require an explicit answer
--      (`shared/booking/fields.ts`, `netlify/lib/bookingInput.ts`).
--
--   2. `reserve_booking_hold` gains a parameter, and in Postgres that creates a
--      second *overload* rather than replacing the function. Two live signatures
--      would mean `p_guest_attending` being silently dropped whenever the older
--      one won overload resolution, so the 0006 signature is dropped explicitly
--      and the new one created in its place — the same approach 0006 took.
--
-- Only the customer detail written by the INSERT changes. The advisory lock on
-- the Sydney booking day, the idempotency lookup by attempt id, stale hold
-- expiry, the overlap check, the same-day training-area lock, reference
-- generation, exclusion-constraint translation, hold expiry and the audit event
-- are all exactly as 0006 left them. Nothing about pricing, Stripe or booking
-- status is touched.

alter table public.bookings
  add column if not exists guest_attending boolean;

comment on column public.bookings.guest_attending is
  'True when one guest is expected alongside the customer. Null on bookings taken before this was asked — not recorded, not "no".';

-- ---------------------------------------------------------------------------
-- Replace, rather than overload, the reservation function.
--
-- This is the 0006 signature: 21 arguments, controller included.
-- ---------------------------------------------------------------------------
drop function if exists public.reserve_booking_hold(
  uuid, text, text, integer, integer, text, text,
  timestamptz, timestamptz, timestamptz, text,
  text, text, text, text, text, text, text, text, integer, integer);

create function public.reserve_booking_hold(
  p_attempt_id       uuid,
  p_session_slug     text,
  p_session_name     text,
  p_duration_minutes integer,
  p_price_cents      integer,
  p_location_slug    text,
  p_location_name    text,
  p_starts_at        timestamptz,
  p_ends_at          timestamptz,
  p_occupied_until   timestamptz,
  p_time_zone        text,
  p_customer_name    text,
  p_email            text,
  p_mobile           text,
  p_drone_model      text,
  p_controller_model text,
  p_experience_code  text,
  p_help_with        text,
  p_notes            text,
  p_guest_attending  boolean,
  p_hold_minutes     integer,
  p_grace_minutes    integer
)
returns table (booking_id uuid, reference text)
language plpgsql
security definer
-- Pinned empty, as 0003 pins every other definer function. Safe because every
-- relation, type and function named below is schema-qualified or in pg_catalog.
set search_path = ''
as $$
declare
  v_day        date;
  v_lock       text;
  v_reference  text;
  v_id         uuid;
  v_tries      integer := 0;
  v_constraint text;
begin
  v_day := (p_starts_at at time zone p_time_zone)::date;

  -- Serialise every reservation touching this calendar day for the duration of
  -- the transaction. Taken before the idempotency lookup so two concurrent
  -- retries of the same attempt can't both fall through to an insert.
  perform pg_advisory_xact_lock(hashtextextended('booking-day:' || v_day::text, 0));

  -- A duplicate submit or a network retry returns the existing hold.
  select b.id, b.reference into v_id, v_reference
    from public.bookings b
   where b.attempt_id = p_attempt_id
   limit 1;
  if v_id is not null then
    booking_id := v_id;
    reference := v_reference;
    return next;
    return;
  end if;

  perform public.expire_stale_holds(p_grace_minutes);

  select b.location_slug into v_lock
    from public.bookings b
   where b.is_active
     and b.booking_day = v_day
     and b.location_slug <> p_location_slug
   limit 1;
  if v_lock is not null then
    raise exception 'location_locked:%', v_lock using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from public.bookings b
     where b.is_active
       and tstzrange(b.starts_at, b.occupied_until, '[)')
        && tstzrange(p_starts_at, p_occupied_until, '[)')
  ) then
    raise exception 'slot_taken' using errcode = 'P0001';
  end if;

  loop
    v_tries := v_tries + 1;
    v_reference := public.generate_booking_reference();
    begin
      insert into public.bookings (
        reference, attempt_id,
        session_slug, session_name, duration_minutes, price_cents,
        location_slug, location_name,
        starts_at, ends_at, occupied_until, time_zone,
        customer_name, email, mobile, drone_model, controller_model,
        guest_attending, experience_code, help_with, notes,
        status, is_active, hold_expires_at, payment_state
      ) values (
        v_reference, p_attempt_id,
        p_session_slug, p_session_name, p_duration_minutes, p_price_cents,
        p_location_slug, p_location_name,
        p_starts_at, p_ends_at, p_occupied_until, p_time_zone,
        p_customer_name, p_email, p_mobile, p_drone_model, p_controller_model,
        p_guest_attending, p_experience_code, p_help_with, p_notes,
        'pending_payment', true,
        now() + make_interval(mins => greatest(p_hold_minutes, 30)), 'unpaid'
      )
      returning id into v_id;
      exit;
    exception
      when exclusion_violation then
        -- The constraints in 0001 are the final arbiter; translate them into
        -- the same errors the explicit checks above would have raised.
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'bookings_single_location_per_day' then
          -- The competing transaction has committed by the time the constraint
          -- fires, so its area can be named rather than guessed.
          select b.location_slug into v_lock
            from public.bookings b
           where b.is_active
             and b.booking_day = v_day
             and b.location_slug <> p_location_slug
           limit 1;
          raise exception 'location_locked:%', coalesce(v_lock, p_location_slug)
            using errcode = 'P0001';
        end if;
        raise exception 'slot_taken' using errcode = 'P0001';
      when unique_violation then
        -- Reference collision only; anything persistent gives up.
        if v_tries >= 5 then raise; end if;
    end;
  end loop;

  insert into public.booking_events (booking_id, event_type, detail, actor)
  values (
    v_id,
    'hold_created',
    jsonb_build_object(
      'starts_at', p_starts_at,
      'location_slug', p_location_slug,
      'hold_minutes', p_hold_minutes
    ),
    'public'
  );

  booking_id := v_id;
  reference := v_reference;
  return next;
end $$;

-- ---------------------------------------------------------------------------
-- Hardening, for the new signature.
-- ---------------------------------------------------------------------------
-- 0003 has already run on the live database and will not run again, and a freshly
-- created function carries the default EXECUTE grant to PUBLIC. So the same
-- treatment is applied here: PUBLIC unconditionally, the browser roles when they
-- exist, and EXECUTE granted back to service_role alone.
do $$
declare
  v_fn text;
  v_role text;
begin
  select p.oid::regprocedure::text into v_fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'reserve_booking_hold';

  execute format('revoke all on function %s from public', v_fn);

  foreach v_role in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_role) then
      execute format('revoke all on function %s from %I', v_fn, v_role);
    end if;
  end loop;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute format('grant execute on function %s to service_role', v_fn);
  end if;
end $$;
