import { Searcher, mateDistance, type SearchLimits, type SearchResult } from './search';

export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: readonly Level[] = ['easy', 'medium', 'hard'];

interface LevelConfig extends SearchLimits {
  /**
   * Easy only: every legal move is scored at `maxDepth`, then one is picked at random among those
   * within this many centipawns of the best. It never throws away a mate or a piece the shallow
   * search can see, but it does play natural-looking second-best moves.
   */
  randomWindowCp?: number;
}

/**
 * Strength is set by depth and clock. Measured numbers live in engine.test.ts; they are a
 * hobby-grade engine (a few plies, no opening book, no endgame tables), not a strong one.
 */
export const LEVEL_CONFIG: Readonly<Record<Level, LevelConfig>> = {
  easy: { maxDepth: 2, maxNodes: 30_000, maxTimeMs: 400, randomWindowCp: 90 },
  medium: { maxDepth: 5, maxNodes: 600_000, maxTimeMs: 700 },
  hard: { maxDepth: 12, maxNodes: 4_000_000, maxTimeMs: 1400 },
};

/** Rough ratings used as the opponent when a game is rated (see rating.ts). Approximate by design. */
export const LEVEL_RATING: Readonly<Record<Level, number>> = {
  easy: 700,
  medium: 1100,
  hard: 1400,
};

export interface MoveRequest {
  fen: string;
  level: Level;
  /** Earlier positions of this game (FEN, oldest first) so repetition is understood. */
  history?: readonly string[];
  /** Injectable for tests; defaults to Math.random. */
  random?: () => number;
}

/** The engine used by the app: one Searcher (and its transposition table) per game. */
export class ChessEngine {
  private readonly searcher = new Searcher();

  findMove({ fen, level, history = [], random = Math.random }: MoveRequest): SearchResult {
    const config = LEVEL_CONFIG[level];
    const result = this.searcher.search(fen, config, history);
    const window = config.randomWindowCp;
    if (!window || result.move === null || result.mateIn !== null) return result;

    const scored = this.searcher.scoreRootMoves(fen, config.maxDepth, history);
    const best = scored[0];
    if (!best) return result;
    const candidates = scored.filter(
      (m) => m.score >= best.score - window && mateDistance(m.score) === null,
    );
    const pick = candidates[Math.floor(random() * candidates.length)] ?? best;
    return { ...result, move: pick.move, score: pick.score };
  }

  /** Raw search with explicit limits (tests, tooling). */
  search(
    fen: string,
    limits: SearchLimits,
    history: readonly string[] = [],
    now?: () => number,
    rootMoves?: readonly string[],
  ): SearchResult {
    return this.searcher.search(fen, limits, history, now, rootMoves);
  }

  scoreRootMoves(fen: string, depth: number, history: readonly string[] = []) {
    return this.searcher.scoreRootMoves(fen, depth, history);
  }
}
