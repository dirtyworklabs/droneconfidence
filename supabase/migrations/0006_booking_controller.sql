-- Controller / RC model on a booking.
--
-- The booking form used to collect one free-text "drone make and model". It now
-- collects an aircraft *and* the controller it flies with, because that pair is
-- what the owner needs to prepare a lesson — the app, the firmware path and the
-- stick setup all follow from the controller, not the aircraft alone.
--
-- Two things are deliberate here:
--
--   1. `controller_model` is **nullable**. Every booking taken before this
--      migration predates the field, and inventing a value for those rows would
--      be fabricating operational data. New bookings are required to supply one,
--      but that requirement lives in the browser and in the server-side
--      validation (`shared/booking/fields.ts`, `netlify/lib/bookingInput.ts`),
--      not in a NOT NULL that would break the historical rows.
--
--   2. `reserve_booking_hold` gains a parameter, and in Postgres that creates a
--      second *overload* rather than replacing the function. Two live signatures
--      would mean `p_controller_model` being silently dropped whenever the old
--      one won overload resolution, so the previous signature is dropped
--      explicitly and the new one created in its place.
--
-- The recreated function is otherwise byte-for-byte the behaviour from 0002:
-- same advisory lock on the Sydney booking day, same idempotency lookup by
-- attempt id, same hold expiry, same exclusion-constraint translation into
-- 'slot_taken' / 'location_locked:<slug>', same reference generation, same audit
-- event. Nothing about overlap, the same-day area lock, Stripe or booking status
-- changes.

alter table public.bookings
  add column if not exists controller_model text;

comment on column public.bookings.controller_model is
  'Human-readable controller / RC model. Null on bookings taken before this was collected.';

-- ---------------------------------------------------------------------------
-- Replace, rather than overload, the reservation function.
-- ---------------------------------------------------------------------------
drop function if exists public.reserve_booking_hold(
  uuid, text, text, integer, integer, text, text,
  timestamptz, timestamptz, timestamptz, text,
  text, text, text, text, text, text, text, integer, integer);

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
        experience_code, help_with, notes,
        status, is_active, hold_expires_at, payment_state
      ) values (
        v_reference, p_attempt_id,
        p_session_slug, p_session_name, p_duration_minutes, p_price_cents,
        p_location_slug, p_location_name,
        p_starts_at, p_ends_at, p_occupied_until, p_time_zone,
        p_customer_name, p_email, p_mobile, p_drone_model, p_controller_model,
        p_experience_code, p_help_with, p_notes,
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
