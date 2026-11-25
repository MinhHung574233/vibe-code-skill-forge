import { describe, expect, it } from 'vitest';
import { cellIndex } from './board';
import { winningLine } from './rules';

const SIZE = 15;
const idx = (r: number, c: number) => cellIndex(SIZE, r, c);

type Placed = readonly [row: number, col: number, stone: 1 | 2];

function board(stones: readonly Placed[]): Uint8Array {
  const cells = new Uint8Array(SIZE * SIZE);
  for (const [r, c, s] of stones) cells[idx(r, c)] = s;
  return cells;
}

const run = (r: number, c: number, dr: number, dc: number, n: number): Placed[] =>
  Array.from({ length: n }, (_, i) => [r + i * dr, c + i * dc, 1] as const);

describe('winningLine (five or more wins)', () => {
  it.each([
    ['horizontal', 0, 1],
    ['vertical', 1, 0],
    ['diagonal', 1, 1],
    ['anti-diagonal', 1, -1],
  ] as const)('detects five on the %s from any of its stones', (_name, dr, dc) => {
    const stones = run(5, 6, dr, dc, 5);
    const cells = board(stones);
    for (const [r, c] of stones) {
      expect(winningLine(cells, SIZE, idx(r, c))).toEqual(stones.map(([a, b]) => idx(a, b)));
    }
  });

  it('does not accept four in a row', () => {
    expect(winningLine(board(run(7, 3, 0, 1, 4)), SIZE, idx(7, 3))).toBeNull();
  });

  it('does not accept a five broken by an opponent stone or a gap', () => {
    const blocked = board([...run(7, 3, 0, 1, 2), [7, 5, 2], ...run(7, 6, 0, 1, 3)]);
    expect(winningLine(blocked, SIZE, idx(7, 3))).toBeNull();
    expect(winningLine(blocked, SIZE, idx(7, 7))).toBeNull();
    const gap = board([...run(7, 3, 0, 1, 2), ...run(7, 6, 0, 1, 3)]);
    expect(winningLine(gap, SIZE, idx(7, 6))).toBeNull();
  });

  it('counts six or more (overline) and highlights the whole run', () => {
    expect(winningLine(board(run(3, 2, 0, 1, 6)), SIZE, idx(3, 4))).toHaveLength(6);
  });

  it('counts a five blocked at both ends (no Vietnamese-Caro blocked-five rule)', () => {
    const cells = board([...run(7, 4, 0, 1, 5), [7, 3, 2], [7, 9, 2]]);
    expect(winningLine(cells, SIZE, idx(7, 6))).toHaveLength(5);
  });

  it('works on the board edge and corner', () => {
    expect(winningLine(board(run(0, 0, 1, 1, 5)), SIZE, idx(4, 4))).toHaveLength(5);
    expect(winningLine(board(run(14, 10, 0, 1, 5)), SIZE, idx(14, 10))).toHaveLength(5);
    expect(winningLine(board(run(0, 14, 1, -1, 5)), SIZE, idx(2, 12))).toHaveLength(5);
  });

  it('does not wrap around the edges of the flat array', () => {
    // End of one row and start of the next are adjacent in memory, not on the board.
    const cells = board([
      [3, 13, 1],
      [3, 14, 1],
      [4, 0, 1],
      [4, 1, 1],
      [4, 2, 1],
    ]);
    expect(winningLine(cells, SIZE, idx(4, 0))).toBeNull();
  });

  it('returns null for an empty cell', () => {
    expect(winningLine(board([]), SIZE, idx(7, 7))).toBeNull();
  });
});
