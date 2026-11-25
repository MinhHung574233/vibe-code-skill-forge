import { describe, expect, it } from 'vitest';
import { cellIndex } from './board';
import { isLegalMove, newGame, playMove, replay, stoneCount, stoneToMove, undoMoves } from './game';
import { drawMoves } from './testing';

const i = (r: number, c: number) => cellIndex(15, r, c);

describe('game state', () => {
  it('starts empty with stone 1 to move', () => {
    const g = newGame(15);
    expect(g.moves).toEqual([]);
    expect(g.status).toEqual({ kind: 'playing' });
    expect(stoneToMove(g)).toBe(1);
  });

  it('alternates stones and never mutates the previous state', () => {
    const g0 = newGame(15);
    const g1 = playMove(g0, i(7, 7));
    const g2 = playMove(g1, i(7, 8));
    expect(g0.cells[i(7, 7)]).toBe(0);
    expect(g1.cells[i(7, 7)]).toBe(1);
    expect(g2.cells[i(7, 8)]).toBe(2);
    expect(stoneToMove(g2)).toBe(1);
    expect(stoneCount(g2, 1)).toBe(1);
    expect(stoneCount(playMove(g2, i(0, 0)), 1)).toBe(2);
  });

  it('rejects occupied, out-of-range and non-integer cells', () => {
    const g = playMove(newGame(9), 40);
    expect(isLegalMove(g, 40)).toBe(false);
    expect(isLegalMove(g, -1)).toBe(false);
    expect(isLegalMove(g, 81)).toBe(false);
    expect(isLegalMove(g, 1.5)).toBe(false);
    expect(() => playMove(g, 40)).toThrow(RangeError);
  });

  it('ends with a win and the winning line, then accepts no more moves', () => {
    // X plays row 7, O plays row 8; X completes five on its fifth stone.
    const moves = [0, 1, 2, 3, 4].flatMap((c) => [i(7, c), i(8, c)]).slice(0, 9);
    const g = replay(15, moves);
    expect(g.status).toEqual({
      kind: 'won',
      winner: 1,
      line: [0, 1, 2, 3, 4].map((c) => i(7, c)),
    });
    expect(isLegalMove(g, i(0, 0))).toBe(false);
  });

  it('reports a win for the second player', () => {
    const moves = [
      i(0, 0),
      i(5, 0),
      i(0, 2),
      i(5, 1),
      i(0, 4),
      i(5, 2),
      i(2, 0),
      i(5, 3),
      i(3, 3),
      i(5, 4),
    ];
    expect(replay(15, moves).status).toMatchObject({ kind: 'won', winner: 2 });
  });

  it('declares a draw when the board fills without five in a row', () => {
    const moves = drawMoves(9);
    expect(moves).toHaveLength(81);
    expect(replay(9, moves).status).toEqual({ kind: 'draw' });
  });

  it('undoes moves by replaying the shorter history', () => {
    const g = replay(15, [i(7, 7), i(7, 8), i(6, 6)]);
    const back = undoMoves(g, 2);
    expect(back.moves).toEqual([i(7, 7)]);
    expect(back.cells[i(7, 8)]).toBe(0);
    expect(undoMoves(g, 10).moves).toEqual([]);
  });

  it('replay throws on a corrupt history', () => {
    expect(() => replay(15, [5, 5])).toThrow(RangeError);
  });
});
