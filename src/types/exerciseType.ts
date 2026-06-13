// ─── Exercise Types ───────────────────────────────────────────────────────────
// Pure TypeScript — no framework dependencies.
// Web-specific icon/UI constants live in cerevia-web/app/types/exerciseType.ts.

export type ExerciseType = 'flashcard' | 'mcq' | 'fill-in-the-blank' | 'word-pick' | 'order-sentence';

/** Fields of an exercise that can be filled from an editor text selection */
export type FillableField = 'source' | 'question' | 'answer' | 'blank' | 'option' | 'sentence';

/**
 * Returns the fillable fields for a given exercise type. `labelKey` is an i18n
 * key (common namespace) — resolve it with t() at the call site so the field
 * labels are translatable. Display text lives in i18n, not here.
 */
export function getDraftFields(type: ExerciseType): { field: FillableField; labelKey: string }[] {
    switch (type) {
        case 'flashcard':
            return [
                { field: 'source', labelKey: 'common:exercise.field.sourceText' },
                { field: 'question', labelKey: 'common:exercise.field.question' },
                { field: 'answer', labelKey: 'common:exercise.field.answer' },
            ];
        case 'fill-in-the-blank':
            return [
                { field: 'source', labelKey: 'common:exercise.field.sourceText' },
                { field: 'question', labelKey: 'common:exercise.field.sentence' },
                { field: 'blank', labelKey: 'common:exercise.field.missingWord' },
                { field: 'answer', labelKey: 'common:exercise.field.explanation' },
            ];
        case 'word-pick':
            return [
                { field: 'source', labelKey: 'common:exercise.field.sourceText' },
                { field: 'question', labelKey: 'common:exercise.field.sentence' },
                { field: 'blank', labelKey: 'common:exercise.field.correctWord' },
                { field: 'option', labelKey: 'common:exercise.field.addDistractor' },
                { field: 'answer', labelKey: 'common:exercise.field.explanation' },
            ];
        case 'mcq':
            return [
                { field: 'source', labelKey: 'common:exercise.field.sourceText' },
                { field: 'question', labelKey: 'common:exercise.field.question' },
                { field: 'option', labelKey: 'common:exercise.field.addOption' },
                { field: 'answer', labelKey: 'common:exercise.field.correctAnswer' },
            ];
        case 'order-sentence':
            return [
                { field: 'source', labelKey: 'common:exercise.field.sourceText' },
                { field: 'question', labelKey: 'common:exercise.field.question' },
                { field: 'sentence', labelKey: 'common:exercise.field.sentenceToOrder' },
                { field: 'answer', labelKey: 'common:exercise.field.correctAnswer' },
            ];
    }
}

// ─── Exercise interfaces ──────────────────────────────────────────────────────

export interface BaseExercise {
    id: string;
    type: ExerciseType;
    question: string;
    sourceText?: string;
    sourceRange?: {
        start: number;
        end: number;
    };
    highlightColor?: string;
    createdAt: number;
}

export interface FlashcardExercise extends BaseExercise {
    type: 'flashcard';
    answer: string;
}

export interface FillInTheBlankExercise extends BaseExercise {
    type: 'fill-in-the-blank';
    blank: string;       // kept for backward compat (single blank)
    blanks?: string[];   // new: one entry per ___ (overrides blank when present)
    explanation?: string;
}

export interface WordPickExercise extends BaseExercise {
    type: 'word-pick';
    blanks: string[];    // correct word for each ___ (ordered)
    options: string[];   // all selectable chips (correct + distractors)
    explanation?: string;
}

export interface McqExercise extends BaseExercise {
    type: 'mcq';
    options: string[];
    answers: string[];
    explanation?: string;
}

export interface OrderSentenceExercise extends BaseExercise {
    type: 'order-sentence';
    words: string[];
    explanation?: string;
}

export type Exercise =
    | FlashcardExercise
    | FillInTheBlankExercise
    | McqExercise
    | WordPickExercise
    | OrderSentenceExercise;

// ─── Exercise metadata (i18n keys — no icons, no display text) ───────────────
// labelKey/descriptionKey are common-namespace i18n keys; resolve with t() at
// the call site so type labels are translatable.

export const EXERCISE_META: Record<ExerciseType, { labelKey: string; descriptionKey: string }> = {
    flashcard:           { labelKey: 'common:exercise.type.flashcard.label',      descriptionKey: 'common:exercise.type.flashcard.description' },
    'fill-in-the-blank': { labelKey: 'common:exercise.type.fillInTheBlank.label', descriptionKey: 'common:exercise.type.fillInTheBlank.description' },
    'word-pick':         { labelKey: 'common:exercise.type.wordPick.label',       descriptionKey: 'common:exercise.type.wordPick.description' },
    mcq:                 { labelKey: 'common:exercise.type.mcq.label',            descriptionKey: 'common:exercise.type.mcq.description' },
    'order-sentence':    { labelKey: 'common:exercise.type.orderSentence.label',  descriptionKey: 'common:exercise.type.orderSentence.description' },
};
