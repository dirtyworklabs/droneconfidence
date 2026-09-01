/**
 * Lightweight analytics hooks.
 *
 * No provider is configured, and none is required. Events are forwarded to a
 * `window.dataLayer` array if some future provider creates one, and are
 * otherwise dropped. Payloads carry no personal information: never pass a
 * name, email, phone number, drone model, notes, booking reference or any
 * Stripe identifier through here. Session id, training area, a step number and
 * an error code are all that booking events are allowed to send.
 */

export type AnalyticsEvent =
  | 'session_viewed'
  | 'booking_clicked'
  | 'booking_page_viewed'
  | 'booking_session_selected'
  | 'booking_location_selected'
  | 'booking_slot_selected'
  | 'booking_details_started'
  | 'booking_checkout_started'
  | 'booking_checkout_failed'
  | 'booking_confirmed_viewed'
  | 'booking_unavailable_shown'
  | 'enquiry_submitted'

type AnalyticsPayload = Record<string, string | number | boolean | undefined>

interface DataLayerWindow extends Window {
  dataLayer?: Array<Record<string, unknown>>
}

export const track = (event: AnalyticsEvent, payload: AnalyticsPayload = {}): void => {
  if (typeof window === 'undefined') return
  const target = window as DataLayerWindow
  if (!Array.isArray(target.dataLayer)) return
  target.dataLayer.push({ event, ...payload })
}
