/**
 * Unit tests for syncSessionHistory push step.
 *
 * Verifies the batched insert: new sessions go out in ONE insert call, and a
 * failed push surfaces as the function's error instead of being swallowed.
 * Uses a mock client (no network, no secret).
 *
 * npx vitest run tests/sync.sessionHistory.push.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncSessionHistory } from '../src/helpers/sync/sessionHistory'
import type { SessionLog } from '../src/types/studyType'

type Result = { data: unknown; error: { message: string } | null }

// Records every insert payload so tests can assert it was a single batch.
class MockBuilder {
  method: 'select' | 'insert' = 'select'
  constructor(
    public table: string,
    private serverRows: unknown[],
    private insertError: string | null,
    private insertCalls: unknown[][],
  ) {}
  select() { this.method = 'select'; return this }
  insert(rows: unknown[]) { this.method = 'insert'; this.insertCalls.push(rows); return this }
  eq() { return this }
  order() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    const result: Result =
      this.method === 'insert'
        ? { data: null, error: this.insertError ? { message: this.insertError } : null }
        : { data: this.serverRows, error: null }
    return Promise.resolve(result).then(onF, onR)
  }
}

function makeClient(opts: { serverRows?: unknown[]; insertError?: string | null }) {
  const insertCalls: unknown[][] = []
  const client = {
    from: (table: string) =>
      new MockBuilder(table, opts.serverRows ?? [], opts.insertError ?? null, insertCalls),
  } as unknown as SupabaseClient
  return { client, insertCalls }
}

function makeSession(id: string): SessionLog {
  return {
    id,
    deckId: 'deck-1',
    stats: {
      total: 1, again: 0, hard: 0, good: 1, easy: 0,
      skipped: 0, avgResponseTime: 100, startTime: 1, endTime: 2,
    },
    attempts: [],
    savedAt: Date.now(),
  }
}

describe('syncSessionHistory — push', () => {
  it('pushes all new sessions in a single batched insert', async () => {
    const { client, insertCalls } = makeClient({})
    const sessions = [makeSession('a'), makeSession('b'), makeSession('c')]

    const result = await syncSessionHistory(client, sessions, 'user-1')

    expect(result.error).toBeNull()
    expect(insertCalls.length).toBe(1) // one round-trip, not three
    expect((insertCalls[0] as unknown[]).length).toBe(3)
    expect(result.syncedIds).toEqual(['a', 'b', 'c'])
  })

  it('surfaces a failed push instead of reporting success', async () => {
    const { client } = makeClient({ insertError: 'boom: insert failed' })
    const result = await syncSessionHistory(client, [makeSession('a')], 'user-1')

    expect(result.error).toBe('boom: insert failed')
    expect(result.syncedIds).toEqual([]) // atomic batch: nothing synced on error
  })

  it('skips sessions already on the server and does not insert when none are new', async () => {
    const { client, insertCalls } = makeClient({
      serverRows: [{ id: 'a', deck_id: 'deck-1', stats: {}, attempts: [], saved_at: new Date().toISOString() }],
    })
    const result = await syncSessionHistory(client, [makeSession('a')], 'user-1')

    expect(result.error).toBeNull()
    expect(insertCalls.length).toBe(0) // nothing new → no insert call at all
    expect(result.syncedIds).toEqual([])
  })
})
