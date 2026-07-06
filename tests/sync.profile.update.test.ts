/**
 * Unit tests for updateProfile partial-failure handling (Bug #7).
 *
 * profiles is the source of truth and is written first; the auth user_metadata
 * mirror is best-effort. A mirror failure must NOT be reported as a failed save
 * (error) — it returns as a non-fatal metadataWarning so the caller still shows
 * success and refreshes, while flagging that cached UI fields may lag.
 * Uses a mock client (no network, no secret).
 *
 * npx vitest run tests/sync.profile.update.test.ts
 */
import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { updateProfile } from '../src/helpers/sync/profile'
import type { ProfileUpdate } from '../src/helpers/sync/profile'

type Err = { message: string } | null
interface Opts { profileError?: Err; metaError?: Err }

// `from('profiles').update().eq()` is awaited (thenable → { error: profileError });
// `auth.updateUser()` resolves { error: metaError }.
class ProfileBuilder {
  constructor(private opts: Opts) {}
  update() { return this }
  eq() { return this }
  then(onF: (r: { error: Err }) => unknown, onR?: (e: unknown) => unknown) {
    return Promise.resolve({ error: this.opts.profileError ?? null }).then(onF, onR)
  }
}

function makeClient(opts: Opts) {
  return {
    from: () => new ProfileBuilder(opts),
    auth: { updateUser: () => Promise.resolve({ error: opts.metaError ?? null }) },
  } as unknown as SupabaseClient
}

const update: ProfileUpdate = { firstName: 'Ada', lastName: 'Lovelace', phone: '123', country: 'United Kingdom' }

describe('updateProfile', () => {
  it('returns no error and no warning on full success', async () => {
    const result = await updateProfile(makeClient({}), 'user-1', update)
    expect(result.error).toBeNull()
    expect(result.metadataWarning).toBeNull()
  })

  it('returns a hard error (and no warning) when the profiles write fails', async () => {
    const result = await updateProfile(makeClient({ profileError: { message: 'rls denied' } }), 'user-1', update)
    expect(result.error).toBe('rls denied')
    expect(result.metadataWarning).toBeNull()
  })

  it('returns a non-fatal warning (not an error) when only the metadata mirror fails', async () => {
    const result = await updateProfile(makeClient({ metaError: { message: 'auth timeout' } }), 'user-1', update)
    expect(result.error).toBeNull() // profile DID save
    expect(result.metadataWarning).toBe('auth timeout')
  })
})
