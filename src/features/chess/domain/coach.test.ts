import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  ACCURACY_FLOOR_CP,
  COACH_LIMITS,
  GRADE_LIMITS,
  SCORE_CAP,
  analyseMove,
  capScore,
  centipawnLoss,
  coachGate,
  gradeForLoss,
  moveAccuracy,
  needsAttention,
  reviewsAfterUndo,
  summariseReviews,
  suggestMove,
  toReview,
  withReview,
  type CoachCard,
  type MoveAnalysis,
  type MoveReview,
} from './coach';
import { ChessEngine } from './engine';
import { MATE } from './search';

/** Generous clock so the tests depend on the depth, never on how fast the machine is. */
const LIMITS = { ...COACH_LIMITS, maxNodes: 50_000_000, maxTimeMs: 60_000 };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const analyse = (fen: string, move: string) =>
  analyseMove(new ChessEngine(), { fen, move, limits: LIMITS });

describe('grading', () => {
  it('uses the documented centipawn thresholds, inclusive at the upper end', () => {
    expect(GRADE_LIMITS).toEqual({ best: 10, good: 50, inaccuracy: 100, mistake: 250 });
    expect(gradeForLoss(0)).toBe('best');
    expect(gradeForLoss(10)).toBe('best');
    expect(gradeForLoss(11)).toBe('good');
    expect(gradeForLoss(50)).toBe('good');
    expect(gradeForLoss(51)).toBe('inaccuracy');
    expect(gradeForLoss(100)).toBe('inaccuracy');
    expect(gradeForLoss(101)).toBe('mistake');
    expect(gradeForLoss(250)).toBe('mistake');
    expect(gradeForLoss(251)).toBe('blunder');
    expect(gradeForLoss(5000)).toBe('blunder');
  });

  it('stops the learner only on inaccuracies and worse', () => {
    expect(
      ['best', 'good', 'inaccuracy', 'mistake', 'blunder'].map((g) => needsAttention(g as never)),
    ).toEqual([false, false, true, true, true]);
  });

  it('never treats a mate score as a huge number of pawns', () => {
    expect(capScore(MATE - 3, 2)).toBe(SCORE_CAP);
    expect(capScore(-MATE + 4, -2)).toBe(-SCORE_CAP);
    expect(capScore(4000, null)).toBe(SCORE_CAP);
    expect(capScore(-130, null)).toBe(-130);
    // missing a mate while still clearly winning is a real loss, not a 29 000 cp one
    expect(centipawnLoss({ score: MATE - 3, mate: 2 }, { score: 450, mate: null })).toBe(350);
    // a slower mate is as good as a faster one
    expect(centipawnLoss({ score: MATE - 3, mate: 2 }, { score: MATE - 9, mate: 5 })).toBe(0);
    // walking into mate from an equal position
    expect(centipawnLoss({ score: 0, mate: null }, { score: -MATE + 2, mate: -1 })).toBe(SCORE_CAP);
  });

  it('does not punish trading one winning score for another', () => {
    expect(centipawnLoss({ score: 1500, mate: null }, { score: 1100, mate: null })).toBe(0);
    expect(centipawnLoss({ score: 100, mate: null }, { score: 150, mate: null })).toBe(0);
  });

  it('scores accuracy per move on a capped linear scale', () => {
    expect(moveAccuracy(0)).toBe(100);
    expect(moveAccuracy(10)).toBe(97.5);
    expect(moveAccuracy(ACCURACY_FLOOR_CP)).toBe(0);
    expect(moveAccuracy(5000)).toBe(0);
    expect(moveAccuracy(-5)).toBe(100);
  });
});

describe('analysing real positions', () => {
  it('calls a sound developing move best or good and has nothing to complain about', () => {
    const a = analyse(START, 'g1f3');
    expect(['best', 'good']).toContain(a.grade);
    expect(a.reasons).toEqual([]);
    expect(a.playedSan).toBe('Nf3');
    expect(a.depth).toBeGreaterThanOrEqual(5);
  });

  it('grades the engine’s own choice as best with no loss', () => {
    const suggestion = suggestMove(new ChessEngine(), { fen: START, limits: LIMITS });
    const a = analyse(START, suggestion.bestUci);
    expect(a.grade).toBe('best');
    expect(a.lossCp).toBe(0);
    expect(a.bestUci).toBe(suggestion.bestUci);
  });

  it('a move that hangs the queen is a blunder and names the capture', () => {
    // Qxd5?? takes a pawn that the rook defends
    const a = analyse('3rk3/8/8/3p4/8/8/8/3QK3 w - - 0 1', 'd1d5');
    expect(a.grade).toBe('blunder');
    expect(a.playedSan).toBe('Qxd5');
    expect(a.reasons[0]).toEqual({ code: 'hangs', piece: 'q', square: 'd5', reply: 'Rxd5' });
    expect(a.bestUci).not.toBe('d1d5');
    expect(a.lossCp).toBeGreaterThan(GRADE_LIMITS.mistake);
  });

  it('does not call an even trade a hanging piece', () => {
    // Bxf6: the bishop takes a knight and may be recaptured, which is a fair swap
    const a = analyse(
      'r2qkb1r/ppp2ppp/2np1n2/4p1B1/4P3/2N2N2/PPPP1PPP/R2QKB1R w KQkq - 0 1',
      'g5f6',
    );
    expect(['best', 'good']).toContain(a.grade);
    expect(a.reasons).toEqual([]);
  });

  it('a move that allows checkmate says so and counts the moves', () => {
    // 1.f3 e5 2.g4?? Qh4#
    const a = analyse('rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2', 'g2g4');
    expect(a.grade).toBe('blunder');
    expect(a.reasons[0]).toEqual({ code: 'allowsMate', moves: 1, reply: 'Qh4#' });
    expect(a.playedMate).toBe(-1);
  });

  it('detects a missed mate in 1 and shows the mating move', () => {
    const a = analyse('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 'g1f1');
    expect(['mistake', 'blunder']).toContain(a.grade);
    expect(a.bestUci).toBe('a1a8');
    expect(a.bestSan).toBe('Ra8#');
    expect(a.bestMate).toBe(1);
    expect(a.plan).toEqual({ kind: 'mate', moves: 1 });
    expect(a.reasons).toEqual([{ code: 'missedMate', moves: 1 }]);
  });

  it('detects a free queen that was not taken', () => {
    const a = analyse('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', 'e1e2');
    expect(a.grade).toBe('blunder');
    expect(a.bestSan).toBe('Rxd5');
    expect(a.plan).toEqual({ kind: 'capture', piece: 'q', check: false });
    expect(a.reasons).toEqual([{ code: 'missedWin', piece: 'q' }]);
  });

  it('shows what a quiet best move wins when the gain comes a move later (a fork)', () => {
    // Nc7+ forks king and rook; the rook falls on the next move
    const a = analyse('r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1', 'e1d1');
    expect(a.grade).toBe('blunder');
    expect(a.bestSan).toBe('Nc7+');
    expect(a.plan).toEqual({ kind: 'line', pawns: 5 });
  });

  it('names the pawn the best move wins when the move played gave that up', () => {
    // Nd5 lets the e5 pawn live, while Nxe5 simply wins it
    const a = analyse('rnbqkb1r/pppp1ppp/5n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 1', 'c3d5');
    expect(needsAttention(a.grade)).toBe(true);
    expect(a.bestSan).toBe('Nxe5');
    expect(a.reasons).toEqual([{ code: 'missedWin', piece: 'p' }]);
  });

  it('falls back to an evaluation sentence in tenths of a pawn for a quiet, costly move', () => {
    // an early queen sortie: nothing is lost on the spot, the engine just prefers development
    const a = analyse('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', 'd1h5');
    expect(['inaccuracy', 'mistake']).toContain(a.grade);
    expect(a.reasons).toEqual([{ code: 'evalDrop', pawns: Math.round(a.lossCp / 10) / 10 }]);
    expect(a.bestSan).toBe('Nc3');
  });

  it('suggests a move with its SAN and what it achieves', () => {
    const s = suggestMove(new ChessEngine(), {
      fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
      limits: LIMITS,
    });
    expect(s).toMatchObject({
      bestUci: 'a1a8',
      bestSan: 'Ra8#',
      mate: 1,
      plan: { kind: 'mate', moves: 1 },
    });
  });

  it('refuses an illegal move', () => {
    expect(() => analyse(START, 'e2e5')).toThrow();
  });

  it('keeps the whole analysis within a phone-sized budget on the default limits', () => {
    const t0 = performance.now();
    analyseMove(new ChessEngine(), {
      fen: 'r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2PBPN2/PP1N1PPP/R2QK2R w KQ - 0 8',
      move: 'e1g1',
    });
    // two searches of at most 600 ms each, plus a little overhead for the line and the SAN
    expect(performance.now() - t0).toBeLessThan(2500);
  });
});

describe('coach card state', () => {
  const analysis = (grade: MoveAnalysis['grade']): MoveAnalysis => ({
    playedUci: 'e2e4',
    playedSan: 'e4',
    bestUci: 'd2d4',
    bestSan: 'd4',
    bestScore: 20,
    playedScore: 0,
    bestMate: null,
    playedMate: null,
    lossCp: 20,
    grade,
    reasons: [],
    plan: null,
    depth: 6,
  });
  const card = (patch: Partial<CoachCard>): CoachCard => ({
    ply: 0,
    status: 'done',
    analysis: analysis('good'),
    acknowledged: false,
    ...patch,
  });

  it('is checking until the card is about the learner’s latest move', () => {
    expect(coachGate(null, 1)).toBe('checking');
    expect(coachGate(card({ ply: 0 }), 3)).toBe('checking'); // an old card
    expect(coachGate(card({ ply: 2 }), 3)).toBe('open');
  });

  it('holds the engine back on a bad move until the learner continues', () => {
    const bad = card({ analysis: analysis('blunder') });
    expect(coachGate(bad, 1)).toBe('waiting');
    expect(coachGate({ ...bad, acknowledged: true }, 1)).toBe('open');
    expect(coachGate(card({ analysis: analysis('inaccuracy') }), 1)).toBe('waiting');
    expect(coachGate(card({ analysis: analysis('best') }), 1)).toBe('open');
  });

  it('never blocks the game when the analysis failed', () => {
    expect(coachGate({ ply: 0, status: 'failed', acknowledged: false }, 1)).toBe('open');
  });
});

describe('review of a game', () => {
  const review = (ply: number, grade: MoveReview['grade'], lossCp: number): MoveReview => ({
    ply,
    san: `m${ply}`,
    bestSan: `b${ply}`,
    grade,
    lossCp,
  });

  it('drops the reviews of moves that were taken back and replaces retried ones', () => {
    const all = [review(0, 'best', 0), review(2, 'blunder', 600), review(4, 'good', 30)];
    expect(reviewsAfterUndo(all, 3).map((r) => r.ply)).toEqual([0, 2]);
    expect(reviewsAfterUndo(all, 0)).toEqual([]);
    const retried = withReview(reviewsAfterUndo(all, 2), review(2, 'best', 0));
    expect(retried.map((r) => [r.ply, r.grade])).toEqual([
      [0, 'best'],
      [2, 'best'],
    ]);
  });

  it('turns an analysis into the compact record kept with the draft', () => {
    const a: MoveAnalysis = {
      playedUci: 'g2g4',
      playedSan: 'g4',
      bestUci: 'g1f3',
      bestSan: 'Nf3',
      bestScore: 20,
      playedScore: -900,
      bestMate: null,
      playedMate: -1,
      lossCp: 800,
      grade: 'blunder',
      reasons: [],
      plan: null,
      depth: 6,
    };
    expect(toReview(4, a)).toEqual({
      ply: 4,
      san: 'g4',
      bestSan: 'Nf3',
      grade: 'blunder',
      lossCp: 800,
    });
  });

  it('counts the grades, averages the accuracy and lists the three costliest moves', () => {
    const s = summariseReviews([
      review(0, 'best', 0),
      review(2, 'good', 40),
      review(4, 'inaccuracy', 80),
      review(6, 'mistake', 200),
      review(8, 'blunder', 700),
      review(10, 'blunder', 900),
    ]);
    expect(s.moves).toBe(6);
    expect(s.counts).toEqual({ best: 1, good: 1, inaccuracy: 1, mistake: 1, blunder: 2 });
    // (100 + 90 + 80 + 50 + 0 + 0) / 6 = 53.3
    expect(s.accuracy).toBe(53);
    expect(s.biggest.map((r) => r.ply)).toEqual([10, 8, 6]);
  });

  it('has no accuracy and no list for an empty review', () => {
    expect(summariseReviews([])).toEqual({
      moves: 0,
      counts: { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 },
      accuracy: null,
      biggest: [],
    });
  });

  it('only lists real mistakes as biggest, never good moves', () => {
    expect(summariseReviews([review(0, 'good', 45), review(2, 'best', 0)]).biggest).toEqual([]);
  });
});

describe('searching one move (the engine behind the grading)', () => {
  const FEN = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';

  it('restricts the root to the given moves and reports the line it expects', () => {
    const engine = new ChessEngine();
    const free = engine.search(FEN, LIMITS, []);
    const only = engine.search(FEN, LIMITS, [], undefined, ['h7h6']);
    expect(only.move).toBe('h7h6');
    expect(only.pv[0]).toBe('h7h6');
    expect(only.score).toBeLessThanOrEqual(free.score);
    expect(free.pv[0]).toBe(free.move);
    expect(free.pv.length).toBeGreaterThan(1);
  });

  it('every move of the reported line is legal in turn', () => {
    const engine = new ChessEngine();
    const { pv } = engine.search(START, LIMITS, []);
    const chess = new Chess();
    for (const uci of pv) {
      expect(() =>
        chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }),
      ).not.toThrow();
    }
  });

  it('reports no move when none of the requested moves is legal', () => {
    const r = new ChessEngine().search(START, LIMITS, [], undefined, ['e2e5']);
    expect(r.move).toBeNull();
    expect(r.pv).toEqual([]);
  });
});
