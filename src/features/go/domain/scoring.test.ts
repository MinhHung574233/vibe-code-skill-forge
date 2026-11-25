import { describe, expect, it } from 'vitest';
import { BLACK, Board, EMPTY, WHITE, boardFromRows } from './board';
import { areaScore, formatMargin, toggleDeadGroup } from './scoring';
import { defaultKomi, handicapPoints, maxHandicap } from './handicap';

const nine = (rows: string[]): Board => {
  const full = [...rows];
  while (full.length < 9) full.push('.........');
  return boardFromRows(full.map((r) => r.padEnd(9, '.')));
};
const column = (row: string): string[] => Array.from({ length: 9 }, () => row);

describe('area scoring', () => {
  it('splits a board down the middle: stones plus territory, then komi', () => {
    // black column at x=4, white at x=5; black owns 4 columns, white 3
    const s = areaScore(nine(column('....XO...')), 6.5);
    expect(s.blackStones).toBe(9);
    expect(s.whiteStones).toBe(9);
    expect(s.blackTerritory).toBe(36);
    expect(s.whiteTerritory).toBe(27);
    expect(s.neutral).toBe(0);
    expect(s.black).toBe(45);
    expect(s.white).toBe(36);
    expect(s.margin).toBe(2.5);
    expect(s.winner).toBe(BLACK);
  });

  it('komi can flip the winner, and an exact tie is a draw', () => {
    const board = nine(column('....XO...'));
    expect(areaScore(board, 9.5).winner).toBe(WHITE);
    expect(areaScore(board, 9).winner).toBe('draw');
    expect(areaScore(board, 9).margin).toBe(0);
  });

  it('treats an empty region touching both colours as neutral (dame)', () => {
    const dame = areaScore(nine(column('XXXX.OOOO')), 0.5);
    expect(dame).toMatchObject({ black: 36, white: 36, neutral: 9 });
    expect(dame.winner).toBe(WHITE); // komi 0.5 breaks the tie
  });

  it('an empty board is entirely neutral', () => {
    const s = areaScore(Board.empty(9), 6.5);
    expect(s).toMatchObject({ black: 0, white: 0, neutral: 81, winner: WHITE });
    expect(s.margin).toBe(-6.5);
  });

  it('a lone stone claims the whole empty board (it touches only one colour)', () => {
    const board = Board.empty(9);
    board.setStone(40, BLACK);
    expect(areaScore(board, 0.5).black).toBe(81);
  });

  it('seki groups keep their stones and share neutral liberties', () => {
    const board = boardFromRows(['XX.OO', 'XX.OO', 'XXXOO']);
    const s = areaScore(board, 0.5);
    expect(s).toMatchObject({ blackStones: 7, whiteStones: 6, neutral: 2, blackTerritory: 0 });
  });

  it('marking stones dead turns their points into the other side territory', () => {
    const rows = column('....XO...');
    rows[1] = '.O..XO...';
    const board = nine(rows);
    const alive = areaScore(board, 0.5);
    expect(alive.neutral).toBe(35); // the black region touches the white stone
    const dead = areaScore(board, 0.5, new Set([9 + 1]));
    expect(dead.blackTerritory).toBe(36);
    expect(dead.whiteStones).toBe(9);
    expect(dead.neutral).toBe(0);
  });

  it('dead stones of both colours are removed before regions are found', () => {
    const s = areaScore(nine(['XO.......']), 0, new Set([0, 1]));
    expect(s).toMatchObject({ black: 0, white: 0, neutral: 81, winner: 'draw' });
  });

  it('exposes a per-point owner map for the territory overlay', () => {
    const { owner } = areaScore(nine(column('....XO...')), 6.5);
    expect(owner[0]).toBe(BLACK);
    expect(owner[4]).toBe(BLACK);
    expect(owner[8]).toBe(WHITE);
    expect(areaScore(nine(column('XXXX.OOOO')), 0.5).owner[4]).toBe(EMPTY);
  });

  it('a hand-built 9x9 end position: walls with a row of dame between them', () => {
    const board = nine([
      '.........',
      '.........',
      '.........',
      'XXXXXXXXX',
      '.........',
      'OOOOOOOOO',
      '.........',
      '.........',
      '.........',
    ]);
    const s = areaScore(board, 7.5);
    expect(s).toMatchObject({
      blackStones: 9,
      whiteStones: 9,
      blackTerritory: 27,
      whiteTerritory: 27,
      neutral: 9,
      black: 36,
      white: 36,
    });
    expect(s.margin).toBe(-7.5);
  });

  it('a hand-built 9x9 position with a corner moyo and a captured-looking dead group', () => {
    // Black owns the left of a diagonal-free split; two dead white stones sit in its area.
    const rows = column('...XO....');
    rows[2] = '.O.XO....';
    rows[3] = '.O.XO....';
    const board = nine(rows);
    const s = areaScore(board, 6.5, new Set([2 * 9 + 1, 3 * 9 + 1]));
    // black: 9 stones + 3 columns x 9 = 27 -> 36 ; white: 9 stones + 4 columns x 9 = 36 -> 45
    expect(s).toMatchObject({ black: 36, white: 45 });
    expect(s.winner).toBe(WHITE);
    expect(s.margin).toBe(-15.5);
  });
});

describe('formatMargin', () => {
  it('uses the usual notation', () => {
    expect(formatMargin(BLACK, 3.5)).toBe('B+3.5');
    expect(formatMargin(WHITE, -12)).toBe('W+12');
    expect(formatMargin('draw', 0)).toBe('Draw');
  });
});

describe('toggleDeadGroup', () => {
  it('marks and unmarks a whole group, ignoring empty points', () => {
    const board = boardFromRows(['XX...', '.....', '..O..', '.....', '.....']);
    const dead = toggleDeadGroup(board, new Set(), 0);
    expect([...dead].sort()).toEqual([0, 1]);
    expect(toggleDeadGroup(board, dead, 1).size).toBe(0);
    expect(toggleDeadGroup(board, dead, 24)).toEqual(dead); // empty point: no change
    expect(toggleDeadGroup(board, dead, 12).size).toBe(3);
  });

  it('does not mutate its input', () => {
    const board = boardFromRows(['X....', '.....', '.....', '.....', '.....']);
    const input = new Set<number>();
    toggleDeadGroup(board, input, 0);
    expect(input.size).toBe(0);
  });
});

describe('handicap placement', () => {
  it('uses the standard star points on 19x19', () => {
    const t = (x: number, y: number) => y * 19 + x;
    expect(handicapPoints(19, 2)).toEqual([t(3, 15), t(15, 3)]);
    expect(handicapPoints(19, 4)).toEqual([t(3, 15), t(15, 3), t(15, 15), t(3, 3)]);
    expect(new Set(handicapPoints(19, 5)).has(t(9, 9))).toBe(true);
    expect(new Set(handicapPoints(19, 9))).toEqual(
      new Set([3, 9, 15].flatMap((x) => [3, 9, 15].map((y) => t(x, y)))),
    );
  });

  it('gives the right number of distinct points for every handicap', () => {
    for (const size of [13, 19] as const) {
      for (let n = 2; n <= 9; n++) {
        const points = handicapPoints(size, n);
        expect(points).toHaveLength(n);
        expect(new Set(points).size).toBe(n);
      }
    }
    for (let n = 2; n < 5; n++) {
      expect(handicapPoints(13, n + 1).slice(0, n)).toEqual(handicapPoints(13, n));
    }
  });

  it('puts 3-3 corners and the centre on 9x9, up to five stones', () => {
    const t = (x: number, y: number) => y * 9 + x;
    expect(handicapPoints(9, 5)).toEqual([t(2, 6), t(6, 2), t(6, 6), t(2, 2), t(4, 4)]);
    expect(maxHandicap(9)).toBe(5);
    expect(() => handicapPoints(9, 6)).toThrow();
  });

  it('0 and 1 place nothing; invalid values throw', () => {
    expect(handicapPoints(19, 0)).toEqual([]);
    expect(handicapPoints(19, 1)).toEqual([]);
    expect(() => handicapPoints(19, 2.5)).toThrow();
    expect(() => handicapPoints(19, -1)).toThrow();
  });

  it('komi defaults to 6.5 even and 0.5 with a handicap', () => {
    expect(defaultKomi(0)).toBe(6.5);
    expect(defaultKomi(1)).toBe(6.5);
    expect(defaultKomi(3)).toBe(0.5);
  });
});
