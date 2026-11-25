import { describe, expect, it } from 'vitest';
import { BLACK, Board, WHITE, boardFromRows, type BoardSize, type Color } from './board';
import {
  gameResult,
  gameStatus,
  legalPoints,
  newGame,
  passTurn,
  playStone,
  restoreGame,
  resign,
  resumePlay,
  serializeGame,
  undoMove,
  type GameState,
} from './game';
import { createRng } from './rng';

const pt = (state: GameState, x: number, y: number) => y * state.config.size + x;

function must(result: ReturnType<typeof playStone>): GameState {
  if (!result.ok) throw new Error(`move rejected: ${result.reason}`);
  return result.state;
}
const stone = (s: GameState, x: number, y: number) => must(playStone(s, pt(s, x, y)));
const pass = (s: GameState) => must(passTurn(s));

/** A 9x9 game starting from a drawn position (top rows given, the rest empty). */
function fromRows(rows: string[], toPlay: Color, komi = 0.5): GameState {
  const full = [...rows];
  while (full.length < 9) full.push('.........');
  const padded = full.map((r) => r.padEnd(9, '.'));
  return { ...newGame({ size: 9, komi, handicap: 0 }), board: boardFromRows(padded), toPlay };
}

describe('turns, passes and the end of the game', () => {
  it('alternates colours starting with Black', () => {
    let s = newGame({ size: 9, komi: 6.5, handicap: 0 });
    expect(s.toPlay).toBe(BLACK);
    s = stone(s, 2, 2);
    expect(s.toPlay).toBe(WHITE);
    s = pass(s);
    expect(s.toPlay).toBe(BLACK);
    expect(s.moves.map((m) => m.color)).toEqual([BLACK, WHITE]);
  });

  it('ends after two consecutive passes and refuses further moves', () => {
    let s = newGame({ size: 9, komi: 6.5, handicap: 0 });
    s = pass(s);
    expect(gameStatus(s)).toBe('playing');
    s = pass(s);
    expect(gameStatus(s)).toBe('scoring');
    expect(playStone(s, 0)).toEqual({ ok: false, reason: 'game-over' });
    expect(passTurn(s)).toEqual({ ok: false, reason: 'game-over' });
  });

  it('a stone between two passes resets the pass count', () => {
    let s = newGame({ size: 9, komi: 6.5, handicap: 0 });
    s = pass(s);
    s = stone(s, 4, 4);
    s = pass(s);
    expect(gameStatus(s)).toBe('playing');
  });

  it('counts prisoners for the capturing side', () => {
    let s = fromRows(['.X.', 'XO.', '.X.'], BLACK);
    s = stone(s, 2, 1);
    expect(s.captures).toEqual({ black: 1, white: 0 });
  });

  it('resignation ends the game and the other side wins', () => {
    const s = resign(newGame({ size: 9, komi: 6.5, handicap: 0 }), BLACK);
    expect(gameStatus(s)).toBe('resigned');
    expect(gameResult(s)).toMatchObject({ winner: WHITE, by: 'resign', text: 'W+R' });
    expect(playStone(s, 0)).toEqual({ ok: false, reason: 'game-over' });
  });

  it('undo takes back one move, and the start position stays put', () => {
    const start = newGame({ size: 9, komi: 6.5, handicap: 0 });
    const s = stone(stone(start, 2, 2), 6, 6);
    expect(undoMove(s).moves).toHaveLength(1);
    expect(undoMove(start)).toBe(start);
    expect(undoMove(resign(s, WHITE))).toBe(s);
  });

  it('resuming from scoring takes the last pass back', () => {
    let s = stone(newGame({ size: 9, komi: 6.5, handicap: 0 }), 2, 2);
    s = pass(pass(s));
    expect(gameStatus(s)).toBe('scoring');
    const resumed = resumePlay(s);
    expect(gameStatus(resumed)).toBe('playing');
    expect(resumed.moves.at(-1)).toEqual({ color: WHITE, point: null });
    expect(resumePlay(resumed)).toBe(resumed);
  });
});

describe('ko (positional superko)', () => {
  // Black (1,0) (0,1) (1,2); white (2,0) (1,1) (3,1) (2,2); the ko point is (2,1) / (1,1).
  const koPosition = () => fromRows(['.XO......', 'XO.O.....', '.XO......'], BLACK);

  it('forbids retaking a one-point ko immediately', () => {
    const s1 = stone(koPosition(), 2, 1); // black captures (1,1)
    expect(s1.ko).toBe(pt(s1, 1, 1));
    expect(playStone(s1, pt(s1, 1, 1))).toEqual({ ok: false, reason: 'superko' });
  });

  it('allows the retake after a ko threat and a reply elsewhere', () => {
    let s = stone(koPosition(), 2, 1); // black takes
    s = stone(s, 7, 7); // white plays a ko threat
    s = stone(s, 7, 6); // black answers it
    const retake = playStone(s, pt(s, 1, 1)); // white retakes: the board is new (extra stones)
    expect(retake.ok).toBe(true);
    if (retake.ok) {
      expect(retake.state.board.get(pt(s, 2, 1))).toBe(0);
      // and now black cannot retake at once
      expect(playStone(retake.state, pt(s, 2, 1))).toEqual({ ok: false, reason: 'superko' });
    }
  });

  it('forbids the move that closes a triple-ko cycle (which simple ko would allow)', () => {
    // Three one-point kos side by side on 19x19. Ko A and C are open for Black, ko B for White.
    // Black takes A, White takes B, Black takes C, White retakes A, Black retakes B and White's
    // retake of C would recreate the starting position: only positional superko forbids it.
    const board = Board.empty(19);
    const put = (x0: number, y0: number, openForBlack: boolean) => {
      const at = (x: number, y: number) => (y0 + y) * 19 + x0 + x;
      for (const [x, y] of [
        [1, 0],
        [0, 1],
        [1, 2],
      ] as const)
        board.setStone(at(x, y), BLACK);
      for (const [x, y] of [
        [2, 0],
        [3, 1],
        [2, 2],
      ] as const)
        board.setStone(at(x, y), WHITE);
      if (openForBlack)
        board.setStone(at(1, 1), WHITE); // Black may capture it by playing (2,1)
      else board.setStone(at(2, 1), BLACK); // White may capture it by playing (1,1)
      return { black: at(2, 1), white: at(1, 1) };
    };
    const a = put(1, 1, true);
    const b = put(1, 7, false);
    const c = put(1, 13, true);
    let state: GameState = {
      ...newGame({ size: 19, komi: 6.5, handicap: 0 }),
      board,
      toPlay: BLACK,
    };
    const sequence = [a.black, b.white, c.black, a.white, b.black];
    for (const point of sequence) state = must(playStone(state, point));
    // White's retake of C is legal for the board alone (it captures one stone)...
    expect(state.board.clone().play(c.white, WHITE).ok).toBe(true);
    // ...but it would repeat the very first position
    expect(playStone(state, c.white)).toEqual({ ok: false, reason: 'superko' });
    // after any other move (a ko threat) it is a new position and is allowed
    const threat = must(playStone(must(playStone(state, 19 * 17 + 17)), 19 * 17 + 3));
    expect(playStone(threat, c.white).ok).toBe(true);
  });

  it('never lets any earlier position come back, over many random full games', () => {
    for (const size of [9, 13] as BoardSize[]) {
      for (let seed = 1; seed <= 3; seed++) {
        const rng = createRng(seed * 31 + size);
        let s = newGame({ size, komi: 6.5, handicap: 0 });
        const seen = new Set<number>([s.board.hashKey()]);
        let stones = 0;
        for (let i = 0; i < 700 && gameStatus(s) === 'playing'; i++) {
          const legal = legalPoints(s);
          if (legal.length === 0 || rng.next() < 0.01) {
            s = pass(s);
            continue;
          }
          const p = legal[rng.int(legal.length)] as number;
          s = must(playStone(s, p));
          stones++;
          const key = s.board.hashKey();
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
        expect(stones).toBeGreaterThan(100);
      }
    }
  });
});

describe('handicap', () => {
  it('places the stones and gives White the first move', () => {
    const s = newGame({ size: 19, komi: 0.5, handicap: 4 });
    expect(s.board.stoneCount(BLACK)).toBe(4);
    expect(s.board.stoneCount(WHITE)).toBe(0);
    expect(s.toPlay).toBe(WHITE);
    expect(s.moves).toHaveLength(0);
  });

  it('a handicap of 1 is just Black moving first', () => {
    const s = newGame({ size: 9, komi: 6.5, handicap: 1 });
    expect(s.board.stoneCount(BLACK)).toBe(0);
    expect(s.toPlay).toBe(BLACK);
  });

  it('rejects invalid settings', () => {
    expect(() => newGame({ size: 9, komi: 6.5, handicap: 6 })).toThrow();
    expect(() => newGame({ size: 19, komi: 6.5, handicap: 10 })).toThrow();
    expect(() => newGame({ size: 19, komi: Number.NaN, handicap: 0 })).toThrow();
    expect(() => newGame({ size: 17 as BoardSize, komi: 6.5, handicap: 0 })).toThrow();
  });

  it('handicap stones are part of the starting position for superko', () => {
    const s = newGame({ size: 9, komi: 0.5, handicap: 2 });
    expect(s.prev).toBeNull();
    expect(gameStatus(s)).toBe('playing');
  });
});

describe('result', () => {
  it('scores a finished game with komi and dead stones', () => {
    // black left of column 4, white right of it, one white stone dead inside black's area
    const rows = Array.from({ length: 9 }, () => '....XO...');
    rows[1] = '.O..XO...';
    let s = fromRows(rows, BLACK, 6.5);
    s = pass(pass(s));
    const dead = new Set([pt(s, 1, 1)]);
    const r = gameResult(s, dead);
    expect(r.by).toBe('score');
    expect(r.score).toMatchObject({ black: 45, white: 36 });
    expect(r.winner).toBe(BLACK);
    expect(r.text).toBe('B+2.5');
    expect(r.margin).toBe(2.5);
  });
});

describe('persistence', () => {
  it('replays a serialized game to the same position', () => {
    let s = newGame({ size: 9, komi: 5.5, handicap: 2 });
    s = stone(s, 4, 4);
    s = stone(s, 3, 4);
    s = pass(s);
    s = stone(s, 2, 2);
    const copy = restoreGame(
      JSON.parse(JSON.stringify(serializeGame(s))) as ReturnType<typeof serializeGame>,
    );
    expect(copy).not.toBeNull();
    expect(copy?.board.equals(s.board)).toBe(true);
    expect(copy?.toPlay).toBe(s.toPlay);
    expect(copy?.moves).toEqual(s.moves);
  });

  it('restores a resignation', () => {
    const s = resign(stone(newGame({ size: 9, komi: 6.5, handicap: 0 }), 4, 4), WHITE);
    expect(restoreGame(serializeGame(s))?.resignedBy).toBe(WHITE);
  });

  it('rejects a tampered record instead of loading an impossible game', () => {
    const config = { size: 9 as const, komi: 6.5, handicap: 0 };
    expect(restoreGame({ config, moves: [40, 40], resignedBy: null })).toBeNull(); // occupied
    expect(restoreGame({ config, moves: [999], resignedBy: null })).toBeNull();
    expect(
      restoreGame({ config: { ...config, handicap: 7 }, moves: [], resignedBy: null }),
    ).toBeNull();
  });
});

describe('legalPoints', () => {
  it('excludes occupied points, suicide and ko-forbidden points', () => {
    const s = fromRows(['.X.......', 'X.X......', '.X.......'], WHITE);
    const legal = new Set(legalPoints(s));
    expect(legal.has(pt(s, 1, 0))).toBe(false); // occupied
    expect(legal.has(pt(s, 1, 1))).toBe(false); // suicide for white
    expect(legal.has(pt(s, 5, 5))).toBe(true);
    expect(legalPoints(pass(pass(s)))).toEqual([]);
  });
});
