/**
 * Regression test: deleting a deck must not resurrect it for one sync cycle.
 *
 * Bug: on delete, the deck is removed from localDecks and its id queued in
 * pendingDeletes. syncDecks fetched the still-live server deck (Phase 1) and the
 * pull-back loop (Phase 3) re-added it to mergedDecks because it was no longer in
 * localById — restoring it locally — while Phase 5 soft-deleted it on the server.
 * Net: sync #1 restored the deck, sync #2 finally dropped it.
 *
 * Fix: the pull-back loop skips ids in pendingDeletes, so a just-deleted deck is
 * never resurrected.
 *
 * npx vitest run tests/sync.decks.delete-resurrect.test.ts
 */
import { describe, it, expect, afterEach } from 'vitest'
import { syncDecks } from '../src/helpers/sync/decks'
import { uid, serviceClient, makeDeck, canRunAuth, cleanGuest } from './sync.helpers'

const skip = !canRunAuth()
if (skip) console.warn('Delete-resurrect test skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.test')

describe.skipIf(skip)('syncDecks — deleted deck is not resurrected', () => {
  let owner = ''
  afterEach(async () => {
    if (owner) await cleanGuest(owner)
    owner = ''
  })

  it('does not return a pending-deleted deck in mergedDecks', async () => {
    owner = uid()
    const admin = serviceClient()

    // Deck already exists on the server (previously synced).
    const deck = makeDeck(owner)
    await admin.from('decks').insert(deck)
    await admin.from('study_settings').insert({ deck_id: deck.id, repeat_mode: 'never' })

    // User deletes it: gone from localDecks, id queued in pendingDeletes.
    const result = await syncDecks(admin, [], [deck.id], owner)
    expect(result.error).toBeNull()

    // The deck must NOT come back in the merged (local) result.
    expect(result.mergedDecks.some((d) => d.id === deck.id)).toBe(false)
    expect(result.pulledCount).toBe(0)

    // And it is soft-deleted on the server.
    const { data: row } = await admin
      .from('decks').select('deleted_at').eq('id', deck.id).single()
    expect(row?.deleted_at, 'deck should be soft-deleted on server').not.toBeNull()
  })
})
