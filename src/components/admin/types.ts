/**
 * A call to an admin endpoint with a freshly minted token.
 *
 * Panels never hold a token themselves; they hand a function to `run`, which
 * supplies one and deals with an expired session centrally.
 */
export type AdminRun = <T>(fn: (token: string) => Promise<T>) => Promise<T>

export const errorText = (error: unknown): string =>
  error instanceof Error && error.message.length > 0
    ? error.message
    : 'That did not work. Please try again.'
