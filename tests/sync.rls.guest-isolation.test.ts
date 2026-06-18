/**
 * Anon/guest DB access — RLS.
 *
 * Guests are local-only: they never persist study data to Supabase (only QR
 * pairing and edit sessions use the network). The `anon` role has NO policies on
 * decks/exercises/card_records/study_settings, so it is fully default-denied.
 * These tests pin that guarantee. Data is seeded via the service role (which
 * bypasses RLS) so we can prove anon cannot read or write it.
 *
 * `support_tickets` is the one exception — anon may INSERT (write-only) but not read.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { uid, guestClient, serviceClient, canRunAuth, makeDeck, makeExercise } from './sync.helpers'

const skip = !canRunAuth() // needs the service role to seed + clean up

describe.skipIf(skip)('Anon/guest DB access — RLS denial', () => {
  const ownerId = uid()
  const deck = makeDeck(ownerId)
  const exercise = makeExercise(deck.id)

  beforeAll(async () => {
    const admin = serviceClient()
    await admin.from('decks').insert(deck)
    await admin.from('exercises').insert(exercise)
    await admin.from('study_settings').insert({ deck_id: deck.id, repeat_mode: 'never' })
    await admin.from('card_records').insert({
      user_id: null, guest_session_id: ownerId, exercise_id: exercise.id,
      interval_days: 1, due_date: new Date().toISOString(),
      last_reviewed: null, last_rating: null, consecutive_same_rating: 0,
    })
  })

  afterAll(async () => {
    const admin = serviceClient()
    await Promise.all([
      admin.from('card_records').delete().eq('guest_session_id', ownerId),
      admin.from('study_settings').delete().eq('deck_id', deck.id),
      admin.from('exercises').delete().eq('deck_id', deck.id),
    ])
    await admin.from('decks').delete().eq('id', deck.id)
  })

  // A guest client passing the (now policy-less) x-app-guest-id header still gets nothing.
  const guest = () => guestClient(ownerId)

  it('cannot SELECT decks', async () => {
    const { data } = await guest().from('decks').select('id').eq('id', deck.id)
    expect(data).toHaveLength(0)
  })

  it('cannot INSERT a deck', async () => {
    const { error } = await guest().from('decks').insert(makeDeck(ownerId))
    expect(error).not.toBeNull()
  })

  it('cannot SELECT exercises', async () => {
    const { data } = await guest().from('exercises').select('id').eq('id', exercise.id)
    expect(data).toHaveLength(0)
  })

  it('cannot SELECT card_records', async () => {
    const { data } = await guest().from('card_records').select('id').eq('guest_session_id', ownerId)
    expect(data).toHaveLength(0)
  })

  it('cannot INSERT card_records', async () => {
    const { error } = await guest().from('card_records').insert({
      user_id: null, guest_session_id: ownerId, exercise_id: exercise.id,
      interval_days: 1, due_date: new Date().toISOString(),
      last_reviewed: null, last_rating: null, consecutive_same_rating: 0,
    })
    expect(error).not.toBeNull()
  })

  it('cannot SELECT study_settings', async () => {
    const { data } = await guest().from('study_settings').select('deck_id').eq('deck_id', deck.id)
    expect(data).toHaveLength(0)
  })

  // support_tickets is intentionally write-only for anon (allows unauthenticated bug reports).
  it('CAN INSERT a support ticket but cannot read it back (write-only)', async () => {
    const subject = `rls-test-${uid()}`
    const { error } = await guest().from('support_tickets').insert({
      user_id: 'anon-test', title: 'Bug', category: 'bug', subject,
    })
    expect(error).toBeNull()
    const { data } = await guest().from('support_tickets').select('id').eq('subject', subject)
    expect(data).toHaveLength(0)
    await serviceClient().from('support_tickets').delete().eq('subject', subject)
  })
})
