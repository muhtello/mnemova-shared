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
  // TODO: max_hard_repeats column missing — add to DB and include in toStudySettingsRow
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
  } else if (exercise.type === 'mcq') {
    properties = { options: exercise.options, answers: exercise.answers, explanation: exercise.explanation ?? null }
  }
  return {
    id: exercise.id, deck_id: deckId, type: exercise.type, question: exercise.question,
    properties, source_text: exercise.sourceText ?? null, source_range: exercise.sourceRange ?? null,
    highlight_color: exercise.highlightColor ?? null,
    created_at: new Date(exercise.createdAt).toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
  }
}

function fromStudySettingsRow(row: StudySettingsRow): StudySettings {
  return {
    repeatSettings: { mode: row.repeat_mode as RepeatMode, count: row.repeat_count ?? undefined },
    hardDelayHours: row.hard_delay_hours, goodDays: row.good_days, easyDays: row.easy_days,
    intervalDayIncrement: row.interval_day_increment, maxCards: row.max_cards,
    // TODO: maxHardRepeats not in DB schema — always falls back to default until column is added
    maxHardRepeats: DEFAULT_STUDY_SETTINGS.maxHardRepeats,
  }
}

function toStudySettingsRow(deckId: string, settings: StudySettings) {
  return {
    deck_id: deckId, repeat_mode: settings.repeatSettings.mode, repeat_count: settings.repeatSettings.count ?? null,
    hard_delay_hours: settings.hardDelayHours, good_days: settings.goodDays, easy_days: settings.easyDays,
    interval_day_increment: settings.intervalDayIncrement, max_cards: settings.maxCards,
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

  const [{ data: exerciseRows, error: exError }, { data: settingRows, error: settingError }] = await Promise.all([
    client.from('exercises').select('*').in('deck_id', emptyFilter).is('deleted_at', null),
    client.from('study_settings').select('*').in('deck_id', emptyFilter),
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
        exUpserts.push(...local.exercises.map((e) => toExerciseRow(local.id, e)))
        settingUpserts.push(toStudySettingsRow(local.id, local.studySettings))
        mergedDecks.push({ ...local, _localStatus: 'synced' })
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
        exUpserts.push(...local.exercises.map((e) => toExerciseRow(local.id, e)))
        settingUpserts.push(toStudySettingsRow(local.id, local.studySettings))
        mergedDecks.push({ ...local, _localStatus: 'synced' })
        pushedCount++
      }
      // _localStatus === 'synced' with no server record means the deck was deleted remotely — drop it.
    }
  }

  // Pull decks that exist on server but have never been seen locally
  for (const server of serverDecks) {
    if (!localById.has(server.id)) { mergedDecks.push(server); pulledCount++ }
  }

  // BUG FIX: exercises removed from a local deck are absent from exUpserts but still alive on
  // the server. Compute the set of server exercises that should be soft-deleted.
  const pushedExerciseIds = new Set(exUpserts.map((r) => r.id))
  const orphanedExIds: string[] = []
  for (const upserted of deckUpserts) {
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
    const now = new Date().toISOString()
    await Promise.all([
      client.from('exercises').update({ deleted_at: now }).in('deck_id', pendingDeletes),
      client.from('decks').update({ deleted_at: now }).in('id', pendingDeletes),
      // BUG FIX: study_settings rows were previously not cleaned up — delete them to avoid orphans
      client.from('study_settings').delete().in('deck_id', pendingDeletes),
    ])
  }

  const exercisesPushed = exUpserts.length
  const exercisesPulled = mergedDecks
    .filter((d) => !localById.has(d.id))
    .reduce((sum, d) => sum + d.exercises.length, 0)

  return { mergedDecks, error: null, pushedCount, pulledCount, conflictCount, exercisesPushed, exercisesPulled }
}
