import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionLog, SessionStats, AttemptLog } from '../../types/studyType'

// ─── DB row shape ─────────────────────────────────────────────────────────────

interface SessionLogRow {
  id: string
  deck_id: string | null
  stats: SessionStats
  attempts: AttemptLog[]
  saved_at: string
}

function rowToSessionLog(row: SessionLogRow): SessionLog {
  return {
    id: row.id,
    deckId: row.deck_id ?? '',
    stats: row.stats,
    attempts: row.attempts,
    savedAt: new Date(row.saved_at).getTime(),
  }
}

// Shape a local session for insertion. Kept separate so the push step can build
// the whole batch in one map() and stay easy to test.
function sessionToRow(session: SessionLog, userId: string) {
  return {
    id:               session.id,
    user_id:          userId,
    guest_session_id: null,
    deck_id:          session.deckId || null,
    stats:            session.stats,
    attempts:         session.attempts,
    saved_at:         new Date(session.savedAt).toISOString(),
  }
}

// ─── syncSessionHistory ───────────────────────────────────────────────────────
//
// Bidirectional sync for the `session_logs` table (authenticated users only).
//
// Steps:
//   1. Pull  — fetch all session_logs for userId (newest 100, ordered desc)
//   2. Push  — insert local sessions whose id is not yet on the server
//
// Returns `pulledSessions` (full server history) so the caller can merge it
// into their local `sessionHistory` store (deduplication by id).
// Calling this multiple times is safe — already-pushed ids are skipped.

export async function syncSessionHistory(
  client: SupabaseClient,
  localSessions: SessionLog[],
  userId: string,
): Promise<{ pulledSessions: SessionLog[]; syncedIds: string[]; error: string | null }> {

  // ── 1. Pull ──────────────────────────────────────────────────────────────────
  const { data: serverRows, error: pullError } = await client
    .from('session_logs')
    .select('id,deck_id,stats,attempts,saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(100)

  if (pullError) {
    return { pulledSessions: [], syncedIds: [], error: pullError.message }
  }

  const serverIds = new Set((serverRows ?? []).map((r: { id: string }) => r.id))

  // ── 2. Push sessions the server hasn't seen yet ───────────────────────────────
  // Batch into a single INSERT: one round-trip instead of one per session, which
  // matters when a user returns from offline with many unsynced sessions.
  const newSessions = localSessions.filter(s => !serverIds.has(s.id))
  const pulledSessions = (serverRows as SessionLogRow[]).map(rowToSessionLog)

  if (newSessions.length === 0) {
    return { pulledSessions, syncedIds: [], error: null }
  }

  const { error: pushError } = await client
    .from('session_logs')
    .insert(newSessions.map(session => sessionToRow(session, userId)))

  // The client resolves with { error } rather than throwing, so surface a failed
  // push instead of silently reporting success. The batch is atomic, so on error
  // nothing was synced — syncedIds stays empty.
  if (pushError) {
    return { pulledSessions, syncedIds: [], error: pushError.message }
  }

  return { pulledSessions, syncedIds: newSessions.map(s => s.id), error: null }
}
