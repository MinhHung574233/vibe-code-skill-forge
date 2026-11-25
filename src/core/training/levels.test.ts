import { describe, expect, it } from 'vitest';
import { MAX_LEVEL, levelForXp, levelProgress, xpToReach } from './levels';

describe('xpToReach', () => {
  it('follows round(100·(L−1)^1.5), with level 1 free', () => {
    expect([1, 2, 3, 4, 5, 6].map(xpToReach)).toEqual([0, 100, 283, 520, 800, 1118]);
  });

  it('handles nonsense input without throwing', () => {
    expect(xpToReach(0)).toBe(0);
    expect(xpToReach(-5)).toBe(0);
    expect(xpToReach(Number.NaN)).toBe(0);
  });

  it('is strictly increasing (every level costs more than the last)', () => {
    for (let l = 1; l < 60; l++) expect(xpToReach(l + 1)).toBeGreaterThan(xpToReach(l));
  });
});

describe('levelForXp', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [282, 2],
    [283, 3],
    [799, 4],
    [800, 5],
  ])('%s XP -> level %s', (xp, level) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it('is the exact inverse of xpToReach at every boundary', () => {
    for (let l = 1; l <= 80; l++) {
      expect(levelForXp(xpToReach(l))).toBe(l);
      if (l > 1) expect(levelForXp(xpToReach(l) - 1)).toBe(l - 1);
    }
  });

  it('clamps invalid and huge values', () => {
    expect(levelForXp(-50)).toBe(1);
    expect(levelForXp(Number.NaN)).toBe(1);
    expect(levelForXp(1e12)).toBe(MAX_LEVEL);
  });
});

describe('levelProgress', () => {
  it('reports progress inside the current level', () => {
    expect(levelProgress(0)).toMatchObject({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      fraction: 0,
    });
    const p = levelProgress(150);
    expect(p).toMatchObject({ level: 2, xpIntoLevel: 50, xpForNextLevel: 183 });
    expect(p.fraction).toBeCloseTo(50 / 183, 5);
  });

  it('never exceeds 1 and is full at the level cap', () => {
    expect(levelProgress(282).fraction).toBeLessThan(1);
    expect(levelProgress(1e12)).toMatchObject({ level: MAX_LEVEL, fraction: 1, xpForNextLevel: 0 });
  });
});
