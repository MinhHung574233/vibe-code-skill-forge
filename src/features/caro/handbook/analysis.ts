import { OBSTACLE, otherStone, type Stone } from '../domain/board';
import { runWins, winningLine, type CaroRule } from '../domain/rules';
import type { Edge, Goal, Spot, WrongKind } from './types';

/**
 * Pure helpers that turn a diagram into a real position and ask the real rules about it. The app
 * only needs `embed` / `spotIndex`; the rest exists so the content tests can PROVE every claim a
 * caption or an exercise makes, using `winningLine` (the same function the game uses).
 */

interface WindowLike {
  readonly rows: readonly string[];
  readonly edges?: readonly Edge[];
  readonly board?: 9 | 15 | 19;
}

export interface Embedded {
  readonly size: number;
  readonly cells: Uint8Array;
  readonly rowOffset: number;
  readonly colOffset: number;
  readonly height: number;
  readonly width: number;
}

function offsetFor(
  windowLength: number,
  size: number,
  start: boolean,
  end: boolean,
  axis: string,
): number {
  if (windowLength > size) throw new RangeError(`${axis}: window larger than the board`);
  if (start && end) {
    if (windowLength !== size) throw new RangeError(`${axis}: both edges need the full board`);
    return 0;
  }
  if (start) return 0;
  if (end) return size - windowLength;
  return Math.floor((size - windowLength) / 2);
}

/** Places the window on a real board (15x15 unless said otherwise) so rules see the real edges. */
export function embed(window: WindowLike): Embedded {
  const size = window.board ?? 15;
  const height = window.rows.length;
  const width = window.rows[0]?.length ?? 0;
  if (window.rows.some((row) => row.length !== width)) throw new RangeError('Ragged diagram rows');
  const edges = new Set(window.edges ?? []);
  const rowOffset = offsetFor(height, size, edges.has('top'), edges.has('bottom'), 'rows');
  const colOffset = offsetFor(width, size, edges.has('left'), edges.has('right'), 'columns');
  const cells = new Uint8Array(size * size);
  window.rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      const index = (rowOffset + r) * size + colOffset + c;
      if (ch === 'X') cells[index] = 1;
      else if (ch === 'O') cells[index] = 2;
      else if (ch === '#') cells[index] = OBSTACLE;
      else if (ch !== '.') throw new RangeError(`Unknown diagram symbol "${ch}"`);
    });
  });
  return { size, cells, rowOffset, colOffset, height, width };
}

export function spotIndex(position: Embedded, spot: Spot): number {
  return (position.rowOffset + spot[0]) * position.size + position.colOffset + spot[1];
}

/** The window spot of a board index, or null when it lies outside the window. */
export function indexSpot(position: Embedded, index: number): Spot | null {
  const row = Math.floor(index / position.size) - position.rowOffset;
  const col = (index % position.size) - position.colOffset;
  return row >= 0 && row < position.height && col >= 0 && col < position.width ? [row, col] : null;
}

export function countStones(rows: readonly string[]): { x: number; o: number; blocked: number } {
  let x = 0;
  let o = 0;
  let blocked = 0;
  for (const row of rows)
    for (const ch of row) {
      if (ch === 'X') x++;
      else if (ch === 'O') o++;
      else if (ch === '#') blocked++;
    }
  return { x, o, blocked };
}

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Same answer as `winningLine(cells, size, last, rule) !== null`, without building the line (this
 * is the hot loop of every proof below). It shares `runWins` with the game; the tests compare the
 * two on random boards.
 */
export function makesWin(
  cells: ArrayLike<number>,
  size: number,
  last: number,
  rule: CaroRule,
): boolean {
  const stone = cells[last];
  if (stone !== 1 && stone !== 2) return false;
  const row = Math.floor(last / size);
  const col = last % size;
  for (const [dr, dc] of DIRECTIONS) {
    let length = 1;
    const ends: (number | undefined)[] = [undefined, undefined];
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1;
      let r = row + sign * dr;
      let c = col + sign * dc;
      while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
        length++;
        r += sign * dr;
        c += sign * dc;
      }
      if (r >= 0 && r < size && c >= 0 && c < size) ends[side] = cells[r * size + c];
    }
    if (runWins(rule, length, ends[0], ends[1])) return true;
  }
  return false;
}

/**
 * Empty cells next to (within `radius` of) a stone of `stone`, in board order. Any cell that
 * completes or extends one of that colour's lines is adjacent to one of its stones, so radius 1
 * is enough to find fours and fives and keeps the proofs fast.
 */
function emptyCellsNear(cells: Uint8Array, size: number, stone: number, radius: number): number[] {
  const seen = new Uint8Array(cells.length);
  const out: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== stone) continue;
    const row = Math.floor(i / size);
    const col = i % size;
    for (let dr = -radius; dr <= radius; dr++)
      for (let dc = -radius; dc <= radius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const j = r * size + c;
        if (cells[j] === 0 && !seen[j]) {
          seen[j] = 1;
          out.push(j);
        }
      }
  }
  return out.sort((a, b) => a - b);
}

/** Every empty cell where `stone` would complete a WINNING run next move. */
export function completingCells(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  rule: CaroRule,
): number[] {
  const out: number[] = [];
  for (const i of emptyCellsNear(cells, size, stone, 1)) {
    cells[i] = stone;
    if (makesWin(cells, size, i, rule)) out.push(i);
    cells[i] = 0;
  }
  return out;
}

/** Whether a stone placed on an empty cell wins at once. */
export function winsAt(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  index: number,
  rule: CaroRule,
): boolean {
  if (cells[index] !== 0) return false;
  cells[index] = stone;
  const wins = makesWin(cells, size, index, rule);
  cells[index] = 0;
  return wins;
}

/** True when a stone at `index` makes five or more that the rule rejects (both ends walled). */
export function isDeadFiveAt(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  index: number,
  rule: CaroRule,
): boolean {
  if (cells[index] !== 0) return false;
  cells[index] = stone;
  const dead =
    winningLine(cells, size, index, 'freestyle') !== null &&
    winningLine(cells, size, index, rule) === null;
  cells[index] = 0;
  return dead;
}

/** Cells where playing makes an OPEN four: two or more different ways to win next move. */
export function openFourCells(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  rule: CaroRule,
): number[] {
  const opponent = otherStone(stone);
  const out: number[] = [];
  for (const i of emptyCellsNear(cells, size, stone, 1)) {
    cells[i] = stone;
    const wins = makesWin(cells, size, i, rule);
    if (
      !wins &&
      completingCells(cells, size, stone, rule).length >= 2 &&
      completingCells(cells, size, opponent, rule).length === 0
    ) {
      out.push(i);
    }
    cells[i] = 0;
  }
  return out;
}

/**
 * True when `stone`, to move, wins by a chain of fours: each four forces one reply, and the chain
 * ends in a five or in a double threat. The opponent must not be able to win or make a four of
 * their own along the way.
 */
export function winsByFours(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  rule: CaroRule,
  depth: number,
): boolean {
  const opponent = otherStone(stone);
  if (completingCells(cells, size, stone, rule).length > 0) return true;
  if (depth <= 0) return false;
  for (const i of emptyCellsNear(cells, size, stone, 1)) {
    cells[i] = stone;
    const threats = completingCells(cells, size, stone, rule);
    let won = false;
    if (threats.length > 0 && completingCells(cells, size, opponent, rule).length === 0) {
      if (threats.length >= 2) won = true;
      else {
        const block = threats[0]!;
        cells[block] = opponent;
        if (completingCells(cells, size, opponent, rule).length === 0) {
          won = winsByFours(cells, size, stone, rule, depth - 1);
        }
        cells[block] = 0;
      }
    }
    cells[i] = 0;
    if (won) return true;
  }
  return false;
}

const stoneOnBoard = (value: number | undefined): boolean => value === 1 || value === 2;

/** Empty cells within two steps of any stone: the only ones that can matter in these positions. */
function nearCells(cells: Uint8Array, size: number): number[] {
  const near = new Set<number>();
  for (let i = 0; i < cells.length; i++) {
    if (!stoneOnBoard(cells[i])) continue;
    const row = Math.floor(i / size);
    const col = i % size;
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === 0) {
          near.add(r * size + c);
        }
      }
  }
  return [...near];
}

/** An empty cell far from every stone: stands for "the opponent plays somewhere irrelevant". */
function farCell(cells: Uint8Array, size: number): number | null {
  const stones: number[] = [];
  for (let i = 0; i < cells.length; i++) if (stoneOnBoard(cells[i])) stones.push(i);
  let best = -1;
  let bestDistance = -1;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== 0) continue;
    let nearest = Infinity;
    for (const j of stones) {
      nearest = Math.min(
        nearest,
        Math.max(
          Math.abs(Math.floor(i / size) - Math.floor(j / size)),
          Math.abs((i % size) - (j % size)),
        ),
      );
    }
    if (nearest > bestDistance) {
      bestDistance = nearest;
      best = i;
    }
  }
  return best >= 0 ? best : null;
}

/**
 * Playing `move` leaves the opponent no defence by the "everything they try" test: they have no
 * four to counter with, and whatever single move they make next, `stone` still gets an open four
 * (or a winning chain of fours). This is how a double three is proven.
 */
export function leavesNoDefence(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  move: number,
  rule: CaroRule,
): boolean {
  const opponent = otherStone(stone);
  if (cells[move] !== 0) return false;
  cells[move] = stone;
  try {
    if (completingCells(cells, size, opponent, rule).length > 0) return false;
    const replies = nearCells(cells, size);
    const far = farCell(cells, size);
    if (far !== null) replies.unshift(far); // "pass" first: it fails fastest when there is no threat
    for (const reply of replies) {
      cells[reply] = opponent;
      let holds = false;
      if (completingCells(cells, size, opponent, rule).length === 0) {
        holds =
          openFourCells(cells, size, stone, rule).length > 0 ||
          winsByFours(cells, size, stone, rule, 4);
      }
      cells[reply] = 0;
      if (!holds) return false;
    }
    return true;
  } finally {
    cells[move] = 0;
  }
}

/** A move after which `stone` wins by force: five now, an open four, a four-three or a three-three. */
export function isForcedWin(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  move: number,
  rule: CaroRule,
  /** false skips the slow "no defence against a quiet double threat" proof (a cheap first pass). */
  quiet = true,
): boolean {
  if (cells[move] !== 0) return false;
  if (winsAt(cells, size, stone, move, rule)) return true;
  const opponent = otherStone(stone);
  cells[move] = stone;
  let decided: boolean | null = null;
  try {
    if (completingCells(cells, size, opponent, rule).length > 0) decided = false;
    else {
      const threats = completingCells(cells, size, stone, rule);
      if (threats.length >= 2) decided = true;
      else if (threats.length === 1) {
        const block = threats[0]!;
        cells[block] = opponent;
        decided =
          completingCells(cells, size, opponent, rule).length === 0 &&
          (openFourCells(cells, size, stone, rule).length > 0 ||
            winsByFours(cells, size, stone, rule, 4));
        cells[block] = 0;
      }
    }
  } finally {
    cells[move] = 0;
  }
  if (decided !== null) return decided;
  return quiet && leavesNoDefence(cells, size, stone, move, rule);
}

/** Every empty cell near the stones that is a forced win for `stone`. */
export function forcedWinCells(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  rule: CaroRule,
): number[] {
  return nearCells(cells, size).filter((i) => isForcedWin(cells, size, stone, i, rule));
}

/**
 * After `move` by `stone`, can the opponent still force a win by themselves next turn? True means
 * the move failed to stop something (an open four, a four-three, a three-three...).
 */
export function opponentStillWins(
  cells: Uint8Array,
  size: number,
  stone: Stone,
  move: number,
  rule: CaroRule,
): boolean {
  if (cells[move] !== 0) return true;
  const opponent = otherStone(stone);
  cells[move] = stone;
  try {
    if (winsAt(cells, size, stone, move, rule)) return false; // we won
    // Cheap proofs (five, open four, four-three) over every cell first; the slow double-three
    // proof only runs when none of them exists. Same answer as one pass, much faster to refute.
    const near = nearCells(cells, size);
    return (
      near.some((i) => isForcedWin(cells, size, opponent, i, rule, false)) ||
      near.some((i) => isForcedWin(cells, size, opponent, i, rule, true))
    );
  } finally {
    cells[move] = 0;
  }
}

/** All cells (near the stones) that have `goal` for the first player, who is to move. */
export function goalCells(goal: Goal, cells: Uint8Array, size: number, rule: CaroRule): number[] {
  const me: Stone = 1;
  const opponent: Stone = 2;
  switch (goal) {
    case 'five':
      return completingCells(cells, size, me, rule);
    case 'unstoppable-four':
      return openFourCells(cells, size, me, rule);
    case 'block-four': {
      if (completingCells(cells, size, opponent, rule).length === 0) return [];
      return nearCells(cells, size).filter((m) => {
        cells[m] = me;
        const stopped = completingCells(cells, size, opponent, rule).length === 0;
        cells[m] = 0;
        return stopped;
      });
    }
    case 'four-three':
      return nearCells(cells, size).filter((m) => {
        cells[m] = me;
        const fours = completingCells(cells, size, me, rule).length;
        cells[m] = 0;
        return fours === 1 && isForcedWin(cells, size, me, m, rule);
      });
    case 'three-three':
      return nearCells(cells, size).filter((m) => {
        cells[m] = me;
        const fours = completingCells(cells, size, me, rule).length;
        cells[m] = 0;
        return fours === 0 && leavesNoDefence(cells, size, me, m, rule);
      });
    case 'safe':
      return nearCells(cells, size).filter((m) => !opponentStillWins(cells, size, me, m, rule));
  }
}

/** The ways a wrong answer can be wrong; each is checked against the real rules in the tests. */
export function wrongHasKind(
  kind: WrongKind,
  cells: Uint8Array,
  size: number,
  move: number,
  rule: CaroRule,
): boolean {
  const me: Stone = 1;
  const opponent: Stone = 2;
  switch (kind) {
    case 'dead-five':
      return isDeadFiveAt(cells, size, me, move, rule);
    case 'closed-four': {
      cells[move] = me;
      const fours = completingCells(cells, size, me, rule).length;
      cells[move] = 0;
      return fours === 1;
    }
    case 'leaves-five': {
      cells[move] = me;
      const left = completingCells(cells, size, opponent, rule).length;
      cells[move] = 0;
      return left > 0;
    }
    case 'opponent-forces':
      return opponentStillWins(cells, size, me, move, rule);
    case 'dead-four': {
      cells[move] = me;
      const real = completingCells(cells, size, me, rule).length;
      const nominal = completingCells(cells, size, me, 'freestyle').length;
      cells[move] = 0;
      return real === 0 && nominal > 0;
    }
    case 'wasted-block':
      return isDeadFiveAt(cells, size, opponent, move, rule);
  }
}
