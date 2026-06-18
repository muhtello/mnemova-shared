import type { EditSessionStatus } from "../types/editSessionType";
export declare const EDIT_SESSION_TTL_MS: number;
/**
 * 6-digit numeric pairing code, matching the existing connect-session format.
 *
 * Uses a CSPRNG: this code gates an edit session that can modify a user's decks,
 * so it must be unpredictable. Math.random() is NOT cryptographically secure.
 * Rejection sampling avoids the modulo bias of `value % 900000`.
 */
export declare function generateShortCode(): string;
/**
 * A session is usable only while `active` AND not past its expiry. Completed and
 * expired are terminal — this is the single-use gate every endpoint checks.
 */
export declare function isEditSessionUsable(status: EditSessionStatus, expiresAt: string | Date): boolean;
