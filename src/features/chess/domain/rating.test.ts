import { describe, expect, it } from 'vitest';
import { INITIAL_RATING, START_RATING, expectedScore, kFactor, updateRating } from './rating';

describe('expectedScore', () => {
  it('is 0.5 between equals and follows the 400-point rule', () => {
    expect(expectedScore(1200, 1200)).toBeCloseTo(0.5, 10);
    expect(expectedScore(1400, 1000)).toBeCloseTo(10 / 11, 6);
    expect(expectedScore(1000, 1400)).toBeCloseTo(1 / 11, 6);
  });

  it('is symmetric', () => {
    expect(expectedScore(1337, 1111) + expectedScore(1111, 1337)).toBeCloseTo(1, 10);
  });
});

describe('kFactor', () => {
  it('shrinks as more games are played', () => {
    expect(kFactor(0)).toBe(40);
    expect(kFactor(9)).toBe(40);
    expect(kFactor(10)).toBe(32);
    expect(kFactor(30)).toBe(24);
    expect(kFactor(100)).toBe(16);
    expect(kFactor(5000)).toBe(16);
  });
});

describe('updateRating', () => {
  it('starts at 1000 and moves by half of K against an equal opponent', () => {
    expect(INITIAL_RATING).toEqual({ value: START_RATING, games: 0 });
    expect(updateRating(INITIAL_RATING, 1000, 1)).toEqual({ value: 1020, games: 1, delta: 20 });
    expect(updateRating(INITIAL_RATING, 1000, 0)).toEqual({ value: 980, games: 1, delta: -20 });
    expect(updateRating(INITIAL_RATING, 1000, 0.5)).toEqual({ value: 1000, games: 1, delta: 0 });
  });

  it('rewards beating a stronger opponent more than a weaker one', () => {
    const player = { value: 1000, games: 20 };
    const upset = updateRating(player, 1400, 1).delta;
    const expected = updateRating(player, 600, 1).delta;
    expect(upset).toBeGreaterThan(expected);
    expect(expected).toBeGreaterThanOrEqual(0);
  });

  it('moves less once many games are played', () => {
    const rookie = updateRating({ value: 1000, games: 0 }, 1000, 1).delta;
    const veteran = updateRating({ value: 1000, games: 200 }, 1000, 1).delta;
    expect(veteran).toBe(8);
    expect(rookie).toBeGreaterThan(veteran);
  });

  it('is zero-sum at equal games and never falls below the floor', () => {
    const a = updateRating({ value: 1200, games: 40 }, 1100, 1);
    const b = updateRating({ value: 1100, games: 40 }, 1200, 0);
    expect(a.delta + b.delta).toBe(0);
    expect(updateRating({ value: 110, games: 0 }, 110, 0).value).toBe(100);
  });
});
