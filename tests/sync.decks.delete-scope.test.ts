/**
 * Regression test for owner-scoped deletes in syncDecks (Phase 5 pendingDeletes).
 *
 * Threat model: syncDecks may run with a service-role client (RLS bypassed). A
 * pendingDeletes array containing a foreign deck id must NOT delete that deck.
 * The fix scopes deletes to decks the caller actually owns; this test proves it
 * by using a service client (no RLS net) and a foreign-owned deck.
 *
 * npx vitest run tests/sync.decks.delete-scope.test.ts
 */
import { describe, it, expect, afterEach } from 'vitest'
import { syncDecks } from '../src/helpers/sync/decks'
import {
  uid, serviceClient, makeDeck, makeExercise, canRunAuth, cleanGuest,
} from './sync.helpers'

const skip = !canRunAuth()
if (skip) console.warn('Delete-scope test skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.test')

describe.skipIf(skip)('syncDecks — owner-scoped deletes', () => {
  let ownerA = ''
  let ownerB = ''
  afterEach(async () => {
    if (ownerA) await cleanGuest(ownerA)
    if (ownerB) await cleanGuest(ownerB)
    ownerA = ''; ownerB = ''
  })

  it('does not delete a deck owned by another user, even via service-role client', async () => {
    ownerA = uid()
    ownerB = uid()
    const admin = serviceClient()

    const deckA = makeDeck(ownerA)
    const deckB = makeDeck(ownerB)
    await admin.from('decks').insert([deckA, deckB])
    // Give B an exercise + settings to confirm child rows survive too
    const exB = makeExercise(deckB.id)
    await admin.from('exercises').insert(exB)
    await admin.from('study_settings').insert({ deck_id: deckB.id, repeat_mode: 'never' })

    // Run sync as ownerA, but maliciously/buggily ask to delete BOTH decks.
    const result = await syncDecks(admin, [], [deckA.id, deckB.id], ownerA)
    expect(result.error).toBeNull()

    // A's own deck IS soft-deleted (positive path)
    const { data: rowA } = await admin
      .from('decks').select('deleted_at').eq('id', deckA.id).single()
    expect(rowA?.deleted_at, 'owner A deck should be deleted').not.toBeNull()

    // B's deck is untouched (the fix)
    const { data: rowB } = await admin
      .from('decks').select('deleted_at').eq('id', deckB.id).single()
    expect(rowB?.deleted_at, 'foreign deck must NOT be deleted').toBeNull()

    // B's child rows untouched too
    const { data: exRowB } = await admin
      .from('exercises').select('deleted_at').eq('id', exB.id).single()
    expect(exRowB?.deleted_at, 'foreign exercise must NOT be deleted').toBeNull()

    const { data: settingsB } = await admin
      .from('study_settings').select('deck_id').eq('deck_id', deckB.id)
    expect(settingsB, 'foreign settings must NOT be deleted').toHaveLength(1)
  })
})
