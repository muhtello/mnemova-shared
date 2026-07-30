/**
 * Unit test for Phase 5 delete error surfacing in syncDecks.
 *
 * Phase 5 now calls the delete_decks_cascade RPC (atomic on the server) instead of
 * several independent REST calls. This test uses a mock client (no network, no
 * secret) to prove an RPC error still bubbles up as syncDecks' error.
 *
 * npx vitest run tests/sync.decks.delete-errors.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncDecks } from '../src/helpers/sync/decks'

type Result = { data: unknown; error: { message: string } | null }

// Minimal chainable stand-in for the Supabase query builder — Phase 1's server-state
// fetches just need an empty server response.
class MockBuilder {
  select() { return this }
  eq() { return this }
  is() { return this }
  in() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    return Promise.resolve({ data: [], error: null }).then(onF, onR)
  }
}

function makeClient(rpcError: string | null = null): SupabaseClient {
  return {
    from: () => new MockBuilder(),
    rpc: () => Promise.resolve({ data: null, error: rpcError ? { message: rpcError } : null }),
  } as unknown as SupabaseClient
}

describe('syncDecks — Phase 5 delete errors', () => {
  it('surfaces a failed delete_decks_cascade call instead of reporting success', async () => {
    const client = makeClient('boom: delete_decks_cascade failed')
    const result = await syncDecks(client, [], ['deck-1'], 'owner-1')
    expect(result.error).toBe('boom: delete_decks_cascade failed')
  })

  it('returns no error when the delete succeeds', async () => {
    const client = makeClient()
    const result = await syncDecks(client, [], ['deck-1'], 'owner-1')
    expect(result.error).toBeNull()
  })
})
