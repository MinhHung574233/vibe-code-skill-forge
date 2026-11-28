import { describe, expect, it } from 'vitest';
import { cellIndex, OBSTACLE, type BoardSize, type Stone } from '../board';
import { newGame, playMove, stoneToMove, type GameState } from '../game';
import { placeObstacles } from '../obstacles';
import { mulberry32 } from '../rng';
import { winningLine, wouldWin, type CaroRule } from '../rules';
import { movesFromDiagram, obstaclesFromDiagram } from '../testing';
import { chooseMove, type AiRequest } from './engine';
import { LEVEL_CONFIG, type Level } from './levels';
import { SearchPosition } from './position';

const SIZE = 15;
const at = (row: number, col: number) => cellIndex(SIZE, row, col);
const NO_CLOCK = { maxMs: 600_000 };

function ask(
  level: Level,
  rule: CaroRule,
  rows: readonly string[],
  origin: readonly [number, number] = [5, 5],
  limits: AiRequest['limits'] = NO_CLOCK,
) {
  return chooseMove({
    size: SIZE,
    level,
    rule,
    moves: movesFromDiagram(SIZE, rows, origin),
    obstacles: obstaclesFromDiagram(SIZE, rows, origin),
    limits,
  });
}

/** Whether `stone` can win with one move on the position. */
function canWinNow(game: GameState, stone: Stone): boolean {
  for (let cell = 0; cell < game.cells.length; cell++) {
    if (game.cells[cell] === 0 && wouldWin(game.cells, game.size, cell, stone, game.rule)) {
      return true;
    }
  }
  return false;
}

describe('blocked rule: winning and defending', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    '%s completes a five that has one free end',
    (level) => {
      const result = ask(level, 'blocked', ['OXXXX.', '.OO...', '.O....']);
      expect(result.move).toBe(at(5, 10));
      expect(result.source).toBe('win');
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)('%s still wins with an open four', (level) => {
    const result = ask(level, 'blocked', ['.XXXX.', '......', '.OO...', '.OO...']);
    expect([at(5, 5), at(5, 10)]).toContain(result.move);
    expect(result.source).toBe('win');
  });

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s does not play a five walled in by two opponent stones as a win',
    (level) => {
      // X X X X _ with O on both far ends: filling the gap makes a dead five.
      const rows = ['OXXXX.O', '.OO....'];
      const free = ask(level, 'freestyle', rows);
      expect(free.source).toBe('win');
      const blocked = ask(level, 'blocked', rows);
      expect(blocked.source).not.toBe('win');
      expect(blocked.score).toBeLessThan(900_000);
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s does not defend against a four that can only become a dead five',
    (level) => {
      // O has four with X at the left end and X at the far right end: no real threat.
      const rows = ['XOOOO.X', '.......', '..X.X..'];
      expect(ask(level, 'freestyle', rows)).toMatchObject({ source: 'block', move: at(5, 10) });
      expect(ask(level, 'blocked', rows).source).not.toBe('block');
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s stops a real four (by the gap or by walling in its free end)',
    (level) => {
      const rows = ['XOOOO..', '.......', '..X.X.X'];
      const moves = movesFromDiagram(SIZE, rows, [5, 5]);
      const result = ask(level, 'blocked', rows);
      expect(result.source).toBe('block');
      expect([at(5, 10), at(5, 11)]).toContain(result.move);
      let game = newGame(SIZE, { rule: 'blocked' });
      for (const move of [...moves, result.move]) game = playMove(game, move);
      expect(canWinNow(game, 2)).toBe(false);
    },
  );

  it.each(['medium', 'hard'] as const)('%s blocks a genuine open three', (level) => {
    const result = ask(level, 'blocked', [
      '..........',
      '..X.......',
      '..........',
      '...OOO....',
      '..........',
      '....X.....',
      'X.........',
    ]);
    expect([at(8, 7), at(8, 11)]).toContain(result.move);
  });
});

describe('blocked squares', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    '%s treats a blocked square as a wall at the end of a run',
    (level) => {
      const rows = ['#XXXX.#', '.OOO...', '.O.....'];
      expect(ask(level, 'freestyle', rows).source).toBe('win');
      expect(ask(level, 'blocked', rows).source).not.toBe('win');
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s sees no four across a blocked square',
    (level) => {
      // X X X # X: the obstacle breaks the line, so there is nothing to complete or to fear.
      const rows = ['XXX#X', 'O.O.O', '..O..'];
      const result = ask(level, 'freestyle', rows);
      expect(result.move).not.toBe(at(5, 8));
      expect(result.source).not.toBe('win');
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s never plays on a blocked square, even when it is the best cell',
    (level) => {
      // The two ends of X's open three are blocked squares; the engine must not pick them.
      const rows = ['.#XXX#.', '.......', '.OOO...'];
      const obstacles = obstaclesFromDiagram(SIZE, rows, [5, 5]);
      for (const rule of ['freestyle', 'blocked'] as const) {
        const result = ask(level, rule, rows);
        expect(obstacles).not.toContain(result.move);
      }
    },
  );

  it('a window holding a blocked square is dead for both colours in the search position', () => {
    const rows = ['XXXX#', '.OOO.'];
    const pos = SearchPosition.fromMoves(
      SIZE,
      movesFromDiagram(SIZE, rows, [5, 5]),
      'freestyle',
      obstaclesFromDiagram(SIZE, rows, [5, 5]),
    );
    expect(pos.cells[at(5, 9)]).toBe(OBSTACLE);
    expect(pos.winCells(1, [])).toBe(1); // only the left end (5,4) completes five
    expect(pos.empties).toBe(SIZE * SIZE - 7 - 1);
  });

  it('refuses a history that plays on a blocked square', () => {
    expect(() =>
      chooseMove({ size: 9, level: 'easy', moves: [40], obstacles: [40], rule: 'blocked' }),
    ).toThrow(RangeError);
  });
});

describe('determinism with variants', () => {
  it.each(['freestyle', 'blocked'] as const)('same position and level, same move (%s)', (rule) => {
    const rows = ['..#.....', '..OX....', '...XO...', '..X.O#..', '.....X..'];
    for (const level of ['easy', 'medium', 'hard'] as const) {
      const a = ask(level, rule, rows, [5, 5], { maxMs: 600_000, maxNodes: 6_000 });
      const b = ask(level, rule, rows, [5, 5], { maxMs: 600_000, maxNodes: 6_000 });
      expect(b.move).toBe(a.move);
    }
  });
});

/** A reproducible mid-game on `size` with some obstacles: random moves near the middle. */
function midGame(size: BoardSize, rule: CaroRule, obstacleCount: number, stones: number) {
  const obstacles = placeObstacles(size, obstacleCount, 1234);
  const rng = mulberry32(99);
  let game = newGame(size, { rule, obstacles });
  const mid = Math.floor(size / 2);
  while (game.moves.length < stones) {
    const row = mid + Math.floor(rng() * 9) - 4;
    const col = mid + Math.floor(rng() * 9) - 4;
    const cell = cellIndex(size, row, col);
    if (game.cells[cell] !== 0) continue;
    const next = playMove(game, cell);
    if (next.status.kind === 'playing') game = next; // keep the position undecided
  }
  return { game, obstacles };
}

describe('19x19 and time budgets', () => {
  it.each(['freestyle', 'blocked'] as const)(
    'Hard answers within its budget on 19x19 with 3 blocked squares (%s)',
    (rule) => {
      const { game, obstacles } = midGame(19, rule, 3, 24);
      const started = performance.now();
      const result = chooseMove({
        size: 19,
        level: 'hard',
        rule,
        moves: game.moves,
        obstacles,
      });
      const took = performance.now() - started;
      expect(game.cells[result.move]).toBe(0);
      expect(obstacles).not.toContain(result.move);
      // Budget is 800 ms; allow generous slack for a slow CI machine.
      expect(took).toBeLessThan(LEVEL_CONFIG.hard.maxMs * 3 + 1500);
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    '%s stays inside its time budget on a crowded 19x19 blocked position',
    (level) => {
      const { game, obstacles } = midGame(19, 'blocked', 3, 60);
      const started = performance.now();
      const result = chooseMove({ size: 19, level, rule: 'blocked', moves: game.moves, obstacles });
      expect(performance.now() - started).toBeLessThan(LEVEL_CONFIG[level].maxMs * 3 + 1500);
      expect(game.cells[result.move]).toBe(0);
    },
  );
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
        const v = nr >= 0 && nr < size && nc >= 0 && nc < size ? game.cells[nr * size + nc] : 0;
        near = v === 1 || v === 2;
      }
    }
    if (near) candidates.push(cell);
  }
  return candidates[Math.floor(rng() * candidates.length)]!;
}

function playMatch(
  level: Level,
  engineStone: Stone,
  seed: number,
  size: BoardSize,
  rule: CaroRule,
  obstacleCount: number,
): { winner: Stone | 0; game: GameState } {
  const rng = mulberry32(seed);
  const obstacles = placeObstacles(size, obstacleCount, seed);
  let game = newGame(size, { rule, obstacles });
  while (game.status.kind === 'playing') {
    const move =
      stoneToMove(game) === engineStone
        ? chooseMove({
            size,
            level,
            rule,
            obstacles,
            moves: game.moves,
            limits: { maxMs: 600_000, maxNodes: 8_000 },
          }).move
        : nearStoneMove(game, rng);
    game = playMove(game, move); // throws if the engine ever picks an illegal cell
  }
  return { winner: game.status.kind === 'won' ? game.status.winner : 0, game };
}

describe('strength in the new variants', () => {
  it('Hard beats the baseline under blocked ends on 15x15', () => {
    let wins = 0;
    for (let g = 0; g < 6; g++) {
      const stone: Stone = g % 2 === 0 ? 1 : 2;
      if (playMatch('hard', stone, 500 + g, 15, 'blocked', 0).winner === stone) wins++;
    }
    expect(wins).toBe(6);
  }, 180_000);

  it('Hard beats the baseline on the tournament board (19x19, blocked, 3 blocked squares)', () => {
    let wins = 0;
    for (let g = 0; g < 4; g++) {
      const stone: Stone = g % 2 === 0 ? 1 : 2;
      const { winner, game } = playMatch('hard', stone, 700 + g, 19, 'blocked', 3);
      if (winner === stone) wins++;
      if (game.status.kind === 'won') {
        expect(winningLine(game.cells, 19, game.moves.at(-1)!, 'blocked')).not.toBeNull();
      }
    }
    expect(wins).toBeGreaterThanOrEqual(3);
  }, 240_000);
});
