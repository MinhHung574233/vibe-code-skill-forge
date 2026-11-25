import { describe, expect, it } from 'vitest';
import { BLACK, Board, WHITE, boardFromRows, createTopology, opponent, type Color } from './board';
import { createRng } from './rng';

const at = (board: Board, x: number, y: number) => y * board.topology.width + x;

/** Plays and asserts success, returning the number of captured stones. */
function mustPlay(board: Board, x: number, y: number, color: Color): number {
  const r = board.play(at(board, x, y), color);
  if (!r.ok) throw new Error(`expected ${x},${y} to be legal, got ${r.reason}`);
  return r.captured.length;
}

describe('liberties and groups', () => {
  it('counts distinct liberties of a connected group', () => {
    const board = boardFromRows(['.....', '.XX..', '.X...', '.....', '.....']);
    const g = board.group(at(board, 1, 1));
    expect([...g.stones].sort()).toEqual(
      [at(board, 1, 1), at(board, 2, 1), at(board, 1, 2)].sort(),
    );
    expect(g.liberties).toHaveLength(7);
    expect(board.libertyCount(at(board, 2, 1))).toBe(7);
  });

  it('does not count a shared liberty twice', () => {
    expect(boardFromRows(['X.X..', '.....', '.....', '.....', '.....']).libertyCount(0)).toBe(2);
    expect(boardFromRows(['XXX..', '.....', '.....', '.....', '.....']).libertyCount(0)).toBe(4);
    // two separate stones share the liberty between them, each still has its own count
    const split = boardFromRows(['X.X..', '.....', '.....', '.....', '.....']);
    expect(split.group(0).liberties).toHaveLength(2);
  });

  it('reports no liberties for an empty point', () => {
    const board = Board.empty(9);
    expect(board.libertyCount(0)).toBe(0);
    expect(board.group(0)).toEqual({ stones: [], liberties: [] });
  });

  it('handles a stone in the corner and on the edge', () => {
    const board = boardFromRows(['X....', '.....', '.....', '.....', '..X..']);
    expect(board.libertyCount(0)).toBe(2);
    expect(board.libertyCount(at(board, 2, 4))).toBe(3);
  });
});

describe('capture', () => {
  it('captures a single stone in the open', () => {
    const board = boardFromRows(['.X...', 'XO...', '.X...', '.....', '.....']);
    expect(mustPlay(board, 2, 1, BLACK)).toBe(1);
    expect(board.toRows()[1]).toBe('X.X..');
  });

  it('captures a single stone on the edge', () => {
    const board = boardFromRows(['.....', 'X....', 'O....', 'X....', '.....']);
    // (0,2) white: neighbours (0,1)X (0,3)X (1,2) empty
    expect(mustPlay(board, 1, 2, BLACK)).toBe(1);
    expect(board.get(at(board, 0, 2))).toBe(0);
  });

  it('captures a single stone in the corner', () => {
    const board = boardFromRows(['OX...', '.....', '.....', '.....', '.....']);
    expect(mustPlay(board, 0, 1, BLACK)).toBe(1);
    expect(board.toRows()[0]).toBe('.X...');
  });

  it('captures a group of three at once', () => {
    const board = boardFromRows(['.XXX..', 'XOOO..', '.XXX..', '......', '......', '......']);
    expect(mustPlay(board, 4, 1, BLACK)).toBe(3);
    expect(board.toRows().slice(0, 3)).toEqual(['.XXX..', 'X...X.', '.XXX..']);
  });

  it('captures two separate groups with one move', () => {
    const board = boardFromRows(['.X.X.', 'XO.OX', '.X.X.', '.....', '.....']);
    expect(mustPlay(board, 2, 1, BLACK)).toBe(2);
    expect(board.get(at(board, 1, 1))).toBe(0);
    expect(board.get(at(board, 3, 1))).toBe(0);
  });

  it('does not capture a group that still has a liberty', () => {
    const board = boardFromRows(['.X...', 'XO...', '.....', '.....', '.....']);
    expect(mustPlay(board, 1, 2, BLACK)).toBe(0);
    expect(board.get(at(board, 1, 1))).toBe(WHITE);
  });

  it('keeps a snapback group uncaptured until the recapture', () => {
    const board = boardFromRows(['..OX.', 'OOOX.', 'XXX..', '.....', '.....']);
    expect(board.libertyCount(at(board, 0, 1))).toBe(2); // (0,0) and (1,0)
    expect(mustPlay(board, 0, 0, BLACK)).toBe(0); // the sacrifice: black has one liberty, (1,0)
    expect(mustPlay(board, 1, 0, WHITE)).toBe(1); // white takes it and is left in atari at (0,0)
    expect(board.libertyCount(at(board, 1, 0))).toBe(1);
    expect(mustPlay(board, 0, 0, BLACK)).toBe(5); // the snapback captures the whole group
    expect(board.toRows().slice(0, 2)).toEqual(['X..X.', '...X.']);
  });
});

describe('suicide', () => {
  it('rejects a single-stone suicide and leaves the board untouched', () => {
    const board = boardFromRows(['.X...', 'X.X..', '.X...', '.....', '.....']);
    const before = board.toRows();
    const key = board.hashKey();
    const r = board.play(at(board, 1, 1), WHITE);
    expect(r).toEqual({ ok: false, reason: 'suicide' });
    expect(board.toRows()).toEqual(before);
    expect(board.hashKey()).toBe(key);
  });

  it('rejects filling the last liberty of an own group', () => {
    const board = boardFromRows(['.XXX.', 'XO.X.', '.XXX.', '.....', '.....']);
    expect(board.play(at(board, 2, 1), WHITE)).toEqual({ ok: false, reason: 'suicide' });
    expect(board.get(at(board, 1, 1))).toBe(WHITE); // the old stone is still there
  });

  it('allows a move that looks like suicide but captures', () => {
    const board = boardFromRows(['.XO..', 'XO.O.', '.XO..', '.....', '.....']);
    // black at (2,1) has no empty neighbour, but captures the white stone at (1,1)
    expect(mustPlay(board, 2, 1, BLACK)).toBe(1);
    expect(board.get(at(board, 2, 1))).toBe(BLACK);
    expect(board.get(at(board, 1, 1))).toBe(0);
  });

  it('cannot play into either of two real eyes, so the group is uncapturable', () => {
    const board = boardFromRows(['.O.O.', 'OOOOO', 'XXXXX', '.....', '.....']);
    for (const x of [0, 2, 4]) {
      expect(board.play(at(board, x, 0), BLACK)).toEqual({ ok: false, reason: 'suicide' });
    }
    expect(board.libertyCount(at(board, 1, 1))).toBe(3);
  });

  it('seki: neither side can profit, and entering a shared liberty loses the group', () => {
    const board = boardFromRows(['XX.OO', 'XX.OO', 'XXXOO']);
    expect(board.libertyCount(0)).toBe(2);
    expect(board.libertyCount(at(board, 3, 0))).toBe(2);
    expect(mustPlay(board, 2, 0, BLACK)).toBe(0); // self-atari for black...
    expect(board.libertyCount(0)).toBe(1);
    expect(mustPlay(board, 2, 1, WHITE)).toBe(8); // ...and white takes the whole group
  });
});

describe('ko', () => {
  const ko = () => boardFromRows(['.XO..', 'XO.O.', '.XO..', '.....', '.....']);

  it('reports the ko point after a single stone is taken', () => {
    const board = ko();
    const r = board.play(at(board, 2, 1), BLACK);
    expect(r).toMatchObject({ ok: true, ko: at(board, 1, 1) });
  });

  it('reports no ko when more than one stone is captured or the capturer has company', () => {
    const board = boardFromRows(['.X.X.', 'XO.OX', '.X.X.', '.....', '.....']);
    const r = board.play(at(board, 2, 1), BLACK);
    expect(r).toMatchObject({ ok: true, ko: -1 });
    const open = boardFromRows(['.X...', 'XO...', '.X...', '.....', '.....']);
    expect(open.play(at(open, 2, 1), BLACK)).toMatchObject({ ok: true, ko: -1 }); // 3 liberties
  });

  it('lets the board retake (history rules live in the game layer)', () => {
    const board = ko();
    mustPlay(board, 2, 1, BLACK);
    expect(mustPlay(board, 1, 1, WHITE)).toBe(1);
  });
});

describe('basic rejections', () => {
  it('rejects occupied and off-board points', () => {
    const board = boardFromRows(['X....', '.....', '.....', '.....', '.....']);
    expect(board.play(0, WHITE)).toEqual({ ok: false, reason: 'occupied' });
    expect(board.play(-1, WHITE)).toEqual({ ok: false, reason: 'off-board' });
    expect(board.play(25, WHITE)).toEqual({ ok: false, reason: 'off-board' });
  });

  it('treats blocked points like the edge of the board', () => {
    const blocked = createTopology(3, 3, new Set([4]));
    const board = new Board(blocked);
    expect(board.play(4, BLACK)).toEqual({ ok: false, reason: 'off-board' });
    mustPlay(board, 0, 0, WHITE);
    expect(board.libertyCount(0)).toBe(2);
    expect(board.toRows()).toEqual(['O..', '.#.', '...']);
  });
});

describe('invariants over random play', () => {
  it('keeps hashes consistent and never leaves a group without liberties', () => {
    for (const size of [9, 13, 19]) {
      const rng = createRng(size);
      const board = Board.empty(size);
      let color: Color = BLACK;
      for (let i = 0; i < 600; i++) {
        const p = rng.int(size * size);
        const r = board.play(p, color);
        if (r.ok) color = opponent(color);
      }
      const rebuilt = new Board(board.topology, board.cells.slice());
      expect(board.hashKey()).toBe(rebuilt.hashKey());
      expect(board.equals(rebuilt)).toBe(true);
      for (let p = 0; p < board.cells.length; p++) {
        if (board.get(p) !== 0) expect(board.libertyCount(p)).toBeGreaterThan(0);
      }
    }
  });

  it('different positions have different keys, equal positions equal keys', () => {
    const a = boardFromRows(['X....', '.O...', '.....', '.....', '.....']);
    const b = boardFromRows(['.....', '.....', '.....', '.....', '.....']);
    b.setStone(0, BLACK);
    b.setStone(6, WHITE);
    expect(a.hashKey()).toBe(b.hashKey());
    b.setStone(6, BLACK);
    expect(a.hashKey()).not.toBe(b.hashKey());
  });

  it('clone is independent', () => {
    const a = Board.empty(9);
    const b = a.clone();
    mustPlay(b, 3, 3, BLACK);
    expect(a.get(at(a, 3, 3))).toBe(0);
    expect(a.hashKey()).not.toBe(b.hashKey());
  });
});

describe('boardFromRows', () => {
  it('round-trips and rejects bad input', () => {
    const rows = ['X.O', '.#.', 'O.X'];
    expect(boardFromRows(rows).toRows()).toEqual(rows);
    expect(() => boardFromRows([])).toThrow();
    expect(() => boardFromRows(['X.', 'X'])).toThrow();
    expect(() => boardFromRows(['X?'])).toThrow();
  });
});
