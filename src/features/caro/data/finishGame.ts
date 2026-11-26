import type { Clock } from '@/core/time/clock';
import type { SkillForgeDB } from '@/db/schema';
import { t } from '@/i18n/core';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import { stoneCount, type GameState } from '../domain/game';
import { MIN_PLAYER_MOVES_FOR_SESSION, outcomeOf, type CaroDraft } from '../domain/play';
import { clearDraft, saveFinishedGame } from './caroRepository';

/** The training engine rejects sessions over 12 h; a game left open for days is clamped. */
const LONGEST_SESSION_MS = 11 * 60 * 60 * 1000;
/** ...and under 1 s: a scripted or very fast game still needs a positive duration. */
const SHORTEST_SESSION_MS = 1000;

export type FinishResult =
  { ok: true; session: CompletionOutcome | null } | { ok: false; message: string };

interface FinishDeps {
  db: SkillForgeDB;
  engine: TrainingEngine;
  clock: Pick<Clock, 'now'>;
}

/**
 * Records a game that ended on the board: the result in `gameRecords`, and, when the person made
 * at least five moves, ONE training session (XP, streak) keyed by the game id. Both writes are
 * idempotent, so a retry after a crash cannot double-count. The saved game is removed last: if
 * anything failed it stays, the finished board is shown again on resume and recording is retried.
 *
 * Resigning or abandoning never comes here, so those games record nothing.
 */
export async function finishGame(
  deps: FinishDeps,
  draft: CaroDraft,
  game: GameState,
): Promise<FinishResult> {
  const outcome = outcomeOf(game.status, draft.humanStone);
  if (!outcome) return { ok: false, message: t('The game is not finished.') };

  const endedAt = deps.clock.now();
  const startedAt = Math.min(
    Math.max(draft.startedAt, endedAt - LONGEST_SESSION_MS),
    endedAt - SHORTEST_SESSION_MS,
  );

  try {
    await saveFinishedGame(deps.db, {
      id: draft.id,
      level: draft.level,
      outcome,
      size: draft.size,
      moves: game.moves.length,
      firstMover: draft.humanStone === 1 ? 'player' : 'computer',
      undos: draft.undos,
      startedAt: draft.startedAt,
      endedAt,
    });
  } catch {
    return { ok: false, message: t('Could not save the game result. Try again.') };
  }

  let session: CompletionOutcome | null = null;
  if (stoneCount(game, draft.humanStone) >= MIN_PLAYER_MOVES_FOR_SESSION) {
    const recorded = await deps.engine.recordSession({
      id: draft.id,
      moduleId: 'caro',
      activityType: 'game_session',
      startedAt,
      endedAt,
      source: 'timer',
      score: outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0,
      result: { game: 'caro', level: draft.level, outcome },
    });
    if (!recorded.ok) return { ok: false, message: t(recorded.error.message) };
    session = recorded.value;
  }

  try {
    await clearDraft(deps.db);
  } catch {
    return { ok: false, message: t('Could not clear the saved game. Try again.') };
  }
  return { ok: true, session };
}
