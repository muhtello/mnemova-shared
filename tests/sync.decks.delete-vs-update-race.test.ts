/**
 * Regression test: a device deletes a deck while a second device has an older,
 * already-synced-at-the-time local copy and later pushes an edit that predates
 * the delete.
 *
 * Bug: Phase 1 only fetches decks with deleted_at is null, so a soft-deleted
 * deck is indistinguishable from one that never existed. The second device's
 * push then falls into the "no server record — push as new" branch and
 * recreates the deck, silently undoing the first device's delete.
 *
 * Fix: fetch tombstones (deleted_at) for local decks missing an active server
 * counterpart. If the tombstone is at/after the local device's last known
 * edit, honor the delete instead of resurrecting it.
 *
 * npx vitest run tests/sync.decks.delete-vs-update-race.test.ts
 */
import { describe, it, expect, afterEach } from 'vitest'
import { syncDecks } from '../src/helpers/sync/decks'
import { uid, serviceClient, makeDeck, canRunAuth, cleanGuest } from './sync.helpers'
import type { Deck } from '../src/types/deckType'
import { DEFAULT_STUDY_SETTINGS } from '../src/types/settingType'

const skip = !canRunAuth()
if (skip) console.warn('Delete-vs-update race test skipped — set SUPABASE_SERVICE_ROLE_KEY in .env.test')

describe.skipIf(skip)('syncDecks — delete vs. stale update race', () => {
  let owner = ''
  afterEach(async () => {
    if (owner) await cleanGuest(owner)
    owner = ''
  })

  it('does not resurrect a deck deleted by another device when the local edit predates the delete', async () => {
    owner = uid()
    const admin = serviceClient()

    // Deck already exists on the server (previously synced by both devices).
    const deck = makeDeck(owner)
    await admin.from('decks').insert(deck)
    await admin.from('study_settings').insert({ deck_id: deck.id, repeat_mode: 'never' })

    // Device A deletes it.
    const deleteResult = await syncDecks(admin, [], [deck.id], owner)
    expect(deleteResult.error).toBeNull()

    // Device B still has its old local copy, edited before the delete happened,
    // and pushes that edit having never seen the delete.
    const staleLocal: Deck = {
      id: deck.id,
      title: 'Edited on device B',
      content: 'stale edit',
      exercises: [],
      createdAt: new Date(deck.created_at),
      updatedAt: new Date(Date.now() - 60_000), // edited a minute before this sync — before the delete
      studySettings: { ...DEFAULT_STUDY_SETTINGS },
      _localStatus: 'updated',
    }
    const result = await syncDecks(admin, [staleLocal], [], owner)
    expect(result.error).toBeNull()

    // The deck must NOT be resurrected locally or on the server.
    expect(result.mergedDecks.some((d) => d.id === deck.id)).toBe(false)
    const { data: row } = await admin
      .from('decks').select('deleted_at').eq('id', deck.id).single()
    expect(row?.deleted_at, 'deck should remain soft-deleted on server').not.toBeNull()
  })

  it('recreates a deck when the local edit is newer than the remote delete', async () => {
    owner = uid()
    const admin = serviceClient()

    const deck = makeDeck(owner)
    await admin.from('decks').insert(deck)
    await admin.from('study_settings').insert({ deck_id: deck.id, repeat_mode: 'never' })

    // Device A deletes it.
    const deleteResult = await syncDecks(admin, [], [deck.id], owner)
    expect(deleteResult.error).toBeNull()

    // Device B edits it AFTER the delete (from B's perspective it never saw
    // the delete and made a genuinely newer change) — intended LWW outcome
    // is to recreate the deck.
    const freshLocal: Deck = {
      id: deck.id,
      title: 'Edited after delete on device B',
      content: 'fresh edit',
      exercises: [],
      createdAt: new Date(deck.created_at),
      updatedAt: new Date(Date.now() + 60_000), // newer than the tombstone
      studySettings: { ...DEFAULT_STUDY_SETTINGS },
      _localStatus: 'updated',
    }
    const result = await syncDecks(admin, [freshLocal], [], owner)
    expect(result.error).toBeNull()
    expect(result.mergedDecks.some((d) => d.id === deck.id)).toBe(true)

    const { data: row } = await admin
      .from('decks').select('deleted_at').eq('id', deck.id).single()
    expect(row?.deleted_at, 'deck should be recreated (undeleted) on server').toBeNull()
  })
})
