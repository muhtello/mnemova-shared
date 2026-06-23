/**
 * Unit tests for syncStudyData progress-reset handling.
 *
 * A progress reset this cycle must win over stale server state. The guard covers
 * BOTH reset representations:
 *   - re-initialised local record (lastReviewed === 0) — step 2 merge loop
 *   - deleted local record (absent from localCardRecords)  — step 3 server-only pull
 * Without the guard, a failed/lagging server DELETE would silently undo the reset.
 * Uses a mock client (no network, no secret).
 *
 * npx vitest run tests/sync.study.reset.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncStudyData } from '../src/helpers/sync/study'
import type { CardRecord } from '../src/types/studyType'

type Result = { data: unknown; error: { message: string } | null }

// Thenable builder: returns server rows for card_records/exercises selects,
// and a no-op success for insert/update (the reset tests never push).
class MockBuilder {
  private method: 'select' | 'insert' | 'update' = 'select'
  constructor(
    public table: string,
    private cardRows: unknown[],
    private exerciseIds: string[],
  ) {}
  select() { this.method = 'select'; return this }
  insert() { this.method = 'insert'; return this }
  update() { this.method = 'update'; return this }
  eq() { return this }
  in() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    let result: Result = { data: null, error: null }
    if (this.method === 'select') {
      result = this.table === 'exercises'
        ? { data: this.exerciseIds.map((id) => ({ id })), error: null }
        : { data: this.cardRows, error: null }
    }
    return Promise.resolve(result).then(onF, onR)
  }
}

function makeClient(opts: { cardRows?: unknown[]; exerciseIds?: string[] }) {
  return {
    from: (table: string) =>
      new MockBuilder(table, opts.cardRows ?? [], opts.exerciseIds ?? []),
  } as unknown as SupabaseClient
}

// A stale server row carrying old progress (recent last_reviewed) for ex-1.
function staleServerRow(lastReviewedMs: number) {
  return {
    id: 'row-1', user_id: 'user-1', guest_session_id: null,
    exercise_id: 'ex-1', interval_days: 7,
    due_date: new Date(lastReviewedMs + 7 * 86_400_000).toISOString(),
    last_reviewed: new Date(lastReviewedMs).toISOString(),
    last_rating: 'good', consecutive_same_rating: 3,
  }
}

function reinitialisedRecord(): CardRecord {
  // Reset re-initialises the local record: scheduled now, no review history.
  return {
    exerciseId: 'ex-1', intervalDays: 1, dueDate: Date.now(),
    lastReviewed: 0, lastRating: null, consecutiveSameRating: 0,
  }
}

describe('syncStudyData — progress reset wins over stale server state', () => {
  const OLD = Date.now() - 10 * 86_400_000 // server progress from 10 days ago

  it('does not pull a stale server row when the reset re-initialised the local record (step 2)', async () => {
    const client = makeClient({ cardRows: [staleServerRow(OLD)] })
    const local = { 'deck-1': { 'ex-1': reinitialisedRecord() } }

    const result = await syncStudyData(client, local, 'user-1', ['ex-1'])

    expect(result.error).toBeNull()
    expect(result.mergedFlatRecords['ex-1'].lastReviewed).toBe(0) // reset preserved
    expect(result.mergedFlatRecords['ex-1'].consecutiveSameRating).toBe(0)
    expect(result.pulledCount).toBe(0) // stale server progress NOT re-imported
  })

  it('control: without the reset id, the stale server row IS pulled back (demonstrates the guard matters)', async () => {
    const client = makeClient({ cardRows: [staleServerRow(OLD)] })
    const local = { 'deck-1': { 'ex-1': reinitialisedRecord() } }

    const result = await syncStudyData(client, local, 'user-1', []) // no reset id

    expect(result.mergedFlatRecords['ex-1'].lastReviewed).toBe(OLD) // server won
    expect(result.pulledCount).toBe(1)
  })

  it('does not re-pull a server-only row when the reset deleted the local record (step 3)', async () => {
    const client = makeClient({ cardRows: [staleServerRow(OLD)] })
    const local = {} // local record was deleted by the reset

    const result = await syncStudyData(client, local, 'user-1', ['ex-1'])

    expect(result.error).toBeNull()
    expect(result.mergedFlatRecords['ex-1']).toBeUndefined() // not resurrected
    expect(result.pulledCount).toBe(0)
  })
})
