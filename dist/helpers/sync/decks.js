"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDecks = syncDecks;
const settingType_1 = require("../../types/settingType");
// ─── Converters ───────────────────────────────────────────────────────────────
function fromExerciseRow(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const props = (_a = row.properties) !== null && _a !== void 0 ? _a : {};
    const base = {
        id: row.id, type: row.type, question: row.question,
        sourceText: (_b = row.source_text) !== null && _b !== void 0 ? _b : undefined,
        sourceRange: row.source_range,
        highlightColor: (_c = row.highlight_color) !== null && _c !== void 0 ? _c : undefined,
        createdAt: new Date(row.created_at).getTime(),
    };
    if (row.type === 'flashcard') {
        return { ...base, type: 'flashcard', answer: (_d = props.answer) !== null && _d !== void 0 ? _d : '' };
    }
    if (row.type === 'fill-in-the-blank') {
        const storedBlanks = props.blanks;
        const storedBlank = (_e = props.blank) !== null && _e !== void 0 ? _e : '';
        return {
            ...base, type: 'fill-in-the-blank', blank: storedBlank,
            blanks: storedBlanks && storedBlanks.length > 0 ? storedBlanks : undefined,
            explanation: (_f = props.explanation) !== null && _f !== void 0 ? _f : undefined,
        };
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
        return { ...base, type: 'word-pick', blanks, options, explanation: (_k = props.explanation) !== null && _k !== void 0 ? _k : undefined };
    }
    if (row.type === 'order-sentence') {
        return {
            ...base, type: 'order-sentence',
            words: (_l = props.words) !== null && _l !== void 0 ? _l : [],
            explanation: (_m = props.explanation) !== null && _m !== void 0 ? _m : undefined,
        };
    }
    return {
        ...base, type: 'mcq',
        options: (_o = props.options) !== null && _o !== void 0 ? _o : [],
        answers: (_p = props.answers) !== null && _p !== void 0 ? _p : [],
        explanation: (_q = props.explanation) !== null && _q !== void 0 ? _q : undefined,
    };
}
function toExerciseRow(deckId, exercise) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
    else if (exercise.type === 'mcq') {
        properties = { options: exercise.options, answers: exercise.answers, explanation: (_e = exercise.explanation) !== null && _e !== void 0 ? _e : null };
    }
    return {
        id: exercise.id, deck_id: deckId, type: exercise.type, question: exercise.question,
        properties, source_text: (_f = exercise.sourceText) !== null && _f !== void 0 ? _f : null, source_range: (_g = exercise.sourceRange) !== null && _g !== void 0 ? _g : null,
        highlight_color: (_h = exercise.highlightColor) !== null && _h !== void 0 ? _h : null,
        created_at: msToISO(exercise.createdAt), updated_at: new Date().toISOString(), deleted_at: null,
    };
}
function fromStudySettingsRow(row) {
    var _a, _b, _c, _d;
    return {
        repeatSettings: { mode: row.repeat_mode, count: (_a = row.repeat_count) !== null && _a !== void 0 ? _a : undefined },
        hardDelayHours: row.hard_delay_hours, goodDays: row.good_days, easyDays: row.easy_days,
        intervalDayIncrement: row.interval_day_increment, maxCards: row.max_cards,
        maxHardRepeats: (_b = row.max_hard_repeats) !== null && _b !== void 0 ? _b : settingType_1.DEFAULT_STUDY_SETTINGS.maxHardRepeats,
        timerEnabled: (_c = row.timer_enabled) !== null && _c !== void 0 ? _c : settingType_1.DEFAULT_STUDY_SETTINGS.timerEnabled,
        timerSeconds: (_d = row.timer_seconds) !== null && _d !== void 0 ? _d : settingType_1.DEFAULT_STUDY_SETTINGS.timerSeconds,
    };
}
function toStudySettingsRow(deckId, settings) {
    var _a;
    return {
        deck_id: deckId, repeat_mode: settings.repeatSettings.mode, repeat_count: (_a = settings.repeatSettings.count) !== null && _a !== void 0 ? _a : null,
        hard_delay_hours: settings.hardDelayHours, good_days: settings.goodDays, easy_days: settings.easyDays,
        interval_day_increment: settings.intervalDayIncrement, max_cards: settings.maxCards,
        max_hard_repeats: settings.maxHardRepeats,
        timer_enabled: settings.timerEnabled,
        timer_seconds: settings.timerSeconds,
    };
}
function fromDeckRow(row, exercises, settings) {
    var _a, _b;
    return {
        id: row.id, title: row.title, content: (_a = row.content) !== null && _a !== void 0 ? _a : undefined, exercises,
        formatting: (_b = row.content_formatting) !== null && _b !== void 0 ? _b : undefined,
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
// Safely convert a millisecond timestamp to ISO. Legacy exercises persisted before
// `createdAt` existed can be undefined at runtime (the type says number, but old
// local data predates it); a corrupt value can be NaN. Either would make
// new Date(x).toISOString() throw RangeError and abort the whole sync — so fall
// back to "now" instead.
function msToISO(ms) {
    if (typeof ms !== 'number' || !Number.isFinite(ms))
        return new Date().toISOString();
    return new Date(ms).toISOString();
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
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
    const serverDecks = deckRows.map((row) => { var _a, _b; return fromDeckRow(row, (_a = exercisesByDeck.get(row.id)) !== null && _a !== void 0 ? _a : [], (_b = settingsByDeck.get(row.id)) !== null && _b !== void 0 ? _b : { ...settingType_1.DEFAULT_STUDY_SETTINGS }); });
    const serverById = new Map(serverDecks.map((d) => [d.id, d]));
    const localById = new Map(localDecks.map((d) => [d.id, d]));
    // Decks queued for deletion are removed from localDecks but still live on the
    // server until Phase 5 soft-deletes them. Track them so the pull-back loop
    // below doesn't resurrect a deck the user just deleted.
    const pendingDeleteSet = new Set(pendingDeletes);
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
                deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: (_c = local.content) !== null && _c !== void 0 ? _c : null, content_formatting: (_d = local.formatting) !== null && _d !== void 0 ? _d : null, created_at: toISO(local.createdAt), updated_at: toISO((_e = local.updatedAt) !== null && _e !== void 0 ? _e : local.createdAt), deleted_at: null });
                // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
                const exercises = (_f = local.exercises) !== null && _f !== void 0 ? _f : [];
                exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)));
                const settings = (_g = local.studySettings) !== null && _g !== void 0 ? _g : { ...settingType_1.DEFAULT_STUDY_SETTINGS };
                settingUpserts.push(toStudySettingsRow(local.id, settings));
                mergedDecks.push({ ...local, exercises, studySettings: settings, _localStatus: 'synced' });
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
                deckUpserts.push({ id: local.id, owner_id: userId, title: local.title, content: (_h = local.content) !== null && _h !== void 0 ? _h : null, content_formatting: (_j = local.formatting) !== null && _j !== void 0 ? _j : null, created_at: toISO(local.createdAt), updated_at: toISO((_k = local.updatedAt) !== null && _k !== void 0 ? _k : local.createdAt), deleted_at: null });
                // Guard: old persisted decks may lack exercises/studySettings (fields added later in schema)
                const exercises = (_l = local.exercises) !== null && _l !== void 0 ? _l : [];
                exUpserts.push(...exercises.map((e) => toExerciseRow(local.id, e)));
                const settings = (_m = local.studySettings) !== null && _m !== void 0 ? _m : { ...settingType_1.DEFAULT_STUDY_SETTINGS };
                settingUpserts.push(toStudySettingsRow(local.id, settings));
                mergedDecks.push({ ...local, exercises, studySettings: settings, _localStatus: 'synced' });
                pushedCount++;
            }
            // _localStatus === 'synced' with no server record means the deck was deleted remotely — drop it.
        }
    }
    // Pull decks that exist on server but have never been seen locally.
    // Skip decks queued for deletion — they were removed locally on purpose and
    // are about to be soft-deleted on the server in Phase 5; pulling them back
    // would resurrect the deck for one sync cycle before it finally disappears.
    for (const server of serverDecks) {
        if (pendingDeleteSet.has(server.id))
            continue;
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
        // Defense-in-depth: only delete decks the user actually owns. RLS is the first
        // gate, but scoping in code too means a missing/broken policy — or a service-role
        // client that bypasses RLS — can't wipe another user's rows.
        const { data: ownedRows } = await client
            .from('decks').select('id').eq('owner_id', userId).in('id', pendingDeletes);
        const ownedDeckIds = (ownedRows !== null && ownedRows !== void 0 ? ownedRows : []).map((r) => r.id);
        if (ownedDeckIds.length > 0) {
            const now = new Date().toISOString();
            // The Supabase client resolves with { error } instead of throwing, so a failed
            // delete would slip past Promise.all silently and the caller would report a
            // successful sync while the deck stays live on the server (and gets pulled back
            // next cycle). Capture each result and surface the first error like Phase 4.
            const deleteResults = await Promise.all([
                client.from('exercises').update({ deleted_at: now }).in('deck_id', ownedDeckIds),
                client.from('decks').update({ deleted_at: now }).in('id', ownedDeckIds),
                // BUG FIX: study_settings rows were previously not cleaned up — delete them to avoid orphans
                client.from('study_settings').delete().in('deck_id', ownedDeckIds),
            ]);
            const deleteError = (_o = deleteResults.find((r) => r.error)) === null || _o === void 0 ? void 0 : _o.error;
            if (deleteError)
                return { mergedDecks: localDecks, error: deleteError.message, pushedCount: 0, pulledCount: 0, conflictCount: 0, exercisesPushed: 0, exercisesPulled: 0 };
        }
    }
    const exercisesPushed = exUpserts.length;
    const exercisesPulled = mergedDecks
        .filter((d) => !localById.has(d.id))
        .reduce((sum, d) => sum + d.exercises.length, 0);
    return { mergedDecks, error: null, pushedCount, pulledCount, conflictCount, exercisesPushed, exercisesPulled };
}
