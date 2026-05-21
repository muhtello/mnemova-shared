"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDecks = syncDecks;
const settingType_1 = require("../../types/settingType");
// ─── Converters ───────────────────────────────────────────────────────────────
function fromExerciseRow(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const props = (_a = row.properties) !== null && _a !== void 0 ? _a : {};
    const base = {
        id: row.id, type: row.type, question: row.question,
        sourceText: (_b = row.source_text) !== null && _b !== void 0 ? _b : undefined,
        sourceRange: row.source_range,
        highlightColor: (_c = row.highlight_color) !== null && _c !== void 0 ? _c : undefined,
        createdAt: new Date(row.created_at).getTime(),
    };
    if (row.type === 'flashcard') {
        return Object.assign(Object.assign({}, base), { type: 'flashcard', answer: (_d = props.answer) !== null && _d !== void 0 ? _d : '' });
    }
    if (row.type === 'fill-in-the-blank') {
        const storedBlanks = props.blanks;
        const storedBlank = (_e = props.blank) !== null && _e !== void 0 ? _e : '';
        return Object.assign(Object.assign({}, base), { type: 'fill-in-the-blank', blank: storedBlank, blanks: storedBlanks && storedBlanks.length > 0 ? storedBlanks : undefined, explanation: (_f = props.explanation) !== null && _f !== void 0 ? _f : undefined });
    }
    if (row.type === 'word-pick') {
        const options = (_g = props.options) !== null && _g !== void 0 ? _g : [];
        let blanks = (_h = props.blanks) !== null && _h !== void 0 ? _h : [];
        // Exercises synced before `blanks` was added have blanks = [].
        // Options are always saved as [...blanks, ...distractors], so recover by
        // slicing the first N options where N = number of ___ in the question.
        if (blanks.length === 0 && options.length > 0) {
            const blankCount = Math.max(((_j = row.question.match(/_{2,}/g)) !== null && _j !== void 0 ? _j : []).length, 1);
            blanks = options.slice(0, blankCount);
        }
        return Object.assign(Object.assign({}, base), { type: 'word-pick', blanks, options, explanation: (_k = props.explanation) !== null && _k !== void 0 ? _k : undefined });
    }
    if (row.type === 'order-sentence') {
        return Object.assign(Object.assign({}, base), { type: 'order-sentence', words: (_l = props.words) !== null && _l !== void 0 ? _l : [], explanation: (_m = props.explanation) !== null && _m !== void 0 ? _m : undefined });
    }
    if (row.type === 'match') {
        return Object.assign(Object.assign({}, base), { type: 'match', pairs: (_o = props.pairs) !== null && _o !== void 0 ? _o : [], explanation: (_p = props.explanation) !== null && _p !== void 0 ? _p : undefined });
    }
    return Object.assign(Object.assign({}, base), { type: 'mcq', options: (_q = props.options) !== null && _q !== void 0 ? _q : [], answers: (_r = props.answers) !== null && _r !== void 0 ? _r : [], explanation: (_s = props.explanation) !== null && _s !== void 0 ? _s : undefined });
}
function toExerciseRow(deckId, exercise) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    let properties = {};
    if (exercise.type === 'flashcard') {
        properties = { answer: exercise.answer };
    }
    else if (exercise.type === 'fill-in-the-blank') {
        // Store both blanks[] (new) and blank (legacy) so old clients can still read the row
        const blanksArr = exercise.blanks && exercise.blanks.length > 0 ? exercise.blanks : [exercise.blank];
        properties = { blank: (_a = blanksArr[0]) !== null && _a !== void 0 ? _a : exercise.blank, blanks: blanksArr, explanation: (_b = exercise.explanation) !== null && _b !== void 0 ? _b : null };
    }
    else if (exercise.type === 'word-pick') {
        properties = { blanks: exercise.blanks, options: exercise.options, explanation: (_c = exercise.explanation) !== null && _c !== void 0 ? _c : null };
    }
    else if (exercise.type === 'order-sentence') {
        properties = { words: exercise.words, explanation: (_d = exercise.explanation) !== null && _d !== void 0 ? _d : null };
    }
    else if (exercise.type === 'match') {
        properties = { pairs: exercise.pairs, explanation: (_e = exercise.explanation) !== null && _e !== void 0 ? _e : null };
    }
    else if (exercise.type === 'mcq') {
        properties = { options: exercise.options, answers: exercise.answers, explanation: (_f = exercise.explanation) !== null && _f !== void 0 ? _f : null };
    }
    return {
        id: exercise.id, deck_id: deckId, type: exercise.type, question: exercise.question,
        properties, source_text: (_g = exercise.sourceText) !== null && _g !== void 0 ? _g : null, source_range: (_h = exercise.sourceRange) !== null && _h !== void 0 ? _h : null,
        highlight_color: (_j = exercise.highlightColor) !== null && _j !== void 0 ? _j : null,
        created_at: new Date(exercise.createdAt).toISOString(), updated_at: new Date().toISOString(), deleted_at: null,
    };
}
function fromStudySettingsRow(row) {
    var _a;
    return {
        repeatSettings: { mode: row.repeat_mode, count: (_a = row.repeat_count) !== null && _a !== void 0 ? _a : undefined },
        hardDelayHours: row.hard_delay_hours, goodDays: row.good_days, easyDays: row.easy_days,
        intervalDayIncrement: row.interval_day_increment, maxCards: row.max_cards,
        // TODO: maxHardRepeats not in DB schema — always falls back to default until column is added
        maxHardRepeats: settingType_1.DEFAULT_STUDY_SETTINGS.maxHardRepeats,
    };
}
function toStudySettingsRow(deckId, settings) {
    var _a;
    return {
        deck_id: deckId, repeat_mode: settings.repeatSettings.mode, repeat_count: (_a = settings.repeatSettings.count) !== null && _a !== void 0 ? _a : null,
        hard_delay_hours: settings.hardDelayHours, good_days: settings.goodDays, easy_days: settings.easyDays,
        interval_day_increment: settings.intervalDayIncrement, max_cards: settings.maxCards,
    };
}
function fromDeckRow(row, exercises, settings) {
    var _a;
    return {
        id: row.id, title: row.title, content: (_a = row.content) !== null && _a !== void 0 ? _a : undefined, exercises,
        createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at),
        studySettings: settings, _localStatus: 'synced',
    };
}
function toISO(date) {
    if (!date)
        return new Date().toISOString();
    return typeof date === 'string' ? date : date.toISOString();
}
function toTime(date) {
    if (!date)
        return 0;
    return typeof date === 'string' ? new Date(date).getTime() : date.getTime();
}
function isValidUUID(id) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
// ─── syncDecks ────────────────────────────────────────────────────────────────
// Strategy: last-write-wins on updatedAt.
// A local deck flagged as 'created'/'updated' is pushed if it's at least as
// recent as the server version; otherwise server wins (conflict).
// Exercises deleted from a local deck are soft-deleted on the server so pulling
// devices don't receive ghost exercises.
async function syncDecks(client, localDecks, pendingDeletes, userId) {
    // ── Phase 1: Fetch server state ─────────────────────────────────────────────
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { data: deckRows, error: deckError } = await client
        .from('decks').select('*').eq('owner_id', userId).is('deleted_at', null);
    if (deckError)
        return { mergedDecks: localDecks, error: deckError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    const deckIds = deckRows.map((r) => r.id);
    // Supabase rejects .in() with an empty array (400 error); [''] safely matches nothing.
    const emptyFilter = deckIds.length > 0 ? deckIds : [''];
    // limit(10000) overrides PostgREST's default max-rows cap (typically 1000) so large
    // exercise sets aren't silently truncated. Adjust if your dataset grows beyond this.
    const [{ data: exerciseRows, error: exError }, { data: settingRows, error: settingError }] = await Promise.all([
        client.from('exercises').select('*').in('deck_id', emptyFilter).is('deleted_at', null).limit(10000),
        client.from('study_settings').select('*').in('deck_id', emptyFilter).limit(10000),
    ]);
    if (exError)
        return { mergedDecks: localDecks, error: exError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    if (settingError)
        return { mergedDecks: localDecks, error: settingError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    // ── Phase 2: Build lookup maps ──────────────────────────────────────────────
    const exercisesByDeck = new Map();
    exerciseRows.forEach((row) => {
        if (!exercisesByDeck.has(row.deck_id))
            exercisesByDeck.set(row.deck_id, []);
        exercisesByDeck.get(row.deck_id).push(fromExerciseRow(row));
    });
    const settingsByDeck = new Map();
    settingRows.forEach((row) => settingsByDeck.set(row.deck_id, fromStudySettingsRow(row)));
    const serverDecks = deckRows.map((row) => { var _a, _b; return fromDeckRow(row, (_a = exercisesByDeck.get(row.id)) !== null && _a !== void 0 ? _a : [], (_b = settingsByDeck.get(row.id)) !== null && _b !== void 0 ? _b : Object.assign({}, settingType_1.DEFAULT_STUDY_SETTINGS)); });
    const serverById = new Map(serverDecks.map((d) => [d.id, d]));
    const localById = new Map(localDecks.map((d) => [d.id, d]));
    // ── Phase 3: Merge — last-write-wins on updatedAt ───────────────────────────
    const mergedDecks = [];
    const deckUpserts = [];
    const exUpserts = [];
    const settingUpserts = [];
    let pushedCount = 0, pulledCount = 0, conflictCount = 0;
    for (const local of localDecks) {
        if (!isValidUUID(local.id))
            continue;
        const server = serverById.get(local.id);
        const localTime = toTime((_a = local.updatedAt) !== null && _a !== void 0 ? _a : local.createdAt);
        if (server) {
            const serverTime = toTime((_b = server.updatedAt) !== null && _b !== void 0 ? _b : server.createdAt);
            // Push if local has unsaved changes and is at least as recent as server
            const localIsNewer = local._localStatus !== 'synced' && localTime >= serverTime;
            if (localIsNewer) {
                deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: (_c = local.content) !== null && _c !== void 0 ? _c : null, created_at: toISO(local.createdAt), updated_at: toISO((_d = local.updatedAt) !== null && _d !== void 0 ? _d : local.createdAt), deleted_at: null });
                // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
                const exercises = (_e = local.exercises) !== null && _e !== void 0 ? _e : [];
                exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)));
                const settings = (_f = local.studySettings) !== null && _f !== void 0 ? _f : Object.assign({}, settingType_1.DEFAULT_STUDY_SETTINGS);
                settingUpserts.push(toStudySettingsRow(local.id, settings));
                mergedDecks.push(Object.assign(Object.assign({}, local), { exercises, studySettings: settings, _localStatus: 'synced' }));
                pushedCount++;
            }
            else {
                // Server wins — local had no unsaved changes or server is strictly newer (conflict)
                if (local._localStatus !== 'synced')
                    conflictCount++;
                mergedDecks.push(server);
            }
        }
        else {
            // No server record yet — push if deck was ever created/modified locally
            if (local._localStatus !== 'synced') {
                deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: (_g = local.content) !== null && _g !== void 0 ? _g : null, created_at: toISO(local.createdAt), updated_at: toISO((_h = local.updatedAt) !== null && _h !== void 0 ? _h : local.createdAt), deleted_at: null });
                // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
                const exercises = (_j = local.exercises) !== null && _j !== void 0 ? _j : [];
                exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)));
                const settings = (_k = local.studySettings) !== null && _k !== void 0 ? _k : Object.assign({}, settingType_1.DEFAULT_STUDY_SETTINGS);
                settingUpserts.push(toStudySettingsRow(local.id, settings));
                mergedDecks.push(Object.assign(Object.assign({}, local), { exercises, studySettings: settings, _localStatus: 'synced' }));
                pushedCount++;
            }
            // _localStatus === 'synced' with no server record means the deck was deleted remotely — drop it.
        }
    }
    // Pull decks that exist on server but have never been seen locally
    for (const server of serverDecks) {
        if (!localById.has(server.id)) {
            mergedDecks.push(server);
            pulledCount++;
        }
    }
    // Soft-delete server exercises that were explicitly removed from a local deck.
    // CRITICAL GUARD: only treat absent exercises as deletions when the local deck
    // had a non-empty exercises array — an empty array could mean "exercises not yet
    // loaded into local state", not "user deleted everything". Without this guard,
    // any deck pushed with exercises: [] would wipe all its server exercises.
    const pushedExerciseIds = new Set(exUpserts.map((r) => r.id));
    const orphanedExIds = [];
    for (const upserted of deckUpserts) {
        const localDeck = localById.get(upserted.id);
        // Skip orphan detection when local exercises were empty — can't distinguish
        // "user deleted all" from "exercises not yet loaded". Exercises are never
        // orphaned by accident; at worst a genuinely-deleted exercise stays soft-live
        // until the next push that includes exercises.
        if (!(localDeck === null || localDeck === void 0 ? void 0 : localDeck.exercises) || localDeck.exercises.length === 0)
            continue;
        const serverDeck = serverById.get(upserted.id);
        if (serverDeck) {
            for (const ex of serverDeck.exercises) {
                if (!pushedExerciseIds.has(ex.id))
                    orphanedExIds.push(ex.id);
            }
        }
    }
    // ── Phase 4: Write to server ────────────────────────────────────────────────
    if (deckUpserts.length > 0) {
        const { error } = await client.from('decks').upsert(deckUpserts, { onConflict: 'id' });
        if (error)
            return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    }
    if (exUpserts.length > 0) {
        const { error } = await client.from('exercises').upsert(exUpserts, { onConflict: 'id' });
        if (error)
            return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    }
    // Soft-delete exercises that were removed from a pushed deck
    if (orphanedExIds.length > 0) {
        const { error } = await client.from('exercises').update({ deleted_at: new Date().toISOString() }).in('id', orphanedExIds);
        if (error)
            return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    }
    if (settingUpserts.length > 0) {
        const { error } = await client.from('study_settings').upsert(settingUpserts, { onConflict: 'deck_id' });
        if (error)
            return { mergedDecks: localDecks, error: error.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
    }
    // ── Phase 5: Apply pending deletes ─────────────────────────────────────────
    if (pendingDeletes.length > 0) {
        const now = new Date().toISOString();
        await Promise.all([
            client.from('exercises').update({ deleted_at: now }).in('deck_id', pendingDeletes),
            client.from('decks').update({ deleted_at: now }).in('id', pendingDeletes),
            // BUG FIX: study_settings rows were previously not cleaned up — delete them to avoid orphans
            client.from('study_settings').delete().in('deck_id', pendingDeletes),
        ]);
    }
    const exercisesPushed = exUpserts.length;
    const exercisesPulled = mergedDecks
        .filter((d) => !localById.has(d.id))
        .reduce((sum, d) => sum + d.exercises.length, 0);
    return { mergedDecks, error: null, pushedCount, pulledCount, conflictCount, exercisesPushed, exercisesPulled };
}
