import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, adminClient, adminInsertDeck, adminInsertExercise, adminDelete, canRun } from './rls.helpers'

describe.skipIf(!canRun())('exercises RLS — authenticated', () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>
  let userB: Awaited<ReturnType<typeof createTestUser>>
  let deckA = ''
  let deckB = ''
  let exA = ''
  let exB = ''
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    userA = await createTestUser('ex-a')
    cleanups.unshift(userA.cleanup)
    userB = await createTestUser('ex-b')
    cleanups.unshift(userB.cleanup)

    deckA = await adminInsertDeck(userA.userId)
    cleanups.unshift(() => adminDelete('decks', deckA))
    deckB = await adminInsertDeck(userB.userId)
    cleanups.unshift(() => adminDelete('decks', deckB))

    exA = await adminInsertExercise(deckA)
    cleanups.unshift(() => adminDelete('exercises', exA))
    exB = await adminInsertExercise(deckB)
    cleanups.unshift(() => adminDelete('exercises', exB))
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it('SELECT: user sees exercises in their own deck', async () => {
    const { data, error } = await userA.client.from('exercises').select('id').eq('id', exA)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it("SELECT: user gets 0 rows for exercises in another user's deck", async () => {
    const { data, error } = await userA.client.from('exercises').select('id').eq('id', exB)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('INSERT: user can add an exercise to their own deck', async () => {
    const { data, error } = await userA.client
      .from('exercises')
      .insert({ deck_id: deckA, type: 'flashcard', question: 'Test?', properties: { answer: 'Yes' } })
      .select('id')
      .single()
    expect(error).toBeNull()
    if (data?.id) await adminDelete('exercises', data.id)
  })

  it("INSERT: WITH CHECK blocks adding exercise to another user's deck", async () => {
    const { error } = await userA.client
      .from('exercises')
      .insert({ deck_id: deckB, type: 'flashcard', question: 'Hijack?', properties: { answer: 'No' } })
    expect(error).not.toBeNull()
  })
})

describe.skipIf(!canRun())('study_settings RLS — authenticated', () => {
  let userA: Awaited<ReturnType<typeof createTestUser>>
  let userB: Awaited<ReturnType<typeof createTestUser>>
  let deckA = ''
  let deckB = ''
  const cleanups: Array<() => Promise<unknown>> = []

  beforeAll(async () => {
    userA = await createTestUser('ss-a')
    cleanups.unshift(userA.cleanup)
    userB = await createTestUser('ss-b')
    cleanups.unshift(userB.cleanup)

    deckA = await adminInsertDeck(userA.userId)
    cleanups.unshift(() => adminDelete('decks', deckA))
    deckB = await adminInsertDeck(userB.userId)
    cleanups.unshift(() => adminDelete('decks', deckB))

    await adminClient()
      .from('study_settings')
      .insert({ deck_id: deckA, repeat_mode: 'random', repeat_count: 3 })
    cleanups.unshift(() =>
      adminClient().from('study_settings').delete().eq('deck_id', deckA),
    )

    await adminClient()
      .from('study_settings')
      .insert({ deck_id: deckB, repeat_mode: 'random', repeat_count: 3 })
    cleanups.unshift(() =>
      adminClient().from('study_settings').delete().eq('deck_id', deckB),
    )
  })

  afterAll(() => Promise.allSettled(cleanups.map((c) => c())))

  it("SELECT: user sees study_settings for their own deck", async () => {
    const { data, error } = await userA.client
      .from('study_settings')
      .select('deck_id')
      .eq('deck_id', deckA)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it("SELECT: user gets 0 rows for another user's study_settings", async () => {
    const { data, error } = await userA.client
      .from('study_settings')
      .select('deck_id')
      .eq('deck_id', deckB)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it("INSERT: user can add study_settings to their own deck", async () => {
    const tmpDeck = await adminInsertDeck(userA.userId)
    cleanups.unshift(() => adminDelete('decks', tmpDeck))
    const { error } = await userA.client
      .from('study_settings')
      .insert({ deck_id: tmpDeck, repeat_mode: 'once' })
    expect(error).toBeNull()
    cleanups.unshift(() =>
      adminClient().from('study_settings').delete().eq('deck_id', tmpDeck),
    )
  })

  it("INSERT: WITH CHECK blocks adding study_settings to another user's deck", async () => {
    const { error } = await userA.client
      .from('study_settings')
      .insert({ deck_id: deckB, repeat_mode: 'once' })
    expect(error).not.toBeNull()
  })
})
