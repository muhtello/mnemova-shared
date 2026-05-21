"use strict";
// ─── Exercise Types ───────────────────────────────────────────────────────────
// Pure TypeScript — no framework dependencies.
// Web-specific icon/UI constants live in cerevia-web/app/types/exerciseType.ts.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXERCISE_META = void 0;
exports.getDraftFields = getDraftFields;
/** Returns the fillable fields (with human labels) for a given exercise type */
function getDraftFields(type) {
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
        case 'match':
            return [
                { field: 'source', label: 'Source Text' },
                { field: 'question', label: 'Question' },
                { field: 'pairA', label: 'Add to Group A' },
                { field: 'pairB', label: 'Add to Group B' },
            ];
    }
}
// ─── Exercise metadata (label/description — no icons) ────────────────────────
exports.EXERCISE_META = {
    flashcard: { label: 'Flashcard', description: 'Question & answer recall' },
    'fill-in-the-blank': { label: 'Fill Blank', description: 'Type the missing word(s)' },
    'word-pick': { label: 'Word Pick', description: 'Select the missing word(s)' },
    mcq: { label: 'MCQ', description: 'Multiple choice question' },
    'order-sentence': { label: 'Order Sentence', description: 'Arrange shuffled words into the correct order' },
    'match': { label: 'Match', description: 'Link each Group A item to its Group B match(es)' },
};
