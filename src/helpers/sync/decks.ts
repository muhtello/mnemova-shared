import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_STUDY_SETTINGS } from '../../types/settingType'
import type { Deck } from '../../types/deckType'
import type { Exercise } from '../../types/exerciseType'
import type { StudySettings, RepeatMode } from '../../types/settingType'

// ─── Row shapes ───────────────────────────────────────────────────────────────

interface DeckRow {
  id: string; owner_id: string; title: string; content: string | null
  created_at: string; updated_at: string; deleted_at: string | null
}

interface ExerciseRow {
  id: string; deck_id: string; type: string; question: string
  properties: Record<string, unknown> | null; source_text: string | null
  source_range: unknown; highlight_color: string | null
  created_at: string; updated_at: string; deleted_at: string | null
}

interface StudySettingsRow {
  id: string; deck_id: string; repeat_mode: string; repeat_count: number | null
  hard_delay_hours: number; good_days: number; easy_days: number
  interval_day_increment: number; max_cards: number
  max_hard_repeats: number | null
  timer_enabled: boolean | null
  timer_seconds: number | null
}

// ─── Converters ───────────────────────────────────────────────────────────────

function fromExerciseRow(row: ExerciseRow): Exercise {
  const props = row.properties ?? {}
  const base = {
    id: row.id, type: row.type as any, question: row.question,
    sourceText: row.source_text ?? undefined,
    sourceRange: row.source_range as any,
    highlightColor: row.highlight_color ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  }
  if (row.type === 'flashcard') {
    return { ...base, type: 'flashcard', answer: (props.answer as string) ?? '' } as any
  }
  if (row.type === 'fill-in-the-blank') {
    const storedBlanks = props.blanks as string[] | undefined
    const storedBlank = (props.blank as string) ?? ''
    return {
      ...base, type: 'fill-in-the-blank', blank: storedBlank,
      blanks: storedBlanks && storedBlanks.length > 0 ? storedBlanks : undefined,
      explanation: (props.explanation as string) ?? undefined,
    } as any
  }
  if (row.type === 'word-pick') {
    const options = (props.options as string[]) ?? []
    let blanks = (props.blanks as string[]) ?? []
    // Exercises synced before `blanks` was added have blanks = [].
    // Options are always saved as [...blanks, ...distractors], so recover by
    // slicing the first N options where N = number of ___ in the question.
    if (blanks.length === 0 && options.length > 0) {
      const blankCount = Math.max((row.question.match(/_{2,}/g) ?? []).length, 1)
      blanks = options.slice(0, blankCount)
    }
    return { ...base, type: 'word-pick', blanks, options, explanation: (props.explanation as string) ?? undefined } as any
  }
  if (row.type === 'order-sentence') {
    return {
      ...base, type: 'order-sentence',
      words: (props.words as string[]) ?? [],
      explanation: (props.explanation as string) ?? undefined,
    } as any
  }
  return {
    ...base, type: 'mcq',
    options: (props.options as string[]) ?? [],
    answers: (props.answers as string[]) ?? [],
    explanation: (props.explanation as string) ?? undefined,
  } as any
}

function toExerciseRow(deckId: string, exercise: Exercise) {
  let properties: Record<string, unknown> = {}
  if (exercise.type === 'flashcard') {
    properties = { answer: exercise.answer }
  } else if (exercise.type === 'fill-in-the-blank') {
    // Store both blanks[] (new) and blank (legacy) so old clients can still read the row
    const blanksArr = exercise.blanks && exercise.blanks.length > 0 ? exercise.blanks : [exercise.blank]
    properties = { blank: blanksArr[0] ?? exercise.blank, blanks: blanksArr, explanation: exercise.explanation ?? null }
  } else if (exercise.type === 'word-pick') {
    properties = { blanks: exercise.blanks, options: exercise.options, explanation: exercise.explanation ?? null }
  } else if (exercise.type === 'order-sentence') {
    properties = { words: exercise.words, explanation: exercise.explanation ?? null }
  } else if (exercise.type === 'mcq') {
    properties = { options: exercise.options, answers: exercise.answers, explanation: exercise.explanation ?? null }
  }
  return {
    id: exercise.id, deck_id: deckId, type: exercise.type, question: exercise.question,
    properties, source_text: exercise.sourceText ?? null, source_range: exercise.sourceRange ?? null,
    highlight_color: exercise.highlightColor ?? null,
    created_at: msToISO(exercise.createdAt), updated_at: new Date().toISOString(), deleted_at: null,
  }
}

function fromStudySettingsRow(row: StudySettingsRow): StudySettings {
  return {
    repeatSettings: { mode: row.repeat_mode as RepeatMode, count: row.repeat_count ?? undefined },
    hardDelayHours: row.hard_delay_hours, goodDays: row.good_days, easyDays: row.easy_days,
    intervalDayIncrement: row.interval_day_increment, maxCards: row.max_cards,
    maxHardRepeats: row.max_hard_repeats ?? DEFAULT_STUDY_SETTINGS.maxHardRepeats,
    timerEnabled: row.timer_enabled ?? DEFAULT_STUDY_SETTINGS.timerEnabled,
    timerSeconds: row.timer_seconds ?? DEFAULT_STUDY_SETTINGS.timerSeconds,
  }
}

function toStudySettingsRow(deckId: string, settings: StudySettings) {
  return {
    deck_id: deckId, repeat_mode: settings.repeatSettings.mode, repeat_count: settings.repeatSettings.count ?? null,
    hard_delay_hours: settings.hardDelayHours, good_days: settings.goodDays, easy_days: settings.easyDays,
    interval_day_increment: settings.intervalDayIncrement, max_cards: settings.maxCards,
    max_hard_repeats: settings.maxHardRepeats,
    timer_enabled: settings.timerEnabled,
    timer_seconds: settings.timerSeconds,
  }
}

function fromDeckRow(row: DeckRow, exercises: Exercise[], settings: StudySettings): Deck {
  return {
    id: row.id, title: row.title, content: row.content ?? undefined, exercises,
    createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
    studySettings: settings, _localStatus: 'synced',
  }
}

function toISO(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString()
  return typeof date === 'string' ? date : date.toISOString()
}

function toTime(date: Date | string | undefined): number {
  if (!date) return 0
  return typeof date === 'string' ? new Date(date).getTime() : date.getTime()
}

// Safely convert a millisecond timestamp to ISO. Legacy exercises persisted before
// `createdAt` existed can be undefined at runtime (the type says number, but old
// local data predates it); a corrupt value can be NaN. Either would make
// new Date(x).toISOString() throw RangeError and abort the whole sync — so fall
// back to "now" instead.
function msToISO(ms: number | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return new Date().toISOString()
  return new Date(ms).toISOString()
}

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// ─── syncDecks ────────────────────────────────────────────────────────────────
// Strategy: last-write-wins on updatedAt.
// A local deck flagged as 'created'/'updated' is pushed if it's at least as
// recent as the server version; otherwise server wins (conflict).
// Exercises deleted from a local deck are soft-deleted on the server so pulling
// devices don't receive ghost exercises.

export async function syncDecks(
  client: SupabaseClient,
  localDecks: Deck[],
  pendingDeletes: string[],
  userId: string,
): Promise<{ mergedDecks: Deck[]; error: string | null; pushedCount: number; pulledCount: number; conflictCount: number; exercisesPushed: number; exercisesPulled: number }> {

  // ── Phase 1: Fetch server state ─────────────────────────────────────────────

  const { data: deckRows, error: deckError } = await client
    .from('decks').select('*').eq('owner_id', userId).is('deleted_at', null)
  if (deckError) return { mergedDecks: localDecks, error: deckError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }

  const deckIds = (deckRows as DeckRow[]).map((r) => r.id)
  // Supabase rejects .in() with an empty array (400 error); [''] safely matches nothing.
  const emptyFilter = deckIds.length > 0 ? deckIds : ['']

  // limit(10000) overrides PostgREST's default max-rows cap (typically 1000) so large
  // exercise sets aren't silently truncated. Adjust if your dataset grows beyond this.
  const [{ data: exerciseRows, error: exError }, { data: settingRows, error: settingError }] = await Promise.all([
    client.from('exercises').select('*').in('deck_id', emptyFilter).is('deleted_at', null).limit(10000),
    client.from('study_settings').select('*').in('deck_id', emptyFilter).limit(10000),
  ])
  if (exError) return { mergedDecks: localDecks, error: exError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
  if (settingError) return { mergedDecks: localDecks, error: settingError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }

  // ── Phase 2: Build lookup maps ──────────────────────────────────────────────

  const exercisesByDeck = new Map<string, Exercise[]>()
  ;(exerciseRows as ExerciseRow[]).forEach((row) => {
    if (!exercisesByDeck.has(row.deck_id)) exercisesByDeck.set(row.deck_id, [])
    exercisesByDeck.get(row.deck_id)!.push(fromExerciseRow(row))
  })
  const settingsByDeck = new Map<string, StudySettings>()
  ;(settingRows as StudySettingsRow[]).forEach((row) => settingsByDeck.set(row.deck_id, fromStudySettingsRow(row)))

  const serverDecks = (deckRows as DeckRow[]).map((row) =>
    fromDeckRow(row, exercisesByDeck.get(row.id) ?? [], settingsByDeck.get(row.id) ?? { ...DEFAULT_STUDY_SETTINGS })
  )
  const serverById = new Map(serverDecks.map((d) => [d.id, d]))
  const localById = new Map(localDecks.map((d) => [d.id, d]))
  // Decks queued for deletion are removed from localDecks but still live on the
  // server until Phase 5 soft-deletes them. Track them so the pull-back loop
  // below doesn't resurrect a deck the user just deleted.
  const pendingDeleteSet = new Set(pendingDeletes)

  // ── Phase 3: Merge — last-write-wins on updatedAt ───────────────────────────

  const mergedDecks: Deck[] = []
  const deckUpserts: DeckRow[] = []
  const exUpserts: ReturnType<typeof toExerciseRow>[] = []
  const settingUpserts: ReturnType<typeof toStudySettingsRow>[] = []
  let pushedCount = 0, pulledCount = 0, conflictCount = 0

  for (const local of localDecks) {
    if (!isValidUUID(local.id)) continue
    const server = serverById.get(local.id)
    const localTime = toTime(local.updatedAt ?? local.createdAt)

    if (server) {
      const serverTime = toTime(server.updatedAt ?? server.createdAt)
      // Push if local has unsaved changes and is at least as recent as server
      const localIsNewer = local._localStatus !== 'synced' && localTime >= serverTime
      if (localIsNewer) {
        deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: local.content ?? null, created_at: toISO(local.createdAt), updated_at: toISO(local.updatedAt ?? local.createdAt), deleted_at: null })
        // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
        const exercises = local.exercises ?? []
        exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)))
        const settings = local.studySettings ?? { ...DEFAULT_STUDY_SETTINGS }
        settingUpserts.push(toStudySettingsRow(local.id, settings))
        mergedDecks.push({ ...local, exercises, studySettings: settings, _localStatus: 'synced' })
        pushedCount++
      } else {
        // Server wins — local had no unsaved changes or server is strictly newer (conflict)
        if (local._localStatus !== 'synced') conflictCount++
        mergedDecks.push(server)
      }
    } else {
      // No server record yet — push if deck was ever created/modified locally
      if (local._localStatus !== 'synced') {
        deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: local.content ?? null, created_at: toISO(local.createdAt), updated_at: toISO(local.updatedAt ?? local.createdAt), deleted_at: null })
        // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
        const exercises = local.exercises ?? []
        exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)))
        const settings = local.studySettings ?? { ...DEFAULT_STUDY_SETTINGS }
        settingUpserts.push(toStudySettingsRow(local.id, settings))
        mergedDecks.push({ ...local, exercises, studySettings: settings, _localStatus: 'synced' })
        pushedCount++
      }
      // _localStatus === 'synced' with no server record means the deck was deleted remotely — drop it.
    }
  }

  // Pull decks that exist on server but have never been seen locally.
  // Skip decks queued for deletion — they were removed locally on purpose and
  // are about to be soft-deleted on the server in Phase 5; pulling them back
  // would resurrect the deck for one sync cycle before it finally disappears.
  for (const server of serverDecks) {
    if (pendingDeleteSet.has(server.id)) continue
    if (!localById.has(server.id)) { mergedDecks.push(server); pulledCount++ }
  }

  // Soft-delete server exercises that were explicitly removed from a local deck.
  // CRITICAL GUARD: only treat absent exercises as deletions when the local deck
  // had a non-empty exercises array — an empty array could mean "exercises not yet
  // loaded into local state", not "user deleted everything". Without this guard,
  // any deck pushed with exercises: [] would wipe all its server exercises.
  const pushedExerciseIds = new Set(exUpserts.map((r) => r.id))
  const orphanedExIds: string[] = []
  for (const upserted of deckUpserts) {
    const localDeck = localById.get(upserted.id)
    // Skip orphan detection when local exercises were empty — can't distinguish
    // "user deleted all" from "exercises not yet loaded". Exercises are never
    // orphaned by accident; at worst a genuinely-deleted exercise stays soft-live
    // until the next push that includes exercises.
    if (!localDeck?.exercises || localDeck.exercises.length === 0) continue
    const serverDeck = serverById.get(upserted.id)
    if (serverDeck) {
      for (const ex of serverDeck.exercises) {
        if (!pushedExerciseIds.has(ex.id)) orphanedExIds.push(ex.id)
      }
    }
  }

  // ── Phase 4: Write to server ────────────────────────────────────────────────

  if (deckUpserts.length > 0) {
    const { error } = await client.from('decks').upsert(deckUpserts, { onConflict: 'id' })
    if (error) return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
  }
  if (exUpserts.length > 0) {
    const { error } = await client.from('exercises').upsert(exUpserts, { onConflict: 'id' })
    if (error) return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
  }
  // Soft-delete exercises that were removed from a pushed deck
  if (orphanedExIds.length > 0) {
    const { error } = await client.from('exercises').update({ deleted_at: new Date().toISOString() }).in('id', orphanedExIds)
    if (error) return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
  }
  if (settingUpserts.length > 0) {
    const { error } = await client.from('study_settings').upsert(settingUpserts, { onConflict: 'deck_id' })
    if (error) return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
  }

  // ── Phase 5: Apply pending deletes ─────────────────────────────────────────

  if (pendingDeletes.length > 0) {
    // Defense-in-depth: only delete decks the user actually owns. RLS is the first
    // gate, but scoping in code too means a missing/broken policy — or a service-role
    // client that bypasses RLS — can't wipe another user's rows.
    const { data: ownedRows } = await client
      .from('decks').select('id').eq('owner_id', userId).in('id', pendingDeletes)
    const ownedDeckIds = (ownedRows ?? []).map((r: { id: string }) => r.id)

    if (ownedDeckIds.length > 0) {
      const now = new Date().toISOString()
      // The Supabase client resolves with { error } instead of throwing, so a failed
      // delete would slip past Promise.all silently and the caller would report a
      // successful sync while the deck stays live on the server (and gets pulled back
      // next cycle). Capture each result and surface the first error like Phase 4.
      const deleteResults = await Promise.all([
        client.from('exercises').update({ deleted_at: now }).in('deck_id', ownedDeckIds),
        client.from('decks').update({ deleted_at: now }).in('id', ownedDeckIds),
        // BUG FIX: study_settings rows were previously not cleaned up — delete them to avoid orphans
        client.from('study_settings').delete().in('deck_id', ownedDeckIds),
      ])
      const deleteError = deleteResults.find((r) => r.error)?.error
      if (deleteError) return { mergedDecks: localDecks, error: deleteError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 }
    }
  }

  const exercisesPushed = exUpserts.length
  const exercisesPulled = mergedDecks
    .filter((d) => !localById.has(d.id))
    .reduce((sum, d) => sum + d.exercises.length, 0)

  return { mergedDecks, error: null, pushedCount, pulledCount, conflictCount, exercisesPushed, exercisesPulled }
}
