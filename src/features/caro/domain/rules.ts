import { OBSTACLE, WIN_LENGTH } from './board';

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * RULES. Two variants share one board model; the engine, the tests and the UI all call
 * `winningLine`, so they cannot disagree.
 *
 * 'freestyle': five OR MORE stones of one colour in an unbroken row, column or diagonal win.
 *   Overlines (six or more) count and a five blocked at both ends still wins.
 *
 * 'blocked' (the Vietnamese "chan hai dau" rule): five or more in a row win UNLESS both cells at
 *   the two ends of that run are occupied by opponent stones or blocked squares. A run that
 *   touches the board edge is NOT blocked at that end (the edge never counts as a blocker). A run
 *   blocked at one end only still wins. The game simply goes on after a doubly blocked five.
 *
 * Blocked squares (OBSTACLE cells): unplayable, never part of a line, and a wall for the
 *   'blocked' rule. In 'freestyle' they only break lines.
 *
 * Returns every cell of the winning run through `last` (so the UI can highlight an overline in
 * full), or null when the stone just placed at `last` did not complete a winning run.
 */
export type CaroRule = 'freestyle' | 'blocked';

export const CARO_RULES: readonly CaroRule[] = ['freestyle', 'blocked'];

export function isCaroRule(value: unknown): value is CaroRule {
  return value === 'freestyle' || value === 'blocked';
}

/** True when the cell at the end of a run stops it: any opponent stone or blocked square. */
export const isWall = (cell: number | undefined): boolean => cell !== undefined && cell !== 0;

/**
 * Whether a run of `stone` is blocked at BOTH ends. `end1`/`end2` are the cells just beyond the
 * run, or `undefined` off the board (the edge is not a blocker).
 */
export function isBlockedBothEnds(end1: number | undefined, end2: number | undefined): boolean {
  return isWall(end1) && isWall(end2);
}

/** A run of `length` (>= WIN_LENGTH) wins under `rule` given the two cells just beyond it. */
export function runWins(
  rule: CaroRule,
  length: number,
  end1: number | undefined,
  end2: number | undefined,
): boolean {
  if (length < WIN_LENGTH) return false;
  return rule === 'freestyle' || !isBlockedBothEnds(end1, end2);
}

export function winningLine(
  cells: ArrayLike<number>,
  size: number,
  last: number,
  rule: CaroRule = 'freestyle',
): readonly number[] | null {
  const stone = cells[last];
  if (!stone || stone === OBSTACLE) return null;
  const row = Math.floor(last / size);
  const col = last % size;

  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = [last];
    const ends: (number | undefined)[] = [undefined, undefined];
    for (const sign of [1, -1]) {
      let r = row + sign * dr;
      let c = col + sign * dc;
      while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
        const index = r * size + c;
        if (sign === 1) line.push(index);
        else line.unshift(index);
        r += sign * dr;
        c += sign * dc;
      }
      if (r >= 0 && r < size && c >= 0 && c < size) ends[sign === 1 ? 0 : 1] = cells[r * size + c];
    }
    if (runWins(rule, line.length, ends[0], ends[1])) return line;
  }
  return null;
}

/**
 * True when the stone at `last` completed a run of five or more that the 'blocked' rule rejects
 * because both ends are walled. Used for the one-time "that five is blocked" hint.
 */
export function isDeadFive(cells: ArrayLike<number>, size: number, last: number): boolean {
  return (
    winningLine(cells, size, last, 'freestyle') !== null &&
    winningLine(cells, size, last, 'blocked') === null
  );
}

/**
 * Whether `stone` placed on the (empty) cell `at` would win under `rule`. Reads `cells` without
 * changing it and allocates nothing, so the engine can call it inside its search.
 */
export function wouldWin(
  cells: ArrayLike<number>,
  size: number,
  at: number,
  stone: number,
  rule: CaroRule,
): boolean {
  const row = Math.floor(at / size);
  const col = at % size;
  for (let d = 0; d < 4; d++) {
    const dr = DIRECTIONS[d]![0];
    const dc = DIRECTIONS[d]![1];
    let length = 1;
    let end1: number | undefined;
    let end2: number | undefined;
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
      length++;
      r += dr;
      c += dc;
    }
    if (r >= 0 && r < size && c >= 0 && c < size) end1 = cells[r * size + c];
    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
      length++;
      r -= dr;
      c -= dc;
    }
    if (r >= 0 && r < size && c >= 0 && c < size) end2 = cells[r * size + c];
    if (runWins(rule, length, end1, end2)) return true;
  }
  return false;
}
