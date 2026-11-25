import { centerIndex, otherStone, type BoardSize, type Stone } from '../board';
import { mulberry32 } from '../rng';
import { LEVEL_CONFIG, type Level, type LevelConfig } from './levels';
import { SearchPosition } from './position';

/**
 * Caro / gomoku engine: iterative-deepening negamax with alpha-beta pruning and a transposition
 * table, over threat-ordered, neighbour-limited candidate moves.
 *
 * Tactics, in the order they are applied at every node:
 *   1. a five is available      -> that is a win; nothing else is searched;
 *   2. the opponent has a four  -> the single blocking cell is the only move (two such cells = lost);
 *   3. otherwise                -> the best few moves by threat value (see SearchPosition.moveValue).
 * At the root, medium and hard first look for a forced win by consecutive fours (VCF).
 *
 * What it is not: it is not a solver and has no opening book. It does not see a win that needs a
 * quiet (non-forcing) preparatory move deeper than its depth, and it only extends the search for
 * fours, not for open threes.
 */

const INF = 1_000_000_000;
const WIN = 1_000_000;
/** Scores beyond this are "mate in n" values and are stored/read with their ply adjusted. */
const MATE_BOUND = WIN - 1_000;
const MAX_PLY = 48;
const TT_BITS = 16;
const TT_MASK = (1 << TT_BITS) - 1;
const VCF_NODE_LIMIT = 30_000;

const enum Bound {
  None = 0,
  Exact = 1,
  Lower = 2,
  Upper = 3,
}

export interface AiLimits {
  maxDepth?: number;
  maxNodes?: number;
  maxMs?: number;
}

export interface AiRequest {
  size: BoardSize;
  /** The game so far, in order (cell indexes). The side to move follows from its length. */
  moves: readonly number[];
  level: Level;
  /** Only used by Easy's occasional mistake. Defaults to a hash of the position (deterministic). */
  seed?: number;
  /** Overrides for the level's budget (tests, tuning). */
  limits?: AiLimits;
}

export type AiMoveSource = 'opening' | 'win' | 'block' | 'vcf' | 'search' | 'mistake';

export interface AiResult {
  move: number;
  /** From the mover's point of view; +/-1,000,000 means a forced win or loss was found. */
  score: number;
  /** Deepest fully searched iteration (plies). 0 for moves that needed no search. */
  depth: number;
  nodes: number;
  elapsedMs: number;
  source: AiMoveSource;
}

const clock = (): number => (typeof performance === 'undefined' ? Date.now() : performance.now());

function widthAt(widths: readonly number[], ply: number): number {
  return widths[Math.min(ply, widths.length - 1)] ?? 8;
}

class Searcher {
  private nodes = 0;
  private aborted = false;
  private readonly deadline: number;
  private readonly maxNodes: number;
  private readonly moveBuf: Int32Array[] = [];
  private readonly valueBuf: Int32Array[] = [];
  private readonly winBuf: number[] = [];
  private readonly ttLock = new Int32Array(1 << TT_BITS);
  private readonly ttScore = new Int32Array(1 << TT_BITS);
  private readonly ttMove = new Int16Array(1 << TT_BITS);
  private readonly ttDepth = new Int8Array(1 << TT_BITS);
  private readonly ttBound = new Uint8Array(1 << TT_BITS);

  constructor(
    private readonly pos: SearchPosition,
    private readonly config: LevelConfig,
    startedAt: number,
    limits: AiLimits,
  ) {
    this.deadline = startedAt + (limits.maxMs ?? config.maxMs);
    this.maxNodes = limits.maxNodes ?? config.maxNodes;
    const capacity = Math.max(...config.widths) + 2;
    for (let ply = 0; ply <= MAX_PLY; ply++) {
      this.moveBuf.push(new Int32Array(capacity));
      this.valueBuf.push(new Int32Array(capacity));
    }
  }

  get nodeCount(): number {
    return this.nodes;
  }

  /**
   * The best `width` empty cells near stones for the side to move, best first, in the per-ply
   * buffer. Ties keep the lower cell index, so ordering is deterministic. A transposition-table
   * move goes first.
   */
  private generate(ply: number, width: number, hashMove: number): number {
    const pos = this.pos;
    const me = pos.turn;
    const out = this.moveBuf[ply]!;
    const values = this.valueBuf[ply]!;
    let count = 0;
    for (let cell = 0; cell < pos.cellCount; cell++) {
      if (pos.cells[cell] !== 0 || pos.near[cell] === 0) continue;
      const value = pos.moveValue(cell, me);
      if (count < width || value > values[count - 1]!) {
        let j = count < width ? count : count - 1;
        while (j > 0 && values[j - 1]! < value) {
          out[j] = out[j - 1]!;
          values[j] = values[j - 1]!;
          j--;
        }
        out[j] = cell;
        values[j] = value;
        if (count < width) count++;
      }
    }
    if (count === 0) {
      for (let cell = 0; cell < pos.cellCount && count === 0; cell++) {
        if (pos.cells[cell] === 0) out[count++] = cell;
      }
    }
    if (hashMove >= 0 && pos.cells[hashMove] === 0) {
      let at = out.indexOf(hashMove);
      if (at < 0 || at >= count) {
        if (count < out.length) count++;
        at = count - 1;
      }
      for (let j = at; j > 0; j--) out[j] = out[j - 1]!;
      out[0] = hashMove;
    }
    return count;
  }

  private search(depth: number, alphaIn: number, betaIn: number, ply: number): number {
    this.nodes++;
    if (this.nodes > this.maxNodes || ((this.nodes & 255) === 0 && clock() > this.deadline)) {
      this.aborted = true;
    }
    if (this.aborted) return 0;

    const pos = this.pos;
    const me = pos.turn;
    if (pos.empties === 0) return 0;
    if (pos.fourCount(me) > 0) return WIN - ply - 1;
    let forced = -1;
    if (pos.fourCount(otherStone(me)) > 0) {
      if (pos.winCells(otherStone(me), this.winBuf) > 1) return -(WIN - ply - 2);
      forced = this.winBuf[0]!;
    }
    if ((depth <= 0 && forced < 0) || ply >= MAX_PLY) return pos.evaluate(me);

    let alpha = alphaIn;
    let beta = betaIn;
    const slot = pos.hashLo & TT_MASK;
    const lock = pos.hashHi;
    let hashMove = -1;
    if (this.ttBound[slot] !== Bound.None && this.ttLock[slot] === lock) {
      hashMove = this.ttMove[slot]!;
      if (this.ttDepth[slot]! >= depth) {
        let stored = this.ttScore[slot]!;
        if (stored > MATE_BOUND) stored -= ply;
        else if (stored < -MATE_BOUND) stored += ply;
        const bound = this.ttBound[slot];
        if (bound === Bound.Exact) return stored;
        if (bound === Bound.Lower) alpha = Math.max(alpha, stored);
        else beta = Math.min(beta, stored);
        if (alpha >= beta) return stored;
      }
    }

    let count: number;
    if (forced >= 0) {
      this.moveBuf[ply]![0] = forced;
      count = 1;
    } else {
      count = this.generate(ply, widthAt(this.config.widths, ply), hashMove);
    }
    const list = this.moveBuf[ply]!;

    let best = -INF;
    let bestMove = -1;
    for (let i = 0; i < count; i++) {
      const move = list[i]!;
      pos.make(move);
      const score = -this.search(depth - 1, -beta, -alpha, ply + 1);
      pos.unmake();
      if (this.aborted) return 0;
      if (score > best) {
        best = score;
        bestMove = move;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }

    this.ttLock[slot] = lock;
    this.ttMove[slot] = bestMove;
    this.ttDepth[slot] = Math.min(depth, 100);
    this.ttScore[slot] = best > MATE_BOUND ? best + ply : best < -MATE_BOUND ? best - ply : best;
    this.ttBound[slot] = best <= alphaIn ? Bound.Upper : best >= betaIn ? Bound.Lower : Bound.Exact;
    return best;
  }

  /**
   * Victory by continuous fours: the side to move plays only fours, the opponent can only block
   * the single completion cell, and the chain ends in a double four (or a four-three that
   * becomes one). Sound (it only reports wins it has proven) but incomplete: it gives up when the
   * defender's forced block itself makes a four or a five. Returns the first move, or -1.
   */
  findVcf(maxFours: number): number {
    const root = this.pos.turn;
    this.nodes = 0;
    const found = { move: -1 };
    const attack = (fours: number): boolean => {
      this.nodes++;
      if (this.nodes > VCF_NODE_LIMIT) return false;
      const pos = this.pos;
      if (fours === 0 || pos.fourCount(otherStone(root)) > 0) return false;
      const makers: number[] = [];
      pos.fourMakers(root, makers);
      const replies: number[] = [];
      for (const cell of makers) {
        pos.make(cell);
        const wins = pos.winCells(root, replies);
        let won = false;
        if (wins >= 2) {
          won = true;
        } else if (wins === 1) {
          const block = replies[0]!;
          pos.make(block);
          const counter = pos.lastWon || pos.fourCount(otherStone(root)) > 0;
          won = !counter && attack(fours - 1);
          pos.unmake();
        }
        pos.unmake();
        if (won) {
          if (fours === maxFours) found.move = cell;
          return true;
        }
      }
      return false;
    };
    return attack(maxFours) ? found.move : -1;
  }

  /**
   * Iterative deepening over the root moves. Returns null when not even depth 1 finished (a
   * budget smaller than one ply), otherwise the best move of the deepest completed iteration.
   */
  searchRoot(rootMoves: number[], fullWindow: boolean) {
    const pos = this.pos;
    let bestMove = -1;
    let bestScore = 0;
    let completedDepth = 0;
    let scores: number[] = [];
    for (let depth = 1; depth <= this.config.maxDepth; depth++) {
      let iterBest = -1;
      let iterScore = -INF;
      let alpha = -INF;
      const iterScores: number[] = [];
      for (const move of rootMoves) {
        pos.make(move);
        const score = -this.search(depth - 1, -INF, fullWindow ? INF : -alpha, 1);
        pos.unmake();
        if (this.aborted) break;
        iterScores.push(score);
        if (score > iterScore) {
          iterScore = score;
          iterBest = move;
        }
        if (score > alpha) alpha = score;
      }
      if (this.aborted) break;
      bestMove = iterBest;
      bestScore = iterScore;
      completedDepth = depth;
      // Next iteration starts with the best move; with exact scores (full window) the rest are
      // ranked too, which is what Easy's "2nd or 3rd best" needs.
      const bestAt = rootMoves.indexOf(iterBest);
      const order = iterScores.map((_, i) => i);
      if (fullWindow) order.sort((a, b) => iterScores[b]! - iterScores[a]! || a - b);
      else order.sort((a, b) => Number(b === bestAt) - Number(a === bestAt) || a - b);
      const reordered = order.map((i) => rootMoves[i]!);
      scores = order.map((i) => iterScores[i]!);
      rootMoves.splice(0, rootMoves.length, ...reordered);
      if (Math.abs(iterScore) > MATE_BOUND) break;
    }
    return completedDepth === 0
      ? null
      : { move: bestMove, score: bestScore, depth: completedDepth, ranked: rootMoves, scores };
  }
}

/** Picks the engine's move for the side to move. Throws if the board is full. */
export function chooseMove(request: AiRequest): AiResult {
  const startedAt = clock();
  const { size, moves, level } = request;
  const config = LEVEL_CONFIG[level];
  const limits = request.limits ?? {};
  const pos = SearchPosition.fromMoves(size, moves);
  if (pos.empties === 0) throw new RangeError('The board is full');

  const finish = (
    move: number,
    source: AiMoveSource,
    score = 0,
    depth = 0,
    nodes = 0,
  ): AiResult => ({ move, score, depth, nodes, elapsedMs: clock() - startedAt, source });

  const me: Stone = pos.turn;
  const opp = otherStone(me);

  if (pos.stones === 0) return finish(centerIndex(size), 'opening');

  const cells: number[] = [];
  if (pos.fourCount(me) > 0) {
    pos.winCells(me, cells);
    return finish(Math.min(...cells), 'win', WIN);
  }
  if (pos.fourCount(opp) > 0) {
    // One cell: block it. Two or more: the game is lost, so make the most useful block.
    pos.winCells(opp, cells);
    const block = cells.reduce((best, cell) =>
      pos.moveValue(cell, me) > pos.moveValue(best, me) ? cell : best,
    );
    return finish(block, 'block', cells.length > 1 ? -WIN : 0);
  }

  const searcher = new Searcher(
    pos,
    { ...config, maxDepth: limits.maxDepth ?? config.maxDepth },
    startedAt,
    limits,
  );

  if (config.vcfFours > 0) {
    const vcf = searcher.findVcf(config.vcfFours);
    if (vcf >= 0) return finish(vcf, 'vcf', WIN, 0, searcher.nodeCount);
  }

  // Root candidates: same ordering the search uses, widest list.
  const width = widthAt(config.widths, 0);
  const rootMoves = rankedCandidates(pos, me, width);
  const result = searcher.searchRoot(rootMoves, config.mistakeRate > 0);
  const nodes = searcher.nodeCount;
  if (!result) return finish(rootMoves[0]!, 'search', 0, 0, nodes);

  if (config.mistakeRate > 0 && result.ranked.length > 1) {
    const rng = mulberry32(request.seed ?? pos.hashLo ^ pos.hashHi ^ moves.length);
    if (rng() < config.mistakeRate) {
      // Only among moves that do not lose outright, never the best one.
      const playable = result.ranked
        .map((move, i) => ({ move, score: result.scores[i] ?? -INF }))
        .filter((m, i) => i > 0 && i < 3 && m.score > -MATE_BOUND);
      const pick = playable[Math.floor(rng() * playable.length)];
      if (pick) return finish(pick.move, 'mistake', pick.score, result.depth, nodes);
    }
  }
  return finish(result.move, 'search', result.score, result.depth, nodes);
}

/** The `width` best candidate cells for `stone`, best first (root move list). */
function rankedCandidates(pos: SearchPosition, stone: Stone, width: number): number[] {
  const scored: { cell: number; value: number }[] = [];
  for (let cell = 0; cell < pos.cellCount; cell++) {
    if (pos.cells[cell] === 0 && pos.near[cell]! > 0) {
      scored.push({ cell, value: pos.moveValue(cell, stone) });
    }
  }
  if (scored.length === 0) {
    const empty = pos.cells.findIndex((c) => c === 0);
    return [empty];
  }
  scored.sort((a, b) => b.value - a.value || a.cell - b.cell);
  return scored.slice(0, width).map((s) => s.cell);
}
