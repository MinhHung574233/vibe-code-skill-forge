import { OBSTACLE, type Stone } from '../board';
import { mulberry32 } from '../rng';
import { isWall, wouldWin, type CaroRule } from '../rules';

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
 *
 * Rules and blocked squares. A blocked square counts as a stone of BOTH colours in every window
 * it touches, so those windows hold both colours and are dead for everybody (value 0, never a
 * four). Under the 'blocked' rule a window is also "sealed" for a colour when both squares just
 * beyond its two ends hold walls for that colour (an opponent stone or a blocked square): a five
 * completed there would be a dead five, so the window is worth nothing to that colour. Counters
 * of walled ends are kept per window and colour. The counters are exact for "a four exists"
 * only as a pre-filter (an overline can still change the answer), so every "can complete a
 * winning five" decision goes through `winCells`, which applies the real rule.
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
  /** CSR list: windows whose end neighbour (the square just beyond an end) is this cell. */
  cellCapOffset: Int32Array;
  cellCaps: Int32Array;
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
  const beyond: number[][] = []; // per window: the in-board cells just beyond its two ends
  for (const [dr, dc] of DIRECTIONS) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const endR = r + 4 * dr;
        const endC = c + 4 * dc;
        if (endR < size && endC >= 0 && endC < size) {
          starts.push(r * size + c);
          steps.push(dr * size + dc);
          const ends: number[] = [];
          for (const [er, ec] of [
            [r - dr, c - dc],
            [r + 5 * dr, c + 5 * dc],
          ] as const) {
            if (er >= 0 && er < size && ec >= 0 && ec < size) ends.push(er * size + ec);
          }
          beyond.push(ends);
        }
      }
    }
  }
  const windowCount = starts.length;
  const winStart = Int32Array.from(starts);
  const winStep = Int32Array.from(steps);
  const winTotal = new Int32Array(windowCount);
  const perCell: number[][] = Array.from({ length: cellCount }, () => []);
  const perCap: number[][] = Array.from({ length: cellCount }, () => []);
  for (let w = 0; w < windowCount; w++) {
    for (let k = 0; k < 5; k++) {
      const cell = winStart[w]! + k * winStep[w]!;
      winTotal[w]! += cell;
      perCell[cell]!.push(w);
    }
  }
  beyond.forEach((ends, w) => {
    for (const cell of ends) perCap[cell]!.push(w);
  });
  const cellCapOffset = new Int32Array(cellCount + 1);
  const capFlat: number[] = [];
  perCap.forEach((list, cell) => {
    cellCapOffset[cell] = capFlat.length;
    capFlat.push(...list);
  });
  cellCapOffset[cellCount] = capFlat.length;
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
    cellCapOffset,
    cellCaps: Int32Array.from(capFlat),
    nearOffset,
    nearCells: Int32Array.from(near),
    centerBonus,
    zobristLo,
    zobristHi,
  };
  geometryCache.set(size, geometry);
  return geometry;
}

/** Longest list of defensive cells `defences` reports (a safety cap for absurd positions). */
export const MAX_DEFENCES = 40;

/** Value of a window under the 'blocked' rule: sealed windows are worth nothing to that colour. */
function sealedValue(x: number, o: number, capX: number, capO: number): number {
  if (x > 0 && o === 0) return capX === 2 ? 0 : (WINDOW_WEIGHT[x] ?? 0);
  if (o > 0 && x === 0) return capO === 2 ? 0 : -(WINDOW_WEIGHT[o] ?? 0);
  return 0;
}

export class SearchPosition {
  readonly size: number;
  readonly cellCount: number;
  readonly rule: CaroRule;
  /** 0 empty, 1 / 2 stones, OBSTACLE (3) blocked. */
  readonly cells: Int8Array;
  /** How many stones lie within two squares of each cell: the source of candidate moves. */
  readonly near: Uint8Array;
  /** Static evaluation from stone 1's point of view. */
  score = 0;
  hashLo = 0;
  hashHi = 0;
  empties: number;
  /** The last `make` completed a winning five (under the position's rule). */
  lastWon = false;

  private readonly geo: Geometry;
  private readonly blocked: boolean;
  private readonly wx: Uint8Array;
  private readonly wo: Uint8Array;
  /** Per window and colour: how many of its two end neighbours are walls for that colour. */
  private readonly capX: Uint8Array;
  private readonly capO: Uint8Array;
  private readonly sum: Int32Array;
  private readonly fours = [0, 0, 0];
  private readonly stack: number[] = [];
  private readonly scratch: number[] = [];

  constructor(size: number, rule: CaroRule = 'freestyle', obstacles: readonly number[] = []) {
    this.geo = geometryFor(size);
    this.size = size;
    this.rule = rule;
    this.blocked = rule === 'blocked';
    this.cellCount = this.geo.cellCount;
    this.cells = new Int8Array(this.cellCount);
    this.near = new Uint8Array(this.cellCount);
    this.wx = new Uint8Array(this.geo.windowCount);
    this.wo = new Uint8Array(this.geo.windowCount);
    this.capX = new Uint8Array(this.geo.windowCount);
    this.capO = new Uint8Array(this.geo.windowCount);
    this.sum = new Int32Array(this.geo.windowCount);
    this.empties = this.cellCount;
    for (const cell of obstacles) this.addObstacle(cell);
  }

  static fromMoves(
    size: number,
    moves: readonly number[],
    rule: CaroRule = 'freestyle',
    obstacles: readonly number[] = [],
  ): SearchPosition {
    const position = new SearchPosition(size, rule, obstacles);
    for (const move of moves) position.make(move);
    return position;
  }

  /** Marks a blocked square. Only before the first move: it is part of the starting position. */
  private addObstacle(cell: number): void {
    const g = this.geo;
    if (cell < 0 || cell >= this.cellCount || this.cells[cell] !== 0) {
      throw new RangeError(`Bad blocked square ${cell}`);
    }
    this.cells[cell] = OBSTACLE;
    this.empties--;
    for (let k = g.cellWinOffset[cell]!; k < g.cellWinOffset[cell + 1]!; k++) {
      const w = g.cellWins[k]!;
      this.wx[w]!++;
      this.wo[w]!++;
    }
    for (let k = g.cellCapOffset[cell]!; k < g.cellCapOffset[cell + 1]!; k++) {
      const w = g.cellCaps[k]!;
      this.capX[w]!++;
      this.capO[w]!++;
    }
  }

  /** Whose turn it is: stone 1 plays when an even number of stones is on the board. */
  get turn(): Stone {
    return this.stack.length % 2 === 0 ? 1 : 2;
  }

  get stones(): number {
    return this.stack.length;
  }

  /**
   * Number of windows where `stone` has four stones and the opponent none (a five is one move
   * away). Under 'blocked' windows that could only become a dead five are not counted. It is a
   * quick pre-filter: use `hasWin` / `winCells` for the exact answer.
   */
  fourCount(stone: Stone): number {
    return this.fours[stone] ?? 0;
  }

  /** True when `stone` can complete a winning five right now. */
  hasWin(stone: Stone): boolean {
    if ((this.fours[stone] ?? 0) === 0) return false;
    return !this.blocked || this.winCells(stone, this.scratch) > 0;
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
    const blocked = this.blocked;
    let completed = false;
    for (let k = g.cellWinOffset[cell]!; k < g.cellWinOffset[cell + 1]!; k++) {
      const w = g.cellWins[k]!;
      const x = wx[w]!;
      const o = wo[w]!;
      const nx = stone === 1 ? x + dir : x;
      const no = stone === 2 ? o + dir : o;
      if (blocked) {
        const cx = this.capX[w]!;
        const co = this.capO[w]!;
        this.score += sealedValue(nx, no, cx, co) - sealedValue(x, o, cx, co);
        fours[1]! +=
          (nx === 4 && no === 0 && cx < 2 ? 1 : 0) - (x === 4 && o === 0 && cx < 2 ? 1 : 0);
        fours[2]! +=
          (no === 4 && nx === 0 && co < 2 ? 1 : 0) - (o === 4 && x === 0 && co < 2 ? 1 : 0);
      } else {
        this.score += WINDOW_VALUE[nx * 6 + no]! - WINDOW_VALUE[x * 6 + o]!;
        fours[1]! += (nx === 4 && no === 0 ? 1 : 0) - (x === 4 && o === 0 ? 1 : 0);
        fours[2]! += (no === 4 && nx === 0 ? 1 : 0) - (o === 4 && x === 0 ? 1 : 0);
      }
      if (dir === 1 && ((nx === 5 && no === 0) || (no === 5 && nx === 0))) completed = true;
      wx[w] = nx;
      wo[w] = no;
      sum[w]! += dir * cell;
    }
    if (blocked) {
      // The stone is a wall for the OTHER colour's windows that end next to it.
      for (let k = g.cellCapOffset[cell]!; k < g.cellCapOffset[cell + 1]!; k++) {
        const w = g.cellCaps[k]!;
        const x = wx[w]!;
        const o = wo[w]!;
        const cx = this.capX[w]!;
        const co = this.capO[w]!;
        const ncx = stone === 2 ? cx + dir : cx;
        const nco = stone === 1 ? co + dir : co;
        this.score += sealedValue(x, o, ncx, nco) - sealedValue(x, o, cx, co);
        fours[1]! +=
          (x === 4 && o === 0 && ncx < 2 ? 1 : 0) - (x === 4 && o === 0 && cx < 2 ? 1 : 0);
        fours[2]! +=
          (o === 4 && x === 0 && nco < 2 ? 1 : 0) - (o === 4 && x === 0 && co < 2 ? 1 : 0);
        this.capX[w] = ncx;
        this.capO[w] = nco;
      }
    }
    this.lastWon =
      completed && (!blocked || wouldWin(this.cells, this.size, cell, stone, 'blocked'));
    this.cells[cell] = dir === 1 ? stone : 0;
    this.empties -= dir;
    this.hashLo ^= g.zobristLo[stone * g.cellCount + cell]!;
    this.hashHi ^= g.zobristHi[stone * g.cellCount + cell]!;
    for (let k = g.nearOffset[cell]!; k < g.nearOffset[cell + 1]!; k++) {
      this.near[g.nearCells[k]!]! += dir;
    }
  }

  /**
   * The distinct cells where `stone` completes a winning five right now (replaces the contents
   * of `out`). Under 'blocked' a completion that would be walled in at both ends is not listed.
   */
  winCells(stone: Stone, out: number[]): number {
    out.length = 0;
    const g = this.geo;
    for (let w = 0; w < g.windowCount; w++) {
      const mine = stone === 1 ? this.wx[w]! : this.wo[w]!;
      const theirs = stone === 1 ? this.wo[w]! : this.wx[w]!;
      if (mine === 4 && theirs === 0) {
        const cell = g.winTotal[w]! - this.sum[w]!;
        if (out.includes(cell)) continue;
        if (!this.blocked || wouldWin(this.cells, this.size, cell, stone, 'blocked')) {
          out.push(cell);
        }
      }
    }
    return out.length;
  }

  /**
   * Every cell that may stop `stone` from completing the wins listed in `wins`: the completion
   * cells themselves and, under 'blocked', the free end of a would-be five whose other end is
   * already walled (walling it in kills the win). A superset: the search checks each one.
   */
  defences(stone: Stone, wins: readonly number[], out: number[]): number {
    out.length = 0;
    for (const cell of wins) if (!out.includes(cell)) out.push(cell);
    if (!this.blocked) return out.length;
    const size = this.size;
    const cells = this.cells;
    for (const win of wins) {
      const row = Math.floor(win / size);
      const col = win % size;
      for (const [dr, dc] of DIRECTIONS) {
        let length = 1;
        let end1 = -1;
        let end2 = -1;
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
          length++;
          r += dr;
          c += dc;
        }
        if (r >= 0 && r < size && c >= 0 && c < size) end1 = r * size + c;
        r = row - dr;
        c = col - dc;
        while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
          length++;
          r -= dr;
          c -= dc;
        }
        if (r >= 0 && r < size && c >= 0 && c < size) end2 = r * size + c;
        if (length < 5) continue;
        const e1 = end1 < 0 ? undefined : cells[end1];
        const e2 = end2 < 0 ? undefined : cells[end2];
        if (e1 === 0 && isWall(e2) && !out.includes(end1)) out.push(end1);
        if (e2 === 0 && isWall(e1) && !out.includes(end2)) out.push(end2);
      }
    }
    if (out.length > MAX_DEFENCES) out.length = MAX_DEFENCES;
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
      if (this.blocked && (stone === 1 ? this.capX[w]! : this.capO[w]!) === 2) continue;
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
    const blocked = this.blocked;
    for (let k = g.cellWinOffset[cell]!; k < g.cellWinOffset[cell + 1]!; k++) {
      const w = g.cellWins[k]!;
      const mine = stone === 1 ? this.wx[w]! : this.wo[w]!;
      const theirs = stone === 1 ? this.wo[w]! : this.wx[w]!;
      if (theirs === 0) {
        if (!blocked || (stone === 1 ? this.capX[w]! : this.capO[w]!) < 2) {
          value += ATTACK_GAIN[mine]!;
        }
      } else if (mine === 0) {
        if (!blocked || (stone === 1 ? this.capO[w]! : this.capX[w]!) < 2) {
          value += DEFEND_GAIN[theirs]!;
        }
      }
    }
    return value;
  }
}
