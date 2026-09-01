/**
 * Client-side validation.
 *
 * The rules themselves live in `shared/booking/fields.ts` so the booking form
 * and the Netlify Function that reserves the slot validate identically. This
 * module is the import path the React components use; nothing is re-implemented
 * here.
 */

export * from '@shared/booking/fields'
