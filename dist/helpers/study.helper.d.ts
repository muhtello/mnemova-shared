import { Exercise } from "../types/exerciseType";
import { CardRecord, CardRating, QueueItem } from "../types/studyType";
import { RepeatStrategy, StudySettings } from "../types/settingType";
export declare function getInitialRecord(exerciseId: string): CardRecord;
/**
 * Returns the subset of exercises that are new or due for review.
 * Capped at `settings.maxCards` (0 = no cap, returns all due).
 * Result preserves original deck order (no shuffle) — the caller
 * uses pickFromPool() to introduce randomness during the session.
 */
export declare function buildExercisePool(exercises: Exercise[], records: Record<string, CardRecord>, settings: StudySettings): Exercise[];
/**
 * Picks one item from `pool` uniformly at random (every item equally likely).
 * Callers splice the returned index out of the pool, so repeated calls drain
 * the pool as an unbiased shuffle. (An earlier three-section scheme gave each
 * section equal probability despite unequal sizes, over-picking the deck tail.)
 */
export declare function pickFromPool<T>(pool: T[]): {
    item: T;
    index: number;
} | null;
export declare function applyRating(record: CardRecord, rating: CardRating, settings: StudySettings, sessionHardCount: number): CardRecord;
export declare function shouldRepeatAgain(item: QueueItem, strategy: RepeatStrategy): boolean;
export declare function shouldRepeatHard(item: QueueItem, settings: StudySettings): boolean;
export declare function getRepeatInsertPosition(repeatPoolLength: number): number;
/**
 * Given pool sizes, returns which pool to draw from next.
 * remaining > repeat → draw from remaining
 * repeat > remaining → draw from repeat (prioritise weak cards)
 * equal              → random choice
 */
export declare function selectNextPool(remainingLen: number, repeatLen: number): "remaining" | "repeat";
