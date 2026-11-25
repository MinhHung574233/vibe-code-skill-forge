/**
 * Elo-style ratings, labelled "SkillForge rating" in the UI. They are only comparable with
 * themselves: puzzle difficulty and engine levels are authored estimates, not FIDE or Lichess data.
 */

export const START_RATING = 1000;
const FLOOR = 100;

export interface RatingState {
  value: number;
  games: number;
}

export const INITIAL_RATING: RatingState = { value: START_RATING, games: 0 };

/** Probability that a player rated `rating` scores against `opponent` (0..1). */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + 10 ** ((opponent - rating) / 400));
}

/** Learn fast at the start, settle later: 40 for the first 10 games, then 32, 24 and finally 16. */
export function kFactor(games: number): number {
  if (games < 10) return 40;
  if (games < 30) return 32;
  if (games < 100) return 24;
  return 16;
}

export interface RatingUpdate extends RatingState {
  delta: number;
}

/** `score` is 1 for a win, 0.5 for a draw and 0 for a loss. */
export function updateRating(current: RatingState, opponent: number, score: number): RatingUpdate {
  const change = kFactor(current.games) * (score - expectedScore(current.value, opponent));
  const value = Math.max(FLOOR, Math.round(current.value + change));
  return { value, games: current.games + 1, delta: value - current.value };
}
