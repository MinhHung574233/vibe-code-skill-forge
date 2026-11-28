import type { SkillForgeDB } from '@/db/schema';
import { t } from '@/i18n/core';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import {
  clearGameDraft,
  recordFinishedGame,
  saveGameDraft,
  type FinishedGame,
  type GameDraft,
  type GameRecordResult,
} from './chessRepository';

/** The training engine rejects sessions over 12 h; a game resumed after days is clamped. */
const LONGEST_SESSION_MS = 11 * 60 * 60 * 1000;
const SHORTEST_SESSION_MS = 1000;

export type FinishResult =
  | { ok: true; saved: GameRecordResult; session: CompletionOutcome | null }
  | { ok: false; message: string };

interface FinishDeps {
  db: SkillForgeDB;
  engine: TrainingEngine;
  now?: () => number;
}

/**
 * Records a game that is over: the result and play rating in `gameRecords`/`ratings`, and (for
 * games long enough) ONE training session keyed by the game id. Safe to call again after a
 * failure: the game record is idempotent per id and the session per activity key, so neither the
 * rating nor the XP can be applied twice.
 *
 * The draft (marked `finished`) is written first and removed last. If anything fails it stays, so
 * the finished board comes back on resume with a "Try saving again" button instead of the result
 * being lost.
 */
export async function finishChessGame(
  deps: FinishDeps,
  draft: GameDraft,
  game: FinishedGame,
): Promise<FinishResult> {
  const now = deps.now ?? Date.now;
  try {
    await saveGameDraft(deps.db, draft, now());
  } catch {
    // best effort: if storage is failing the next step reports it
  }

  let saved: GameRecordResult;
  try {
    saved = await recordFinishedGame(deps.db, game);
  } catch {
    return { ok: false, message: failureMessage() };
  }

  let session: CompletionOutcome | null = null;
  if (saved.rewarded) {
    const startedAt = Math.min(
      Math.max(game.startedAt, game.endedAt - LONGEST_SESSION_MS),
      game.endedAt - SHORTEST_SESSION_MS,
    );
    try {
      const recorded = await deps.engine.recordSession({
        id: game.id,
        moduleId: 'chess',
        activityType: 'game_session',
        startedAt,
        endedAt: game.endedAt,
        source: 'timer',
        score: game.result === 'win' ? 1 : game.result === 'draw' ? 0.5 : 0,
        result: {
          level: game.level,
          color: game.color,
          outcome: game.result,
          reason: game.reason,
          playerMoves: game.playerMoves,
          ...(saved.coached ? { coached: true } : {}),
        },
      });
      if (!recorded.ok) return { ok: false, message: failureMessage() };
      // a duplicate means an earlier attempt already paid out: nothing new to show
      session = recorded.value.duplicate ? null : recorded.value;
    } catch {
      return { ok: false, message: failureMessage() };
    }
  }

  try {
    await clearGameDraft(deps.db);
  } catch {
    return { ok: false, message: failureMessage() };
  }
  return { ok: true, saved, session };
}

function failureMessage(): string {
  return t('The game could not be saved. Check storage space in Settings and try again.');
}
