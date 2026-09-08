/**
 * Whether anyone is coming along to the session.
 *
 * Operational attendance only: the answer is a stable code, exactly as
 * experience levels are, so the stored meaning survives an edit to the
 * customer-facing wording. No detail about the guest is collected anywhere —
 * not a name, not an age, not contact details — because the lesson is still
 * one-on-one with the person who booked and the only thing the owner needs to
 * know is whether to expect a second person on site.
 */

export const GUEST_ATTENDANCE_OPTIONS = [
  { code: 'just-me', label: 'No, just me', attending: false },
  { code: 'one-guest', label: 'Yes, one guest', attending: true },
] as const

export type GuestAttendanceCode = (typeof GUEST_ATTENDANCE_OPTIONS)[number]['code']

export const isGuestAttendanceCode = (value: string): value is GuestAttendanceCode =>
  GUEST_ATTENDANCE_OPTIONS.some((option) => option.code === value)

export const guestAttendanceLabel = (code: string): string =>
  GUEST_ATTENDANCE_OPTIONS.find((option) => option.code === code)?.label ?? code

/**
 * The boolean the database stores.
 *
 * Only ever called with a code that has already passed validation, so an
 * unrecognised value is a programming error rather than a customer's answer —
 * it is refused rather than quietly read as "no guest".
 */
export const guestAttending = (code: GuestAttendanceCode): boolean =>
  GUEST_ATTENDANCE_OPTIONS.find((option) => option.code === code)!.attending
