import type { CardRecord, QueueItem } from '../src/types/studyType';
import type { FlashcardExercise } from '../src/types/exerciseType';
import { DEFAULT_STUDY_SETTINGS } from '../src/types/settingType';
import type { StudySettings } from '../src/types/settingType';

export const testSettings: StudySettings = { ...DEFAULT_STUDY_SETTINGS };

export function makeRecord(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    exerciseId: 'ex-1',
    intervalDays: 1,
    dueDate: Date.now(),
    lastReviewed: 0,
    lastRating: null,
    consecutiveSameRating: 0,
    ...overrides,
  };
}

export function makeExercise(overrides: Partial<FlashcardExercise> = {}): FlashcardExercise {
  return {
    id: 'ex-1',
    type: 'flashcard',
    question: 'What is 2+2?',
    answer: '4',
    createdAt: 0,
    ...overrides,
  };
}

export function makeQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    exercise: makeExercise(),
    againCount: 0,
    hardCount: 0,
    ...overrides,
  };
}
