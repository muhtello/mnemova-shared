/**
 * RLS test helpers — shared equivalent of mnemova-web/tests/rls/helpers.ts.
 * Uses stateless JWT injection so tests have no dependency on session storage.
 */
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL ?? ''
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const TEST_PASSWORD = 'MnemovaRLS_Test_2024!'

export const canRun = () => Boolean(URL && ANON_KEY && SERVICE_KEY)

export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function anonClient(): SupabaseClient {
  return createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function guestClient(guestId: string): SupabaseClient {
  return createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'x-app-guest-id': guestId } },
  })
}

export async function createTestUser(tag: string) {
  const admin = adminClient()
  const email = `rls-${tag}-${Date.now()}@example.com`

  const { data: { user }, error } = await admin.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
  })
  if (error || !user) throw new Error(`createUser failed: ${error?.message}`)

  const { data: { session }, error: signInErr } = await anonClient().auth.signInWithPassword({
    email, password: TEST_PASSWORD,
  })
  if (signInErr || !session) throw new Error(`signIn failed: ${signInErr?.message}`)

  // Stateless: JWT injected as Authorization header — no cookie/storage needed
  const client = createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  })

  return { userId: user.id, client, cleanup: () => admin.auth.admin.deleteUser(user.id) }
}

export async function adminInsertDeck(ownerId: string): Promise<string> {
  const { data, error } = await adminClient()
    .from('decks')
    .insert({ title: 'rls-test-deck', owner_id: ownerId })
    .select('id')
    .single()
  if (error || !data) throw new Error(`adminInsertDeck: ${error?.message}`)
  return data.id as string
}

export async function adminInsertExercise(deckId: string): Promise<string> {
  const { data, error } = await adminClient()
    .from('exercises')
    .insert({
      deck_id: deckId, type: 'flashcard',
      question: 'RLS test question?', properties: { answer: 'RLS test answer' },
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`adminInsertExercise: ${error?.message}`)
  return data.id as string
}

export async function adminDelete(table: string, id: string): Promise<void> {
  await adminClient().from(table).delete().eq('id', id)
}
