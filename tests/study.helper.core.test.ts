import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getInitialRecord, buildExercisePool, pickFromPool } from '../src/helpers/study.helper';
import { makeRecord, makeExercise, testSettings } from './fixtures';
import type { CardRecord } from '../src/types/studyType';

const NOW = 1_700_000_000_000;
const FUTURE = NOW + 86_400_000;
const PAST = NOW - 1_000;

describe('getInitialRecord', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it('uses the provided exerciseId', () => {
    expect(getInitialRecord('my-id').exerciseId).toBe('my-id');
  });
  it('sets intervalDays to 1', () => {
    expect(getInitialRecord('x').intervalDays).toBe(1);
  });
  it('sets dueDate to now (due immediately for new card)', () => {
    expect(getInitialRecord('x').dueDate).toBe(NOW);
  });
  it('marks card as never studied (lastReviewed = 0)', () => {
    expect(getInitialRecord('x').lastReviewed).toBe(0);
  });
  it('sets lastRating to null', () => {
    expect(getInitialRecord('x').lastRating).toBeNull();
  });
  it('sets consecutiveSameRating to 0', () => {
    expect(getInitialRecord('x').consecutiveSameRating).toBe(0);
  });
});

describe('buildExercisePool', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  it('returns empty array for no exercises', () => {
    expect(buildExercisePool([], {}, testSettings)).toEqual([]);
  });
  it('includes exercises with no record (new cards)', () => {
    expect(buildExercisePool([makeExercise({ id: 'new' })], {}, testSettings)).toHaveLength(1);
  });
  it('includes exercises where lastReviewed = 0 (started but never completed)', () => {
    const records: Record<string, CardRecord> = {
      e1: makeRecord({ exerciseId: 'e1', lastReviewed: 0, dueDate: FUTURE }),
    };
    expect(buildExercisePool([makeExercise({ id: 'e1' })], records, testSettings)).toHaveLength(1);
  });
  it('includes exercises where dueDate <= now', () => {
    const records: Record<string, CardRecord> = {
      e1: makeRecord({ exerciseId: 'e1', lastReviewed: PAST, dueDate: PAST }),
    };
    expect(buildExercisePool([makeExercise({ id: 'e1' })], records, testSettings)).toHaveLength(1);
  });
  it('excludes exercises where dueDate is in the future', () => {
    const records: Record<string, CardRecord> = {
      e1: makeRecord({ exerciseId: 'e1', lastReviewed: PAST, dueDate: FUTURE }),
    };
    expect(buildExercisePool([makeExercise({ id: 'e1' })], records, testSettings)).toHaveLength(0);
  });
  it('caps results at maxCards', () => {
    const exercises = Array.from({ length: 30 }, (_, i) => makeExercise({ id: `e${i}` }));
    expect(buildExercisePool(exercises, {}, { ...testSettings, maxCards: 5 })).toHaveLength(5);
  });
  it('maxCards = 0 returns all due exercises (no cap)', () => {
    const exercises = Array.from({ length: 30 }, (_, i) => makeExercise({ id: `e${i}` }));
    expect(buildExercisePool(exercises, {}, { ...testSettings, maxCards: 0 })).toHaveLength(30);
  });
  it('preserves original deck order', () => {
    const exercises = ['e1', 'e2', 'e3'].map(id => makeExercise({ id }));
    expect(buildExercisePool(exercises, {}, testSettings).map(e => e.id)).toEqual(['e1', 'e2', 'e3']);
  });
});

describe('pickFromPool', () => {
  it('returns null for an empty pool', () => {
    expect(pickFromPool([])).toBeNull();
  });
  it('returns the only item for a single-element pool', () => {
    expect(pickFromPool(['only'])).toEqual({ item: 'only', index: 0 });
  });
  it('returns an item whose index matches its pool position', () => {
    const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
    const result = pickFromPool(pool);
    expect(result).not.toBeNull();
    expect(pool[result!.index]).toBe(result!.item);
  });
  it('index is always a valid pool position (stress test)', () => {
    const pool = Array.from({ length: 9 }, (_, i) => i);
    for (let i = 0; i < 100; i++) {
      const result = pickFromPool(pool);
      expect(result!.index).toBeGreaterThanOrEqual(0);
      expect(result!.index).toBeLessThan(pool.length);
    }
  });
  // Regression for Bug #4: a size that isn't a multiple of 3 used to over-pick
  // the deck tail (last index ~1/3 vs ~1/5). Every index must now be ~uniform.
  it('picks every index with roughly uniform probability (no tail bias)', () => {
    const size = 5;
    const pool = Array.from({ length: size }, (_, i) => i);
    const counts = new Array(size).fill(0);
    const iterations = 60_000;
    for (let i = 0; i < iterations; i++) counts[pickFromPool(pool)!.index]++;

    const expected = iterations / size;
    for (const count of counts) {
      // ±10% is ~12σ here — safe from flakiness; the old code put index 4 at ~1/3.
      expect(count).toBeGreaterThan(expected * 0.9);
      expect(count).toBeLessThan(expected * 1.1);
    }
  });
});
