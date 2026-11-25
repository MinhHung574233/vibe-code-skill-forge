import { describe, expect, it } from 'vitest';
import { LEVEL_SPECS, chooseMove, rankMoves, type AiOptions, type Level } from './ai';
import { BLACK, WHITE, boardFromRows, type Color } from './board';
import {
  gameResult,
  gameStatus,
  newGame,
  passTurn,
  playStone,
  type GameState,
  type Move,
} from './game';
import { isEye, suggestDeadStones } from './playout';
import { createRng } from './rng';

/** Seeded, wall-clock-free options: only the playout budget limits the search (deterministic). */
const seededOptions = (level: Level, seed: number, extra: Partial<AiOptions> = {}): AiOptions => ({
  level,
  rng: createRng(seed),
  maxMs: Infinity,
  ...extra,
});

const pt = (x: number, y: number, size = 9) => y * size + x;
const ALL_LEVELS: Level[] = ['easy', 'medium', 'hard'];

/** A 9x9 position from the top rows (the rest empty), with the given side to move. */
function position(rows: string[], toPlay: Color, komi = 6.5): GameState {
  const full = [...rows];
  while (full.length < 9) full.push('.........');
  const board = boardFromRows(full.map((r) => r.padEnd(9, '.')));
  return { ...newGame({ size: 9, komi, handicap: 0 }), board, toPlay };
}

/** Hard is capped at 300 playouts here (its real budget is several times that) to keep tests fast. */
const options = (level: Level, seed = 1, extra: Partial<AiOptions> = {}) =>
  seededOptions(level, seed, level === 'hard' ? { playouts: 300, ...extra } : extra);

function must(result: ReturnType<typeof playStone>): GameState {
  if (!result.ok) throw new Error(`rejected: ${result.reason}`);
  return result.state;
}

/** Plays one full game; `moveFor` supplies each move. Throws if any move is illegal. */
function playGame(
  size: 9 | 13,
  moveFor: (state: GameState, ply: number) => ReturnType<typeof chooseMove>,
  maxPlies = 400,
): GameState {
  let s = newGame({ size, komi: 6.5, handicap: 0 });
  for (let ply = 0; ply < maxPlies && gameStatus(s) === 'playing'; ply++) {
    const m = moveFor(s, ply);
    const r = m.kind === 'move' ? playStone(s, m.point) : passTurn(s);
    if (!r.ok) throw new Error(`illegal AI move at ply ${ply}: ${JSON.stringify(m)} (${r.reason})`);
    s = r.state;
  }
  return s;
}

describe('tactics', () => {
  it('saves a group in atari by extending to more liberties', () => {
    // Black (4,4) has white on three sides; the only liberty (4,5) leads to open space.
    const s = position(['', '', '', '....O....', '...OXO...'], BLACK);
    for (const level of ALL_LEVELS) {
      for (const seed of [1, 2, 3]) {
        expect(chooseMove(s, options(level, seed))).toEqual({ kind: 'move', point: pt(4, 5) });
      }
    }
  });

  it('captures a group in atari when it can', () => {
    // White (4,3) is surrounded on three sides: its last liberty is (4,2).
    const s = position(['', '', '', '...XOX...', '....X....'], BLACK);
    for (const level of ALL_LEVELS) {
      for (const seed of [1, 2, 3]) {
        expect(chooseMove(s, options(level, seed))).toEqual({ kind: 'move', point: pt(4, 2) });
      }
    }
  });

  it('finds the capture with the full hard budget too', () => {
    const s = position(['', '', '', '...XOX...', '....X....'], BLACK);
    expect(chooseMove(s, seededOptions('hard', 1))).toEqual({ kind: 'move', point: pt(4, 2) });
  });

  it('captures a two-stone group in atari', () => {
    const s = position(['', '', '...XX....', '..XOO....', '...XX....'], BLACK);
    expect(chooseMove(s, options('medium'))).toEqual({ kind: 'move', point: pt(5, 3) });
  });

  it('does not extend a group in atari when the extension is itself self-atari', () => {
    // Extending (4,4) to (4,5) would leave one liberty at (4,6): pointless.
    const s = position(['', '', '', '....O....', '...OXO...', '...O.O...'], BLACK);
    const ranked = rankMoves(s.board, BLACK, -1, -1);
    expect(ranked.find((m) => m.point === pt(4, 5))).toBeUndefined();
  });

  it('plays atari to chase a weak group', () => {
    // White (4,4) has two liberties; black stones cut it down to atari with one move.
    const s = position(['', '', '', '....X....', '...XO....', '.........', '.........'], BLACK);
    const ranked = rankMoves(s.board, BLACK, -1, -1);
    const atari = ranked.find((m) => m.point === pt(5, 4));
    const quiet = ranked.find((m) => m.point === pt(1, 6));
    expect(atari).toBeDefined();
    expect(atari?.score).toBeGreaterThan(quiet?.score ?? 0);
  });

  it('never chooses a self-atari move (that does not capture) in a whole game', () => {
    let selfAtari = 0;
    playGame(9, (state, ply) => {
      const m = chooseMove(state, options('medium', 40 + ply, { playouts: 60 }));
      if (m.kind === 'move') {
        const sim = state.board.clone();
        const r = sim.play(m.point, state.toPlay);
        if (r.ok && r.captured.length === 0 && sim.libertyCount(m.point) === 1) selfAtari++;
      }
      return m;
    });
    expect(selfAtari).toBe(0);
  });
});

describe('eyes', () => {
  // Black owns everything except two single-point eyes on the top edge.
  const twoEyes = () =>
    position(['.X.XXXXXX', ...Array.from({ length: 8 }, () => 'XXXXXXXXX')], BLACK);

  it('recognises real eyes and rejects false ones', () => {
    const s = twoEyes();
    expect(isEye(s.board, pt(0, 0), BLACK)).toBe(true);
    expect(isEye(s.board, pt(2, 0), BLACK)).toBe(true);
    expect(isEye(s.board, pt(0, 0), WHITE)).toBe(false);
    // a corner point whose diagonal is not black is a false eye
    expect(isEye(boardFromRows(['.X...', 'XO...', '.....', '.....', '.....']), 0, BLACK)).toBe(
      false,
    );
    // an interior point may miss one diagonal and still be an eye, but not two
    const interior = boardFromRows(['XXX..', 'X.X..', 'XXO..', '.....', '.....']);
    expect(isEye(interior, pt(1, 1, 5), BLACK)).toBe(true);
    const broken = boardFromRows(['XXO..', 'X.X..', 'XXO..', '.....', '.....']);
    expect(isEye(broken, pt(1, 1, 5), BLACK)).toBe(false);
  });

  it('never fills its own last two eyes: it passes when nothing else is left', () => {
    for (const level of ALL_LEVELS) {
      for (const seed of [1, 2, 3]) {
        expect(chooseMove(twoEyes(), options(level, seed))).toEqual({ kind: 'pass' });
      }
    }
  });

  it('never fills an eye while it has other moves', () => {
    const s = position(
      [
        '.X.XOOO..',
        'XXXXOOOO.',
        'XXXXOOO..',
        'XXXXOOOOO',
        'XXXXOOOOO',
        'XXXXXXOOO',
        'XXXXXXOOO',
        'XXXXXXOOO',
        'XXXXXXXOO',
      ],
      BLACK,
    );
    for (const level of ALL_LEVELS) {
      for (const seed of [1, 2, 3, 4]) {
        const m = chooseMove(s, options(level, seed));
        if (m.kind === 'move') expect([pt(0, 0), pt(2, 0)]).not.toContain(m.point);
      }
    }
  });
});

describe('passing', () => {
  const split = (komi: number) => {
    const rows = Array.from({ length: 9 }, () => '....XO...');
    const afterWhitePass = passTurn(position(rows, WHITE, komi));
    if (!afterWhitePass.ok) throw new Error('pass rejected');
    return afterWhitePass.state; // black to move, white has just passed
  };

  it('passes after the opponent passed when it is ahead on settled area', () => {
    expect(chooseMove(split(0.5), options('medium'))).toEqual({ kind: 'pass' });
  });

  it('keeps playing after the opponent passed when it is behind', () => {
    expect(chooseMove(split(12.5), options('medium')).kind).toBe('move');
  });

  it('passes when no sensible move is left (only own territory and eyes)', () => {
    const rows = ['.X.X.X.X.', ...Array.from({ length: 8 }, () => 'XXXXXXXXX')];
    expect(chooseMove(position(rows, BLACK), options('hard'))).toEqual({ kind: 'pass' });
  });

  it('does nothing once the game is over', () => {
    const s = must(passTurn(must(passTurn(newGame({ size: 9, komi: 6.5, handicap: 0 })))));
    expect(chooseMove(s, options('easy'))).toEqual({ kind: 'pass' });
  });
});

describe('opening', () => {
  it('opens on the centre or a 3-3 point of an empty 9x9', () => {
    const m = chooseMove(newGame({ size: 9, komi: 6.5, handicap: 0 }), options('medium'));
    expect(m.kind).toBe('move');
    if (m.kind === 'move') {
      expect([pt(4, 4), pt(2, 2), pt(6, 2), pt(2, 6), pt(6, 6)]).toContain(m.point);
    }
  });

  it('opens on a star point of an empty 19x19', () => {
    const m = chooseMove(newGame({ size: 19, komi: 6.5, handicap: 0 }), options('hard'));
    expect(m.kind).toBe('move');
    if (m.kind === 'move') {
      expect([3, 9, 15]).toContain(m.point % 19);
      expect([3, 9, 15]).toContain(Math.floor(m.point / 19));
    }
  });

  it('takes an empty corner on 19x19 instead of crowding the existing stone', () => {
    const s = must(playStone(newGame({ size: 19, komi: 6.5, handicap: 0 }), pt(3, 3, 19)));
    const m = chooseMove(s, options('medium'));
    expect(m.kind).toBe('move');
    if (m.kind === 'move') {
      const dx = Math.abs((m.point % 19) - 3);
      const dy = Math.abs(Math.floor(m.point / 19) - 3);
      expect(Math.max(dx, dy)).toBeGreaterThan(4);
    }
  });
});

describe('legality, determinism and time', () => {
  it('is deterministic for a seed when only the playout budget limits the search', () => {
    const s = position(['', '', '..X......', '...O.....'], BLACK);
    expect(chooseMove(s, options('medium', 7))).toEqual(chooseMove(s, options('medium', 7)));
  });

  it('never retakes a ko it is not allowed to retake', () => {
    const koPosition = position(['.XO......', 'XO.O.....', '.XO......'], BLACK);
    const afterTake = must(playStone(koPosition, pt(2, 1))); // black takes; white (AI) to move
    for (const seed of [1, 2, 3, 4, 5]) {
      const m = chooseMove(afterTake, options('hard', seed, { playouts: 120 }));
      expect(m).not.toEqual({ kind: 'move', point: pt(1, 1) });
      if (m.kind === 'move') expect(playStone(afterTake, m.point).ok).toBe(true);
    }
  });

  it('finishes a complete AI-vs-AI game on 9x9, legally, ending with two passes', () => {
    const s = playGame(9, (state, ply) =>
      chooseMove(state, options('medium', 100 + ply, { playouts: 120 })),
    );
    expect(gameStatus(s)).toBe('scoring');
    expect(s.moves.length).toBeGreaterThan(30);
    expect(s.moves.slice(-2).every((m) => m.point === null)).toBe(true);
  });

  it('plays legal moves on 13x13 and 19x19 inside the time budget', () => {
    for (const size of [13, 19] as const) {
      let s = newGame({ size, komi: 6.5, handicap: 0 });
      for (let i = 0; i < 6; i++) {
        const started = Date.now();
        const m = chooseMove(s, { level: 'hard', rng: createRng(i + 1) });
        expect(Date.now() - started).toBeLessThan(1500);
        if (m.kind !== 'move') throw new Error('expected a move');
        s = must(playStone(s, m.point));
      }
    }
  });

  it('respects the wall-clock limit even when the playout budget is huge', () => {
    const s = position(['', '', '..X......', '...O.....'], BLACK);
    const started = Date.now();
    chooseMove(s, { level: 'hard', rng: createRng(1), playouts: 10_000_000, maxMs: 150 });
    expect(Date.now() - started).toBeLessThan(700);
  });

  it('ranks only legal, non-eye moves', () => {
    const s = position(['.X.XOOO..', 'XXXXOOOO.', 'XXXXOOO..'], BLACK);
    for (const m of rankMoves(s.board, BLACK, -1, -1)) {
      expect(s.board.isLegal(m.point, BLACK)).toBe(true);
      expect(isEye(s.board, m.point, BLACK)).toBe(false);
    }
  });
});

describe('strength (a sanity check, not a rating)', () => {
  /** A legal random mover that never fills its own eye and passes when nothing else is left. */
  const randomMover = (rng: ReturnType<typeof createRng>) => (state: GameState) => {
    const cells = state.board.cells.length;
    const order = Array.from({ length: cells }, (_, i) => i).sort(() => rng.next() - 0.5);
    for (const p of order) {
      if (
        state.board.get(p) === 0 &&
        !isEye(state.board, p, state.toPlay) &&
        playStone(state, p).ok
      ) {
        return { kind: 'move', point: p } as const;
      }
    }
    return { kind: 'pass' } as const;
  };

  it('easy beats a random legal player', () => {
    let wins = 0;
    for (let g = 0; g < 4; g++) {
      const random = randomMover(createRng(500 + g));
      const easyIsBlack = g % 2 === 0;
      const s = playGame(9, (state, ply) =>
        (state.toPlay === BLACK) === easyIsBlack
          ? chooseMove(state, options('easy', 900 + ply + g * 1000))
          : random(state),
      );
      if ((gameResult(s).winner === BLACK) === easyIsBlack) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(3);
  });

  it('hard beats easy over seeded games (colours alternate)', () => {
    let hardWins = 0;
    for (let g = 0; g < 4; g++) {
      const hardIsBlack = g % 2 === 0;
      const s = playGame(9, (state, ply) => {
        const hard = (state.toPlay === BLACK) === hardIsBlack;
        // a reduced hard budget keeps the test fast; it is still over ten times easy's
        return chooseMove(
          state,
          options(hard ? 'hard' : 'easy', 2000 + g * 1000 + ply, hard ? { playouts: 150 } : {}),
        );
      });
      if ((gameResult(s).winner === BLACK) === hardIsBlack) hardWins++;
    }
    expect(hardWins).toBeGreaterThanOrEqual(3);
  }, 30_000);

  it('levels are ordered by playout budget', () => {
    expect(LEVEL_SPECS.easy.playouts).toBeLessThan(LEVEL_SPECS.medium.playouts);
    expect(LEVEL_SPECS.medium.playouts).toBeLessThan(LEVEL_SPECS.hard.playouts);
  });
});

describe('resignation', () => {
  // White owns the lower six rows (two real eyes); black has the top three rows and two stones.
  const lost = (movesPlayed: number): GameState => {
    const rows = [
      '....X....',
      '.........',
      '.........',
      'OOOOOOOOO',
      'OOOOOOOOO',
      'OOOOOOOOO',
      'OOOOOOOOO',
      'OOOOOOOOO',
      'O.OOOOO.O',
    ];
    const base = position(rows, BLACK);
    const filler: Move[] = Array.from({ length: movesPlayed }, () => ({ color: WHITE, point: 0 }));
    return { ...base, moves: filler };
  };

  it('a hopeless position late in the game makes medium and hard resign, never easy', () => {
    expect(chooseMove(lost(40), options('medium'))).toEqual({ kind: 'resign' });
    expect(chooseMove(lost(40), options('hard', 1, { playouts: 200 }))).toEqual({ kind: 'resign' });
    expect(chooseMove(lost(40), options('easy')).kind).not.toBe('resign');
  });

  it('does not resign early in the game', () => {
    expect(chooseMove(lost(4), options('medium')).kind).not.toBe('resign');
  });
});

describe('dead stone suggestion', () => {
  it('marks a lone stone deep in enemy area and leaves living walls alone', () => {
    const rows = Array.from({ length: 9 }, () => '....XO...');
    rows[1] = '.O..XO...';
    const dead = suggestDeadStones(boardFromRows(rows), createRng(3), 80);
    expect(dead.has(pt(1, 1))).toBe(true);
    expect(dead.has(pt(4, 4))).toBe(false);
    expect(dead.has(pt(5, 4))).toBe(false);
  });
});
