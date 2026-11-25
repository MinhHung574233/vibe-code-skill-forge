import {
  FLAG_CAPTURE,
  KING,
  PAWN,
  Position,
  moveFlags,
  moveFrom,
  movePromotion,
  moveTo,
  moveToUci,
  pieceType,
} from './board';
import { PIECE_VALUE, evaluate } from './evaluate';

export const MATE = 30_000;
const INF = 32_000;
const MAX_PLY = 96;
/** Scores beyond this are "mate in N" rather than material. */
const MATE_BOUND = MATE - MAX_PLY;

const TT_EXACT = 1;
const TT_LOWER = 2;
const TT_UPPER = 3;

export interface SearchLimits {
  maxDepth: number;
  maxNodes: number;
  /** Wall-clock budget in milliseconds. */
  maxTimeMs: number;
}

export interface SearchResult {
  /** Best move in UCI (`e2e4`, `e7e8q`), or null when the side to move has no legal move. */
  move: string | null;
  /** Centipawns for the side to move; mate scores are +/-(MATE - plies). */
  score: number;
  /** Moves until mate for the side to move (negative: it is being mated), else null. */
  mateIn: number | null;
  depth: number;
  nodes: number;
  timeMs: number;
}

export interface RootMoveScore {
  move: string;
  score: number;
}

const toTtScore = (score: number, ply: number): number =>
  score >= MATE_BOUND ? score + ply : score <= -MATE_BOUND ? score - ply : score;
const fromTtScore = (score: number, ply: number): number =>
  score >= MATE_BOUND ? score - ply : score <= -MATE_BOUND ? score + ply : score;

export function mateDistance(score: number): number | null {
  if (score >= MATE_BOUND) return Math.ceil((MATE - score) / 2);
  if (score <= -MATE_BOUND) return -Math.ceil((MATE + score) / 2);
  return null;
}

/**
 * Iterative-deepening alpha-beta (negamax, principal-variation search) with a transposition
 * table, null-move pruning, late-move reductions, killer/history/MVV-LVA ordering and a
 * quiescence search. The table survives between searches of one game.
 */
export class Searcher {
  private readonly ttMask: number;
  private readonly ttHi: Int32Array;
  private readonly ttMove: Int32Array;
  private readonly ttScore: Int16Array;
  /** depth << 2 | bound; 0 = empty slot. */
  private readonly ttMeta: Int16Array;

  private readonly moveLists: Int32Array[] = [];
  private readonly moveScores: Int32Array[] = [];
  private readonly killers = new Int32Array(MAX_PLY * 2);
  private readonly history = new Int32Array(2 * 128 * 128);

  private pos: Position = new Position();
  private nodes = 0;
  private stopped = false;
  private deadline = 0;
  private maxNodes = 0;
  private now: () => number = () => performance.now();
  private iterationBest = 0;
  private iterationScore = 0;

  constructor(ttBits = 18) {
    const size = 1 << ttBits;
    this.ttMask = size - 1;
    this.ttHi = new Int32Array(size);
    this.ttMove = new Int32Array(size);
    this.ttScore = new Int16Array(size);
    this.ttMeta = new Int16Array(size);
    for (let i = 0; i < MAX_PLY + 2; i++) {
      this.moveLists.push(new Int32Array(256));
      this.moveScores.push(new Int32Array(256));
    }
  }

  /**
   * `history` holds the positions that occurred earlier in the game (oldest first) so a move
   * that repeats one is scored as the draw it is.
   */
  search(
    fen: string,
    limits: SearchLimits,
    history: readonly string[] = [],
    now: () => number = () => performance.now(),
  ): SearchResult {
    this.now = now;
    const start = now();
    this.deadline = start + limits.maxTimeMs;
    this.maxNodes = limits.maxNodes;
    this.nodes = 0;
    this.stopped = false;
    this.loadPosition(fen, history);
    this.ageHistory();

    const pos = this.pos;
    const roots = this.legalMoves();
    if (roots.length === 0) {
      const mated = pos.inCheck();
      return {
        move: null,
        score: mated ? -MATE : 0,
        mateIn: mated ? 0 : null,
        depth: 0,
        nodes: 0,
        timeMs: now() - start,
      };
    }

    let bestMove = roots[0] as number;
    let bestScore = 0;
    let reached = 0;
    for (let depth = 1; depth <= limits.maxDepth; depth++) {
      this.iterationBest = 0;
      const score = this.negamax(depth, -INF, INF, 0, false);
      // A cut-off iteration may still carry a trustworthy root move: the previous best is searched
      // first, so any move that raised alpha was fully searched before the clock ran out.
      if (this.stopped && this.iterationBest === 0) break;
      if (this.iterationBest !== 0) {
        bestMove = this.iterationBest;
        bestScore = this.stopped ? this.iterationScore : score;
      }
      if (this.stopped) break;
      reached = depth; // only fully searched iterations count towards the reported depth
      // A forced mate shorter than the search horizon cannot be improved on.
      if (Math.abs(bestScore) >= MATE - depth) break;
    }

    return {
      move: moveToUci(bestMove),
      score: bestScore === 0 ? 0 : bestScore, // negation can leave -0
      mateIn: mateDistance(bestScore),
      depth: reached,
      nodes: this.nodes,
      timeMs: now() - start,
    };
  }

  /** Exact score of every legal root move at a fixed depth (used for the easy level and tests). */
  scoreRootMoves(fen: string, depth: number, history: readonly string[] = []): RootMoveScore[] {
    this.now = () => performance.now();
    this.deadline = Number.POSITIVE_INFINITY;
    this.maxNodes = Number.POSITIVE_INFINITY;
    this.nodes = 0;
    this.stopped = false;
    this.loadPosition(fen, history);
    this.ageHistory();

    const pos = this.pos;
    const out: RootMoveScore[] = [];
    for (const m of this.legalMoves()) {
      pos.make(m);
      const score = -this.negamax(depth - 1, -INF, INF, 1, true);
      pos.unmake(m);
      out.push({ move: moveToUci(m), score });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  private loadPosition(fen: string, history: readonly string[]): void {
    const pos = new Position();
    pos.setFen(fen);
    // Only positions since the last irreversible move can repeat, and the clock bounds that.
    const relevant = history.slice(Math.max(0, history.length - Math.max(pos.halfmove, 0)));
    for (const earlier of relevant) pos.pushHistoryOf(Position.fromFen(earlier));
    this.pos = pos;
  }

  private ageHistory(): void {
    for (let i = 0; i < this.history.length; i++) this.history[i] = (this.history[i] as number) >> 1;
    this.killers.fill(0);
  }

  private legalMoves(): number[] {
    const pos = this.pos;
    const list = new Int32Array(256);
    const n = pos.generate(list, false);
    const legal: number[] = [];
    for (let i = 0; i < n; i++) {
      const m = list[i] as number;
      if (pos.make(m)) {
        pos.unmake(m);
        legal.push(m);
      }
    }
    return legal;
  }

  private checkLimits(): void {
    if (this.nodes >= this.maxNodes || this.now() >= this.deadline) this.stopped = true;
  }

  private negamax(
    depthIn: number,
    alphaIn: number,
    betaIn: number,
    ply: number,
    allowNull: boolean,
  ): number {
    if ((++this.nodes & 1023) === 0) this.checkLimits();
    if (this.stopped) return 0;
    const pos = this.pos;
    const isRoot = ply === 0;
    let alpha = alphaIn;
    let beta = betaIn;
    let depth = depthIn;

    if (!isRoot) {
      if (pos.halfmove >= 100 || pos.isRepetition() || pos.insufficientMaterial()) return 0;
      // a mate found elsewhere that is shorter than any mate possible here makes this line moot
      alpha = Math.max(alpha, -MATE + ply);
      beta = Math.min(beta, MATE - ply - 1);
      if (alpha >= beta) return alpha;
    }
    if (ply >= MAX_PLY - 1) return evaluate(pos);

    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return this.quiesce(alpha, beta, ply);

    // transposition table
    const slot = pos.hashLo & this.ttMask;
    let ttMove = 0;
    const meta = this.ttMeta[slot] as number;
    if (meta !== 0 && this.ttHi[slot] === pos.hashHi) {
      ttMove = this.ttMove[slot] as number;
      if (!isRoot && meta >> 2 >= depth) {
        const score = fromTtScore(this.ttScore[slot] as number, ply);
        const bound = meta & 3;
        if (bound === TT_EXACT) return score;
        if (bound === TT_LOWER && score >= beta) return score;
        if (bound === TT_UPPER && score <= alpha) return score;
      }
    }

    // null-move pruning: if passing still beats beta, this node is not worth a full search
    const us = pos.side;
    if (allowNull && !inCheck && depth >= 3 && beta - alpha === 1 && this.hasPieces(us)) {
      pos.makeNull();
      const score = -this.negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
      pos.unmakeNull();
      if (this.stopped) return 0;
      if (score >= beta) return score >= MATE_BOUND ? beta : score;
    }

    const moves = this.moveLists[ply] as Int32Array;
    const scores = this.moveScores[ply] as Int32Array;
    const count = pos.generate(moves, false);
    this.scoreMoves(moves, scores, count, ttMove, ply);

    const alphaStart = alpha;
    let best = -INF;
    let bestMove = 0;
    let legal = 0;

    for (let i = 0; i < count; i++) {
      // selection sort: pick the best remaining move lazily (most nodes cut off after a few)
      let top = i;
      for (let j = i + 1; j < count; j++) {
        if ((scores[j] as number) > (scores[top] as number)) top = j;
      }
      if (top !== i) {
        const m = moves[top] as number;
        moves[top] = moves[i] as number;
        moves[i] = m;
        const s = scores[top] as number;
        scores[top] = scores[i] as number;
        scores[i] = s;
      }
      const move = moves[i] as number;
      if (!pos.make(move)) continue;
      legal++;
      const quiet = (moveFlags(move) & FLAG_CAPTURE) === 0 && movePromotion(move) === 0;

      let score: number;
      if (legal === 1) {
        score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
      } else {
        // late quiet moves rarely matter: look at them shallower first, widen only if they surprise
        let reduction = 0;
        if (depth >= 3 && legal > 4 && quiet && !inCheck && !pos.inCheck()) reduction = 1;
        score = -this.negamax(depth - 1 - reduction, -alpha - 1, -alpha, ply + 1, true);
        if (score > alpha && reduction > 0) {
          score = -this.negamax(depth - 1, -alpha - 1, -alpha, ply + 1, true);
        }
        if (score > alpha && score < beta) {
          score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
        }
      }
      pos.unmake(move);
      if (this.stopped) return 0;

      if (score > best) {
        best = score;
        bestMove = move;
        if (score > alpha) {
          alpha = score;
          if (isRoot) {
            this.iterationBest = move;
            this.iterationScore = score;
          }
          if (alpha >= beta) {
            if (quiet) this.rewardQuiet(move, us, depth, ply);
            break;
          }
        }
      }
    }

    if (legal === 0) return inCheck ? -MATE + ply : 0;

    const bound = best >= beta ? TT_LOWER : best > alphaStart ? TT_EXACT : TT_UPPER;
    this.ttHi[slot] = pos.hashHi;
    this.ttMove[slot] = bestMove;
    this.ttScore[slot] = toTtScore(best, ply);
    this.ttMeta[slot] = (depth << 2) | bound;
    return best;
  }

  private quiesce(alphaIn: number, beta: number, ply: number): number {
    if ((++this.nodes & 1023) === 0) this.checkLimits();
    if (this.stopped) return 0;
    const pos = this.pos;
    let alpha = alphaIn;
    if (ply >= MAX_PLY - 1) return evaluate(pos);

    const inCheck = pos.inCheck();
    let best = -INF;
    if (!inCheck) {
      best = evaluate(pos);
      if (best >= beta) return best;
      if (best > alpha) alpha = best;
    }

    const moves = this.moveLists[ply] as Int32Array;
    const scores = this.moveScores[ply] as Int32Array;
    // in check every evasion matters (stand-pat would be a lie), otherwise captures only
    const count = pos.generate(moves, !inCheck);
    this.scoreMoves(moves, scores, count, 0, ply);
    let legal = 0;

    for (let i = 0; i < count; i++) {
      let top = i;
      for (let j = i + 1; j < count; j++) {
        if ((scores[j] as number) > (scores[top] as number)) top = j;
      }
      if (top !== i) {
        const m = moves[top] as number;
        moves[top] = moves[i] as number;
        moves[i] = m;
        const s = scores[top] as number;
        scores[top] = scores[i] as number;
        scores[i] = s;
      }
      const move = moves[i] as number;
      if (!inCheck) {
        // delta pruning: even winning this piece cannot lift the score back to alpha
        const victim = pieceType(pos.board[moveTo(move)] as number);
        const gain = (PIECE_VALUE[victim] as number) + (movePromotion(move) ? 800 : 0);
        if (best + gain + 200 < alpha && movePromotion(move) === 0) continue;
      }
      if (!pos.make(move)) continue;
      legal++;
      const score = -this.quiesce(-beta, -alpha, ply + 1);
      pos.unmake(move);
      if (this.stopped) return 0;
      if (score > best) {
        best = score;
        if (score > alpha) {
          alpha = score;
          if (alpha >= beta) break;
        }
      }
    }
    if (inCheck && legal === 0) return -MATE + ply;
    return best;
  }

  /** Pawn endings are where passing is a real option (zugzwang), so null move is skipped there. */
  private hasPieces(color: number): boolean {
    const b = this.pos.board;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = b[sq] as number;
      if (p && p >> 3 === color) {
        const t = p & 7;
        if (t !== PAWN && t !== KING) return true;
      }
    }
    return false;
  }

  private scoreMoves(
    moves: Int32Array,
    scores: Int32Array,
    count: number,
    ttMove: number,
    ply: number,
  ): void {
    const pos = this.pos;
    const k1 = this.killers[ply * 2] as number;
    const k2 = this.killers[ply * 2 + 1] as number;
    const side = pos.side;
    for (let i = 0; i < count; i++) {
      const m = moves[i] as number;
      let s: number;
      if (m === ttMove) {
        s = 2_000_000;
      } else if (moveFlags(m) & FLAG_CAPTURE) {
        // most valuable victim, least valuable attacker; en passant victim is always a pawn
        const victim = pieceType(pos.board[moveTo(m)] as number) || PAWN;
        const attacker = pieceType(pos.board[moveFrom(m)] as number);
        s = 1_000_000 + (PIECE_VALUE[victim] as number) * 16 - attacker;
      } else if (movePromotion(m)) {
        s = 900_000 + movePromotion(m);
      } else if (m === k1) {
        s = 800_000;
      } else if (m === k2) {
        s = 790_000;
      } else {
        s = this.history[(side * 128 + moveFrom(m)) * 128 + moveTo(m)] as number;
      }
      scores[i] = s;
    }
  }

  private rewardQuiet(move: number, side: number, depth: number, ply: number): void {
    if (this.killers[ply * 2] !== move) {
      this.killers[ply * 2 + 1] = this.killers[ply * 2] as number;
      this.killers[ply * 2] = move;
    }
    const idx = (side * 128 + moveFrom(move)) * 128 + moveTo(move);
    this.history[idx] = Math.min(700_000, (this.history[idx] as number) + depth * depth);
  }
}
