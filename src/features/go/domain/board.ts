/**
 * Go board and the move rules that need no game history: liberties, capture, suicide.
 *
 * Rules implemented here (everything else lives in game.ts / scoring.ts):
 *  - A group is a maximal set of orthogonally connected stones of one colour; its liberties are
 *    the distinct empty points next to it.
 *  - A stone is placed, then every adjacent opponent group without liberties is captured, and only
 *    then is the placed stone's own group checked. So a move that captures is never suicide.
 *  - **Suicide is illegal**: a move that leaves its own group without liberties (and captured
 *    nothing) is rejected. (New Zealand rules allow it; Chinese, Japanese and AGA rules, and the
 *    ones this module teaches, do not.)
 *
 * The board is mutable for speed (the AI plays out thousands of games); game-level code treats it
 * as immutable by calling `clone()` before `play()`. Scratch buffers are module-level, so none of
 * these methods are re-entrant, which is safe because they never call back into user code.
 */

import { createRng } from './rng';

export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;
export type Color = typeof BLACK | typeof WHITE;
export type Cell = typeof EMPTY | Color;

export const opponent = (color: Color): Color => (color === BLACK ? WHITE : BLACK);

export const BOARD_SIZES = [9, 13, 19] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
const MAX_POINTS = 19 * 19;

/**
 * The shape of a board: which points exist and how they touch. Square boards are the normal
 * case; the tsumego module uses rectangles with blocked points (the part of the board that is
 * outside the cropped problem), which behave exactly like the edge of the board.
 */
export interface Topology {
  readonly width: number;
  readonly height: number;
  readonly count: number;
  /** `playable[p]` is 1 when the point exists. */
  readonly playable: Uint8Array;
  readonly neighbors: readonly Int16Array[];
  readonly diagonals: readonly Int16Array[];
}

export function createTopology(
  width: number,
  height: number,
  blocked: ReadonlySet<number> = new Set(),
): Topology {
  const count = width * height;
  const playable = new Uint8Array(count);
  const neighbors: Int16Array[] = [];
  const diagonals: Int16Array[] = [];
  const exists = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && !blocked.has(y * width + x);
  for (let p = 0; p < count; p++) {
    const x = p % width;
    const y = Math.floor(p / width);
    playable[p] = exists(x, y) ? 1 : 0;
    const near: number[] = [];
    const diag: number[] = [];
    if (playable[p]) {
      for (const [dx, dy] of [
        [0, -1],
        [-1, 0],
        [1, 0],
        [0, 1],
      ] as const) {
        if (exists(x + dx, y + dy)) near.push((y + dy) * width + x + dx);
      }
      for (const [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        if (exists(x + dx, y + dy)) diag.push((y + dy) * width + x + dx);
      }
    }
    neighbors.push(Int16Array.from(near));
    diagonals.push(Int16Array.from(diag));
  }
  return { width, height, count, playable, neighbors, diagonals };
}

const squareCache = new Map<number, Topology>();
export function squareTopology(size: number): Topology {
  let topology = squareCache.get(size);
  if (!topology) {
    topology = createTopology(size, size);
    squareCache.set(size, topology);
  }
  return topology;
}

export const pointOf = (topology: Topology, x: number, y: number): number => y * topology.width + x;
export const xOf = (topology: Topology, p: number): number => p % topology.width;
export const yOf = (topology: Topology, p: number): number => Math.floor(p / topology.width);

// --- Zobrist hashing -------------------------------------------------------------------------
// Two independent 32-bit tables give a 64-bit hash per position; the board maintains it
// incrementally. Only 53 bits are exposed as a number key, and superko detection confirms every
// hash match by comparing the boards, so a collision can never forbid a legal move.

const ZOBRIST_HI = new Uint32Array(MAX_POINTS * 2);
const ZOBRIST_LO = new Uint32Array(MAX_POINTS * 2);
{
  const rng = createRng(0x60b0a4d);
  for (let i = 0; i < ZOBRIST_HI.length; i++) {
    ZOBRIST_HI[i] = Math.floor(rng.next() * 4294967296) >>> 0;
    ZOBRIST_LO[i] = Math.floor(rng.next() * 4294967296) >>> 0;
  }
}

// --- scratch buffers -------------------------------------------------------------------------
const stack = new Int16Array(MAX_POINTS);
const stoneMark = new Uint32Array(MAX_POINTS);
const libertyMark = new Uint32Array(MAX_POINTS);
let stamp = 0;
const nextStamp = (): number => {
  stamp += 1;
  if (stamp === 0xffffffff) {
    stoneMark.fill(0);
    libertyMark.fill(0);
    stamp = 1;
  }
  return stamp;
};

export type PlayRejection = 'occupied' | 'suicide' | 'off-board';
export type PlayResult =
  | {
      ok: true;
      /** Points of the opponent stones removed by this move. */
      captured: number[];
      /**
       * The simple-ko point: set when exactly one stone was captured and the capturing stone now
       * sits alone in atari, so the opponent could recapture straight away. -1 otherwise.
       */
      ko: number;
    }
  | { ok: false; reason: PlayRejection };

export interface GroupInfo {
  stones: number[];
  liberties: number[];
}

export class Board {
  readonly topology: Topology;
  readonly cells: Uint8Array;
  hashHi = 0;
  hashLo = 0;

  constructor(topology: Topology, cells?: Uint8Array, hash?: { hi: number; lo: number }) {
    this.topology = topology;
    this.cells = cells ?? new Uint8Array(topology.count);
    if (hash) {
      this.hashHi = hash.hi;
      this.hashLo = hash.lo;
    } else if (cells) {
      for (let p = 0; p < cells.length; p++) {
        const c = cells[p] ?? 0;
        if (c !== EMPTY) this.toggleHash(p, c);
      }
    }
  }

  static empty(size: number): Board {
    return new Board(squareTopology(size));
  }

  clone(): Board {
    return new Board(this.topology, this.cells.slice(), { hi: this.hashHi, lo: this.hashLo });
  }

  get size(): number {
    return this.topology.width;
  }

  get(p: number): Cell {
    return (this.cells[p] ?? EMPTY) as Cell;
  }

  /** 53-bit position key (stones only: whose turn it is does not matter for positional superko). */
  hashKey(): number {
    return (this.hashHi & 0x1fffff) * 4294967296 + (this.hashLo >>> 0);
  }

  equals(other: Board): boolean {
    if (this.hashHi !== other.hashHi || this.hashLo !== other.hashLo) return false;
    const a = this.cells;
    const b = other.cells;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  /** Put a stone without any rule checks (setup positions: handicap stones, test fixtures). */
  setStone(p: number, color: Cell): void {
    const old = this.cells[p] ?? EMPTY;
    if (old !== EMPTY) this.toggleHash(p, old);
    this.cells[p] = color;
    if (color !== EMPTY) this.toggleHash(p, color);
  }

  private toggleHash(p: number, color: number): void {
    const i = p * 2 + (color - 1);
    this.hashHi = (this.hashHi ^ (ZOBRIST_HI[i] ?? 0)) >>> 0;
    this.hashLo = (this.hashLo ^ (ZOBRIST_LO[i] ?? 0)) >>> 0;
  }

  /** The group containing the stone at `p` and its distinct liberties (empty arrays for an empty point). */
  group(p: number): GroupInfo {
    const color = this.cells[p];
    const stones: number[] = [];
    const liberties: number[] = [];
    if (!color) return { stones, liberties };
    const t = this.topology;
    const s = nextStamp();
    let top = 0;
    stack[top++] = p;
    stoneMark[p] = s;
    while (top > 0) {
      const q = stack[--top] as number;
      stones.push(q);
      for (const n of t.neighbors[q] as Int16Array) {
        const c = this.cells[n];
        if (c === EMPTY) {
          if (libertyMark[n] !== s) {
            libertyMark[n] = s;
            liberties.push(n);
          }
        } else if (c === color && stoneMark[n] !== s) {
          stoneMark[n] = s;
          stack[top++] = n;
        }
      }
    }
    return { stones, liberties };
  }

  /** Number of liberties of the group at `p` (0 for an empty point). */
  libertyCount(p: number): number {
    const color = this.cells[p];
    if (!color) return 0;
    const t = this.topology;
    const s = nextStamp();
    let top = 0;
    let libs = 0;
    stack[top++] = p;
    stoneMark[p] = s;
    while (top > 0) {
      const q = stack[--top] as number;
      for (const n of t.neighbors[q] as Int16Array) {
        const c = this.cells[n];
        if (c === EMPTY) {
          if (libertyMark[n] !== s) {
            libertyMark[n] = s;
            libs++;
          }
        } else if (c === color && stoneMark[n] !== s) {
          stoneMark[n] = s;
          stack[top++] = n;
        }
      }
    }
    return libs;
  }

  /**
   * Flood fills the group at `p`. Returns its stones when it has no liberty at all, and `null` as
   * soon as one liberty is found (the common case, so most checks end early).
   */
  private stonesIfDead(p: number, color: number): number[] | null {
    const t = this.topology;
    const s = nextStamp();
    const stones: number[] = [];
    let top = 0;
    stack[top++] = p;
    stoneMark[p] = s;
    while (top > 0) {
      const q = stack[--top] as number;
      stones.push(q);
      for (const n of t.neighbors[q] as Int16Array) {
        const c = this.cells[n];
        if (c === EMPTY) return null;
        if (c === color && stoneMark[n] !== s) {
          stoneMark[n] = s;
          stack[top++] = n;
        }
      }
    }
    return stones;
  }

  /**
   * Plays `color` at `p`. On success the board is updated (stone placed, captures removed); on
   * failure the board is left exactly as it was.
   */
  play(p: number, color: Color): PlayResult {
    const t = this.topology;
    if (p < 0 || p >= t.count || !t.playable[p]) return { ok: false, reason: 'off-board' };
    if (this.cells[p] !== EMPTY) return { ok: false, reason: 'occupied' };

    const enemy = opponent(color);
    this.cells[p] = color;
    const captured: number[] = [];
    for (const n of t.neighbors[p] as Int16Array) {
      if (this.cells[n] !== enemy) continue; // empty after an earlier capture, or not an enemy
      const dead = this.stonesIfDead(n, enemy);
      if (dead) for (const q of dead) captured.push(q);
      if (dead) for (const q of dead) this.cells[q] = EMPTY;
    }

    if (captured.length === 0 && this.libertyCount(p) === 0) {
      this.cells[p] = EMPTY; // nothing was removed, so undoing the placement restores the board
      return { ok: false, reason: 'suicide' };
    }

    this.toggleHash(p, color);
    for (const q of captured) this.toggleHash(q, enemy);

    let ko = -1;
    if (captured.length === 1) {
      let friends = 0;
      let empties = 0;
      for (const n of t.neighbors[p] as Int16Array) {
        if (this.cells[n] === color) friends++;
        else if (this.cells[n] === EMPTY) empties++;
      }
      if (friends === 0 && empties === 1) ko = captured[0] as number;
    }
    return { ok: true, captured, ko };
  }

  /** Whether `color` could play at `p` right now (ignores ko and superko, which need history). */
  isLegal(p: number, color: Color): boolean {
    if (this.cells[p] !== EMPTY || !this.topology.playable[p]) return false;
    return this.clone().play(p, color).ok;
  }

  stoneCount(color: Color): number {
    let n = 0;
    for (const c of this.cells) if (c === color) n++;
    return n;
  }

  /** Text diagram, one row per line: `.` empty, `X` black, `O` white. Handy in tests. */
  toRows(): string[] {
    const t = this.topology;
    const rows: string[] = [];
    for (let y = 0; y < t.height; y++) {
      let row = '';
      for (let x = 0; x < t.width; x++) {
        const p = y * t.width + x;
        row += !t.playable[p]
          ? '#'
          : this.cells[p] === BLACK
            ? 'X'
            : this.cells[p] === WHITE
              ? 'O'
              : '.';
      }
      rows.push(row);
    }
    return rows;
  }
}

const CHAR_TO_CELL: Record<string, Cell | 'wall'> = {
  '.': EMPTY,
  X: BLACK,
  O: WHITE,
  '#': 'wall',
};

/**
 * Builds a board from a text diagram (`.` empty, `X` black, `O` white, `#` outside the board).
 * Rows must have equal length. Used for tsumego data and for readable test fixtures.
 */
export function boardFromRows(rows: readonly string[]): Board {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (height === 0 || width === 0) throw new RangeError('Board diagram is empty.');
  const blocked = new Set<number>();
  const stones: [number, Color][] = [];
  rows.forEach((row, y) => {
    if (row.length !== width) throw new RangeError(`Board row ${y} has the wrong length.`);
    [...row].forEach((ch, x) => {
      const cell = CHAR_TO_CELL[ch];
      if (cell === undefined) throw new RangeError(`Unknown board character "${ch}".`);
      if (cell === 'wall') blocked.add(y * width + x);
      else if (cell !== EMPTY) stones.push([y * width + x, cell]);
    });
  });
  const topology =
    blocked.size === 0 ? squareOrRect(width, height) : createTopology(width, height, blocked);
  const board = new Board(topology);
  for (const [p, color] of stones) board.setStone(p, color);
  return board;
}

function squareOrRect(width: number, height: number): Topology {
  return width === height ? squareTopology(width) : createTopology(width, height);
}
