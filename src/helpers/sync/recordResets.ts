import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecordReset } from '../../types/studyType'

// ─── syncRecordResets ───────────────────────────────────────────────────────────
// "Reset progress" must wipe every trace of study for a deck, not just the SM-2
// scheduling state: card_records + attempt_logs (both scoped by exercise), and
// session_logs (session history, scoped by deck — it has no exercise column).
//
// Runs BEFORE syncStudyData/history pulls so deleted rows can't reappear in the
// merge. Resilient by design: one deck's failure never blocks the others — a failed
// reset simply isn't returned in syncedDeckIds and stays queued to retry next sync.
// The first error is surfaced (non-fatal) so callers can log a partial-sync warning.
//
// Consumed by web (studyActions syncStudyData) and mobile (lib/sync wrapper); keep the
// delete logic here so it can't drift between platforms.
export async function syncRecordResets(
  client: SupabaseClient,
  resets: RecordReset[],
  userId: string,
): Promise<{ syncedDeckIds: string[]; error: string | null }> {
  const syncedDeckIds: string[] = []
  let firstError: string | null = null

  for (const reset of resets) {
    // session_logs is keyed by deck_id, so clear it even when the deck has no
    // exercises left (card_records/attempt_logs have no deck column to scope by).
    const { error: sessionError } = await client
      .from('session_logs').delete().eq('deck_id', reset.deckId).eq('user_id', userId)

    let resetError = sessionError
    if (reset.exerciseIds.length > 0) {
      const [cardResult, attemptResult] = await Promise.all([
        client.from('card_records').delete().in('exercise_id', reset.exerciseIds).eq('user_id', userId),
        client.from('attempt_logs').delete().in('exercise_id', reset.exerciseIds).eq('user_id', userId),
      ])
      resetError = resetError ?? cardResult.error ?? attemptResult.error
    }

    // Only mark synced when the whole wipe succeeded — a partial failure stays queued.
    if (resetError) {
      firstError = firstError ?? resetError.message
      continue
    }
    syncedDeckIds.push(reset.deckId)
  }

  return { syncedDeckIds, error: firstError }
}
