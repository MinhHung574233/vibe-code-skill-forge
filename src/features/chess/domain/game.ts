import type { Chess, Color } from 'chess.js';

export type Outcome = 'win' | 'loss' | 'draw';

export function outcomeFor(winner: Color | null, human: Color): Outcome {
  if (winner === null) return 'draw';
  return winner === human ? 'win' : 'loss';
}

/** Moves made by the human in a game that started from the initial position (White moves first). */
export function playerMoveCount(moves: readonly string[], human: Color): number {
  const parity = human === 'w' ? 0 : 1;
  return moves.filter((_, i) => i % 2 === parity).length;
}

const PGN_RESULT: Record<'w' | 'b', Record<Outcome, string>> = {
  w: { win: '1-0', loss: '0-1', draw: '1/2-1/2' },
  b: { win: '0-1', loss: '1-0', draw: '1/2-1/2' },
};

/** Export format for the game record; `date` is `YYYY.MM.DD`. */
export function buildPgn(
  game: Chess,
  meta: { human: Color; level: string; outcome: Outcome; date: string },
): string {
  const engineName = `SkillForge engine (${meta.level})`;
  game.setHeader('Event', 'SkillForge training game');
  game.setHeader('Date', meta.date);
  game.setHeader('White', meta.human === 'w' ? 'You' : engineName);
  game.setHeader('Black', meta.human === 'b' ? 'You' : engineName);
  game.setHeader('Result', PGN_RESULT[meta.human][meta.outcome]);
  return game.pgn();
}

/**
 * Undo goes back to the human's previous turn: normally the engine's reply and the human's move
 * are both taken back. Null when the human has not moved yet (a Black player keeps the engine's
 * opening move).
 */
export function movesAfterUndo(moves: readonly string[], human: Color): readonly string[] | null {
  if (playerMoveCount(moves, human) === 0) return null;
  const humansTurn = (moves.length % 2 === 0) === (human === 'w');
  return moves.slice(0, Math.max(0, moves.length - (humansTurn ? 2 : 1)));
}
