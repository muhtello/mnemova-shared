export type ConnErrorCode = "no-connection" | "connection-interrupted" | "server-error";
/**
 * Maps an error (and optional HTTP status) to a connectivity category, or null when it
 * isn't a connectivity problem.
 *
 * - 429 / 5xx → "server-error" (reachable but failing; worth a retry)
 * - timeout / abort / reset → "connection-interrupted"
 * - fetch TypeError (offline / DNS / refused) → "no-connection"
 */
export declare function classifyConnError(error: unknown, httpStatus?: number): ConnErrorCode | null;
/**
 * Maps a ConnErrorCode to its i18n key under the shared `connError` namespace, so web
 * and mobile translate connectivity errors identically: `t(connErrorKey(code))`.
 */
export declare function connErrorKey(code: ConnErrorCode): string;
