/**
 * The production migration sequence, in apply order.
 *
 * Both Postgres test suites import this list so neither can skip a file the
 * other still applies. `tests/migrations.test.ts` also asserts that the
 * directory on disk matches, so a new numbered file cannot land untested.
 */
export const MIGRATION_CHAIN = [
  'supabase/migrations/0001_booking_core.sql',
  'supabase/migrations/0002_booking_functions.sql',
  'supabase/migrations/0003_privilege_hardening.sql',
  'supabase/migrations/0004_service_role_table_grants.sql',
  'supabase/migrations/0005_first_party_analytics.sql',
  'supabase/migrations/0006_booking_controller.sql',
  'supabase/migrations/0007_booking_guest.sql',
] as const
