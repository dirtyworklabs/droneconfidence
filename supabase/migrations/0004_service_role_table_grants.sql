-- 0004_service_role_table_grants.sql
--
-- The booking backend connects through Supabase's service_role.
-- Browser roles remain blocked by RLS and explicit revokes.

grant usage on schema public to service_role;

grant select, insert, update, delete
on table
  public.bookings,
  public.availability_blocks,
  public.booking_settings,
  public.booking_events,
  public.booking_notifications,
  public.stripe_events
to service_role;
