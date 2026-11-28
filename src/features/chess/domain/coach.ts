import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';
import type { ChessEngine } from './engine';
import { PIECE_POINTS, playUci } from './rules';
import type { SearchLimits, SearchResult } from './search';

/**
 * Coach mode: grades a move with the same engine that plays against the learner and explains the
 * grade from the position. Nothing here is canned: every sentence is backed by a search result, a
 * generated line, or an exchange count on the board (see `Reason` and `Plan`).
 *
 * The domain returns structured data only; `ui/coachText.ts` turns it into (translated) sentences.
 * Nothing in this file may import the i18n layer, because the engine worker imports it.
 */

export type MoveGrade = 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export const GRADES: readonly MoveGrade[] = ['best', 'good', 'inaccuracy', 'mistake', 'blunder'];

/**
 * Centipawn-loss limits (100 = one pawn), measured from the learner's side. A move is
 *  - best         loss <= 10   (the engine's own choice, or within noise of it)
 *  - good         loss <= 50
 *  - inaccuracy   loss <= 100
 *  - mistake      loss <= 250
 *  - blunder      loss  > 250  (a piece, or a decisive swing)
 * They are tuned for a depth-6 search: below ~10 cp the difference is search noise.
 */
export const GRADE_LIMITS = { best: 10, good: 50, inaccuracy: 100, mistake: 250 } as const;

/**
 * Scores are capped before they are compared. Past 8 pawns the game is decided, so trading
 * "+12" for "+9" is not a mistake, and a forced mate (either way) counts as exactly this much
 * instead of the huge raw search value.
 */
export const SCORE_CAP = 800;

export function capScore(score: number, mate: number | null): number {
  if (mate !== null) return mate > 0 ? SCORE_CAP : -SCORE_CAP;
  return Math.max(-SCORE_CAP, Math.min(SCORE_CAP, score));
}

/** How much worse (>= 0) the played move is than the best one, in centipawns after capping. */
export function centipawnLoss(
  best: { score: number; mate: number | null },
  played: { score: number; mate: number | null },
): number {
  return Math.max(0, capScore(best.score, best.mate) - capScore(played.score, played.mate));
}

export function gradeForLoss(lossCp: number): MoveGrade {
  if (lossCp <= GRADE_LIMITS.best) return 'best';
  if (lossCp <= GRADE_LIMITS.good) return 'good';
  if (lossCp <= GRADE_LIMITS.inaccuracy) return 'inaccuracy';
  if (lossCp <= GRADE_LIMITS.mistake) return 'mistake';
  return 'blunder';
}

/** Inaccuracies, mistakes and blunders are the moves the coach stops the learner on. */
export const needsAttention = (grade: MoveGrade): boolean =>
  grade === 'inaccuracy' || grade === 'mistake' || grade === 'blunder';

/** What is wrong with the move played (at most one is shown). */
export type Reason =
  | { code: 'allowsMate'; moves: number; reply: string }
  | { code: 'hangs'; piece: PieceSymbol; square: string; reply: string }
  | { code: 'missedMate'; moves: number }
  | { code: 'missedWin'; piece: PieceSymbol }
  | { code: 'evalDrop'; pawns: number };

/** What the best move achieves, as far as the engine's line proves. */
export type Plan =
  | { kind: 'mate'; moves: number }
  | { kind: 'capture'; piece: PieceSymbol; check: boolean }
  | { kind: 'line'; pawns: number };

export interface MoveAnalysis {
  playedUci: string;
  playedSan: string;
  bestUci: string;
  bestSan: string;
  /** Centipawns from the mover's side, uncapped (meaningless when a mate is set). */
  bestScore: number;
  playedScore: number;
  /** Moves to mate for the mover (positive) or against it (negative), else null. */
  bestMate: number | null;
  playedMate: number | null;
  /** Capped centipawn loss, see `centipawnLoss`. */
  lossCp: number;
  grade: MoveGrade;
  reasons: Reason[];
  plan: Plan | null;
  /** Plies searched for both scores. */
  depth: number;
}

export interface MoveSuggestion {
  bestUci: string;
  bestSan: string;
  score: number;
  mate: number | null;
  plan: Plan | null;
  depth: number;
}

export interface CoachRequest {
  fen: string;
  /** Earlier positions of the game (FEN, oldest first) so repetition is understood. */
  history?: readonly string[];
  limits?: SearchLimits;
}

/**
 * Per search; analysing a move runs two of them (the best move, then the move played), so a
 * phone worker spends about 1.2 s at most.
 */
export const COACH_LIMITS: SearchLimits = { maxDepth: 6, maxNodes: 1_500_000, maxTimeMs: 600 };

/* ---- exchange counting (rules from chess.js, so pins and check are respected) ---- */

const ATTACKER_ORDER: Readonly<Record<PieceSymbol, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

function promotionBonus(m: Pick<Move, 'promotion'>): number {
  return m.promotion ? PIECE_POINTS[m.promotion] - PIECE_POINTS.p : 0;
}

/**
 * What the side to move wins by capturing on `square` (always the cheapest attacker first) and
 * letting both sides recapture while it pays. Never negative: capturing is optional.
 */
function exchangeGain(chess: Chess, square: Square, depth = 0): number {
  if (depth > 10) return 0;
  const captures = chess
    .moves({ verbose: true })
    .filter((m) => m.to === square && m.captured !== undefined)
    .sort(
      (a, b) =>
        ATTACKER_ORDER[a.piece] - ATTACKER_ORDER[b.piece] ||
        Number(b.promotion === 'q') - Number(a.promotion === 'q'),
    );
  const m = captures[0];
  if (!m || m.captured === undefined) return 0;
  chess.move({ from: m.from, to: m.to, ...(m.promotion ? { promotion: m.promotion } : {}) });
  const gain =
    PIECE_POINTS[m.captured] + promotionBonus(m) - exchangeGain(chess, square, depth + 1);
  chess.undo();
  return Math.max(0, gain);
}

/** Net pawns won by playing the capture `m` once the recaptures on its square are settled. */
function netOfCapture(chess: Chess, m: Move): number {
  if (m.captured === undefined) return 0;
  chess.move({ from: m.from, to: m.to, ...(m.promotion ? { promotion: m.promotion } : {}) });
  const net = PIECE_POINTS[m.captured] + promotionBonus(m) - exchangeGain(chess, m.to);
  chess.undo();
  return net;
}

function capturedSquare(m: Move): string {
  return m.flags.includes('e') ? `${m.to[0]}${m.from[1]}` : m.to;
}

/**
 * Material the mover nets along the engine's main line, in pawns. The line ends where the search
 * stopped, so its last capture may have a recapture that was never played: that capture is counted
 * by its exchange on the square, not at face value. A quiet last move by the mover is dropped
 * (the opponent has not answered it yet).
 */
function lineMaterial(fen: string, pv: readonly string[]): number {
  const probe = new Chess(fen);
  let length = 0;
  for (const uci of pv.slice(0, 8)) {
    if (!playUci(probe, uci)) break;
    length++;
  }
  const lastMove = probe.history({ verbose: true }).at(-1);
  if (length % 2 === 1 && lastMove?.captured === undefined) length--;
  if (length < 2) return 0;

  const chess = new Chess(fen);
  let mover: string | null = null;
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const m = playUci(chess, pv[i] as string);
    if (!m) return 0;
    mover ??= m.color;
    let gain = (m.captured ? PIECE_POINTS[m.captured] : 0) + promotionBonus(m);
    if (i === length - 1 && m.captured !== undefined) {
      chess.undo();
      gain = netOfCapture(chess, m);
    }
    sum += m.color === mover ? gain : -gain;
  }
  return sum;
}

function planFor(fen: string, best: SearchResult): Plan | null {
  if (best.mateIn !== null && best.mateIn > 0) return { kind: 'mate', moves: best.mateIn };
  const chess = new Chess(fen);
  const m = best.move ? playUciPreview(chess, best.move) : null;
  if (m?.captured !== undefined && netOfCapture(chess, m) >= 1) {
    return { kind: 'capture', piece: m.captured, check: m.san.includes('+') };
  }
  const pawns = lineMaterial(fen, best.pv);
  return pawns >= 2 ? { kind: 'line', pawns } : null;
}

/** The move as chess.js sees it, without changing the board. */
function playUciPreview(chess: Chess, uci: string): Move | null {
  const m = playUci(chess, uci);
  if (m) chess.undo();
  return m;
}

function sanOf(fen: string, uci: string): string {
  const m = playUci(new Chess(fen), uci);
  if (!m) throw new Error(`Illegal move ${uci}`);
  return m.san;
}

/* ---- the engine's opinion ---- */

/** The engine's best move here, with what it achieves. */
export function suggestMove(engine: ChessEngine, request: CoachRequest): MoveSuggestion {
  const { fen, history = [], limits = COACH_LIMITS } = request;
  const best = engine.search(fen, limits, history);
  if (best.move === null) throw new Error('No legal moves');
  return {
    bestUci: best.move,
    bestSan: sanOf(fen, best.move),
    score: best.score,
    mate: best.mateIn,
    plan: planFor(fen, best),
    depth: best.depth,
  };
}

/**
 * Grades `move` (UCI, legal in `fen`). The best move and the move played are searched with the
 * same engine and the same depth, so their scores are comparable; the loss is the difference.
 */
export function analyseMove(
  engine: ChessEngine,
  request: CoachRequest & { move: string },
): MoveAnalysis {
  const { fen, move, history = [], limits = COACH_LIMITS } = request;
  const before = new Chess(fen);
  const played = playUci(before, move);
  if (!played) throw new Error(`Illegal move ${move}`);
  before.undo();

  const best = engine.search(fen, limits, history);
  if (best.move === null) throw new Error('No legal moves');
  const bestUci = best.move;

  let bestScore = best.score;
  let bestMate = best.mateIn;
  let playedRes = best;
  let depth = best.depth;
  if (move !== bestUci) {
    playedRes = engine.search(
      fen,
      { ...limits, maxDepth: Math.max(1, best.depth) },
      history,
      undefined,
      [move],
    );
    depth = Math.min(best.depth, playedRes.depth);
    if (playedRes.depth < best.depth) {
      // the clock cut the second search short: score the best move to the same depth
      const again = engine.search(
        fen,
        { ...limits, maxDepth: Math.max(1, playedRes.depth) },
        history,
        undefined,
        [bestUci],
      );
      bestScore = again.score;
      bestMate = again.mateIn;
    }
  }
  const lossCp =
    move === bestUci
      ? 0
      : centipawnLoss(
          { score: bestScore, mate: bestMate },
          { score: playedRes.score, mate: playedRes.mateIn },
        );
  const grade = gradeForLoss(lossCp);
  const analysis: MoveAnalysis = {
    playedUci: move,
    playedSan: played.san,
    bestUci,
    bestSan: sanOf(fen, bestUci),
    bestScore,
    playedScore: playedRes.score,
    bestMate,
    playedMate: playedRes.mateIn,
    lossCp,
    grade,
    reasons: [],
    plan: null,
    depth,
  };
  if (!needsAttention(grade)) return analysis;

  analysis.plan = planFor(fen, best);
  analysis.reasons = reasonsFor(fen, played, playedRes, analysis);
  return analysis;
}

/** The first thing wrong with the move, from the most to the least concrete. */
function reasonsFor(fen: string, played: Move, res: SearchResult, a: MoveAnalysis): Reason[] {
  const after = new Chess(fen);
  playUci(after, a.playedUci);
  const replyUci = res.pv[1];
  const reply = replyUci ? playUciPreview(after, replyUci) : null;

  if (res.mateIn !== null && res.mateIn < 0 && reply) {
    return [{ code: 'allowsMate', moves: -res.mateIn, reply: reply.san }];
  }
  if (reply?.captured !== undefined) {
    const gained = (played.captured ? PIECE_POINTS[played.captured] : 0) + promotionBonus(played);
    if (netOfCapture(after, reply) - gained >= 1) {
      return [
        {
          code: 'hangs',
          piece: reply.captured,
          square: capturedSquare(reply),
          reply: reply.san,
        },
      ];
    }
  }
  if (a.plan?.kind === 'mate' && (a.playedMate === null || a.playedMate < 0)) {
    return [{ code: 'missedMate', moves: a.plan.moves }];
  }
  if (a.plan?.kind === 'capture') return [{ code: 'missedWin', piece: a.plan.piece }];
  return [{ code: 'evalDrop', pawns: Math.round(a.lossCp / 10) / 10 }];
}

/* ---- coach card state (pure, so take-back and resume can be tested) ---- */

export interface CoachCard {
  /** Index in the move list of the learner's move this card is about. */
  ply: number;
  status: 'done' | 'failed';
  analysis?: MoveAnalysis;
  /** The learner pressed Continue on a card that stopped them. */
  acknowledged: boolean;
}

/**
 * Whether the engine may answer the learner's latest move:
 *  - checking: the analysis of that move is still running
 *  - waiting: it was an inaccuracy or worse, and the learner has not decided yet
 *  - open: go ahead (good move, acknowledged, or the analysis failed, which never blocks the game)
 */
export function coachGate(
  card: CoachCard | null,
  movesPlayed: number,
): 'checking' | 'waiting' | 'open' {
  if (!card || card.ply !== movesPlayed - 1) return 'checking';
  if (card.status === 'failed' || !card.analysis) return 'open';
  if (needsAttention(card.analysis.grade) && !card.acknowledged) return 'waiting';
  return 'open';
}

/* ---- review ---- */

/** The compact record of one graded move; this is what is kept with the game draft. */
export interface MoveReview {
  /** Index in the move list. */
  ply: number;
  san: string;
  bestSan: string;
  grade: MoveGrade;
  lossCp: number;
}

export function toReview(ply: number, a: MoveAnalysis): MoveReview {
  return { ply, san: a.playedSan, bestSan: a.bestSan, grade: a.grade, lossCp: a.lossCp };
}

/** Replaces any earlier review of the same move (a retried move), keeping the list ordered. */
export function withReview(reviews: readonly MoveReview[], review: MoveReview): MoveReview[] {
  return [...reviews.filter((r) => r.ply !== review.ply), review].sort((a, b) => a.ply - b.ply);
}

/** Drops the reviews of moves that were taken back (`movesLeft` = length of the move list now). */
export function reviewsAfterUndo(reviews: readonly MoveReview[], movesLeft: number): MoveReview[] {
  return reviews.filter((r) => r.ply < movesLeft);
}

/** Losses above this earn no accuracy at all. */
export const ACCURACY_FLOOR_CP = 400;

/**
 * SkillForge's own figure, not comparable with other sites: each move scores
 * 100 * (1 - min(loss, 400) / 400), and the game accuracy is the mean over the graded moves.
 * A move within 10 cp of the engine's choice scores at least 97.5; a lost knight scores 20 or less.
 */
export function moveAccuracy(lossCp: number): number {
  return 100 * (1 - Math.min(Math.max(lossCp, 0), ACCURACY_FLOOR_CP) / ACCURACY_FLOOR_CP);
}

export interface ReviewSummary {
  moves: number;
  counts: Record<MoveGrade, number>;
  /** Whole percent, or null when nothing was graded. */
  accuracy: number | null;
  /** Up to three of the costliest moves (inaccuracy or worse), worst first. */
  biggest: MoveReview[];
}

export function summariseReviews(reviews: readonly MoveReview[]): ReviewSummary {
  const counts: Record<MoveGrade, number> = {
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  for (const r of reviews) counts[r.grade]++;
  const accuracy =
    reviews.length === 0
      ? null
      : Math.round(reviews.reduce((s, r) => s + moveAccuracy(r.lossCp), 0) / reviews.length);
  const biggest = reviews
    .filter((r) => needsAttention(r.grade))
    .sort((a, b) => b.lossCp - a.lossCp || a.ply - b.ply)
    .slice(0, 3);
  return { moves: reviews.length, counts, accuracy, biggest };
}
