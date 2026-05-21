// ─── Exercise Types ───────────────────────────────────────────────────────────
// Pure TypeScript — no framework dependencies.
// Web-specific icon/UI constants live in cerevia-web/app/types/exerciseType.ts.

export type ExerciseType = 'flashcard' | 'mcq' | 'fill-in-the-blank' | 'word-pick' | 'order-sentence';

/** Fields of an exercise that can be filled from an editor text selection */
export type FillableField = 'source' | 'question' | 'answer' | 'blank' | 'option' | 'sentence';

/** Returns the fillable fields (with human labels) for a given exercise type */
export function getDraftFields(type: ExerciseType): { field: FillableField; label: string }[] {
    switch (type) {
        case 'flashcard':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Question' },
                { field: 'answer', label: 'Answer' },
            ];
        case 'fill-in-the-blank':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Sentence' },
                { field: 'blank', label: 'Missing Word' },
                { field: 'answer', label: 'Explanation' },
            ];
        case 'word-pick':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Sentence' },
                { field: 'blank', label: 'Correct Word' },
                { field: 'option', label: 'Add Distractor' },
                { field: 'answer', label: 'Explanation' },
            ];
        case 'mcq':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Question' },
                { field: 'option', label: 'Add Option' },
                { field: 'answer', label: 'Correct Answer' },
            ];
        case 'order-sentence':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Question' },
                { field: 'sentence', label: 'Sentence to Order' },
                { field: 'answer', label: 'Correct Answer' },
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

// ─── Exercise metadata (label/description — no icons) ────────────────────────

export const EXERCISE_META: Record<ExerciseType, { label: string; description: string }> = {
    flashcard:           { label: 'Flashcard',      description: 'Question & answer recall' },
    'fill-in-the-blank': { label: 'Fill Blank',     description: 'Type the missing word(s)' },
    'word-pick':         { label: 'Word Pick',      description: 'Select the missing word(s)' },
    mcq:                 { label: 'MCQ',            description: 'Multiple choice question' },
    'order-sentence':    { label: 'Order Sentence', description: 'Arrange shuffled words into the correct order' },
};
