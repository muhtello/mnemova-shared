import { Exercise } from "./exerciseType";
import { StudySettings, DEFAULT_STUDY_SETTINGS } from "./settingType";

export type FormatKind = 'bold' | 'italic' | 'fontSize';

/**
 * A formatting range over `Deck.content`. Carries the covered `text` snippet
 * (like HighlightTarget) so it can be relocated by re-search when cached
 * start/end no longer match after the content string is edited.
 */
export interface TextFormatSpan {
    text: string;
    kind: FormatKind;
    /** pt, 8–72; only set when kind === 'fontSize' */
    fontSize?: number;
    start?: number;
    end?: number;
}

export interface Deck {
    id: string;
    title: string;
    exercises: Exercise[];
    content?: string;
    /** Bold/italic/font-size ranges over `content` */
    formatting?: TextFormatSpan[];
    createdAt: Date;
    updatedAt?: Date;
    /** Per-deck study settings — falls back to DEFAULT_STUDY_SETTINGS on creation */
    studySettings: StudySettings;

    // Sync metadata (client-only, not stored in Supabase columns)
    _localStatus?: 'synced' | 'created' | 'updated' | 'deleted';
}

/** Helper to create a new deck with default study settings */
export function createDeck(partial: Omit<Deck, "studySettings">): Deck {
    return { ...partial, studySettings: { ...DEFAULT_STUDY_SETTINGS } };
}
