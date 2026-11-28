import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { ChessEngine } from './engine';
import { PUZZLES, THEME_LABELS, type Puzzle } from './puzzles';
import { materialBalance, playUci } from './rules';
import { mateDistance } from './search';

const engine = new ChessEngine();
const TIMEOUT = 30_000;

/**
 * Exhaustive search with chess.js alone (no engine code involved): the side to move's first moves
 * that force checkmate within `n` of its own moves.
 */
function matingFirstMoves(chess: Chess, n: number): string[] {
  const found: string[] = [];
  for (const move of chess.moves({ verbose: true })) {
    chess.move(move);
    let forced = false;
    if (chess.isCheckmate()) forced = true;
    else if (n > 1 && !chess.isGameOver()) {
      forced = chess.moves({ verbose: true }).every((reply) => {
        chess.move(reply);
        const answered = matingFirstMoves(chess, n - 1).length > 0;
        chess.undo();
        return answered;
      });
    }
    chess.undo();
    if (forced) found.push(move.from + move.to + (move.promotion ?? ''));
  }
  return found;
}

function solverSign(fen: string): 1 | -1 {
  return new Chess(fen).turn() === 'w' ? 1 : -1;
}

describe('puzzle library', () => {
  it('has at least 40 puzzles with unique ids and a spread of difficulty', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length);
    const ratings = PUZZLES.map((p) => p.rating);
    expect(Math.min(...ratings)).toBeGreaterThanOrEqual(600);
    expect(Math.max(...ratings)).toBeLessThanOrEqual(1800);
    expect(Math.max(...ratings) - Math.min(...ratings)).toBeGreaterThanOrEqual(600);
  });

  it('covers the advertised themes', () => {
    const themes = new Set(PUZZLES.flatMap((p) => p.themes));
    for (const t of [
      'mate-in-1',
      'mate-in-2',
      'mate-in-3',
      'fork',
      'pin',
      'skewer',
      'back-rank',
      'hanging-piece',
    ]) {
      expect(themes.has(t as never), t).toBe(true);
    }
    for (const t of themes) expect(THEME_LABELS[t]).toBeTruthy();
  });
});

describe.each(PUZZLES.map((p) => [p.id, p] as const))('puzzle %s', (_id, puzzle: Puzzle) => {
  it('has a valid position and a legal solution that ends on the solver’s move', () => {
    const chess = new Chess(puzzle.fen);
    expect(chess.isGameOver()).toBe(false);
    // the side that is not to move must not be in check (an unreachable position)
    const flipped = puzzle.fen.replace(/ [wb] /, chess.turn() === 'w' ? ' b ' : ' w ');
    expect(new Chess(flipped).inCheck()).toBe(false);

    expect(puzzle.solution.length % 2).toBe(1);
    puzzle.solution.forEach((uci, i) => {
      expect(playUci(chess, uci), `move ${i + 1}: ${uci}`).not.toBeNull();
      if (i < puzzle.solution.length - 1) expect(chess.isGameOver()).toBe(false);
    });
    expect(puzzle.themes.length).toBeGreaterThan(0);
  });

  if (puzzle.goal.type === 'mate') {
    const n = puzzle.goal.in;
    it(
      `is a forced mate in ${n}: the line ends in checkmate and the first move is the only mating one`,
      () => {
        expect(puzzle.themes).toContain(`mate-in-${n}`);
        expect(puzzle.solution.length).toBe(2 * n - 1);
        const chess = new Chess(puzzle.fen);
        for (const uci of puzzle.solution) playUci(chess, uci);
        expect(chess.isCheckmate()).toBe(true);

        // the engine searches every defence: a mate of exactly this length must exist, no shorter
        // one may, and (for n > 1) the listed first move must be the only way to reach it
        const roots = engine.scoreRootMoves(puzzle.fen, 2 * n);
        const mates = roots.flatMap((r) => {
          const d = mateDistance(r.score);
          return d !== null && d > 0 && d <= n ? [{ move: r.move, d }] : [];
        });
        expect(mates.some((m) => m.d < n)).toBe(false);
        expect(mates.map((m) => m.move)).toContain(puzzle.solution[0]);
        if (n > 1) expect(mates.map((m) => m.move)).toEqual([puzzle.solution[0]]);

        // second opinion without the engine, while exhaustive search is still cheap
        if (n <= 2) {
          const exhaustive = matingFirstMoves(new Chess(puzzle.fen), n);
          expect(exhaustive).toContain(puzzle.solution[0]);
          if (n === 2) expect(exhaustive).toEqual([puzzle.solution[0]]);
        }
      },
      TIMEOUT,
    );
  } else {
    const { gain } = puzzle.goal;
    it(
      `wins ${gain} pawns of material: stated gain matches a count, and the first move clearly beats the alternatives`,
      () => {
        const sign = solverSign(puzzle.fen);
        const before = materialBalance(puzzle.fen) * sign;
        const chess = new Chess(puzzle.fen);
        for (const uci of puzzle.solution) playUci(chess, uci);
        // let the opponent answer as well as the engine can: recaptures count against the gain
        const reply = engine.scoreRootMoves(chess.fen(), 4)[0];
        if (reply) playUci(chess, reply.move);
        const after = materialBalance(chess.fen()) * sign;
        expect(after - before).toBe(gain);
        expect(gain).toBeGreaterThanOrEqual(2);

        const roots = engine.scoreRootMoves(puzzle.fen, 5);
        expect(roots[0]?.move).toBe(puzzle.solution[0]);
        expect((roots[0]?.score ?? 0) - (roots[1]?.score ?? 0)).toBeGreaterThanOrEqual(100);
      },
      TIMEOUT,
    );
  }
});
