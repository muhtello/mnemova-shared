import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, adminClient, adminInsertDeck, adminInsertExercise, adminDelete, anonClient, guestClient, canRun } from './rls.helpers'

const NOW = new Date().toISOString()

describe.skipIf(!canRun())('card_records RLS — authenticated', () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>
  let userB: Awaited<ReturnType<typeof createTestUser>>
  let exA = ''
  let exB = ''
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    userA = await createTestUser('cr-a')
    cleanups.unshift(userA.cleanup)
    userB = await createTestUser('cr-b')
    cleanups.unshift(userB.cleanup)

    const deckA = await adminInsertDeck(userA.userId)
    cleanups.unshift(() => adminDelete('decks', deckA))
    const deckB = await adminInsertDeck(userB.userId)
    cleanups.unshift(() => adminDelete('decks', deckB))

    exA = await adminInsertExercise(deckA)
    cleanups.unshift(() => adminDelete('exercises', exA))
    exB = await adminInsertExercise(deckB)
    cleanups.unshift(() => adminDelete('exercises', exB))

    // Seed a record for userB so SELECT-isolation tests have something to check against
    await adminClient().from('card_records').insert({
      exercise_id: exB, user_id: userB.userId,
      interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
    })
    cleanups.unshift(() =>
      adminClient().from('card_records').delete().eq('user_id', userB.userId),
    )
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it('INSERT: user can insert their own card record', async () => {
    try {
      const { error } = await userA.client.from('card_records').insert({
        exercise_id: exA, user_id: userA.userId,
        interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
      })
      expect(error).toBeNull()
    } finally {
      await adminClient().from('card_records').delete().eq('user_id', userA.userId)
    }
  })

  it("INSERT: WITH CHECK blocks inserting with another user's user_id", async () => {
    const { error } = await userA.client.from('card_records').insert({
      exercise_id: exA, user_id: userB.userId,
      interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
    })
    expect(error).not.toBeNull()
  })

  it('SELECT: user sees only rows where user_id = their own id', async () => {
    await adminClient().from('card_records').insert({
      exercise_id: exA, user_id: userA.userId,
      interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
    })
    try {
      const { data, error } = await userA.client.from('card_records').select('user_id')
      expect(error).toBeNull()
      expect((data ?? []).every((r) => r.user_id === userA.userId)).toBe(true)
    } finally {
      await adminClient().from('card_records').delete().eq('user_id', userA.userId)
    }
  })

  it("SELECT: user gets 0 rows when querying by another user's user_id", async () => {
    const { data, error } = await userA.client
      .from('card_records')
      .select('user_id')
      .eq('user_id', userB.userId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})

describe.skipIf(!canRun())('card_records RLS — anon (guest)', () => {
  let guestId: string
  let exId = ''
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    guestId = crypto.randomUUID()
    const deckId = await adminInsertDeck(guestId)
    cleanups.unshift(() => adminDelete('decks', deckId))
    exId = await adminInsertExercise(deckId)
    cleanups.unshift(() => adminDelete('exercises', exId))
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it('INSERT: guest client (matching header) can insert a record', async () => {
    try {
      const { error } = await guestClient(guestId).from('card_records').insert({
        exercise_id: exId, guest_session_id: guestId,
        interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
      })
      expect(error).toBeNull()
    } finally {
      await adminClient().from('card_records').delete().eq('guest_session_id', guestId)
    }
  })

  it('INSERT: plain anon client (no header) cannot insert — WITH CHECK blocks it', async () => {
    const { error } = await anonClient().from('card_records').insert({
      exercise_id: exId, guest_session_id: guestId,
      interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
    })
    expect(error).not.toBeNull()
  })

  it('INSERT: guest client cannot insert with null guest_session_id', async () => {
    const { error } = await guestClient(guestId).from('card_records').insert({
      exercise_id: exId, guest_session_id: null,
      interval_days: 1, due_date: NOW, last_reviewed: NOW, consecutive_same_rating: 0,
    })
    expect(error).not.toBeNull()
  })
})
