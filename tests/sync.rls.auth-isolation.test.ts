/**
 * Auth cross-user RLS isolation.
 * Verifies that authenticated user B cannot read, write, or escalate via user A's data.
 * Requires SUPABASE_SERVICE_ROLE_KEY — runs inside the same vitest integration suite.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  uid, createAuthUser, cleanAuthUser, serviceClient,
  canRunAuth, makeDeck, makeExercise,
} from './sync.helpers'

const skip = !canRunAuth()
if (skip) console.warn('Auth isolation tests skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.test')

describe.skipIf(skip)('Auth cross-user RLS isolation', () => {
  let clientA: SupabaseClient, userAId: string
  let clientB: SupabaseClient, userBId: string
  let deckAId: string, deckBId: string, exAId: string

  beforeAll(async () => {
    ;[{ client: clientA, userId: userAId }, { client: clientB, userId: userBId }] =
      await Promise.all([createAuthUser(), createAuthUser()])

    const deckA = makeDeck(userAId)
    const deckB = makeDeck(userBId)
    deckAId = deckA.id
    deckBId = deckB.id
    await Promise.all([
      clientA.from('decks').upsert(deckA, { onConflict: 'id' }),
      clientB.from('decks').upsert(deckB, { onConflict: 'id' }),
    ])

    const ex = makeExercise(deckAId)
    exAId = ex.id
    await clientA.from('exercises').upsert(ex, { onConflict: 'id' })

    await serviceClient().from('card_records').insert({
      user_id: userAId, exercise_id: exAId,
      interval_days: 1, due_date: new Date().toISOString(),
      last_reviewed: null, last_rating: null, consecutive_same_rating: 0,
    })
  })

  afterAll(async () => {
    await Promise.all([cleanAuthUser(userAId), cleanAuthUser(userBId)])
  })

  // ── Decks ─────────────────────────────────────────────────────────────────

  it('user B cannot SELECT user A deck', async () => {
    const { data } = await clientB.from('decks').select('id').eq('id', deckAId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot UPDATE user A deck', async () => {
    await clientB.from('decks').update({ title: 'Hijacked' }).eq('id', deckAId)
    const { data } = await serviceClient().from('decks').select('title').eq('id', deckAId).single()
    expect(data?.title).toBe('Test Deck')
  })

  it('user B cannot DELETE user A deck', async () => {
    await clientB.from('decks').delete().eq('id', deckAId)
    const { data } = await serviceClient().from('decks').select('id').eq('id', deckAId)
    expect(data).toHaveLength(1)
  })

  // ── Exercises ─────────────────────────────────────────────────────────────

  it('user B cannot SELECT user A exercises', async () => {
    const { data } = await clientB.from('exercises').select('id').eq('id', exAId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot DELETE user A exercise', async () => {
    await clientB.from('exercises').delete().eq('id', exAId)
    const { data } = await serviceClient().from('exercises').select('id').eq('id', exAId)
    expect(data).toHaveLength(1)
  })

  it('user B cannot reassign user A exercise to B deck (deck_id UPDATE)', async () => {
    await clientB.from('exercises').update({ deck_id: deckBId }).eq('id', exAId)
    const { data } = await serviceClient().from('exercises').select('deck_id').eq('id', exAId).single()
    expect(data?.deck_id).toBe(deckAId)
  })

  // ── card_records ──────────────────────────────────────────────────────────

  it('user B cannot SELECT user A card_records', async () => {
    const { data } = await clientB.from('card_records').select('id').eq('user_id', userAId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot UPDATE user A card_records', async () => {
    await clientB.from('card_records').update({ interval_days: 999 }).eq('exercise_id', exAId)
    const { data } = await serviceClient().from('card_records').select('interval_days').eq('exercise_id', exAId).single()
    expect(data?.interval_days).toBe(1)
  })

  // ── study_settings ────────────────────────────────────────────────────────

  it('user B cannot SELECT user A study_settings', async () => {
    const { data } = await clientB.from('study_settings').select('deck_id').eq('deck_id', deckAId)
    expect(data).toHaveLength(0)
  })

  // ── user_tiers — privilege escalation ─────────────────────────────────────

  it('user cannot self-INSERT a pro tier row (privilege escalation)', async () => {
    const { error } = await clientA.from('user_tiers').insert({ user_id: userAId, tier: 'pro' })
    expect(error).not.toBeNull()
    expect(['42501', '42P01']).toContain(error!.code)
  })

  it('user cannot UPDATE their own tier to pro', async () => {
    // Grant a 'free' tier via service role, then verify the user cannot self-upgrade it
    const admin = serviceClient()
    await admin.from('user_tiers').insert({ user_id: userAId, tier: 'free' })
    // No UPDATE policy on user_tiers — RLS silently filters to 0 rows, no error
    await clientA.from('user_tiers').update({ tier: 'pro' }).eq('user_id', userAId)
    const { data } = await admin.from('user_tiers').select('tier').eq('user_id', userAId).single()
    expect(data?.tier).toBe('free')
    await admin.from('user_tiers').delete().eq('user_id', userAId)
  })
})
