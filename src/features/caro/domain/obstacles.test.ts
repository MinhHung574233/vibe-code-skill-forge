import { describe, expect, it } from 'vitest';
import { BOARD_SIZES, cellIndex, colOf, rowOf, type BoardSize } from './board';
import { OBSTACLE_COUNTS, isValidObstacleSet, obstacleSites, placeObstacles } from './obstacles';

const chebyshev = (size: number, a: number, b: number) =>
  Math.max(Math.abs(rowOf(size, a) - rowOf(size, b)), Math.abs(colOf(size, a) - colOf(size, b)));

describe('placeObstacles', () => {
  it('is deterministic for a size, count and seed, and differs between seeds', () => {
    expect(placeObstacles(19, 3, 42)).toEqual(placeObstacles(19, 3, 42));
    const layouts = new Set(
      Array.from({ length: 20 }, (_, seed) => placeObstacles(19, 3, seed).join(',')),
    );
    expect(layouts.size).toBeGreaterThan(10);
  });

  it('places nothing for 0 and rejects counts the setup does not offer', () => {
    expect(placeObstacles(15, 0, 1)).toEqual([]);
    expect(() => placeObstacles(15, 7, 1)).toThrow(RangeError);
    expect(OBSTACLE_COUNTS).toEqual([0, 3]);
  });

  it.each(BOARD_SIZES)('%i: obeys every constraint for 200 seeds', (size) => {
    const mid = Math.floor(size / 2);
    for (let seed = 0; seed < 200; seed++) {
      const cells = placeObstacles(size, 3, seed);
      expect(cells).toHaveLength(3);
      expect(new Set(cells).size).toBe(3);
      expect([...cells].sort((a, b) => a - b)).toEqual(cells);
      for (const cell of cells) {
        const r = rowOf(size, cell);
        const c = colOf(size, cell);
        expect(r).toBeGreaterThanOrEqual(1); // not on the outer ring
        expect(r).toBeLessThanOrEqual(size - 2);
        expect(c).toBeGreaterThanOrEqual(1);
        expect(c).toBeLessThanOrEqual(size - 2);
        // not on the centre point or its eight neighbours
        expect(Math.max(Math.abs(r - mid), Math.abs(c - mid))).toBeGreaterThan(1);
      }
      for (let a = 0; a < 3; a++) {
        for (let b = a + 1; b < 3; b++) {
          expect(chebyshev(size, cells[a]!, cells[b]!)).toBeGreaterThanOrEqual(2);
        }
      }
      expect(isValidObstacleSet(size, cells)).toBe(true);
    }
  });

  it('spreads the squares out (at least 3 apart) on the big boards', () => {
    for (let seed = 0; seed < 50; seed++) {
      const cells = placeObstacles(19, 3, seed);
      expect(chebyshev(19, cells[0]!, cells[1]!)).toBeGreaterThanOrEqual(3);
      expect(chebyshev(19, cells[1]!, cells[2]!)).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('isValidObstacleSet', () => {
  const at = (r: number, c: number) => cellIndex(15, r, c);
  const ok = [at(2, 2), at(2, 12), at(12, 7)];

  it('accepts none and a good layout', () => {
    expect(isValidObstacleSet(15, [])).toBe(true);
    expect(isValidObstacleSet(15, ok)).toBe(true);
  });

  it.each([
    ['an unoffered count', [at(2, 2)]],
    ['a square on the outer ring', [at(0, 5), at(5, 2), at(12, 12)]],
    ['the centre', [at(7, 7), at(2, 2), at(12, 12)]],
    ['a neighbour of the centre', [at(6, 8), at(2, 2), at(12, 12)]],
    ['two touching squares', [at(2, 2), at(3, 3), at(12, 12)]],
    ['a repeated square', [at(2, 2), at(2, 2), at(12, 12)]],
    ['a fractional cell', [at(2, 2), 40.5, at(12, 12)]],
    ['a cell off the board', [at(2, 2), 999, at(12, 12)]],
  ])('rejects %s', (_name, cells) => {
    expect(isValidObstacleSet(15, cells)).toBe(false);
  });

  it('only offers inner sites that avoid the centre block', () => {
    for (const size of BOARD_SIZES as readonly BoardSize[]) {
      const sites = obstacleSites(size);
      expect(sites).not.toContain(cellIndex(size, Math.floor(size / 2), Math.floor(size / 2)));
      expect(sites).not.toContain(0);
    }
  });
});
