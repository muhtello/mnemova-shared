/**
 * Unit test for Phase 5 delete error surfacing in syncDecks.
 *
 * The Supabase client resolves with { error } instead of throwing, so a failed
 * delete used to slip past Promise.all and the sync reported success. This test
 * uses a mock client (no network, no secret) to prove a delete error now bubbles
 * up as syncDecks' error.
 *
 * npx vitest run tests/sync.decks.delete-errors.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncDecks } from '../src/helpers/sync/decks'

type Result = { data: unknown; error: { message: string } | null }
type Resolver = (b: MockBuilder) => Result

// Minimal chainable stand-in for the Supabase query builder. Every chain method
// returns `this`; awaiting resolves via the table-aware resolver. It's a thenable,
// matching how supabase-js builders are consumed (await builder → { data, error }).
class MockBuilder {
  method: 'select' | 'upsert' | 'update' | 'delete' = 'select'
  cols = '*'
  constructor(public table: string, private resolver: Resolver) {}
  select(cols = '*') { this.method = 'select'; this.cols = cols; return this }
  upsert() { this.method = 'upsert'; return this }
  update() { this.method = 'update'; return this }
  delete() { this.method = 'delete'; return this }
  eq() { return this }
  is() { return this }
  in() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    return Promise.resolve(this.resolver(this)).then(onF, onR)
  }
}

// deleteErrors maps a table name → error message its update/delete should return.
function makeClient(deleteErrors: Record<string, string> = {}): SupabaseClient {
  const resolver: Resolver = (b) => {
    if (b.method === 'select') {
      // Phase 5 ownership check selects 'id' from decks — return the deck as owned.
      if (b.table === 'decks' && b.cols === 'id') return { data: [{ id: 'deck-1' }], error: null }
      // Phase 1 server-state fetches — empty server.
      return { data: [], error: null }
    }
    if (b.method === 'update' || b.method === 'delete') {
      const msg = deleteErrors[b.table]
      return { data: null, error: msg ? { message: msg } : null }
    }
    return { data: null, error: null } // upsert
  }
  return { from: (table: string) => new MockBuilder(table, resolver) } as unknown as SupabaseClient
}

describe('syncDecks — Phase 5 delete errors', () => {
  it('surfaces a failed delete instead of reporting success', async () => {
    const client = makeClient({ study_settings: 'boom: settings delete failed' })
    const result = await syncDecks(client, [], ['deck-1'], 'owner-1')
    expect(result.error).toBe('boom: settings delete failed')
  })

  it('returns no error when all deletes succeed', async () => {
    const client = makeClient()
    const result = await syncDecks(client, [], ['deck-1'], 'owner-1')
    expect(result.error).toBeNull()
  })
})
