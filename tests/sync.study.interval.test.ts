/**
 * Unit tests for syncStudyData sub-day interval persistence (Bug #5).
 *
 * A deferred Hard rating sets intervalDays = hardDelayHours / 24 (e.g. 4h → 0.166).
 * interval_days is `real` in the DB, so the push must NOT round it to 0; otherwise
 * the displayed interval drifts from "0.2d" to "0.0d" after a sync round-trip.
 * Uses a mock client (no network, no secret).
 *
 * npx vitest run tests/sync.study.interval.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncStudyData } from '../src/helpers/sync/study'
import type { CardRecord } from '../src/types/studyType'

type Result = { data: unknown; error: { message: string } | null }
type Row = Record<string, unknown>

// Thenable builder. Captures insert payloads into `inserted`; exercises select
// returns the validated ids so the FK-existence check passes.
class MockBuilder {
  private method: 'select' | 'insert' | 'update' = 'select'
  constructor(
    public table: string,
    private exerciseIds: string[],
    private inserted: Row[],
  ) {}
  select() { this.method = 'select'; return this }
  insert(rows: Row[]) { this.method = 'insert'; this.inserted.push(...rows); return this }
  update() { this.method = 'update'; return this }
  eq() { return this }
  in() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    let result: Result = { data: null, error: null }
    if (this.method === 'select') {
      result = this.table === 'exercises'
        ? { data: this.exerciseIds.map((id) => ({ id })), error: null }
        : { data: [], error: null } // no server rows → local record is inserted
    }
    return Promise.resolve(result).then(onF, onR)
  }
}

function makeClient(exerciseIds: string[], inserted: Row[]) {
  return {
    from: (table: string) => new MockBuilder(table, exerciseIds, inserted),
  } as unknown as SupabaseClient
}

// A deferred-Hard record: sub-day interval, reviewed (so it gets pushed).
function deferredHardRecord(): CardRecord {
  return {
    exerciseId: 'ex-1',
    intervalDays: 4 / 24, // hardDelayHours=4 → 0.1666…
    dueDate: Date.now() + 4 * 3_600_000,
    lastReviewed: Date.now(),
    lastRating: 'hard',
    consecutiveSameRating: 1,
  }
}

describe('syncStudyData — sub-day interval persists losslessly', () => {
  it('pushes the fractional interval_days without rounding to 0', async () => {
    const inserted: Row[] = []
    const client = makeClient(['ex-1'], inserted)
    const local = { 'deck-1': { 'ex-1': deferredHardRecord() } }

    const result = await syncStudyData(client, local, 'user-1')

    expect(result.error).toBeNull()
    expect(result.pushedCount).toBe(1)
    expect(inserted).toHaveLength(1)
    expect(inserted[0].interval_days).toBeCloseTo(4 / 24, 5) // NOT 0
  })
})
