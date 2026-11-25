import { describe, expect, it } from 'vitest';
import { cellIndex, type BoardSize, type Stone } from '../board';
import { newGame, playMove, stoneToMove, type GameState } from '../game';
import { mulberry32 } from '../rng';
import { movesFromDiagram } from '../testing';
import { chooseMove, type AiRequest } from './engine';
import { LEVEL_CONFIG, type Level } from './levels';

const SIZE = 15;
const at = (row: number, col: number) => cellIndex(SIZE, row, col);

/** Generous wall-clock limit so these tests never depend on machine speed (nodes decide). */
const NO_CLOCK = { maxMs: 600_000 };

const ask = (
  level: Level,
  rows: readonly string[],
  origin: readonly [number, number] = [5, 5],
  limits: AiRequest['limits'] = NO_CLOCK,
) => chooseMove({ size: SIZE, level, moves: movesFromDiagram(SIZE, rows, origin), limits });

describe('forced moves', () => {
  it.each(['easy', 'medium', 'hard'] as const)('%s takes an immediate win', (level) => {
    // X (to move) has an open four on row 5; either end wins.
    const result = ask(level, ['.XXXX.', '......', '.OO...', '.OO...']);
    expect([at(5, 5), at(5, 10)]).toContain(result.move);
    expect(result.source).toBe('win');
  });

  it.each(['easy', 'medium', 'hard'] as const)('%s completes a broken four', (level) => {
    // X X X _ X with O closing the left end: only the gap wins.
    const result = ask(level, ['OXXX.X', '.O....', '.O..O.', '......']);
    expect(result.move).toBe(at(5, 9));
  });

  it.each(['easy', 'medium', 'hard'] as const)('%s blocks a four', (level) => {
    // O has four in column 6 and X already sits on top of it: the only defence is below.
    const result = ask(level, ['.X....', '.O....', '.O..X.', '.O..X.', '.O...X', '......']);
    expect(result.move).toBe(at(10, 6));
    expect(result.source).toBe('block');
  });

  it('prefers its own win over blocking the opponent four', () => {
    const result = ask('hard', ['OOOO..', '......', '.XXXX.', '......']);
    expect([at(7, 5), at(7, 10)]).toContain(result.move);
    expect(result.source).toBe('win');
  });

  it.each(['medium', 'hard'] as const)(
    '%s blocks an open three before it becomes an open four',
    (level) => {
      // O threatens an open three on row 8; X has nothing to counter with, so it must close an end.
      const result = ask(level, [
        '..........',
        '..X.......',
        '..........',
        '...OOO....',
        '..........',
        '....X.....',
        'X.........',
      ]);
      expect([at(8, 7), at(8, 11)]).toContain(result.move);
    },
  );
});

describe('attack', () => {
  const DOUBLE_THREE = [
    'O.....O',
    '.......',
    '.......',
    '....XX.',
    '...X...',
    '...X...',
    'O.....O',
  ];

  it.each(['medium', 'hard'] as const)(
    '%s creates a double open three (3-3) when one is available',
    (level) => {
      // (8,8) makes an open three along row 8 and another along column 8 at the same time.
      expect(ask(level, DOUBLE_THREE).move).toBe(at(8, 8));
    },
  );

  it.each(['medium', 'hard'] as const)(
    '%s finds a four-three by continuous fours (VCF)',
    (level) => {
      // (7,8) makes a four on row 7 (O must answer at (7,9)) and an open three on column 8,
      // which then becomes an open four.
      const result = ask(
        level,
        [
          'O........O',
          '..........',
          '..........',
          '.OXXX.....',
          '.....X....',
          '.....X....',
          '..........',
          '..........',
          '.O.......O',
        ],
        [4, 3],
      );
      expect(result.move).toBe(at(7, 8));
      expect(result.source).toBe('vcf');
    },
  );
});

describe('safety and determinism', () => {
  /** Plays `plies` moves of a seeded random game from the centre, stopping before it ends. */
  function randomPosition(size: BoardSize, plies: number, seed: number): GameState {
    const rng = mulberry32(seed);
    let game = newGame(size);
    game = playMove(game, cellIndex(size, Math.floor(size / 2), Math.floor(size / 2)));
    while (game.moves.length < plies && game.status.kind === 'playing') {
      game = playMove(game, nearStoneMove(game, rng));
    }
    return game;
  }

  it.each(['easy', 'medium', 'hard'] as const)('%s never plays an occupied cell', (level) => {
    for (let seed = 1; seed <= 6; seed++) {
      const game = randomPosition(SIZE, 14 + seed * 3, seed);
      if (game.status.kind !== 'playing') continue;
      const result = chooseMove({
        size: SIZE,
        level,
        moves: game.moves,
        limits: { ...NO_CLOCK, maxNodes: 4_000 },
      });
      expect(game.cells[result.move]).toBe(0);
    }
  });

  it('plays the centre on an empty board without searching', () => {
    const result = chooseMove({ size: SIZE, level: 'hard', moves: [] });
    expect(result).toMatchObject({ move: at(7, 7), source: 'opening', nodes: 0 });
    expect(result.elapsedMs).toBeLessThan(50);
    expect(chooseMove({ size: 9, level: 'hard', moves: [] }).move).toBe(cellIndex(9, 4, 4));
  });

  it('answers a lone centre stone within two squares of it, quickly, on every level', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const result = chooseMove({ size: SIZE, level, moves: [at(7, 7)] });
      expect(Math.abs(Math.floor(result.move / SIZE) - 7)).toBeLessThanOrEqual(2);
      expect(Math.abs((result.move % SIZE) - 7)).toBeLessThanOrEqual(2);
      expect(result.elapsedMs).toBeLessThan(LEVEL_CONFIG[level].maxMs + 400);
    }
  });

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s finishes a mid-game move inside its budget',
    (level) => {
      const game = randomPosition(SIZE, 21, 11);
      const config = LEVEL_CONFIG[level];
      const result = chooseMove({ size: SIZE, level, moves: game.moves });
      // The node budget bounds the work; allow slack for the final in-flight node batch and
      // for a slow CI machine on top of the level's own wall-clock cap.
      expect(result.nodes).toBeLessThanOrEqual(config.maxNodes + 1);
      expect(result.elapsedMs).toBeLessThan(config.maxMs + 600);
    },
  );

  it('is deterministic for a given position and level, and a seed only matters for Easy', () => {
    const game = randomPosition(SIZE, 18, 5);
    for (const level of ['easy', 'medium', 'hard'] as const) {
      // Node-bound (the clock never fires), which is what makes the result reproducible.
      const limits = { ...NO_CLOCK, maxNodes: 30_000 };
      const request: AiRequest = { size: SIZE, level, moves: game.moves, limits };
      const first = chooseMove(request);
      const second = chooseMove(request);
      expect(second.move).toBe(first.move);
      expect(second.nodes).toBe(first.nodes);
    }
    const hard: AiRequest = {
      size: SIZE,
      level: 'hard',
      moves: game.moves,
      limits: { ...NO_CLOCK, maxNodes: 30_000 },
    };
    expect(chooseMove({ ...hard, seed: 1 }).move).toBe(chooseMove({ ...hard, seed: 2 }).move);
  }, 30_000);

  it('Easy sometimes plays a lower-ranked move, but only when nothing is forced', () => {
    const quiet = randomPosition(SIZE, 12, 3);
    const moves = new Set<number>();
    const sources = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const r = chooseMove({
        size: SIZE,
        level: 'easy',
        moves: quiet.moves,
        seed,
        limits: NO_CLOCK,
      });
      moves.add(r.move);
      sources.add(r.source);
    }
    expect(sources.has('mistake')).toBe(true);
    expect(sources.has('search')).toBe(true);
    expect(moves.size).toBeGreaterThan(1);

    const forcedMoves = movesFromDiagram(SIZE, ['.XXXX.', '......', '.OO...', '.OO...'], [5, 5]);
    for (let seed = 0; seed < 60; seed++) {
      const r = chooseMove({
        size: SIZE,
        level: 'easy',
        moves: forcedMoves,
        seed,
        limits: NO_CLOCK,
      });
      expect(r.source).toBe('win');
    }
  });

  it('throws on a full board', () => {
    const moves = Array.from({ length: 81 }, (_, k) => k);
    expect(() => chooseMove({ size: 9, level: 'easy', moves })).toThrow(RangeError);
  });
});

/** The naive baseline: a random empty cell within two squares of any stone. */
function nearStoneMove(game: GameState, rng: () => number): number {
  const size = game.size;
  if (game.moves.length === 0) return cellIndex(size, Math.floor(size / 2), Math.floor(size / 2));
  const candidates: number[] = [];
  for (let cell = 0; cell < game.cells.length; cell++) {
    if (game.cells[cell] !== 0) continue;
    const r = Math.floor(cell / size);
    const c = cell % size;
    let near = false;
    for (let dr = -2; dr <= 2 && !near; dr++) {
      for (let dc = -2; dc <= 2 && !near; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        near = nr >= 0 && nr < size && nc >= 0 && nc < size && game.cells[nr * size + nc] !== 0;
      }
    }
    if (near) candidates.push(cell);
  }
  return candidates[Math.floor(rng() * candidates.length)]!;
}

function playMatch(level: Level, engineStone: Stone, seed: number, nodes: number): Stone | 0 {
  const rng = mulberry32(seed);
  let game = newGame(SIZE);
  while (game.status.kind === 'playing') {
    const move =
      stoneToMove(game) === engineStone
        ? chooseMove({
            size: SIZE,
            level,
            moves: game.moves,
            limits: { maxMs: 600_000, maxNodes: nodes },
          }).move
        : nearStoneMove(game, rng);
    game = playMove(game, move);
  }
  return game.status.kind === 'won' ? game.status.winner : 0;
}

describe('strength against a random-near-stones baseline', () => {
  it('Hard wins every one of 12 games, playing each colour 6 times', () => {
    let wins = 0;
    for (let g = 0; g < 12; g++) {
      const stone: Stone = g % 2 === 0 ? 1 : 2;
      if (playMatch('hard', stone, 100 + g, 20_000) === stone) wins++;
    }
    expect(wins).toBe(12);
  }, 120_000);

  it('Medium wins every one of 10 games, playing each colour 5 times', () => {
    let wins = 0;
    for (let g = 0; g < 10; g++) {
      const stone: Stone = g % 2 === 0 ? 1 : 2;
      if (playMatch('medium', stone, 200 + g, 8_000) === stone) wins++;
    }
    expect(wins).toBe(10);
  }, 120_000);

  it('Easy wins most games (it is allowed to be beaten)', () => {
    let wins = 0;
    for (let g = 0; g < 10; g++) {
      const stone: Stone = g % 2 === 0 ? 1 : 2;
      if (playMatch('easy', stone, 300 + g, 4_000) === stone) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(8);
  }, 120_000);
});
