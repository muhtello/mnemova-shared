/**
 * Regression test: a legacy exercise missing `createdAt` (or with a corrupt NaN)
 * must not throw and abort the entire sync.
 *
 * Before the fix, toExerciseRow did `new Date(exercise.createdAt).toISOString()`,
 * which throws RangeError on undefined/NaN and crashes syncDecks for ALL decks.
 *
 * npx vitest run tests/sync.decks.legacy-createdAt.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { syncDecks } from '../src/helpers/sync/decks'
import type { Deck } from '../src/types/deckType'
import type { Exercise } from '../src/types/exerciseType'

type Result = { data: unknown; error: { message: string } | null }

// Minimal chainable Supabase builder stand-in. Server is empty; upserts capture
// the rows so we can assert what was written.
class MockBuilder {
  method: 'select' | 'upsert' | 'update' | 'delete' = 'select'
  constructor(public table: string, private captured: Record<string, unknown[]>) {}
  select() { this.method = 'select'; return this }
  upsert(rows: unknown) { this.method = 'upsert'; this.captured[this.table] = ([] as unknown[]).concat(rows); return this }
  update() { this.method = 'update'; return this }
  delete() { this.method = 'delete'; return this }
  eq() { return this }
  is() { return this }
  in() { return this }
  limit() { return this }
  then(onF: (r: Result) => unknown, onR?: (e: unknown) => unknown) {
    return Promise.resolve<Result>({ data: [], error: null }).then(onF, onR)
  }
}

function makeClient(captured: Record<string, unknown[]>): SupabaseClient {
  return { from: (t: string) => new MockBuilder(t, captured) } as unknown as SupabaseClient
}

// A locally-created deck holding one exercise whose createdAt is missing at runtime.
function legacyDeck(createdAt: unknown): Deck {
  const exercise = {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'flashcard', question: 'Q?', answer: 'A',
    createdAt, // intentionally undefined / NaN — bypasses the `number` type
  } as unknown as Exercise
  return {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Legacy deck', exercises: [exercise],
    createdAt: new Date(), updatedAt: new Date(),
    studySettings: undefined as never, _localStatus: 'created',
  } as unknown as Deck
}

describe('syncDecks — legacy exercise without createdAt', () => {
  it('does not throw and writes a valid ISO created_at', async () => {
    const captured: Record<string, unknown[]> = {}
    const client = makeClient(captured)

    const result = await syncDecks(client, [legacyDeck(undefined)], [], 'owner-1')

    expect(result.error).toBeNull()
    const exRow = captured['exercises']?.[0] as { created_at: string }
    expect(exRow).toBeDefined()
    // Falls back to a real timestamp instead of "Invalid Date"
    expect(Number.isNaN(new Date(exRow.created_at).getTime())).toBe(false)
  })

  it('also handles a corrupt NaN createdAt', async () => {
    const captured: Record<string, unknown[]> = {}
    const result = await syncDecks(makeClient(captured), [legacyDeck(NaN)], [], 'owner-1')
    expect(result.error).toBeNull()
    const exRow = captured['exercises']?.[0] as { created_at: string }
    expect(Number.isNaN(new Date(exRow.created_at).getTime())).toBe(false)
  })
})
