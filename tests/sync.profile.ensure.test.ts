/**
 * Unit tests for ensureProfile error handling (Bug #6).
 *
 * The profile row is upserted before the read, so a read error means a real
 * failure — not a new/empty user. ensureProfile must NOT swallow it and return
 * a default "empty" profile: that would force re-onboarding and let the edit
 * form overwrite real data with blanks. It must throw instead.
 * Uses a mock client (no network, no secret).
 *
 * npx vitest run tests/sync.profile.ensure.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ensureProfile } from '../src/helpers/sync/profile'

type Row = Record<string, unknown>
interface Opts { row?: Row | null; readError?: { message: string } | null; upsertError?: { message: string } | null }

// Builder: `from().upsert()` is awaited directly (thenable → { error }); the
// read path is `from().select().eq().single()` (resolves { data, error }).
class MockBuilder {
  constructor(private opts: Opts) {}
  upsert() { return this }
  select() { return this }
  eq() { return this }
  single() {
    return Promise.resolve({ data: this.opts.row ?? null, error: this.opts.readError ?? null })
  }
  then(onF: (r: { error: unknown }) => unknown, onR?: (e: unknown) => unknown) {
    return Promise.resolve({ error: this.opts.upsertError ?? null }).then(onF, onR)
  }
}

function makeClient(opts: Opts) {
  return { from: () => new MockBuilder(opts) } as unknown as SupabaseClient
}

const fullRow: Row = {
  first_name: 'Ada', last_name: 'Lovelace',
  phone: '123', country: 'United Kingdom', avatar_url: 'a.png', birth_date: '1990-01-01',
  daily_goal_cards: 30, preferred_study_time: 'morning',
}

describe('ensureProfile', () => {
  it('returns a complete profile for an existing user', async () => {
    const client = makeClient({ row: fullRow })
    const profile = await ensureProfile(client, 'user-1', 'ada@x.com')

    expect(profile.isComplete).toBe(true)
    expect(profile.firstName).toBe('Ada')
    expect(profile.dailyGoalCards).toBe(30)
  })

  it('returns an incomplete (not empty) profile for a new user with null name fields', async () => {
    const newRow: Row = {
      first_name: null, last_name: null, phone: null,
      avatar_url: null, birth_date: null, daily_goal_cards: null, preferred_study_time: null,
    }
    const client = makeClient({ row: newRow })
    const profile = await ensureProfile(client, 'user-1', 'new@x.com')

    expect(profile.isComplete).toBe(false)
    expect(profile.firstName).toBe('')
    expect(profile.dailyGoalCards).toBe(20) // sensible default, not an error signal
  })

  it('is incomplete when name + phone are set but country is missing', async () => {
    const noCountry: Row = { ...fullRow, country: null }
    const client = makeClient({ row: noCountry })
    const profile = await ensureProfile(client, 'user-1', 'ada@x.com')

    expect(profile.isComplete).toBe(false)
    expect(profile.country).toBe('')
  })

  it('throws on a read failure instead of returning an empty profile', async () => {
    const client = makeClient({ row: null, readError: { message: 'timeout' } })
    await expect(ensureProfile(client, 'user-1', 'ada@x.com')).rejects.toThrow(/failed to load profile/)
  })

  it('throws on an upsert failure instead of proceeding', async () => {
    const client = makeClient({ upsertError: { message: 'rls denied' } })
    await expect(ensureProfile(client, 'user-1', 'ada@x.com')).rejects.toThrow(/failed to create profile row/)
  })
})
