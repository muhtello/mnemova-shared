"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExerciseStats = getExerciseStats;
exports.getDeckStats = getDeckStats;
/** intervalDays >= this threshold → exercise is considered "mastered" */
const MASTERY_THRESHOLD_DAYS = 21;
function resolveStatus(record) {
    if (!record || record.lastReviewed === 0)
        return "new";
    if (record.intervalDays >= MASTERY_THRESHOLD_DAYS)
        return "mastered";
    if (record.dueDate <= Date.now())
        return "due";
    return "upcoming";
}
function computeMasteryScore(record) {
    if (!record || record.lastReviewed === 0)
        return 0;
    return Math.min(100, Math.round((record.intervalDays / MASTERY_THRESHOLD_DAYS) * 100));
}
function truncatePreview(question) {
    const text = question.trim();
    return text.length > 60 ? text.slice(0, 60) + "…" : text;
}
/**
 * Returns stats for a single exercise given its persisted CardRecord.
 * Pass `undefined` for record if the exercise has never been reviewed.
 */
function getExerciseStats(exercise, record) {
    var _a, _b, _c, _d;
    return {
        exerciseId: exercise.id,
        type: exercise.type,
        preview: truncatePreview(exercise.question),
        status: resolveStatus(record),
        intervalDays: (_a = record === null || record === void 0 ? void 0 : record.intervalDays) !== null && _a !== void 0 ? _a : 1,
        dueDate: (_b = record === null || record === void 0 ? void 0 : record.dueDate) !== null && _b !== void 0 ? _b : 0,
        lastReviewed: (_c = record === null || record === void 0 ? void 0 : record.lastReviewed) !== null && _c !== void 0 ? _c : 0,
        lastRating: (_d = record === null || record === void 0 ? void 0 : record.lastRating) !== null && _d !== void 0 ? _d : null,
        masteryScore: computeMasteryScore(record),
    };
}
/**
 * Aggregates per-exercise stats into a single DeckStats object.
 *
 * @param deck        - The deck to summarise
 * @param deckRecords - exerciseId → CardRecord map for this deck (from studyStore)
 */
function getDeckStats(deck, deckRecords) {
    const exerciseStats = deck.exercises.map((ex) => getExerciseStats(ex, deckRecords[ex.id]));
    const counts = { new: 0, due: 0, upcoming: 0, mastered: 0 };
    const ratingDistribution = { again: 0, hard: 0, good: 0, easy: 0 };
    let lastStudiedAt = null;
    let nextDueAt = null;
    for (const es of exerciseStats) {
        counts[es.status]++;
        if (es.lastRating)
            ratingDistribution[es.lastRating]++;
        if (es.lastReviewed > 0) {
            lastStudiedAt =
                lastStudiedAt === null
                    ? es.lastReviewed
                    : Math.max(lastStudiedAt, es.lastReviewed);
        }
        // Soonest dueDate among scheduled cards. Includes "due" (overdue, dueDate
        // in the past) as well as "upcoming" — otherwise an all-overdue deck would
        // report null ("nothing coming up") while cards are actionable right now.
        // "new" (dueDate 0) and "mastered" are excluded; they aren't scheduled reviews.
        if (es.status === "due" || es.status === "upcoming") {
            nextDueAt =
                nextDueAt === null
                    ? es.dueDate
                    : Math.min(nextDueAt, es.dueDate);
        }
    }
    const total = deck.exercises.length;
    const masteryRate = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;
    return {
        deckId: deck.id,
        title: deck.title,
        totalExercises: total,
        dueCount: counts.due,
        newCount: counts.new,
        masteredCount: counts.mastered,
        upcomingCount: counts.upcoming,
        lastStudiedAt,
        nextDueAt,
        masteryRate,
        ratingDistribution,
        exerciseStats,
    };
}
