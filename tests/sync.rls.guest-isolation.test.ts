/**
 * Guest (anon) cross-session RLS isolation.
 * Verifies that a client with a forged or different x-app-guest-id header cannot
 * read, write, or delete another guest's data.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { uid, guestClient, serviceClient, canRunGuest, makeDeck, makeExercise } from './sync.helpers'

const skip = !canRunGuest()

describe.skipIf(skip)('Guest cross-session RLS isolation', () => {
  const tracked: string[] = []
  const g = () => { const id = uid(); tracked.push(id); return id }

  afterEach(async () => {
    if (!tracked.length) return
    const admin = serviceClient()
    await Promise.all(tracked.map(async (guestId) => {
      const { data: decks } = await admin.from('decks').select('id').eq('owner_id', guestId)
      const ids = (decks ?? []).map((d: { id: string }) => d.id)
      if (ids.length > 0) {
        await Promise.all([
          admin.from('exercises').delete().in('deck_id', ids),
          admin.from('study_settings').delete().in('deck_id', ids),
        ])
      }
      await Promise.all([
        admin.from('decks').delete().eq('owner_id', guestId),
        admin.from('card_records').delete().eq('guest_session_id', guestId),
        admin.from('attempt_logs').delete().eq('guest_session_id', guestId),
        admin.from('session_logs').delete().eq('guest_session_id', guestId),
      ])
    }))
    tracked.length = 0
  })

  // ── Decks ─────────────────────────────────────────────────────────────────

  it('guest B cannot UPDATE guest A deck', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    await guestClient(gB).from('decks').update({ title: 'Hijacked' }).eq('id', deck.id)
    const { data } = await guestClient(gA).from('decks').select('title').eq('id', deck.id).single()
    expect(data?.title).toBe('Test Deck')
  })

  it('guest B cannot DELETE guest A deck', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    await guestClient(gB).from('decks').delete().eq('id', deck.id)
    const { data } = await guestClient(gA).from('decks').select('id').eq('id', deck.id)
    expect(data).toHaveLength(1)
  })

  // ── Exercises ─────────────────────────────────────────────────────────────

  it('guest B cannot INSERT exercise into guest A deck', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    const { error } = await guestClient(gB).from('exercises').upsert(makeExercise(deck.id), { onConflict: 'id' })
    expect(error).not.toBeNull()
  })

  it('guest B cannot move B exercise into guest A deck (deck_id UPDATE)', async () => {
    const gA = g(), gB = g()
    const deckA = makeDeck(gA), deckB = makeDeck(gB)
    await guestClient(gA).from('decks').upsert(deckA, { onConflict: 'id' })
    await guestClient(gB).from('decks').upsert(deckB, { onConflict: 'id' })
    const ex = makeExercise(deckB.id)
    await guestClient(gB).from('exercises').upsert(ex, { onConflict: 'id' })
    await guestClient(gB).from('exercises').update({ deck_id: deckA.id }).eq('id', ex.id)
    // B can still see the exercise (it wasn't moved away from B's deck)
    const { data } = await guestClient(gB).from('exercises').select('id').eq('id', ex.id)
    expect(data).toHaveLength(1)
  })

  // ── card_records ──────────────────────────────────────────────────────────

  it('guest B cannot SELECT guest A card_records', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    const ex = makeExercise(deck.id)
    await guestClient(gA).from('exercises').upsert(ex, { onConflict: 'id' })
    await serviceClient().from('card_records').insert({
      user_id: null, guest_session_id: gA, exercise_id: ex.id,
      interval_days: 1, due_date: new Date().toISOString(),
      last_reviewed: null, last_rating: null, consecutive_same_rating: 0,
    })
    const { data } = await guestClient(gB).from('card_records').select('id').eq('guest_session_id', gA)
    expect(data).toHaveLength(0)
  })

  it('guest B cannot INSERT card_records scoped to guest A session', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    const ex = makeExercise(deck.id)
    await guestClient(gA).from('exercises').upsert(ex, { onConflict: 'id' })
    // B tries to insert a card_record claiming to belong to guest A's session
    const { error } = await guestClient(gB).from('card_records').insert({
      user_id: null, guest_session_id: gA, exercise_id: ex.id,
      interval_days: 1, due_date: new Date().toISOString(),
      last_reviewed: null, last_rating: null, consecutive_same_rating: 0,
    })
    expect(error).not.toBeNull()
  })

  // ── study_settings ────────────────────────────────────────────────────────

  it('guest B cannot SELECT guest A study_settings', async () => {
    const gA = g(), gB = g()
    const deck = makeDeck(gA)
    await guestClient(gA).from('decks').upsert(deck, { onConflict: 'id' })
    await guestClient(gA).from('study_settings').upsert({
      deck_id: deck.id, repeat_mode: 'unlimited', hard_delay_hours: 4,
      good_days: 1, easy_days: 3, interval_day_increment: 1,
      max_cards: 20, max_hard_repeats: 3, timer_enabled: false, timer_seconds: 30,
    }, { onConflict: 'deck_id' })
    const { data } = await guestClient(gB).from('study_settings').select('deck_id').eq('deck_id', deck.id)
    expect(data).toHaveLength(0)
  })

  // ── support_tickets ───────────────────────────────────────────────────────

  it('anon can INSERT support ticket but SELECT returns nothing (write-only)', async () => {
    const subject = `rls-test-${uid()}`
    const { error } = await guestClient(uid()).from('support_tickets').insert({
      user_id: 'anon-test', title: 'Bug', category: 'bug', subject,
    })
    expect(error).toBeNull()
    const { data } = await guestClient(uid()).from('support_tickets').select('id').eq('subject', subject)
    expect(data).toHaveLength(0)
    await serviceClient().from('support_tickets').delete().eq('subject', subject)
  })
})
