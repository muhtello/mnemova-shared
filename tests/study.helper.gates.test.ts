import { describe, it, expect } from 'vitest';
import {
  shouldRepeatAgain,
  shouldRepeatHard,
  getRepeatInsertPosition,
  selectNextPool,
} from '../src/helpers/study.helper';
import { makeQueueItem, testSettings } from './fixtures';

describe('shouldRepeatAgain', () => {
  it('"never": always returns false regardless of againCount', () => {
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 0 }), { mode: 'never' })).toBe(false);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 5 }), { mode: 'never' })).toBe(false);
  });

  it('"once": true only on the first again (againCount === 0)', () => {
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 0 }), { mode: 'once' })).toBe(true);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 1 }), { mode: 'once' })).toBe(false);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 2 }), { mode: 'once' })).toBe(false);
  });

  it('"allCorrect": always returns true regardless of againCount', () => {
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 0 }), { mode: 'allCorrect' })).toBe(true);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 99 }), { mode: 'allCorrect' })).toBe(true);
  });

  it('"random": true when againCount < count, false when >= count', () => {
    const strategy = { mode: 'random' as const, count: 3 };
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 0 }), strategy)).toBe(true);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 2 }), strategy)).toBe(true);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 3 }), strategy)).toBe(false);
    expect(shouldRepeatAgain(makeQueueItem({ againCount: 10 }), strategy)).toBe(false);
  });
});

describe('shouldRepeatHard', () => {
  it('returns true when hardCount < maxHardRepeats', () => {
    // testSettings.maxHardRepeats = 2
    expect(shouldRepeatHard(makeQueueItem({ hardCount: 0 }), testSettings)).toBe(true);
    expect(shouldRepeatHard(makeQueueItem({ hardCount: 1 }), testSettings)).toBe(true);
  });
  it('returns false when hardCount >= maxHardRepeats', () => {
    expect(shouldRepeatHard(makeQueueItem({ hardCount: 2 }), testSettings)).toBe(false);
    expect(shouldRepeatHard(makeQueueItem({ hardCount: 5 }), testSettings)).toBe(false);
  });
});

describe('getRepeatInsertPosition', () => {
  it('returns 0 for an empty repeat pool', () => {
    expect(getRepeatInsertPosition(0)).toBe(0);
  });
  it('always returns a value in [max(1, floor(len/2)), len]', () => {
    for (let len = 1; len <= 15; len++) {
      for (let run = 0; run < 30; run++) {
        const pos = getRepeatInsertPosition(len);
        const min = Math.max(1, Math.floor(len / 2));
        expect(pos).toBeGreaterThanOrEqual(min);
        expect(pos).toBeLessThanOrEqual(len);
      }
    }
  });
});

describe('selectNextPool', () => {
  it('returns "remaining" when both pools are empty', () => {
    expect(selectNextPool(0, 0)).toBe('remaining');
  });
  it('returns "remaining" when the repeat pool is empty', () => {
    expect(selectNextPool(5, 0)).toBe('remaining');
  });
  it('returns "repeat" when the remaining pool is exhausted', () => {
    expect(selectNextPool(0, 5)).toBe('repeat');
  });
  it('returns "remaining" when remaining pool is larger', () => {
    expect(selectNextPool(10, 3)).toBe('remaining');
  });
  it('returns "repeat" when repeat pool is larger', () => {
    expect(selectNextPool(3, 10)).toBe('repeat');
  });
  it('returns both options when pools are equal (probabilistic)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 200; i++) results.add(selectNextPool(3, 3));
    expect(results.has('remaining')).toBe(true);
    expect(results.has('repeat')).toBe(true);
  });
});
