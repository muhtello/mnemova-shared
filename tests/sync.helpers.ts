import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export const canRunGuest = () => Boolean(SUPABASE_URL && ANON_KEY)
export const canRunAuth = () => canRunGuest() && Boolean(SERVICE_KEY)

export function uid(): string {
  return randomUUID()
}

/** Anon client that injects the x-app-guest-id header required by guest RLS policies. */
export function guestClient(guestId: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { 'x-app-guest-id': guestId } },
    auth: { persistSession: false },
  })
}

/** Service-role client — bypasses RLS. Used for test setup/teardown only. */
export function serviceClient(): SupabaseClient {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function makeDeck(ownerId: string, id = uid()) {
  return {
    id,
    owner_id: ownerId,
    title: 'Test Deck',
    content: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }
}

export function makeExercise(deckId: string, id = uid()) {
  return {
    id,
    deck_id: deckId,
    type: 'flashcard',
    question: 'What is the test?',
    properties: { answer: 'It passes.' },
    source_text: null,
    source_range: null,
    highlight_color: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }
}

/** Create a real auth user and return a signed-in client + userId. Requires service role. */
export async function createAuthUser(): Promise<{ client: SupabaseClient; userId: string }> {
  const admin = serviceClient()
  const email = `test-sync-${uid()}@test.mnemova.dev`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'Test1234!',
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`)

  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: 'Test1234!' })
  if (signInErr) throw new Error(`signIn failed: ${signInErr.message}`)

  return { client, userId: data.user.id }
}

/** Remove all test data for a guest and their decks/exercises. */
export async function cleanGuest(guestId: string): Promise<void> {
  if (!SERVICE_KEY) return // skip cleanup silently — unique IDs prevent cross-test contamination
  const admin = serviceClient()
  const { data: decks } = await admin.from('decks').select('id').eq('owner_id', guestId)
  const ids = (decks ?? []).map((d: { id: string }) => d.id)
  if (ids.length > 0) {
    await Promise.all([
      admin.from('exercises').delete().in('deck_id', ids),
      admin.from('study_settings').delete().in('deck_id', ids),
    ])
  }
  // Guests are local-only — they never persist study rows to the DB, so the only
  // guest data to clean is decks seeded by the RLS tests via the service role.
  await admin.from('decks').delete().eq('owner_id', guestId)
}

/** Remove all test data for an auth user and delete the account. */
export async function cleanAuthUser(userId: string): Promise<void> {
  const admin = serviceClient()
  const { data: decks } = await admin.from('decks').select('id').eq('owner_id', userId)
  const ids = (decks ?? []).map((d: { id: string }) => d.id)
  if (ids.length > 0) {
    await Promise.all([
      admin.from('exercises').delete().in('deck_id', ids),
      admin.from('study_settings').delete().in('deck_id', ids),
    ])
  }
  await Promise.all([
    admin.from('decks').delete().eq('owner_id', userId),
    admin.from('user_tiers').delete().eq('user_id', userId),
    admin.from('attempt_logs').delete().eq('user_id', userId),
    admin.from('session_logs').delete().eq('user_id', userId),
    admin.from('card_records').delete().eq('user_id', userId),
  ])
  await admin.auth.admin.deleteUser(userId)
}
