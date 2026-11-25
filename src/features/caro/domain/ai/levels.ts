export const LEVELS = ['easy', 'medium', 'hard'] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(value: string): value is Level {
  return (LEVELS as readonly string[]).includes(value);
}

export interface LevelConfig {
  /** Deepest iteration of the iterative-deepening search (plies). */
  maxDepth: number;
  /**
   * Search-node budget. It is the PRIMARY limit: the same position and level always searches the
   * same nodes, so the engine is deterministic. Sized for well under a second on a recent phone.
   */
  maxNodes: number;
  /** Wall-clock safety net for slower devices; when it fires first the result depends on speed. */
  maxMs: number;
  /** Candidate moves kept per ply (index 0 = root); the last entry applies to deeper plies. */
  widths: readonly number[];
  /** Longest chain of consecutive fours (victory by continuous fours) tried at the root; 0 = off. */
  vcfFours: number;
  /**
   * Easy only: chance that the engine plays its 2nd or 3rd best move instead of its best one.
   * Never applied when a move wins or must block a four, so it cannot throw away a won game
   * or ignore a five that is about to be completed.
   */
  mistakeRate: number;
}

export const LEVEL_CONFIG: Readonly<Record<Level, LevelConfig>> = {
  easy: {
    maxDepth: 2,
    maxNodes: 4_000,
    maxMs: 300,
    widths: [12, 8],
    vcfFours: 0,
    mistakeRate: 0.25,
  },
  medium: {
    maxDepth: 6,
    maxNodes: 40_000,
    maxMs: 500,
    widths: [14, 10, 8],
    vcfFours: 6,
    mistakeRate: 0,
  },
  hard: {
    maxDepth: 12,
    maxNodes: 200_000,
    maxMs: 800,
    widths: [16, 12, 9, 8],
    vcfFours: 10,
    mistakeRate: 0,
  },
};
