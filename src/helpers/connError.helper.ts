// Classifies a thrown value or backend error message into a connectivity category so
// the UI can tell "you're offline" apart from "the request dropped mid-flight". Shared
// by web and mobile (sync, device pairing, edit sessions) to keep one vocabulary.
//
// Returns null when the failure is NOT connectivity-related (e.g. an RLS/validation
// error), so callers fall back to their existing, more specific message.

export type ConnErrorCode = "no-connection" | "connection-interrupted" | "server-error";

// fetch() throws a TypeError when the request never reaches the server: device offline,
// DNS failure, connection refused. Wording differs per platform/engine.
const NO_CONNECTION_PATTERNS = [
  "failed to fetch", // Chromium browsers
  "network request failed", // React Native
  "fetch failed", // Node/undici
  "load failed", // Safari/WebKit
  "networkerror", // Firefox
  "err_internet_disconnected",
  "enotfound",
  "econnrefused",
];

// The request started but never finished cleanly: a timeout (see withTimeout) or an
// aborted/reset socket — typically a flaky or dropped connection rather than no network.
const INTERRUPTED_PATTERNS = [
  "timed out",
  "timeout",
  "aborted",
  "aborterror",
  "the operation was aborted",
  "network changed",
  "econnreset",
  "etimedout",
  "socket hang up",
];

/** Extracts a lowercased message from an Error, string, or { message } shape. */
function messageOf(error: unknown): string {
  if (typeof error === "string") return error.toLowerCase();
  if (error instanceof Error) return error.message.toLowerCase();
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message).toLowerCase();
  }
  return "";
}

/**
 * Maps an error (and optional HTTP status) to a connectivity category, or null when it
 * isn't a connectivity problem.
 *
 * - 429 / 5xx → "server-error" (reachable but failing; worth a retry)
 * - timeout / abort / reset → "connection-interrupted"
 * - fetch TypeError (offline / DNS / refused) → "no-connection"
 */
export function classifyConnError(
  error: unknown,
  httpStatus?: number,
): ConnErrorCode | null {
  if (typeof httpStatus === "number" && (httpStatus === 429 || httpStatus >= 500)) {
    return "server-error";
  }

  const message = messageOf(error);
  if (!message) return null;

  // Check "interrupted" before "no-connection": a timeout often also matches generic
  // network wording, but a dropped request is the more accurate label.
  if (INTERRUPTED_PATTERNS.some((pattern) => message.includes(pattern))) {
    return "connection-interrupted";
  }
  if (NO_CONNECTION_PATTERNS.some((pattern) => message.includes(pattern))) {
    return "no-connection";
  }
  return null;
}

/**
 * Maps a ConnErrorCode to its i18n key under the shared `connError` namespace, so web
 * and mobile translate connectivity errors identically: `t(connErrorKey(code))`.
 */
export function connErrorKey(code: ConnErrorCode): string {
  switch (code) {
    case "no-connection":
      return "connError.noConnection";
    case "connection-interrupted":
      return "connError.connectionInterrupted";
    case "server-error":
      return "connError.serverError";
  }
}
