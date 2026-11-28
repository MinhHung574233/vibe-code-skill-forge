import { describe, expect, it } from 'vitest';
import { OBSTACLE, cellIndex } from './board';
import { mulberry32 } from './rng';
import { isDeadFive, winningLine, wouldWin, type CaroRule } from './rules';

const SIZE = 15;
const idx = (r: number, c: number) => cellIndex(SIZE, r, c);

type Dir = readonly [number, number];
const DIRS: readonly (readonly [string, Dir])[] = [
  ['horizontal', [0, 1]],
  ['vertical', [1, 0]],
  ['diagonal', [1, 1]],
  ['anti-diagonal', [1, -1]],
];

/** A run of `n` stone-1 cells starting at (r, c) going along `dir`, plus the cells beyond both ends. */
function runBoard(
  r: number,
  c: number,
  [dr, dc]: Dir,
  n: number,
  before: number,
  after: number,
): { cells: Uint8Array; run: number[] } {
  const cells = new Uint8Array(SIZE * SIZE);
  const run: number[] = [];
  for (let k = 0; k < n; k++) {
    const cell = idx(r + k * dr, c + k * dc);
    cells[cell] = 1;
    run.push(cell);
  }
  if (before) cells[idx(r - dr, c - dc)] = before;
  if (after) cells[idx(r + n * dr, c + n * dc)] = after;
  return { cells, run };
}

const wins = (cells: Uint8Array, last: number, rule: CaroRule) =>
  winningLine(cells, SIZE, last, rule) !== null;

describe('rule truth table (five in a row, ends given as 0 empty, 2 opponent, 3 blocked square)', () => {
  // [before, after, wins under freestyle, wins under blocked]
  const TABLE: readonly (readonly [number, number, boolean, boolean])[] = [
    [0, 0, true, true],
    [2, 0, true, true],
    [0, 2, true, true],
    [OBSTACLE, 0, true, true],
    [0, OBSTACLE, true, true],
    [2, 2, true, false],
    [OBSTACLE, OBSTACLE, true, false],
    [2, OBSTACLE, true, false],
    [OBSTACLE, 2, true, false],
  ];

  describe.each(DIRS)('%s', (_name, dir) => {
    it.each(TABLE)(
      'ends (%i, %i): freestyle wins=%s, blocked wins=%s',
      (before, after, free, blocked) => {
        const { cells, run } = runBoard(5, 5, dir, 5, before, after);
        for (const cell of run) {
          expect(wins(cells, cell, 'freestyle')).toBe(free);
          expect(wins(cells, cell, 'blocked')).toBe(blocked);
        }
      },
    );
  });

  it('defaults to freestyle', () => {
    const { cells, run } = runBoard(5, 5, [0, 1], 5, 2, 2);
    expect(winningLine(cells, SIZE, run[2]!)).toHaveLength(5);
  });

  it('does not count four, however it is closed', () => {
    const { cells, run } = runBoard(5, 5, [0, 1], 4, 0, 0);
    expect(wins(cells, run[0]!, 'blocked')).toBe(false);
  });
});

describe('the board edge is not a blocker', () => {
  it('a five touching the edge with an opponent stone at the other end still wins', () => {
    // Row 7, columns 0-4, opponent at column 5: the left end is the edge.
    const cells = new Uint8Array(SIZE * SIZE);
    for (let c = 0; c < 5; c++) cells[idx(7, c)] = 1;
    cells[idx(7, 5)] = 2;
    expect(wins(cells, idx(7, 2), 'blocked')).toBe(true);
  });

  it('a five touching the edge at both ends wins (a 5-wide strip of the board)', () => {
    // Column 14, rows 10-14 against the bottom edge, opponent above.
    const cells = new Uint8Array(SIZE * SIZE);
    for (let r = 10; r < 15; r++) cells[idx(r, 14)] = 1;
    cells[idx(9, 14)] = 2;
    expect(wins(cells, idx(12, 14), 'blocked')).toBe(true);
  });

  it('a five in a corner on the diagonal wins', () => {
    const { cells, run } = runBoard(0, 0, [1, 1], 5, 0, 2);
    expect(wins(cells, run[4]!, 'blocked')).toBe(true);
  });
});

describe('overlines', () => {
  it('six in a row with both ends walled does not win under blocked, wins when free', () => {
    const { cells, run } = runBoard(7, 3, [0, 1], 6, 2, 2);
    expect(wins(cells, run[0]!, 'freestyle')).toBe(true);
    expect(wins(cells, run[0]!, 'blocked')).toBe(false);
  });

  it('six in a row with one free end wins and highlights the whole run', () => {
    const { cells, run } = runBoard(7, 3, [0, 1], 6, 2, 0);
    expect(winningLine(cells, SIZE, run[3]!, 'blocked')).toEqual(run);
  });

  it('an overline closed by a blocked square on one side and a stone on the other is dead', () => {
    const { cells, run } = runBoard(7, 3, [0, 1], 7, OBSTACLE, 2);
    expect(wins(cells, run[0]!, 'blocked')).toBe(false);
  });

  it('a win in one direction is found even when another direction is dead', () => {
    // Row 7 (columns 4-8) is walled in; column 6 (rows 3-7) is open.
    const cells = new Uint8Array(SIZE * SIZE);
    for (let c = 4; c <= 8; c++) cells[idx(7, c)] = 1;
    cells[idx(7, 3)] = 2;
    cells[idx(7, 9)] = 2;
    for (let r = 3; r <= 6; r++) cells[idx(r, 6)] = 1;
    expect(winningLine(cells, SIZE, idx(7, 6), 'blocked')).toEqual(
      [3, 4, 5, 6, 7].map((r) => idx(r, 6)),
    );
  });
});

describe('blocked squares', () => {
  it('are never part of a line, in either rule', () => {
    const cells = new Uint8Array(SIZE * SIZE);
    for (const c of [4, 5, 7, 8]) cells[idx(7, c)] = 1;
    cells[idx(7, 6)] = OBSTACLE;
    expect(wins(cells, idx(7, 5), 'freestyle')).toBe(false);
    expect(wins(cells, idx(7, 5), 'blocked')).toBe(false);
  });

  it('a blocked square is not a stone: asking about it returns no win', () => {
    const cells = new Uint8Array(SIZE * SIZE).fill(OBSTACLE);
    expect(winningLine(cells, SIZE, idx(7, 7), 'blocked')).toBeNull();
  });
});

describe('isDeadFive', () => {
  it('is true only for a five the blocked rule rejects', () => {
    const dead = runBoard(7, 3, [0, 1], 5, 2, 2);
    expect(isDeadFive(dead.cells, SIZE, dead.run[0]!)).toBe(true);
    const alive = runBoard(7, 3, [0, 1], 5, 2, 0);
    expect(isDeadFive(alive.cells, SIZE, alive.run[0]!)).toBe(false);
    const four = runBoard(7, 3, [0, 1], 4, 2, 2);
    expect(isDeadFive(four.cells, SIZE, four.run[0]!)).toBe(false);
  });
});

describe('wouldWin agrees with winningLine', () => {
  it.each(['freestyle', 'blocked'] as const)('on 400 random positions (%s)', (rule) => {
    const random = mulberry32(2024);
    for (let trial = 0; trial < 400; trial++) {
      const cells = new Uint8Array(SIZE * SIZE);
      // Dense little clusters so fives, overlines and walls actually occur.
      for (let k = 0; k < 90; k++) {
        const r = 4 + Math.floor(random() * 7);
        const c = 4 + Math.floor(random() * 7);
        const roll = random();
        cells[idx(r, c)] = roll < 0.6 ? 1 : roll < 0.9 ? 2 : OBSTACLE;
      }
      const cell = idx(4 + Math.floor(random() * 7), 4 + Math.floor(random() * 7));
      if (cells[cell] !== 0) continue;
      const expected = (() => {
        const copy = cells.slice();
        copy[cell] = 1;
        return winningLine(copy, SIZE, cell, rule) !== null;
      })();
      expect(wouldWin(cells, SIZE, cell, 1, rule)).toBe(expected);
    }
  });
});
