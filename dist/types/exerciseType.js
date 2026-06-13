"use strict";
// ─── Exercise Types ───────────────────────────────────────────────────────────
// Pure TypeScript — no framework dependencies.
// Web-specific icon/UI constants live in cerevia-web/app/types/exerciseType.ts.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXERCISE_META = void 0;
exports.getDraftFields = getDraftFields;
/**
 * Returns the fillable fields for a given exercise type. `labelKey` is an i18n
 * key (common namespace) — resolve it with t() at the call site so the field
 * labels are translatable. Display text lives in i18n, not here.
 */
function getDraftFields(type) {
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
// ─── Exercise metadata (i18n keys — no icons, no display text) ───────────────
// labelKey/descriptionKey are common-namespace i18n keys; resolve with t() at
// the call site so type labels are translatable.
exports.EXERCISE_META = {
    flashcard: { labelKey: 'common:exercise.type.flashcard.label', descriptionKey: 'common:exercise.type.flashcard.description' },
    'fill-in-the-blank': { labelKey: 'common:exercise.type.fillInTheBlank.label', descriptionKey: 'common:exercise.type.fillInTheBlank.description' },
    'word-pick': { labelKey: 'common:exercise.type.wordPick.label', descriptionKey: 'common:exercise.type.wordPick.description' },
    mcq: { labelKey: 'common:exercise.type.mcq.label', descriptionKey: 'common:exercise.type.mcq.description' },
    'order-sentence': { labelKey: 'common:exercise.type.orderSentence.label', descriptionKey: 'common:exercise.type.orderSentence.description' },
};
