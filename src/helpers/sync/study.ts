import type { SupabaseClient } from '@supabase/supabase-js'
import type { CardRecord } from '../../types/studyType'

// ─── Row shape ────────────────────────────────────────────────────────────────

interface CardRecordRow {
  id: string; user_id: string | null; guest_session_id: string | null
  exercise_id: string; interval_days: number; due_date: string
  last_reviewed: string | null; last_rating: string | null
  consecutive_same_rating: number
}

// ─── Converters ───────────────────────────────────────────────────────────────

function fromCardRecordRow(row: CardRecordRow): CardRecord {
  return {
    exerciseId: row.exercise_id, intervalDays: row.interval_days,
    dueDate: new Date(row.due_date).getTime(),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed).getTime() : 0,
    lastRating: (row.last_rating as CardRecord['lastRating']) ?? null,
    consecutiveSameRating: row.consecutive_same_rating,
  }
}

function toCardRecordFields(record: CardRecord, userId: string) {
  return {
    user_id: userId, guest_session_id: null, exercise_id: record.exerciseId,
    interval_days: Math.round(record.intervalDays),
    due_date: new Date(record.dueDate).toISOString(),
    last_reviewed: record.lastReviewed > 0 ? new Date(record.lastReviewed).toISOString() : null,
    last_rating: record.lastRating ?? null,
    consecutive_same_rating: record.consecutiveSameRating,
  }
}

// ─── syncStudyData ────────────────────────────────────────────────────────────
// Strategy: last-write-wins on last_reviewed timestamp.
// Unreviewed records (lastReviewed === 0) are never pushed — they have no study data.
// NOTE: session logs (attempt_logs) and progress resets are NOT handled here.
// The web handles them via studyActions.ts; mobile uses lib/sync.ts syncSessionLogs/syncRecordResets.

export async function syncStudyData(
  client: SupabaseClient,
  localCardRecords: Record<string, Record<string, CardRecord>>,
  userId: string,
): Promise<{ mergedFlatRecords: Record<string, CardRecord>; error: string | null; pushedCount: number; pulledCount: number }> {

  // Flatten nested deckId → exerciseId structure into a single exerciseId map
  const localFlat: Record<string, CardRecord> = {}
  for (const exercises of Object.values(localCardRecords)) {
    for (const record of Object.values(exercises)) {
      localFlat[record.exerciseId] = record
    }
  }

  // ── 1. Fetch server state ──────────────────────────────────────────────────

  const { data: serverRows, error: pullError } = await client
    .from('card_records').select('*').eq('user_id', userId)
  if (pullError) return { mergedFlatRecords: localFlat, error: pullError.message, pushedCount: 0, pulledCount: 0 }

  const serverMap = new Map<string, CardRecordRow>(
    (serverRows as CardRecordRow[]).map((row) => [row.exercise_id, row])
  )

  // ── 2. Merge local vs server — server wins when its last_reviewed is newer ──

  const mergedFlatRecords: Record<string, CardRecord> = {}
  const toInsert: ReturnType<typeof toCardRecordFields>[] = []
  const toUpdate: Array<{ id: string; fields: ReturnType<typeof toCardRecordFields> }> = []
  let pulledCount = 0

  for (const record of Object.values(localFlat)) {
    const serverRow = serverMap.get(record.exerciseId)
    const serverTs = serverRow?.last_reviewed ? new Date(serverRow.last_reviewed).getTime() : 0
    if (serverRow && serverTs > record.lastReviewed) {
      mergedFlatRecords[record.exerciseId] = fromCardRecordRow(serverRow)
      pulledCount++
    } else {
      mergedFlatRecords[record.exerciseId] = record
      if (record.lastReviewed > 0) {
        const fields = toCardRecordFields(record, userId)
        if (!serverRow) toInsert.push(fields)
        // Only update when local is strictly newer — equal timestamps mean no real change
        else if (record.lastReviewed > serverTs) toUpdate.push({ id: serverRow.id, fields })
      }
    }
  }

  // ── 3. Pull server-only records (studied on another device) ────────────────

  for (const [exerciseId, serverRow] of serverMap) {
    if (!mergedFlatRecords[exerciseId]) {
      mergedFlatRecords[exerciseId] = fromCardRecordRow(serverRow)
      pulledCount++
    }
  }

  // ── 4. Push local winners ──────────────────────────────────────────────────

  if (toInsert.length > 0) {
    // Verify exercise IDs exist — deckRecords can outlive deleted exercises, which would
    // violate the card_records → exercises FK constraint.
    const { data: validExs } = await client
      .from('exercises').select('id').in('id', toInsert.map((r) => r.exercise_id))
    const validIds = new Set((validExs ?? []).map((e: { id: string }) => e.id))
    const safe = toInsert.filter((r) => validIds.has(r.exercise_id))
    if (safe.length > 0) {
      const { error } = await client.from('card_records').insert(safe)
      if (error) return { mergedFlatRecords: localFlat, error: error.message, pushedCount: 0, pulledCount: 0 }
    }
  }

  // BUG FIX: Supabase returns { error } per row rather than throwing — check each result
  // so pushedCount only counts rows that actually landed on the server.
  let successfulUpdates = 0
  if (toUpdate.length > 0) {
    const results = await Promise.all(
      toUpdate.map(({ id, fields }) => client.from('card_records').update(fields).eq('id', id))
    )
    successfulUpdates = results.filter((r) => !r.error).length
  }

  const pushedCount = toInsert.length + successfulUpdates
  return { mergedFlatRecords, error: null, pushedCount, pulledCount }
}
