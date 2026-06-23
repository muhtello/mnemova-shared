import { Exercise } from "../types/exerciseType";
import { CardRecord, CardRating, QueueItem } from "../types/studyType";
import { RepeatStrategy, StudySettings } from "../types/settingType";

// ─── Initial record ───────────────────────────────────────────────────────────

export function getInitialRecord(exerciseId: string): CardRecord {
    return {
        exerciseId,
        intervalDays: 1,
        dueDate: Date.now(),        // due immediately (new card)
        lastReviewed: 0,
        lastRating: null,
        consecutiveSameRating: 0,
    };
}

// ─── Pool builder ─────────────────────────────────────────────────────────────

/**
 * Returns the subset of exercises that are new or due for review.
 * Capped at `settings.maxCards` (0 = no cap, returns all due).
 * Result preserves original deck order (no shuffle) — the caller
 * uses pickFromPool() to introduce randomness during the session.
 */
export function buildExercisePool(
    exercises: Exercise[],
    records: Record<string, CardRecord>,
    settings: StudySettings
): Exercise[] {
    const now = Date.now();

    const due = exercises.filter((ex) => {
        const rec = records[ex.id];
        return !rec || rec.lastReviewed === 0 || rec.dueDate <= now;
    });

    const cap = settings.maxCards === 0
        ? due.length
        : Math.min(settings.maxCards, due.length);

    return due.slice(0, cap);
}

// ─── Random third-section picker ──────────────────────────────────────────────

/**
 * Divides `pool` into three equal sections, picks one section at random,
 * then picks a random item from that section.
 */
export function pickFromPool<T>(pool: T[]): { item: T; index: number } | null {
    if (pool.length === 0) return null;
    if (pool.length === 1) return { item: pool[0], index: 0 };

    const size = pool.length;
    const third = Math.ceil(size / 3);

    const sections = [
        { start: 0, end: Math.min(third, size) },
        { start: Math.min(third, size), end: Math.min(third * 2, size) },
        { start: Math.min(third * 2, size), end: size },
    ].filter((s) => s.start < s.end);

    const section = sections[Math.floor(Math.random() * sections.length)];
    const index = section.start + Math.floor(Math.random() * (section.end - section.start));

    return { item: pool[index], index };
}

// ─── SM-2 rating → next CardRecord ───────────────────────────────────────────

export function applyRating(
    record: CardRecord,
    rating: CardRating,
    settings: StudySettings,
    sessionHardCount: number
): CardRecord {
    const now = Date.now();
    const DAY_MS = 86_400_000;
    const HOUR_MS = 3_600_000;

    const streak =
        record.lastRating === rating
            ? record.consecutiveSameRating + 1
            : 0;

    // ── Again: failed card must resurface — reset schedule to due-now ─────
    // In-session repeats are handled by shouldRepeatAgain(); but when a card
    // ends a session on "again" (mode "never", or "random" after its retries),
    // applyRating persists the final state. Leaving the old dueDate untouched
    // would let a previously-scheduled card keep a future dueDate, so a just-
    // failed card would be filtered out of the next session's pool for days.
    if (rating === "again") {
        return {
            ...record,
            intervalDays: 1,
            dueDate: now,           // due immediately so it returns next session
            lastReviewed: now,
            lastRating: rating,
            consecutiveSameRating: streak,
        };
    }

    // ── Hard: within budget → in-session; over budget → defer ────────────
    if (rating === "hard") {
        if (sessionHardCount < settings.maxHardRepeats) {
            return {
                ...record,
                lastReviewed: now,
                lastRating: rating,
                consecutiveSameRating: streak,
            };
        } else {
            const dueDate = now + settings.hardDelayHours * HOUR_MS;
            return {
                ...record,
                intervalDays: settings.hardDelayHours / 24,
                dueDate,
                lastReviewed: now,
                lastRating: rating,
                consecutiveSameRating: streak,
            };
        }
    }

    // ── Good: base interval + streak growth ───────────────────────────────
    if (rating === "good") {
        const days = settings.goodDays + streak * settings.intervalDayIncrement;
        return {
            ...record,
            intervalDays: days,
            dueDate: now + days * DAY_MS,
            lastReviewed: now,
            lastRating: rating,
            consecutiveSameRating: streak,
        };
    }

    // ── Easy: larger base interval + streak growth ────────────────────────
    const days = settings.easyDays + streak * settings.intervalDayIncrement;
    return {
        ...record,
        intervalDays: days,
        dueDate: now + days * DAY_MS,
        lastReviewed: now,
        lastRating: rating,
        consecutiveSameRating: streak,
    };
}

// ─── Again repeat gate ────────────────────────────────────────────────────────

export function shouldRepeatAgain(
    item: QueueItem,
    strategy: RepeatStrategy
): boolean {
    const { mode, count = 3 } = strategy;

    switch (mode) {
        case "never":
            return false;
        case "once":
            return item.againCount === 0;
        case "allCorrect":
            return true;
        case "random":
            return item.againCount < count;
    }
}

// ─── Hard repeat gate ─────────────────────────────────────────────────────────

export function shouldRepeatHard(
    item: QueueItem,
    settings: StudySettings
): boolean {
    return item.hardCount < settings.maxHardRepeats;
}

// ─── Repeat pool insert position ──────────────────────────────────────────────

export function getRepeatInsertPosition(repeatPoolLength: number): number {
    if (repeatPoolLength === 0) return 0;
    const min = Math.max(1, Math.floor(repeatPoolLength / 2));
    const max = repeatPoolLength;
    return min + Math.floor(Math.random() * (max - min + 1));
}

// ─── Pool selection logic ─────────────────────────────────────────────────────

/**
 * Given pool sizes, returns which pool to draw from next.
 * remaining > repeat → draw from remaining
 * repeat > remaining → draw from repeat (prioritise weak cards)
 * equal              → random choice
 */
export function selectNextPool(
    remainingLen: number,
    repeatLen: number
): "remaining" | "repeat" {
    if (remainingLen === 0 && repeatLen === 0) return "remaining";
    if (repeatLen === 0) return "remaining";
    if (remainingLen === 0) return "repeat";
    if (remainingLen > repeatLen) return "remaining";
    if (repeatLen > remainingLen) return "repeat";
    return Math.random() < 0.5 ? "remaining" : "repeat";
}
