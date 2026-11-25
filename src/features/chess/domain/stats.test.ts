import { describe, expect, it } from 'vitest';
import { puzzleStreakDays, tally } from './stats';

const DAY = 86_400_000;
const NOON = Date.UTC(2026, 5, 10, 12, 0, 0);

describe('puzzleStreakDays', () => {
  it('counts consecutive days ending today', () => {
    expect(puzzleStreakDays([NOON, NOON - DAY, NOON - 2 * DAY], NOON)).toBe(3);
  });

  it('keeps the streak alive until the end of the day after the last solve', () => {
    expect(puzzleStreakDays([NOON - DAY, NOON - 2 * DAY], NOON)).toBe(2);
  });

  it('breaks on a missed day and ignores older runs', () => {
    expect(puzzleStreakDays([NOON, NOON - 2 * DAY, NOON - 3 * DAY], NOON)).toBe(1);
    expect(puzzleStreakDays([NOON - 3 * DAY], NOON)).toBe(0);
  });

  it('counts a day once however many puzzles were solved', () => {
    expect(puzzleStreakDays([NOON, NOON + 1000, NOON + 2000], NOON)).toBe(1);
    expect(puzzleStreakDays([], NOON)).toBe(0);
  });
});

describe('tally', () => {
  it('counts results', () => {
    expect(tally(['win', 'loss', 'win', 'draw'])).toEqual({ wins: 2, draws: 1, losses: 1 });
  });
});
