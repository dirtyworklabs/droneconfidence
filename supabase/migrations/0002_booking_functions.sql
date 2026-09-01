-- Atomic booking operations.
--
-- Availability is never checked and then inserted as two unrelated steps. Every
-- write that can race goes through one of these functions, which take a
-- transaction-level advisory lock on the target Australia/Sydney calendar day,
-- release holds that have genuinely expired, re-check the rules, and rely on the
-- exclusion constraints in 0001 as the final backstop.

-- ---------------------------------------------------------------------------
-- Human-readable booking reference, e.g. DC-7KQ4M2.
-- Ambiguous characters (0/O, 1/I) are left out so it can be read aloud.
-- ---------------------------------------------------------------------------
create or replace function public.generate_booking_reference()
returns text
language plpgsql
volatile
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_out text := '';
  i integer;
begin
  for i in 1..6 loop
    v_out := v_out || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::integer, 1);
  end loop;
  return 'DC-' || v_out;
end $$;

-- ---------------------------------------------------------------------------
-- Release unpaid holds that are past their expiry plus grace.
--
-- The grace exists so a payment that completes moments after the nominal
-- Checkout expiry can still be honoured. Expired rows are kept for audit but
-- stop being active, which is what makes them stop blocking availability and
-- stop colliding with the exclusion constraints.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_holds(p_grace_minutes integer default 3)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  with released as (
    update public.bookings
       set status = 'expired',
           is_active = false
     where status = 'pending_payment'
       and is_active
       and hold_expires_at is not null
       and hold_expires_at + make_interval(mins => greatest(coalesce(p_grace_minutes, 0), 0)) <= now()
    returning id
  )
  select array_agg(id) into v_ids from released;

  if v_ids is not null then
    insert into public.booking_events (booking_id, event_type, detail, actor)
    select id, 'hold_expired', jsonb_build_object('grace_minutes', p_grace_minutes), 'system'
      from unnest(v_ids) as id;
  end if;

  return coalesce(array_length(v_ids, 1), 0);
end $$;

-- ---------------------------------------------------------------------------
-- Reserve a pending booking hold.
--
-- Raises 'slot_taken' or 'location_locked:<slug>' rather than returning a
-- partial result, so the caller cannot mistake a rejection for a success.
-- ---------------------------------------------------------------------------
create or replace function public.reserve_booking_hold(
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
  p_experience_code  text,
  p_help_with        text,
  p_notes            text,
  p_hold_minutes     integer,
  p_grace_minutes    integer
)
returns table (booking_id uuid, reference text)
language plpgsql
security definer
set search_path = public
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
        customer_name, email, mobile, drone_model, experience_code, help_with, notes,
        status, is_active, hold_expires_at, payment_state
      ) values (
        v_reference, p_attempt_id,
        p_session_slug, p_session_name, p_duration_minutes, p_price_cents,
        p_location_slug, p_location_name,
        p_starts_at, p_ends_at, p_occupied_until, p_time_zone,
        p_customer_name, p_email, p_mobile, p_drone_model, p_experience_code, p_help_with, p_notes,
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
-- Confirm payment. Called only by the Stripe webhook, never by a browser.
--
-- Idempotent: a repeated event returns 'already_confirmed' without touching the
-- booking state again. A hold released just before the event arrived is
-- re-activated when the slot is still genuinely free, and reported as
-- 'conflict' when it is not, so the owner can intervene rather than a paid
-- customer silently losing a slot.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_booking_payment(
  p_booking_id         uuid,
  p_payment_intent_id  text,
  p_amount_paid_cents  integer,
  p_currency           text
)
returns table (outcome text, reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    outcome := 'not_found';
    reference := null;
    return next;
    return;
  end if;

  reference := v_booking.reference;

  if v_booking.status = 'confirmed' then
    update public.bookings
       set stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_payment_intent_id),
           amount_paid_cents = greatest(amount_paid_cents, coalesce(p_amount_paid_cents, 0)),
           currency = coalesce(p_currency, currency)
     where id = p_booking_id;
    outcome := 'already_confirmed';
    return next;
    return;
  end if;

  if v_booking.status = 'cancelled' then
    outcome := 'cancelled';
    return next;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('booking-day:' || v_booking.booking_day::text, 0));

  begin
    update public.bookings
       set status = 'confirmed',
           is_active = true,
           hold_expires_at = null,
           stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
           amount_paid_cents = coalesce(p_amount_paid_cents, amount_paid_cents),
           currency = coalesce(p_currency, currency),
           payment_state = 'paid',
           confirmed_at = now()
     where id = p_booking_id;
    outcome := 'confirmed';
  exception when exclusion_violation then
    outcome := 'conflict';
  end;

  insert into public.booking_events (booking_id, event_type, detail, actor)
  values (p_booking_id, 'payment_' || outcome, jsonb_build_object('amount_paid_cents', p_amount_paid_cents), 'stripe');

  return next;
end $$;

-- ---------------------------------------------------------------------------
-- Move a confirmed booking to another genuinely available slot.
--
-- Same locking and same rules as reserving a hold. Payment history is left
-- untouched and the previous appointment is recorded as an audit event rather
-- than silently overwritten.
-- ---------------------------------------------------------------------------
create or replace function public.reschedule_booking(
  p_booking_id     uuid,
  p_starts_at      timestamptz,
  p_ends_at        timestamptz,
  p_occupied_until timestamptz,
  p_location_slug  text,
  p_location_name  text,
  p_grace_minutes  integer,
  p_actor          text
)
returns table (outcome text, reference text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_day     date;
  v_lock    text;
begin
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    outcome := 'not_found'; reference := null; return next; return;
  end if;

  reference := v_booking.reference;

  if v_booking.status <> 'confirmed' then
    outcome := 'not_confirmed'; return next; return;
  end if;

  v_day := (p_starts_at at time zone v_booking.time_zone)::date;
  perform pg_advisory_xact_lock(hashtextextended('booking-day:' || v_day::text, 0));
  perform public.expire_stale_holds(p_grace_minutes);

  select b.location_slug into v_lock
    from public.bookings b
   where b.is_active
     and b.booking_day = v_day
     and b.location_slug <> p_location_slug
     and b.id <> p_booking_id
   limit 1;
  if v_lock is not null then
    outcome := 'location_locked'; return next; return;
  end if;

  if exists (
    select 1 from public.bookings b
     where b.is_active
       and b.id <> p_booking_id
       and tstzrange(b.starts_at, b.occupied_until, '[)')
        && tstzrange(p_starts_at, p_occupied_until, '[)')
  ) then
    outcome := 'slot_taken'; return next; return;
  end if;

  begin
    update public.bookings
       set starts_at = p_starts_at,
           ends_at = p_ends_at,
           occupied_until = p_occupied_until,
           location_slug = p_location_slug,
           location_name = p_location_name
     where id = p_booking_id;
    outcome := 'rescheduled';
  exception when exclusion_violation then
    outcome := 'slot_taken';
    return next;
    return;
  end;

  insert into public.booking_events (booking_id, event_type, detail, actor)
  values (
    p_booking_id,
    'rescheduled',
    jsonb_build_object(
      'previous_starts_at', v_booking.starts_at,
      'previous_ends_at', v_booking.ends_at,
      'previous_location_slug', v_booking.location_slug,
      'starts_at', p_starts_at,
      'location_slug', p_location_slug
    ),
    p_actor
  );

  return next;
end $$;

-- ---------------------------------------------------------------------------
-- Nothing here is callable by a browser role.
-- ---------------------------------------------------------------------------
do $$
declare
  v_role text;
  v_fn text;
begin
  foreach v_role in array array['anon', 'authenticated'] loop
    if not exists (select 1 from pg_roles where rolname = v_role) then continue; end if;
    for v_fn in
      select p.oid::regprocedure::text
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in (
           'generate_booking_reference', 'expire_stale_holds', 'reserve_booking_hold',
           'confirm_booking_payment', 'reschedule_booking'
         )
    loop
      execute format('revoke all on function %s from %I', v_fn, v_role);
    end loop;
  end loop;
end $$;
