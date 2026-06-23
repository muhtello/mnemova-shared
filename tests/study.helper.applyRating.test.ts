import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { applyRating } from '../src/helpers/study.helper';
import { makeRecord, testSettings } from './fixtures';

const NOW = 1_700_000_000_000;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

describe('applyRating', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => vi.useRealTimers());

  describe('"again"', () => {
    it('resets dueDate to now so the failed card resurfaces next session', () => {
      const record = makeRecord({ dueDate: NOW + 20 * DAY_MS });
      expect(applyRating(record, 'again', testSettings, 0).dueDate).toBe(NOW);
    });
    it('resets intervalDays to 1', () => {
      expect(applyRating(makeRecord({ intervalDays: 7 }), 'again', testSettings, 0).intervalDays).toBe(1);
    });
    it('updates lastReviewed to now', () => {
      expect(applyRating(makeRecord(), 'again', testSettings, 0).lastReviewed).toBe(NOW);
    });
    it('sets lastRating to "again"', () => {
      expect(applyRating(makeRecord(), 'again', testSettings, 0).lastRating).toBe('again');
    });
    it('increments streak on consecutive "again" answers', () => {
      const record = makeRecord({ lastRating: 'again', consecutiveSameRating: 2 });
      expect(applyRating(record, 'again', testSettings, 0).consecutiveSameRating).toBe(3);
    });
    it('resets streak when switching from a different rating', () => {
      const record = makeRecord({ lastRating: 'good', consecutiveSameRating: 5 });
      expect(applyRating(record, 'again', testSettings, 0).consecutiveSameRating).toBe(0);
    });
  });

  describe('"hard" — within budget (sessionHardCount < maxHardRepeats)', () => {
    it('does not defer dueDate (card repeats in session)', () => {
      const record = makeRecord({ dueDate: NOW - 500 });
      expect(applyRating(record, 'hard', testSettings, 1).dueDate).toBe(record.dueDate);
    });
    it('updates lastReviewed and lastRating', () => {
      const result = applyRating(makeRecord(), 'hard', testSettings, 0);
      expect(result.lastReviewed).toBe(NOW);
      expect(result.lastRating).toBe('hard');
    });
  });

  describe('"hard" — over budget (sessionHardCount >= maxHardRepeats)', () => {
    it('defers dueDate by hardDelayHours', () => {
      // maxHardRepeats = 2 → sessionHardCount 2 is over budget
      const result = applyRating(makeRecord(), 'hard', testSettings, 2);
      expect(result.dueDate).toBe(NOW + testSettings.hardDelayHours * HOUR_MS);
    });
    it('sets intervalDays to hardDelayHours / 24', () => {
      const result = applyRating(makeRecord(), 'hard', testSettings, 2);
      expect(result.intervalDays).toBe(testSettings.hardDelayHours / 24);
    });
  });

  describe('"good"', () => {
    it('1st good (streak 0): intervalDays = goodDays', () => {
      const result = applyRating(makeRecord({ lastRating: null }), 'good', testSettings, 0);
      expect(result.intervalDays).toBe(1);                  // goodDays = 1
      expect(result.consecutiveSameRating).toBe(0);
    });
    it('2nd consecutive good (streak 1): intervalDays = goodDays + 1×increment', () => {
      const result = applyRating(
        makeRecord({ lastRating: 'good', consecutiveSameRating: 0 }),
        'good', testSettings, 0
      );
      expect(result.intervalDays).toBe(3);                  // 1 + 1×2
      expect(result.consecutiveSameRating).toBe(1);
    });
    it('3rd consecutive good (streak 2): intervalDays = goodDays + 2×increment', () => {
      const result = applyRating(
        makeRecord({ lastRating: 'good', consecutiveSameRating: 1 }),
        'good', testSettings, 0
      );
      expect(result.intervalDays).toBe(5);                  // 1 + 2×2
    });
    it('sets dueDate to now + intervalDays × DAY_MS', () => {
      const result = applyRating(makeRecord({ lastRating: null }), 'good', testSettings, 0);
      expect(result.dueDate).toBe(NOW + 1 * DAY_MS);
    });
  });

  describe('"easy"', () => {
    it('1st easy (streak 0): intervalDays = easyDays', () => {
      const result = applyRating(makeRecord({ lastRating: null }), 'easy', testSettings, 0);
      expect(result.intervalDays).toBe(4);                  // easyDays = 4
      expect(result.consecutiveSameRating).toBe(0);
    });
    it('2nd consecutive easy (streak 1): intervalDays = easyDays + 1×increment', () => {
      const result = applyRating(
        makeRecord({ lastRating: 'easy', consecutiveSameRating: 0 }),
        'easy', testSettings, 0
      );
      expect(result.intervalDays).toBe(6);                  // 4 + 1×2
    });
    it('sets dueDate to now + intervalDays × DAY_MS', () => {
      const result = applyRating(makeRecord({ lastRating: null }), 'easy', testSettings, 0);
      expect(result.dueDate).toBe(NOW + 4 * DAY_MS);
    });
    it('resets streak when switching from "good" to "easy"', () => {
      const result = applyRating(
        makeRecord({ lastRating: 'good', consecutiveSameRating: 3 }),
        'easy', testSettings, 0
      );
      expect(result.consecutiveSameRating).toBe(0);
    });
  });
});
