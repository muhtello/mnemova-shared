/**
 * Integration tests for sync RLS policies.
 * Requires a running Supabase project — configure .env.test (see .env.test.example).
 *
 * npm run test:integration   — run only these tests
 * npm test                   — unit tests only (excludes this file)
 */
import { describe, it, expect, afterEach } from 'vitest'
import {
  uid, guestClient, createAuthUser, serviceClient,
  cleanGuest, cleanAuthUser, canRunGuest, canRunAuth,
  makeDeck, makeExercise,
} from './sync.helpers'

const skipGuest = !canRunGuest()
const skipAuth = !canRunAuth()
if (skipGuest) console.warn('Guest tests skipped — set SUPABASE_URL + SUPABASE_ANON_KEY in .env.test')
if (skipAuth) console.warn('Auth tests skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.test')

// ─── Guest / Anon ─────────────────────────────────────────────────────────────

describe.skipIf(skipGuest)('Guest sync — RLS', () => {
  let guestId = ''
  afterEach(async () => { if (guestId) await cleanGuest(guestId); guestId = '' })

  it('upserts an existing deck without RLS error (the main sync fix)', async () => {
    guestId = uid()
    const client = guestClient(guestId)
    const deck = makeDeck(guestId)

    const { error: e1 } = await client.from('decks').upsert(deck, { onConflict: 'id' })
    expect(e1, `first insert: ${e1?.message}`).toBeNull()

    const { error: e2 } = await client.from('decks').upsert(
      { ...deck, title: 'Re-synced', updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    expect(e2, `re-upsert: ${e2?.message}`).toBeNull()
  })

  it('upserts existing exercises without RLS error', async () => {
    guestId = uid()
    const client = guestClient(guestId)
    const deck = makeDeck(guestId)
    await client.from('decks').upsert(deck, { onConflict: 'id' })
    const ex = makeExercise(deck.id)

    const { error: e1 } = await client.from('exercises').upsert(ex, { onConflict: 'id' })
    expect(e1, `first insert: ${e1?.message}`).toBeNull()

    const { error: e2 } = await client.from('exercises').upsert(
      { ...ex, question: 'Updated question?', updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    expect(e2, `re-upsert: ${e2?.message}`).toBeNull()
  })

  it('blocks creating a 4th deck — free limit still enforced', async () => {
    guestId = uid()
    const client = guestClient(guestId)

    for (let i = 0; i < 3; i++) {
      const { error } = await client.from('decks').upsert(makeDeck(guestId), { onConflict: 'id' })
      expect(error, `deck ${i + 1}: ${error?.message}`).toBeNull()
    }

    const { error } = await client.from('decks').upsert(makeDeck(guestId), { onConflict: 'id' })
    expect(error).not.toBeNull()
    expect(error!.code).toBe('42501')
  })

  it('guest A cannot read guest B decks (cross-session isolation)', async () => {
    guestId = uid()
    const guestBId = uid()
    const deck = makeDeck(guestId)

    await guestClient(guestId).from('decks').upsert(deck, { onConflict: 'id' })

    const { data } = await guestClient(guestBId).from('decks').select('id').eq('id', deck.id)
    expect(data).toHaveLength(0)
  })

  it('guest cannot read another guest attempt_logs (anon_all isolation fix)', async () => {
    guestId = uid()
    const guestBId = uid()
    const client = guestClient(guestId)
    const deck = makeDeck(guestId)
    await client.from('decks').upsert(deck, { onConflict: 'id' })
    const ex = makeExercise(deck.id)
    await client.from('exercises').upsert(ex, { onConflict: 'id' })
    await client.from('attempt_logs').insert({
      guest_session_id: guestId, exercise_id: ex.id, rating: 'good', response_time: 500,
    })

    const { data } = await guestClient(guestBId)
      .from('attempt_logs').select('*').eq('guest_session_id', guestId)
    expect(data).toHaveLength(0)
  })
})

// ─── Auth / Authenticated ─────────────────────────────────────────────────────

describe.skipIf(skipAuth)('Auth sync — RLS', () => {
  let userId = ''
  afterEach(async () => { if (userId) await cleanAuthUser(userId); userId = '' })

  it('upserts an existing deck without RLS error', async () => {
    const { client, userId: id } = await createAuthUser()
    userId = id
    const deck = makeDeck(userId)

    const { error: e1 } = await client.from('decks').upsert(deck, { onConflict: 'id' })
    expect(e1, `first insert: ${e1?.message}`).toBeNull()

    const { error: e2 } = await client.from('decks').upsert(
      { ...deck, title: 'Re-synced', updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    expect(e2, `re-upsert: ${e2?.message}`).toBeNull()
  })

  it('upserts existing exercises without RLS error', async () => {
    const { client, userId: id } = await createAuthUser()
    userId = id
    const deck = makeDeck(userId)
    await client.from('decks').upsert(deck, { onConflict: 'id' })
    const ex = makeExercise(deck.id)

    const { error: e1 } = await client.from('exercises').upsert(ex, { onConflict: 'id' })
    expect(e1, `first insert: ${e1?.message}`).toBeNull()

    const { error: e2 } = await client.from('exercises').upsert(
      { ...ex, question: 'Updated?', updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    expect(e2, `re-upsert: ${e2?.message}`).toBeNull()
  })

  it('blocks 4th new deck but allows upsert of existing 3rd', async () => {
    const { client, userId: id } = await createAuthUser()
    userId = id
    const decks = [makeDeck(userId), makeDeck(userId), makeDeck(userId)]

    for (const d of decks) {
      const { error } = await client.from('decks').upsert(d, { onConflict: 'id' })
      expect(error, `insert: ${error?.message}`).toBeNull()
    }

    const { error: blocked } = await client.from('decks').upsert(makeDeck(userId), { onConflict: 'id' })
    expect(blocked, 'should be blocked').not.toBeNull()
    expect(blocked!.code).toBe('42501')

    // Re-syncing the 3rd deck must pass even though user is at the limit
    const { error: allowed } = await client.from('decks').upsert(
      { ...decks[2], title: 'Re-synced at limit', updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    expect(allowed, `re-upsert at limit: ${allowed?.message}`).toBeNull()
  })

  it('pro user can create more than 3 decks', async () => {
    const { client, userId: id } = await createAuthUser()
    userId = id
    await serviceClient().from('user_tiers').insert({ user_id: userId, tier: 'pro' })

    for (let i = 0; i < 4; i++) {
      const { error } = await client.from('decks').upsert(makeDeck(userId), { onConflict: 'id' })
      expect(error, `deck ${i + 1}: ${error?.message}`).toBeNull()
    }
  })
})
