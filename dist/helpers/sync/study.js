"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStudyData = syncStudyData;
// ─── Converters ───────────────────────────────────────────────────────────────
function fromCardRecordRow(row) {
    var _a;
    return {
        exerciseId: row.exercise_id, intervalDays: row.interval_days,
        dueDate: new Date(row.due_date).getTime(),
        lastReviewed: row.last_reviewed ? new Date(row.last_reviewed).getTime() : 0,
        lastRating: (_a = row.last_rating) !== null && _a !== void 0 ? _a : null,
        consecutiveSameRating: row.consecutive_same_rating,
    };
}
function toCardRecordFields(record, userId) {
    var _a;
    return {
        user_id: userId, guest_session_id: null, exercise_id: record.exerciseId,
        // interval_days is `real` in the DB, so sub-day Hard intervals
        // (hardDelayHours/24, e.g. 0.166) persist losslessly — no rounding.
        interval_days: record.intervalDays,
        due_date: new Date(record.dueDate).toISOString(),
        last_reviewed: record.lastReviewed > 0 ? new Date(record.lastReviewed).toISOString() : null,
        last_rating: (_a = record.lastRating) !== null && _a !== void 0 ? _a : null,
        consecutive_same_rating: record.consecutiveSameRating,
    };
}
// ─── syncStudyData ────────────────────────────────────────────────────────────
// Strategy: last-write-wins on last_reviewed timestamp.
// Unreviewed records (lastReviewed === 0) are never pushed — they have no study data.
// NOTE: session logs (attempt_logs) and progress resets are NOT handled here.
// The web handles them via studyActions.ts; mobile uses lib/sync.ts syncSessionLogs/syncRecordResets.
async function syncStudyData(client, localCardRecords, userId, 
// Exercise IDs whose server records were deleted by a progress reset this sync cycle.
// Prevents re-pulling reset records when the server DELETE partially failed.
pendingResetExerciseIds = []) {
    // Flatten nested deckId → exerciseId structure into a single exerciseId map
    const localFlat = {};
    for (const exercises of Object.values(localCardRecords)) {
        for (const record of Object.values(exercises)) {
            localFlat[record.exerciseId] = record;
        }
    }
    // ── 1. Fetch server state ──────────────────────────────────────────────────
    // limit(10000) overrides PostgREST's default max-rows cap so large record sets aren't truncated.
    const { data: serverRows, error: pullError } = await client
        .from('card_records').select('*').eq('user_id', userId).limit(10000);
    if (pullError)
        return { mergedFlatRecords: localFlat, error: pullError.message, pushedCount: 0, pulledCount: 0 };
    const serverMap = new Map(serverRows.map((row) => [row.exercise_id, row]));
    // ── 2. Merge local vs server — server wins when its last_reviewed is newer ──
    const mergedFlatRecords = {};
    const toInsert = [];
    const toUpdate = [];
    let pulledCount = 0;
    // A progress reset this cycle must win unconditionally. Built before the merge loop
    // so it guards BOTH paths: a reset that re-initialised the local record (lastReviewed === 0)
    // would otherwise lose to a stale server row here in step 2 (serverTs > 0); a reset that
    // deleted the local record is guarded in step 3 below. Either way, never let stale server
    // state silently undo the reset within this cycle.
    const resetIds = new Set(pendingResetExerciseIds);
    for (const record of Object.values(localFlat)) {
        if (resetIds.has(record.exerciseId)) {
            mergedFlatRecords[record.exerciseId] = record;
            continue;
        }
        const serverRow = serverMap.get(record.exerciseId);
        const serverTs = (serverRow === null || serverRow === void 0 ? void 0 : serverRow.last_reviewed) ? new Date(serverRow.last_reviewed).getTime() : 0;
        if (serverRow && serverTs > record.lastReviewed) {
            mergedFlatRecords[record.exerciseId] = fromCardRecordRow(serverRow);
            pulledCount++;
        }
        else {
            mergedFlatRecords[record.exerciseId] = record;
            if (record.lastReviewed > 0) {
                const fields = toCardRecordFields(record, userId);
                if (!serverRow)
                    toInsert.push(fields);
                // Only update when local is strictly newer — equal timestamps mean no real change
                else if (record.lastReviewed > serverTs)
                    toUpdate.push({ id: serverRow.id, fields });
            }
        }
    }
    // ── 3. Pull server-only records (studied on another device) ────────────────
    // NOTE: syncRecordResets runs before syncStudyData in runSync.ts (Step 2 → Step 3).
    // If a reset's server DELETE failed, the record would still be in serverMap. We must
    // not re-pull it, otherwise the user's progress reset would be silently undone.
    // The caller passes pendingResetExerciseIds for exactly this guard (resetIds, built above).
    for (const [exerciseId, serverRow] of serverMap) {
        if (!mergedFlatRecords[exerciseId] && !resetIds.has(exerciseId)) {
            mergedFlatRecords[exerciseId] = fromCardRecordRow(serverRow);
            pulledCount++;
        }
    }
    // ── 4. Push local winners ──────────────────────────────────────────────────
    if (toInsert.length > 0) {
        // Verify exercise IDs exist — deckRecords can outlive deleted exercises, which would
        // violate the card_records → exercises FK constraint.
        const { data: validExs } = await client
            .from('exercises').select('id').in('id', toInsert.map((r) => r.exercise_id));
        const validIds = new Set((validExs !== null && validExs !== void 0 ? validExs : []).map((e) => e.id));
        const safe = toInsert.filter((r) => validIds.has(r.exercise_id));
        if (safe.length > 0) {
            const { error } = await client.from('card_records').insert(safe);
            if (error)
                return { mergedFlatRecords: localFlat, error: error.message, pushedCount: 0, pulledCount: 0 };
        }
    }
    // BUG FIX: Supabase returns { error } per row rather than throwing — check each result
    // so pushedCount only counts rows that actually landed on the server.
    let successfulUpdates = 0;
    if (toUpdate.length > 0) {
        const results = await Promise.all(toUpdate.map(({ id, fields }) => client.from('card_records').update(fields).eq('id', id)));
        successfulUpdates = results.filter((r) => !r.error).length;
    }
    const pushedCount = toInsert.length + successfulUpdates;
    return { mergedFlatRecords, error: null, pushedCount, pulledCount };
}
