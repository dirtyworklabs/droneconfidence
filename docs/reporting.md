# Reporting

Copy-and-paste SQL for running the business. Everything here is read-only: no query on
this page changes a booking, a payment, an email or a setting.

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql), paste a query,
press **Run**, then use **Download CSV** above the results if you want it in a spreadsheet.

## Two sources of truth, on purpose

| Question | Comes from |
| --- | --- |
| How many people visited, what they looked at, where they dropped out | `public.analytics_events` — anonymous website telemetry |
| How many bookings, how much money, how many refunds, what was emailed | `public.bookings`, `public.booking_events`, `public.booking_notifications` — the real records |

Money is never taken from analytics. If the two ever disagree about a booking, the booking
tables are right.

**Website analytics only start accumulating once the change is deployed.** There is no
history to backfill, so traffic and funnel columns will be zero for every period before
launch. Booking, payment and email history is unaffected: it has been recorded since the
booking system went live and is fully reportable from day one.

## What is stored about a visitor

An anonymous UUID held in the browser tab's `sessionStorage`, the pathname of the page, the
referrer's *hostname*, `utm_source`, `utm_medium`, `utm_campaign`, and a handful of short
developer-defined labels (which session or training area a click referred to, and why a step
reported itself unavailable).

Not stored, and with no column that could hold them: names, emails, phone numbers, drone
details, free-text answers, notes, booking references, booking ids, Stripe ids, IP addresses,
User-Agent strings, full URLs, query strings, and any identifier that survives the tab
closing. There is no analytics cookie and nothing in `localStorage`.

`public.analytics_events` has row level security on with no policies and is granted to
nothing but the collector function's service role, INSERT only. The `reporting` schema is
owner-only: the browser roles have no access to the schema or to any view in it.

## Periods

Every period is Australia/Sydney, not UTC.

- **Daily** — the Sydney calendar day.
- **Weekly** — Monday to Sunday, Sydney. `period_start` is the Monday.
- **Monthly** — the Sydney calendar month. `period_start` is the 1st.

A visit or a payment belongs to the Sydney period its own timestamp falls in, so every column
in a row describes the same window of time.

## The main report

`daily_snapshot`, `weekly_snapshot` and `monthly_snapshot` have identical columns, so the same
query works on all three — change the view name and the `limit`.

### Last 31 days

```sql
select *
  from reporting.daily_snapshot
 order by period_start desc
 limit 31;
```

### Last 13 weeks

```sql
select *
  from reporting.weekly_snapshot
 order by period_start desc
 limit 13;
```

### Last 12 months

```sql
select *
  from reporting.monthly_snapshot
 order by period_start desc
 limit 12;
```

### The columns

**Traffic** — `sessions` (distinct anonymous visits), `page_views`, `booking_page_sessions`,
`booking_cta_sessions`, `enquiry_sessions`.

**Funnel**, each one a count of *distinct visits*, so a visitor who presses the same button
three times counts once — `session_selected_sessions`, `location_selected_sessions`,
`slot_selected_sessions`, `details_started_sessions`, `checkout_started_sessions`,
`checkout_failed_sessions`, `booking_confirmed_view_sessions`.

**Booking activity**, from the booking records — `holds_created`, `holds_expired`,
`holds_released`, `confirmed_bookings`, `cancelled_bookings`, `reschedules`,
`payment_conflicts` (someone reached a slot a moment too late).

**Financial**, in AUD to two decimals — `gross_booked_aud` (payments confirmed in the period),
`refunded_aud` (refunds issued in the period), `net_retained_aud`,
`average_booking_value_aud`, `external_refunds_recorded`.

**Functionality** — `booking_unavailable_sessions` (visits shown "no times available"),
`reminders_sent`, `customer_confirmations_sent`, `owner_notifications_sent`,
`cancellation_emails_sent`, `reschedule_emails_sent`.

**Conversion**, as a percentage of the stage before it — `site_to_booking_page_pct`,
`booking_page_to_slot_pct`, `slot_to_checkout_pct`, `checkout_to_paid_pct`, and
`site_to_paid_booking_pct` end to end. A stage nobody reached has no denominator, so the
percentage is **NULL** rather than 0 — "no data", not "0%".

### A short version, for a weekly glance

```sql
select period_start,
       sessions,
       booking_page_sessions,
       checkout_started_sessions,
       confirmed_bookings,
       gross_booked_aud,
       refunded_aud,
       net_retained_aud,
       site_to_paid_booking_pct
  from reporting.weekly_snapshot
 order by period_start desc
 limit 8;
```

## Is everything working right now?

One row, refreshed each time you run it.

```sql
select * from reporting.current_health;
```

- `booking_enabled` — the master switch, as the database has it.
- `upcoming_confirmed_bookings` — paid bookings still in the future.
- `active_pending_holds` — slots held while someone is at the Stripe page. A small number is
  normal.
- `stale_active_holds` — holds already past their expiry plus the configured grace period.
  These are released automatically; a number that stays above zero means the hourly function
  is not running.
- `notifications_claimed_but_unsent` — emails that were claimed but never delivered. Should
  be zero.
- `payment_conflicts_last_24h` — customers who lost a race for a slot in the last day.
- `checkout_failures_last_24h`, `analytics_events_last_24h`, `last_analytics_event_at` — the
  website side. If `last_analytics_event_at` stops advancing, the collector or the site is
  down.
- `last_stripe_event_at`, `last_booking_created_at` — the time of the last webhook and the
  last booking row. Not identifiers, just clocks.

## Which pages are doing the work

```sql
select period_start, path, sessions, page_views
  from reporting.page_performance_daily
 order by period_start desc, page_views desc;
```

Rolled up over the last 30 days:

```sql
select path,
       sum(sessions)   as sessions,
       sum(page_views) as page_views
  from reporting.page_performance_daily
 where period_start >= (now() at time zone 'Australia/Sydney')::date - 30
 group by path
 order by page_views desc;
```

`path` is a pathname and only ever a pathname: `/book`, never `/book?session=first-flight`.

## Where visitors came from

```sql
select period_start, referrer_host, utm_source, utm_medium, utm_campaign,
       sessions, booking_page_sessions, checkout_started_sessions
  from reporting.traffic_sources_daily
 order by period_start desc, sessions desc;
```

By campaign over the last 90 days:

```sql
select coalesce(utm_source, referrer_host)   as source,
       utm_campaign,
       sum(sessions)                  as sessions,
       sum(booking_page_sessions)     as booking_page_sessions,
       sum(checkout_started_sessions) as checkout_started_sessions
  from reporting.traffic_sources_daily
 where period_start >= (now() at time zone 'Australia/Sydney')::date - 90
 group by 1, 2
 order by sessions desc;
```

**A NULL is a NULL.** A blank `referrer_host` means the browser reported no referrer — which
covers typing the address, a bookmark, a link from an app, and a browser configured not to
send one. It is left blank rather than labelled "(direct)", because calling it direct traffic
would be a guess.

## What people are booking

```sql
select period_start, session_name, location_name,
       confirmed_bookings, gross_booked_aud,
       refunded_to_date_aud, net_retained_to_date_aud
  from reporting.booking_mix_monthly
 order by period_start desc, confirmed_bookings desc;
```

Grouped by the month the payment was confirmed. The two `_to_date_` columns are **booking
cohort** figures: the refund position *as it stands today* for the bookings confirmed in that
month, which is the right way to ask "how much of what we sold in October did we keep". They
are not refunds issued during October — for that, use `refunded_aud` in
`reporting.monthly_snapshot`.

## Why bookings were cancelled

```sql
select period_start, cancellation_reason,
       cancelled_bookings, amount_refunded_aud, amount_retained_aud
  from reporting.cancellation_reasons_monthly
 order by period_start desc, cancelled_bookings desc;
```

`cancellation_reason` is the internal code recorded on the cancellation — one of
`customer_outside_24h`, `customer_within_24h`, `no_show`, `weather_refund`,
`weather_reschedule` or `goodwill_full_refund`. The customer-facing wording for each lives in
the application (`shared/booking/policy.ts`); it is not duplicated here, so there is only one
place it can be changed.

## Known limits, stated rather than papered over

**A refund made directly in the Stripe dashboard cannot be periodised exactly.** When this
application issues a refund it records the amount at the moment it issues it, and that is what
`refunded_aud` sums. A refund created in Stripe instead arrives by webhook carrying the
charge's *cumulative* refunded total, not the amount of that one refund, so there is no honest
way to turn a sequence of them into per-period increments. Those refunds are therefore
**counted, not summed**, as `external_refunds_recorded`, and the money is visible in the
booking-cohort columns of `reporting.booking_mix_monthly` and in
`bookings.amount_refunded_cents`. Nothing is estimated to fill the gap. In normal operation
this column is zero, because refunds are issued from the admin dashboard.

**Website analytics have no history before deployment**, as above.

**A visit that crosses Sydney midnight appears in both days.** That is what keeps every column
in a daily row describing the same 24 hours; the weekly and monthly views do not have the
issue at their own boundaries any more than the daily one does.

**`sessions` counts browser tabs, not people.** A visitor who returns tomorrow, or opens the
site in a second tab, is a second session — there is deliberately no cross-visit identifier to
join them with.

## Everything, straight from the tables

If you need a figure the views do not cover, these are the underlying records. Both queries
are read-only.

```sql
-- Business actions, newest first. No customer detail.
select created_at, event_type, detail
  from public.booking_events
 order by created_at desc
 limit 100;
```

```sql
-- Raw website events. Anonymous by construction.
select occurred_at, session_id, event_name, path, referrer_host, utm_source
  from public.analytics_events
 order by occurred_at desc
 limit 100;
```
