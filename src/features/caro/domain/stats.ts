import { LEVELS, type Level } from './ai/levels';
import type { BoardSize } from './board';
import type { Outcome } from './play';
import type { CaroRule } from './rules';
import { matchPreset, type PresetId } from './variant';

/** A stored, finished game as the statistics and the history list need it. */
export interface FinishedGame {
  id: string;
  level: Level;
  outcome: Outcome;
  endedAt: number;
  size: BoardSize;
  /** The variant played, so a record of a 19x19 blocked-ends game is never read as a classic one. */
  rule: CaroRule;
  /** How many blocked squares the board had. */
  obstacles: number;
  moves: number;
}

export interface Tally {
  played: number;
  won: number;
  lost: number;
  drawn: number;
}

/** The kinds of game the record is split by: the three presets, and anything else. */
export type VariantId = PresetId | 'other';
export const VARIANT_IDS: readonly VariantId[] = ['classic', 'vietnamese', 'tournament', 'other'];

/**
 * Which kind of game a stored row was. A row saved before variants existed has no rule or blocked
 * squares and was read as freestyle without any, so it counts as Classic. The quick 9 x 9 board
 * keeps the rule of its game (Classic or Vietnamese rule); only combinations that are neither a
 * preset nor a plain game on the 9 or 15 board (for example a 19 x 19 free-rule game, or blocked
 * squares with another size) are 'other'.
 */
export function variantOf(game: Pick<FinishedGame, 'size' | 'rule' | 'obstacles'>): VariantId {
  const preset = matchPreset(game.size, game.rule, game.obstacles);
  if (preset) return preset;
  if (game.obstacles === 0 && game.size !== 19) {
    return game.rule === 'blocked' ? 'vietnamese' : 'classic';
  }
  return 'other';
}

export interface CaroStats {
  total: Tally;
  byLevel: Record<Level, Tally>;
  byVariant: Record<VariantId, Tally>;
  /** Wins / played, 0..1; null before the first game. A draw is not a win. */
  winRate: number | null;
  /** Consecutive wins ending at the most recent game (a draw or loss resets it). */
  winStreak: number;
  bestWinStreak: number;
}

const emptyTally = (): Tally => ({ played: 0, won: 0, lost: 0, drawn: 0 });

function add(tally: Tally, outcome: Outcome): void {
  tally.played += 1;
  if (outcome === 'win') tally.won += 1;
  else if (outcome === 'loss') tally.lost += 1;
  else tally.drawn += 1;
}

export function computeStats(games: readonly FinishedGame[]): CaroStats {
  const oldestFirst = [...games].sort((a, b) => a.endedAt - b.endedAt);
  const total = emptyTally();
  const byLevel = Object.fromEntries(LEVELS.map((level) => [level, emptyTally()])) as Record<
    Level,
    Tally
  >;
  const byVariant = Object.fromEntries(VARIANT_IDS.map((id) => [id, emptyTally()])) as Record<
    VariantId,
    Tally
  >;
  let streak = 0;
  let best = 0;
  for (const game of oldestFirst) {
    add(total, game.outcome);
    add(byLevel[game.level], game.outcome);
    add(byVariant[variantOf(game)], game.outcome);
    streak = game.outcome === 'win' ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return {
    total,
    byLevel,
    byVariant,
    winRate: total.played === 0 ? null : total.won / total.played,
    winStreak: streak,
    bestWinStreak: best,
  };
}
