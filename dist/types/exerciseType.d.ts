export type ExerciseType = 'flashcard' | 'mcq' | 'fill-in-the-blank' | 'word-pick' | 'order-sentence' | 'match';
/** Fields of an exercise that can be filled from an editor text selection */
export type FillableField = 'source' | 'question' | 'answer' | 'blank' | 'option' | 'sentence' | 'pairA' | 'pairB';
/** Returns the fillable fields (with human labels) for a given exercise type */
export declare function getDraftFields(type: ExerciseType): {
    field: FillableField;
    label: string;
}[];
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
    blank: string;
    blanks?: string[];
    explanation?: string;
}
export interface WordPickExercise extends BaseExercise {
    type: 'word-pick';
    blanks: string[];
    options: string[];
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
export interface MatchPair {
    a: string;
    b: string[];
}
export interface MatchExercise extends BaseExercise {
    type: 'match';
    pairs: MatchPair[];
    explanation?: string;
}
export type Exercise = FlashcardExercise | FillInTheBlankExercise | McqExercise | WordPickExercise | OrderSentenceExercise | MatchExercise;
export declare const EXERCISE_META: Record<ExerciseType, {
    label: string;
    description: string;
}>;
