type ClassValue = string | false | null | undefined

/** Minimal class joiner — no runtime dependency required for this site. */
export const cn = (...values: ClassValue[]): string => values.filter(Boolean).join(' ')
