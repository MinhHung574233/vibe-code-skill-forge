import type { Stone } from '../board';
import { mulberry32 } from '../rng';

/**
 * The engine's mutable board. Instead of scanning lines it tracks every "window": five
 * consecutive cells in a row, column or diagonal. A window holding stones of one colour only is
 * a potential five, and the number of stones in it says how far along it is. That one structure
 * gives, incrementally and in O(windows touching the move):
 *   - the static evaluation (sum of window weights),
 *   - instant detection of "a four" (a window with 4 stones and no opponent stone): the missing
 *     cell is where that colour completes five,
 *   - open/closed distinctions for free: an open three sits in three windows with three stones,
 *     a three blocked at one end in only one.
 */

/** Weight of a window holding n stones of one colour (and none of the other). */
export const WINDOW_WEIGHT = [0, 1, 10, 120, 1500, 20_000] as const;

/** Evaluation of a window with x first-player and o second-player stones, from stone 1's side. */
const WINDOW_VALUE = new Int32Array(36);
for (let x = 0; x <= 5; x++) {
  for (let o = 0; o <= 5; o++) {
    WINDOW_VALUE[x * 6 + o] =
      x > 0 && o === 0 ? (WINDOW_WEIGHT[x] ?? 0) : o > 0 && x === 0 ? -(WINDOW_WEIGHT[o] ?? 0) : 0;
  }
}

/** Ordering gain of adding a stone to a window that already has n of ours, or of blocking n of theirs. */
const ATTACK_GAIN = WINDOW_WEIGHT.slice(1).map((w, n) => w - (WINDOW_WEIGHT[n] ?? 0));
const DEFEND_GAIN = ATTACK_GAIN.map((g) => Math.floor(g * 0.9));

interface Geometry {
  cellCount: number;
  windowCount: number;
  /** Start cell and step of each window; cell k of window w is `start + k * step`. */
  winStart: Int32Array;
  winStep: Int32Array;
  /** Sum of the five cell indexes: minus the stones' sum it names the one empty cell of a four. */
  winTotal: Int32Array;
  /** CSR lists: windows containing a cell, and cells within two squares of a cell. */
  cellWinOffset: Int32Array;
  cellWins: Int32Array;
  nearOffset: Int32Array;
  nearCells: Int32Array;
  /** Small bonus for central cells (tie-break and opening). */
  centerBonus: Int32Array;
  zobristLo: Int32Array;
  zobristHi: Int32Array;
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

const geometryCache = new Map<number, Geometry>();

function geometryFor(size: number): Geometry {
  const cached = geometryCache.get(size);
  if (cached) return cached;
  const cellCount = size * size;
  const starts: number[] = [];
  const steps: number[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const endR = r + 4 * dr;
        const endC = c + 4 * dc;
        if (endR < size && endC >= 0 && endC < size) {
          starts.push(r * size + c);
          steps.push(dr * size + dc);
        }
      }
    }
  }
  const windowCount = starts.length;
  const winStart = Int32Array.from(starts);
  const winStep = Int32Array.from(steps);
  const winTotal = new Int32Array(windowCount);
  const perCell: number[][] = Array.from({ length: cellCount }, () => []);
  for (let w = 0; w < windowCount; w++) {
    for (let k = 0; k < 5; k++) {
      const cell = winStart[w]! + k * winStep[w]!;
      winTotal[w]! += cell;
      perCell[cell]!.push(w);
    }
  }
  const cellWinOffset = new Int32Array(cellCount + 1);
  const flat: number[] = [];
  perCell.forEach((list, cell) => {
    cellWinOffset[cell] = flat.length;
    flat.push(...list);
  });
  cellWinOffset[cellCount] = flat.length;

  const nearOffset = new Int32Array(cellCount + 1);
  const near: number[] = [];
  const mid = (size - 1) / 2;
  const centerBonus = new Int32Array(cellCount);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = r * size + c;
      nearOffset[cell] = near.length;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if ((dr !== 0 || dc !== 0) && nr >= 0 && nr < size && nc >= 0 && nc < size) {
            near.push(nr * size + nc);
          }
        }
      }
      centerBonus[cell] = Math.round(mid - Math.max(Math.abs(r - mid), Math.abs(c - mid)));
    }
  }
  nearOffset[cellCount] = near.length;

  const random = mulberry32(0x5eed0000 + size);
  const zobristLo = new Int32Array(3 * cellCount);
  const zobristHi = new Int32Array(3 * cellCount);
  for (let i = 0; i < zobristLo.length; i++) {
    zobristLo[i] = Math.floor(random() * 4294967296) | 0;
    zobristHi[i] = Math.floor(random() * 4294967296) | 0;
  }

  const geometry: Geometry = {
    cellCount,
    windowCount,
    winStart,
    winStep,
    winTotal,
    cellWinOffset,
    cellWins: Int32Array.from(flat),
    nearOffset,
    nearCells: Int32Array.from(near),
    centerBonus,
    zobristLo,
    zobristHi,
  };
  geometryCache.set(size, geometry);
  return geometry;
}

export class SearchPosition {
  readonly size: number;
  readonly cellCount: number;
  readonly cells: Int8Array;
  /** How many stones lie within two squares of each cell: the source of candidate moves. */
  readonly near: Uint8Array;
  /** Static evaluation from stone 1's point of view. */
  score = 0;
  hashLo = 0;
  hashHi = 0;
  empties: number;
  /** The last `make` completed a five. */
  lastWon = false;

  private readonly geo: Geometry;
  private readonly wx: Uint8Array;
  private readonly wo: Uint8Array;
  private readonly sum: Int32Array;
  private readonly fours = [0, 0, 0];
  private readonly stack: number[] = [];

  constructor(size: number) {
    this.geo = geometryFor(size);
    this.size = size;
    this.cellCount = this.geo.cellCount;
    this.cells = new Int8Array(this.cellCount);
    this.near = new Uint8Array(this.cellCount);
    this.wx = new Uint8Array(this.geo.windowCount);
    this.wo = new Uint8Array(this.geo.windowCount);
    this.sum = new Int32Array(this.geo.windowCount);
    this.empties = this.cellCount;
  }

  static fromMoves(size: number, moves: readonly number[]): SearchPosition {
    const position = new SearchPosition(size);
    for (const move of moves) position.make(move);
    return position;
  }

  /** Whose turn it is: stone 1 plays when an even number of stones is on the board. */
  get turn(): Stone {
    return this.stack.length % 2 === 0 ? 1 : 2;
  }

  get stones(): number {
    return this.stack.length;
  }

  /** Number of windows where `stone` has four stones and the opponent none (a five is one move away). */
  fourCount(stone: Stone): number {
    return this.fours[stone] ?? 0;
  }

  evaluate(forStone: Stone): number {
    return forStone === 1 ? this.score : -this.score;
  }

  make(cell: number): void {
    this.place(cell, this.turn, 1);
    this.stack.push(cell);
  }

  unmake(): void {
    const cell = this.stack.pop();
    if (cell === undefined) return;
    this.place(cell, this.cells[cell] as Stone, -1);
  }

  /** Applies (+1) or reverts (-1) a stone, updating windows, evaluation, hash and neighbours. */
  private place(cell: number, stone: Stone, dir: 1 | -1): void {
    const g = this.geo;
    const { wx, wo, sum, fours } = this;
    let won = false;
    for (let k = g.cellWinOffset[cell]!; k < g.cellWinOffset[cell + 1]!; k++) {
      const w = g.cellWins[k]!;
      const x = wx[w]!;
      const o = wo[w]!;
      const nx = stone === 1 ? x + dir : x;
      const no = stone === 2 ? o + dir : o;
      this.score += WINDOW_VALUE[nx * 6 + no]! - WINDOW_VALUE[x * 6 + o]!;
      fours[1]! += (nx === 4 && no === 0 ? 1 : 0) - (x === 4 && o === 0 ? 1 : 0);
      fours[2]! += (no === 4 && nx === 0 ? 1 : 0) - (o === 4 && x === 0 ? 1 : 0);
      if (dir === 1 && (nx === 5 || no === 5)) won = true;
      wx[w] = nx;
      wo[w] = no;
      sum[w]! += dir * cell;
    }
    this.lastWon = won;
    this.cells[cell] = dir === 1 ? stone : 0;
    this.empties -= dir;
    this.hashLo ^= g.zobristLo[stone * g.cellCount + cell]!;
    this.hashHi ^= g.zobristHi[stone * g.cellCount + cell]!;
    for (let k = g.nearOffset[cell]!; k < g.nearOffset[cell + 1]!; k++) {
      this.near[g.nearCells[k]!]! += dir;
    }
  }

  /** The distinct cells where `stone` completes a five right now (replaces the contents of `out`). */
  winCells(stone: Stone, out: number[]): number {
    out.length = 0;
    const g = this.geo;
    for (let w = 0; w < g.windowCount; w++) {
      const mine = stone === 1 ? this.wx[w]! : this.wo[w]!;
      const theirs = stone === 1 ? this.wo[w]! : this.wx[w]!;
      if (mine === 4 && theirs === 0) {
        const cell = g.winTotal[w]! - this.sum[w]!;
        if (!out.includes(cell)) out.push(cell);
      }
    }
    return out.length;
  }

  /**
   * Cells that would give `stone` a four: the empty cells of windows that already hold three of
   * its stones and none of the opponent's. Distinct, ascending.
   */
  fourMakers(stone: Stone, out: number[]): void {
    out.length = 0;
    const g = this.geo;
    for (let w = 0; w < g.windowCount; w++) {
      const mine = stone === 1 ? this.wx[w]! : this.wo[w]!;
      const theirs = stone === 1 ? this.wo[w]! : this.wx[w]!;
      if (mine !== 3 || theirs !== 0) continue;
      for (let k = 0; k < 5; k++) {
        const cell = g.winStart[w]! + k * g.winStep[w]!;
        if (this.cells[cell] === 0 && !out.includes(cell)) out.push(cell);
      }
    }
    out.sort((a, b) => a - b);
  }

  /**
   * Move-ordering value of `stone` playing `cell`: how much it advances its own windows plus how
   * much it kills the opponent's. A forcing move or a double threat sums several windows, so it
   * sorts far above quiet moves.
   */
  moveValue(cell: number, stone: Stone): number {
    const g = this.geo;
    let value = g.centerBonus[cell]!;
    for (let k = g.cellWinOffset[cell]!; k < g.cellWinOffset[cell + 1]!; k++) {
      const w = g.cellWins[k]!;
      const mine = stone === 1 ? this.wx[w]! : this.wo[w]!;
      const theirs = stone === 1 ? this.wo[w]! : this.wx[w]!;
      if (theirs === 0) value += ATTACK_GAIN[mine]!;
      else if (mine === 0) value += DEFEND_GAIN[theirs]!;
    }
    return value;
  }
}
