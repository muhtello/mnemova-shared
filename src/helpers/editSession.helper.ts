import type { EditSessionStatus } from "../types/editSessionType";

// Ephemeral edit window. Short by design — this is an active editing session,
// not a background sync, so the browser must finish promptly.
export const EDIT_SESSION_TTL_MS = 15 * 60 * 1000;

/**
 * 6-digit numeric pairing code, matching the existing connect-session format.
 *
 * Uses a CSPRNG: this code gates an edit session that can modify a user's decks,
 * so it must be unpredictable. Math.random() is NOT cryptographically secure.
 * Rejection sampling avoids the modulo bias of `value % 900000`.
 */
export function generateShortCode(): string {
  const secureRandom = globalThis.crypto;
  if (!secureRandom?.getRandomValues) {
    // Fail loud rather than fall back to weak randomness — a predictable pairing
    // code is the exact vulnerability this function must not have. On React Native,
    // import "react-native-get-random-values" at the app entry point.
    throw new Error(
      "generateShortCode requires a secure RNG (globalThis.crypto.getRandomValues)."
    );
  }

  const RANGE = 900000; // codes span 100000–999999
  // Largest multiple of RANGE that fits in a uint32 — discard values above it so
  // every code in the range is equally likely.
  const limit = Math.floor(0xffffffff / RANGE) * RANGE;
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    secureRandom.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return String(100000 + (value % RANGE));
}

/**
 * A session is usable only while `active` AND not past its expiry. Completed and
 * expired are terminal — this is the single-use gate every endpoint checks.
 */
export function isEditSessionUsable(
  status: EditSessionStatus,
  expiresAt: string | Date,
): boolean {
  if (status !== "active") return false;
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiry.getTime() > Date.now();
}
