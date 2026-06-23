import type { ExerciseType } from "./exerciseType";
import type { CardRating } from "./studyType";
/** How well-studied a single exercise is at a given moment */
export type ExerciseStatus = "new" | "due" | "upcoming" | "mastered";
export interface ExerciseStats {
    exerciseId: string;
    type: ExerciseType;
    /** First 60 chars of exercise.question */
    preview: string;
    status: ExerciseStatus;
    /** Current scheduled interval in days */
    intervalDays: number;
    /** Unix ms — next due date (0 if never reviewed) */
    dueDate: number;
    /** Unix ms — last review timestamp (0 if never reviewed) */
    lastReviewed: number;
    lastRating: CardRating | null;
    /** 0–100: (intervalDays / MASTERY_THRESHOLD_DAYS) * 100, capped at 100 */
    masteryScore: number;
}
export interface DeckStats {
    deckId: string;
    title: string;
    totalExercises: number;
    dueCount: number;
    newCount: number;
    masteredCount: number;
    upcomingCount: number;
    /** Unix ms of most recent review across all exercises; null if never studied */
    lastStudiedAt: number | null;
    /**
     * Unix ms of the soonest dueDate among scheduled cards (status "due" or
     * "upcoming"); null when none are scheduled. May be in the past when cards
     * are overdue — compare to Date.now(): <= now means "due now", else "next in X".
     */
    nextDueAt: number | null;
    /** (masteredCount / totalExercises) * 100; 0 when totalExercises is 0 */
    masteryRate: number;
    ratingDistribution: {
        again: number;
        hard: number;
        good: number;
        easy: number;
    };
    exerciseStats: ExerciseStats[];
}
