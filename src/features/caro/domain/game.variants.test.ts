import { describe, expect, it } from 'vitest';
import { OBSTACLE, cellIndex } from './board';
import {
  firstDeadFive,
  isLegalMove,
  newGame,
  playMove,
  playableCells,
  replay,
  undoMoves,
} from './game';
import { placeObstacles } from './obstacles';
import { drawMoves } from './testing';

const i = (r: number, c: number) => cellIndex(15, r, c);

/**
 * X builds row 7, columns 4-8. O walls it in at columns 3 and 9 and plays harmless stones far
 * away. The fifth X stone (last move) completes a five closed at both ends.
 */
const DEAD_FIVE_MOVES = [
  i(7, 4),
  i(7, 3),
  i(7, 5),
  i(7, 9),
  i(7, 6),
  i(0, 0),
  i(7, 7),
  i(0, 5),
  i(7, 8),
];

describe('game state with a rule and blocked squares', () => {
  it('defaults to freestyle with no blocked squares', () => {
    const g = newGame(15);
    expect(g.rule).toBe('freestyle');
    expect(g.obstacles).toEqual([]);
  });

  it('marks blocked squares in the cells and refuses to play on them', () => {
    const obstacles = [i(2, 2), i(12, 12)];
    const g = newGame(15, { rule: 'blocked', obstacles });
    expect(g.cells[i(2, 2)]).toBe(OBSTACLE);
    expect(isLegalMove(g, i(2, 2))).toBe(false);
    expect(() => playMove(g, i(12, 12))).toThrow(RangeError);
    expect(isLegalMove(g, i(7, 7))).toBe(true);
    expect(playableCells(g)).toBe(225 - 2);
  });

  it('rejects an obstacle that is off the board', () => {
    expect(() => newGame(9, { obstacles: [81] })).toThrow(RangeError);
  });

  it('keeps the rule and the blocked squares through moves, replay and undo', () => {
    const obstacles = placeObstacles(19, 3, 7);
    const options = { rule: 'blocked' as const, obstacles };
    const g = replay(19, [cellIndex(19, 9, 9), cellIndex(19, 9, 10), cellIndex(19, 8, 9)], options);
    expect(g.rule).toBe('blocked');
    expect(g.obstacles).toEqual(obstacles);
    for (const cell of obstacles) expect(g.cells[cell]).toBe(OBSTACLE);
    const back = undoMoves(g, 2);
    expect(back.moves).toEqual([cellIndex(19, 9, 9)]);
    expect(back.rule).toBe('blocked');
    for (const cell of obstacles) expect(back.cells[cell]).toBe(OBSTACLE);
    expect(undoMoves(g, 10).moves).toEqual([]);
    // Replaying the same list reproduces the same position.
    expect(replay(19, g.moves, g)).toEqual(g);
  });

  it('replay throws when a history plays on a blocked square', () => {
    expect(() => replay(15, [i(2, 2)], { obstacles: [i(2, 2)] })).toThrow(RangeError);
  });

  it('a blocked square stops a line: four plus one beyond it is no win', () => {
    const obstacles = [i(7, 6)];
    // X: (7,4) (7,5) (7,7) (7,8) (7,9); O elsewhere.
    const moves = [
      i(7, 4),
      i(0, 0),
      i(7, 5),
      i(0, 5),
      i(7, 7),
      i(0, 10),
      i(7, 8),
      i(10, 0),
      i(7, 9),
    ];
    expect(replay(15, moves, { obstacles }).status).toEqual({ kind: 'playing' });
  });

  it('is a draw when every playable square is filled, blocked squares aside', () => {
    // A full 9x9 filling with no five, minus three blocked squares chosen so both colours keep
    // the same number of stones.
    for (let seed = 0; seed < 300; seed++) {
      const obstacles = placeObstacles(9, 3, seed);
      const moves = drawMoves(9).filter((cell) => !obstacles.includes(cell));
      // drawMoves alternates colours by list order, so colours stay legal only if the pattern
      // keeps its x/o split; replaying decides.
      try {
        const g = replay(9, moves, { rule: 'blocked', obstacles });
        if (g.status.kind === 'draw') {
          expect(g.moves).toHaveLength(78);
          return;
        }
      } catch {
        // not a legal history for this layout; try the next seed
      }
    }
    throw new Error('no layout produced a draw');
  });
});

describe('the blocked rule in play', () => {
  it('a five closed at both ends does not end a blocked game, but ends a freestyle one', () => {
    const free = replay(15, DEAD_FIVE_MOVES, { rule: 'freestyle' });
    expect(free.status).toMatchObject({ kind: 'won', winner: 1 });
    const blocked = replay(15, DEAD_FIVE_MOVES, { rule: 'blocked' });
    expect(blocked.status).toEqual({ kind: 'playing' });
    expect(isLegalMove(blocked, i(10, 10))).toBe(true);
  });

  it('a five with one free end wins', () => {
    const moves = [i(7, 4), i(7, 3), i(7, 5), i(0, 9), i(7, 6), i(0, 0), i(7, 7), i(0, 5), i(7, 8)];
    expect(replay(15, moves, { rule: 'blocked' }).status).toMatchObject({ kind: 'won', winner: 1 });
  });

  it('a five closed by a blocked square and a stone does not win', () => {
    const moves = [
      i(7, 4),
      i(0, 0),
      i(7, 5),
      i(7, 9),
      i(7, 6),
      i(0, 5),
      i(7, 7),
      i(0, 10),
      i(7, 8),
    ];
    const options = { rule: 'blocked' as const, obstacles: [i(7, 3)] };
    expect(replay(15, moves, options).status).toEqual({ kind: 'playing' });
  });

  it('reports the move that completed the dead five (for the one-time hint)', () => {
    expect(firstDeadFive(replay(15, DEAD_FIVE_MOVES, { rule: 'blocked' }))).toBe(8);
    expect(firstDeadFive(replay(15, DEAD_FIVE_MOVES.slice(0, 8), { rule: 'blocked' }))).toBeNull();
    expect(firstDeadFive(replay(15, DEAD_FIVE_MOVES, { rule: 'freestyle' }))).toBeNull();
  });

  it('the game can still be won later after a dead five', () => {
    // After the dead five (move 8) O plays (0,10); X then makes another, open five elsewhere.
    const base = [...DEAD_FIVE_MOVES, i(0, 10)];
    // X (13,4)..(13,8) with O harmless stones at the far edge of row 1.
    const more = [4, 5, 6, 7, 8].flatMap((c, k) => [i(13, c), i(1, 2 * k)]).slice(0, 9);
    const g = replay(15, [...base, ...more], { rule: 'blocked' });
    expect(g.status).toMatchObject({ kind: 'won', winner: 1 });
  });
});
