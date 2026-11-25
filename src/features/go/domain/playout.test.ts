import { describe, expect, it } from 'vitest';
import { BLACK, Board, WHITE, boardFromRows } from './board';
import { estimateWinner, playout } from './playout';
import { createRng } from './rng';

const nine = (rows: string[]): Board => {
  const full = [...rows];
  while (full.length < 9) full.push('.........');
  return boardFromRows(full.map((r) => r.padEnd(9, '.')));
};

describe('estimateWinner (nearest-stone territory for unfinished boards)', () => {
  it('gives each empty point to the nearest colour and ignores contested points', () => {
    const columns = Array.from({ length: 9 }, () => '..X.....O');
    // black holds columns 0-3, white 5-8; the middle column is equidistant and counts for nobody
    expect(estimateWinner(nine(columns), 0.5)).toBe(BLACK);
    expect(estimateWinner(nine(columns), 30)).toBe(WHITE);
  });

  it('is a draw only when the totals match exactly', () => {
    const board = Board.empty(9);
    board.setStone(0, BLACK);
    board.setStone(80, WHITE);
    expect(estimateWinner(board, 0)).toBe('draw');
  });
});

describe('playout', () => {
  it('plays a position to the end and agrees with the obvious winner', () => {
    // Black owns the board with two eyes; White has a single stone in a corner.
    const board = nine([
      '.X.XXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXX',
      'XXXXXXXXO',
    ]);
    const rng = createRng(1);
    for (let i = 0; i < 5; i++) {
      const sim = board.clone();
      expect(playout(sim, WHITE, -1, -1, rng, { maxMoves: 200, komi: 6.5 })).toBe(BLACK);
    }
  });

  it('stops at the move limit and estimates instead', () => {
    const board = Board.empty(9);
    expect(playout(board, BLACK, -1, -1, createRng(2), { maxMoves: 3, komi: 6.5 })).toBeDefined();
    expect(board.stoneCount(BLACK) + board.stoneCount(WHITE)).toBeLessThanOrEqual(3);
  });

  it('never leaves a group without liberties', () => {
    const board = Board.empty(9);
    playout(board, BLACK, -1, -1, createRng(3), { maxMoves: 300, komi: 6.5 });
    for (let p = 0; p < 81; p++)
      if (board.get(p) !== 0) expect(board.libertyCount(p)).toBeGreaterThan(0);
  });
});
