import type { EditSessionStatus } from "../types/editSessionType";

// Ephemeral edit window. Short by design — this is an active editing session,
// not a background sync, so the browser must finish promptly.
export const EDIT_SESSION_TTL_MS = 15 * 60 * 1000;

/** 6-digit numeric pairing code, matching the existing connect-session format. */
export function generateShortCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
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
