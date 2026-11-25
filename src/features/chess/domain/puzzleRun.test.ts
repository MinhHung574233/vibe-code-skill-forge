import { describe, expect, it } from 'vitest';
import {
  applyReply,
  giveHint,
  isCleanSolve,
  pickPuzzle,
  revealStep,
  startRun,
  tryMove,
  type PuzzleRun,
} from './puzzleRun';
import { PUZZLES, puzzleById, type Puzzle } from './puzzles';

const must = (id: string): Puzzle => {
  const p = puzzleById(id);
  if (!p) throw new Error(`missing puzzle ${id}`);
  return p;
};

function correct(run: PuzzleRun, uci: string) {
  const out = tryMove(run, uci);
  if (out.kind !== 'correct') throw new Error(`expected a correct move, got ${out.kind}`);
  return out;
}

describe('tryMove', () => {
  const mate1 = must('m1-back-rank-rook');

  it('solves a mate in 1 and flags a wrong or illegal move without changing the position', () => {
    const run = startRun(mate1);
    const wrong = tryMove(run, 'a1a7');
    expect(wrong.kind).toBe('wrong');
    if (wrong.kind === 'wrong') {
      expect(wrong.run.fen).toBe(run.fen);
      expect(wrong.run.mistakes).toBe(1);
    }
    expect(tryMove(run, 'a1h8').kind).toBe('illegal');
    const done = correct(run, 'a1a8');
    expect(done.reply).toBeNull();
    expect(done.run.status).toBe('solved');
    expect(isCleanSolve(done.run)).toBe(true);
  });

  it('plays a mate in 2: the scripted reply follows the first move and the mate finishes it', () => {
    const puzzle = must('m2-ladder');
    const [first, reply, last] = puzzle.solution as [string, string, string];
    const afterFirst = correct(startRun(puzzle), first);
    expect(afterFirst.reply).toBe(reply);
    expect(afterFirst.run.status).toBe('playing');
    expect(tryMove(afterFirst.run, last).kind).toBe('illegal'); // not the solver's turn yet
    const replied = applyReply(afterFirst.run);
    expect(replied.ply).toBe(2);
    const done = correct(replied, last);
    expect(done.run.status).toBe('solved');
    expect(done.run.played).toEqual([first, reply, last]);
  });

  it('accepts any checkmating move, listed or not', () => {
    // Qb8# and Qg7# are not both reachable from b1; use a position where two queens mate
    const run = startRun(must('m1-queen-back-rank-black'));
    // the author lists one mating move; any other move that mates must also be accepted
    const alternatives = ['b2b1', 'b2c1', 'b2a1'];
    const listed = run.puzzle.solution[0];
    expect(alternatives).toContain(listed);
    for (const uci of alternatives) {
      expect(tryMove(run, uci).kind, uci).toBe('correct');
    }
  });

  it('rejects a quiet move that merely looks plausible in a mate in 2', () => {
    expect(tryMove(startRun(must('m2-ladder')), 'a2a7').kind).toBe('wrong');
  });

  it('counts a solve with mistakes or hints as not clean', () => {
    const puzzle = must('m1-back-rank-rook');
    const wrong = tryMove(startRun(puzzle), 'a1a7');
    if (wrong.kind !== 'wrong') throw new Error('expected wrong');
    expect(isCleanSolve(correct(wrong.run, 'a1a8').run)).toBe(false);
    expect(isCleanSolve(correct(giveHint(startRun(puzzle)), 'a1a8').run)).toBe(false);
  });
});

describe('hints and reveal', () => {
  it('first hint names the piece, the second also the destination', () => {
    const one = giveHint(startRun(must('m1-back-rank-rook')));
    expect(one.hintSquares).toEqual(['a1']);
    const two = giveHint(one);
    expect(two.hintSquares).toEqual(['a1', 'a8']);
    expect(two.hints).toBe(2);
  });

  it('reveal plays out the stored solution for both sides and ends as revealed, never solved', () => {
    const puzzle = must('m2-ladder');
    let run = startRun(puzzle);
    for (let i = 0; i < 5 && run.status === 'playing'; i++) run = revealStep(run);
    expect(run.status).toBe('revealed');
    expect(run.played).toEqual([...puzzle.solution]);
    expect(isCleanSolve(run)).toBe(false);
  });
});

describe('pickPuzzle', () => {
  it('serves the unsolved puzzle closest to the rating', () => {
    const pick = pickPuzzle(PUZZLES, new Set(), 1000);
    const best = Math.min(...PUZZLES.map((p) => Math.abs(p.rating - 1000)));
    expect(Math.abs((pick?.puzzle.rating ?? 0) - 1000)).toBe(best);
    expect(pick?.practice).toBe(false);
    const high = pickPuzzle(PUZZLES, new Set(), 1700);
    expect(high?.puzzle.rating).toBe(Math.max(...PUZZLES.map((p) => p.rating)));
  });

  it('skips solved puzzles and the one just played', () => {
    const first = pickPuzzle(PUZZLES, new Set(), 1000);
    const firstId = first?.puzzle.id ?? '';
    expect(pickPuzzle(PUZZLES, new Set([firstId]), 1000)?.puzzle.id).not.toBe(firstId);
    expect(pickPuzzle(PUZZLES, new Set(), 1000, { exclude: firstId })?.puzzle.id).not.toBe(firstId);
  });

  it('offers practice (no XP) once everything is solved', () => {
    const all = new Set(PUZZLES.map((p) => p.id));
    expect(pickPuzzle(PUZZLES, all, 1000, { random: () => 0 })?.practice).toBe(true);
    expect(pickPuzzle([], new Set(), 1000)).toBeNull();
  });
});
