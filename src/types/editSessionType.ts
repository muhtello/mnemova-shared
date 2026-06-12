import type { Deck } from "./deckType";

// ─── Ephemeral web editing session ──────────────────────────────────────────────
// A mobile user opens a one-shot session to edit a single deck from any desktop
// browser. The browser never holds DB credentials or local state — it edits a
// detached snapshot through trusted server endpoints. The session is single-use:
// once completed or expired it is terminal and can never be reopened.

export type EditSessionStatus = "active" | "completed" | "expired";

/** The one editable deck handed to the browser. Same shape mobile already holds. */
export type EditSessionSnapshot = Deck;

/** App-shape view of an `edit_sessions` row (browser/mobile never read all columns). */
export interface EditSession {
  id: string;
  shortCode: string;
  ownerId: string;
  isGuest: boolean;
  deviceId: string;
  snapshot: EditSessionSnapshot;
  status: EditSessionStatus;
  /** Opaque browser-session id of the first browser that claimed it (replay guard). */
  consumedBy: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

// ─── Request / response DTOs ─────────────────────────────────────────────────────

/** Mobile → web `open` endpoint: create a session for one deck. */
export interface OpenEditSessionInput {
  deck: Deck;
  ownerId: string;
  isGuest: boolean;
  deviceId: string;
}

export interface OpenEditSessionResult {
  sessionId: string | null;
  shortCode: string | null;
  expiresAt: string | null;
  error: string | null;
}

/** Browser → web `claim` endpoint: first-claim-wins on a short code. */
export interface ClaimEditInput {
  shortCode: string;
  browserSessionId: string;
}

export interface ClaimEditResult {
  sessionId: string | null;
  /** Short-lived HMAC grant bound to this browser session; required by load/save/complete. */
  grant: string | null;
  error: string | null;
}

/** Browser → web `save` endpoint: overwrite the snapshot (autosave). */
export interface SaveEditInput {
  sessionId: string;
  grant: string;
  snapshot: EditSessionSnapshot;
}
