/**
 * Unit tests for getDeckStats — focused on nextDueAt semantics.
 *
 * nextDueAt is the soonest dueDate among SCHEDULED cards (status "due" or
 * "upcoming"). Overdue ("due") cards must be included, otherwise an all-overdue
 * deck would report null while cards are actionable right now. "new" and
 * "mastered" cards are excluded.
 *
 * npx vitest run tests/stats.helper.test.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getDeckStats } from '../src/helpers/stats.helper'
import { makeExercise, makeRecord } from './fixtures'
import type { Deck } from '../src/types/deckType'
import type { CardRecord } from '../src/types/studyType'
import { DEFAULT_STUDY_SETTINGS } from '../src/types/settingType'

const NOW = 1_700_000_000_000
const DAY_MS = 86_400_000

function makeDeck(exerciseIds: string[]): Deck {
  return {
    id: 'deck-1',
    title: 'Deck',
    exercises: exerciseIds.map((id) => makeExercise({ id })),
    createdAt: new Date(NOW),
    studySettings: { ...DEFAULT_STUDY_SETTINGS },
  }
}

// A reviewed, scheduled card: lastReviewed set (so not "new"), interval below
// the 21-day mastery threshold (so not "mastered").
function scheduled(exerciseId: string, dueDate: number): CardRecord {
  return makeRecord({ exerciseId, intervalDays: 5, dueDate, lastReviewed: NOW - DAY_MS })
}

describe('getDeckStats — nextDueAt', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => vi.useRealTimers())

  it('returns the earliest overdue dueDate for an all-overdue deck (not null)', () => {
    const records = {
      'ex-1': scheduled('ex-1', NOW - 3 * DAY_MS),
      'ex-2': scheduled('ex-2', NOW - 7 * DAY_MS), // most overdue
    }
    const stats = getDeckStats(makeDeck(['ex-1', 'ex-2']), records)

    expect(stats.dueCount).toBe(2)
    expect(stats.nextDueAt).toBe(NOW - 7 * DAY_MS) // soonest = most overdue
  })

  it('picks the soonest dueDate across due and upcoming cards', () => {
    const records = {
      'ex-1': scheduled('ex-1', NOW - 2 * DAY_MS), // due
      'ex-2': scheduled('ex-2', NOW + 4 * DAY_MS), // upcoming
    }
    const stats = getDeckStats(makeDeck(['ex-1', 'ex-2']), records)

    expect(stats.nextDueAt).toBe(NOW - 2 * DAY_MS)
  })

  it('returns the upcoming dueDate when nothing is overdue', () => {
    const records = { 'ex-1': scheduled('ex-1', NOW + 4 * DAY_MS) }
    const stats = getDeckStats(makeDeck(['ex-1']), records)

    expect(stats.upcomingCount).toBe(1)
    expect(stats.nextDueAt).toBe(NOW + 4 * DAY_MS)
  })

  it('is null when the deck has only new or mastered cards', () => {
    const records = {
      // 'ex-1' has no record → "new"
      'ex-2': makeRecord({ exerciseId: 'ex-2', intervalDays: 30, dueDate: NOW + 30 * DAY_MS, lastReviewed: NOW - DAY_MS }), // mastered
    }
    const stats = getDeckStats(makeDeck(['ex-1', 'ex-2']), records)

    expect(stats.newCount).toBe(1)
    expect(stats.masteredCount).toBe(1)
    expect(stats.nextDueAt).toBeNull()
  })
})
