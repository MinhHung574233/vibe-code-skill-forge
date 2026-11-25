import { chooseMove, type AiMove, type Level } from '../domain/ai';
import { restoreGame, type SerializedGame } from '../domain/game';
import { createRng } from '../domain/rng';

/** Messages between the game screen and the AI worker (kept free of DOM types: also used in tests). */
export interface AiRequest {
  id: number;
  game: SerializedGame;
  level: Level;
  seed: number;
}

export type AiResponse = { id: number; move: AiMove } | { id: number; error: string };

/**
 * Runs one AI decision. The RNG is seeded from the game's seed and the ply, so a resumed or
 * replayed game gets the same opponent behaviour, yet every move uses a different stream.
 */
export function solveRequest(request: AiRequest): AiMove {
  const state = restoreGame(request.game);
  if (!state) throw new Error('The game record is not valid.');
  const rng = createRng(request.seed + state.moves.length * 7919);
  return chooseMove(state, { level: request.level, rng });
}
