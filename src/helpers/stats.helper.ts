import type { Exercise } from "../types/exerciseType";
import type { CardRecord } from "../types/studyType";
import type { Deck } from "../types/deckType";
import type { DeckStats, ExerciseStats, ExerciseStatus } from "../types/statsType";

/** intervalDays >= this threshold → exercise is considered "mastered" */
const MASTERY_THRESHOLD_DAYS = 21;

function resolveStatus(record: CardRecord | undefined): ExerciseStatus {
    if (!record || record.lastReviewed === 0) return "new";
    if (record.intervalDays >= MASTERY_THRESHOLD_DAYS) return "mastered";
    if (record.dueDate <= Date.now()) return "due";
    return "upcoming";
}

function computeMasteryScore(record: CardRecord | undefined): number {
    if (!record || record.lastReviewed === 0) return 0;
    return Math.min(100, Math.round((record.intervalDays / MASTERY_THRESHOLD_DAYS) * 100));
}

function truncatePreview(question: string): string {
    const text = question.trim();
    return text.length > 60 ? text.slice(0, 60) + "…" : text;
}

/**
 * Returns stats for a single exercise given its persisted CardRecord.
 * Pass `undefined` for record if the exercise has never been reviewed.
 */
export function getExerciseStats(
    exercise: Exercise,
    record: CardRecord | undefined
): ExerciseStats {
    return {
        exerciseId: exercise.id,
        type: exercise.type,
        preview: truncatePreview(exercise.question),
        status: resolveStatus(record),
        intervalDays: record?.intervalDays ?? 1,
        dueDate: record?.dueDate ?? 0,
        lastReviewed: record?.lastReviewed ?? 0,
        lastRating: record?.lastRating ?? null,
        masteryScore: computeMasteryScore(record),
    };
}

/**
 * Aggregates per-exercise stats into a single DeckStats object.
 *
 * @param deck        - The deck to summarise
 * @param deckRecords - exerciseId → CardRecord map for this deck (from studyStore)
 */
export function getDeckStats(
    deck: Deck,
    deckRecords: Record<string, CardRecord>
): DeckStats {
    const exerciseStats = deck.exercises.map((ex) =>
        getExerciseStats(ex, deckRecords[ex.id])
    );

    const counts = { new: 0, due: 0, upcoming: 0, mastered: 0 };
    const ratingDistribution = { again: 0, hard: 0, good: 0, easy: 0 };
    let lastStudiedAt: number | null = null;
    let nextDueAt: number | null = null;

    for (const es of exerciseStats) {
        counts[es.status]++;

        if (es.lastRating) ratingDistribution[es.lastRating]++;

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
    const masteryRate =
        total > 0 ? Math.round((counts.mastered / total) * 100) : 0;

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
