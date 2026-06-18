import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, adminClient, adminInsertDeck, adminDelete, anonClient, guestClient, canRun } from './rls.helpers'

describe.skipIf(!canRun())('decks RLS — authenticated', () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>
  let userB: Awaited<ReturnType<typeof createTestUser>>
  let deckA = ''
  let deckB = ''
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    userA = await createTestUser('dk-a')
    cleanups.unshift(userA.cleanup)
    userB = await createTestUser('dk-b')
    cleanups.unshift(userB.cleanup)

    deckA = await adminInsertDeck(userA.userId)
    cleanups.unshift(() => adminDelete('decks', deckA))
    deckB = await adminInsertDeck(userB.userId)
    cleanups.unshift(() => adminDelete('decks', deckB))
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it('SELECT: user sees their own deck', async () => {
    const { data, error } = await userA.client.from('decks').select('id').eq('id', deckA)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it("SELECT: user gets 0 rows for another user's deck (RLS hides row, no error)", async () => {
    const { data, error } = await userA.client.from('decks').select('id').eq('id', deckB)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('INSERT: user can create a deck with their own owner_id', async () => {
    const { data, error } = await userA.client
      .from('decks')
      .insert({ title: 'user-a-new-deck', owner_id: userA.userId })
      .select('id')
      .single()
    expect(error).toBeNull()
    if (data?.id) await adminDelete('decks', data.id)
  })

  it("INSERT: WITH CHECK (42501) blocks inserting deck with another user's owner_id", async () => {
    const { error } = await userA.client
      .from('decks')
      .insert({ title: 'hijacked', owner_id: userB.userId })
    expect(error).not.toBeNull()
    expect(error?.code).toBe('42501')
  })

  it('UPDATE: user can update their own deck', async () => {
    const { error } = await userA.client
      .from('decks')
      .update({ title: 'updated-by-owner' })
      .eq('id', deckA)
    expect(error).toBeNull()
  })

  it("UPDATE: silently skips another user's deck (RLS hides row → 0 rows affected)", async () => {
    await userA.client.from('decks').update({ title: 'hijacked' }).eq('id', deckB)
    const { data } = await adminClient().from('decks').select('title').eq('id', deckB).single()
    expect(data?.title).not.toBe('hijacked')
  })

  it('DELETE: user can soft-delete their own deck (set deleted_at)', async () => {
    const tmpDeck = await adminInsertDeck(userA.userId)
    const { error } = await userA.client
      .from('decks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tmpDeck)
    expect(error).toBeNull()
    await adminDelete('decks', tmpDeck)
  })
})

// Guests are local-only: the `anon` role has NO policies on `decks`, so it is
// fully default-denied (no read, no write). These tests pin that guarantee.
describe.skipIf(!canRun())('decks RLS — anon/guest fully denied', () => {
  let guestDeckId = ''
  const guestOwnerId = crypto.randomUUID()
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    // Seed a deck via the service role so we can prove anon cannot read it.
    guestDeckId = await adminInsertDeck(guestOwnerId)
    cleanups.push(() => adminDelete('decks', guestDeckId))
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it('SELECT: guest client (with header) gets 0 rows', async () => {
    const { data, error } = await guestClient(guestOwnerId).from('decks').select('id').eq('id', guestDeckId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('SELECT: plain anon client (no header) gets 0 rows', async () => {
    const { data, error } = await anonClient().from('decks').select('id').eq('id', guestDeckId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('INSERT: guest client cannot insert a deck', async () => {
    const { error } = await guestClient(guestOwnerId)
      .from('decks')
      .insert({ title: 'guest-new-deck', owner_id: guestOwnerId })
    expect(error).not.toBeNull()
  })
})
