import { MAX_SESSION_SEC } from '@/core/training/config';
import type { SkillForgeDB } from '@/db/schema';
import { t } from '@/i18n/core';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import { BLACK, WHITE } from '../domain/board';
import { movesBy, serializeGame, type GameResult, type GameState } from '../domain/game';
import { clearDraft, saveDraft, type GoDraft } from './goDraft';
import type { DexieGoRepository } from './goRepository';

/** A finished game must have this many human stones to count (the product rule: >= 5 moves). */
export const MIN_RECORDED_MOVES = 5;

export type FinishResult =
  | { ok: true; recorded: boolean; session: CompletionOutcome | null }
  | { ok: false; message: string };

interface FinishDeps {
  db: SkillForgeDB;
  repository: Pick<DexieGoRepository, 'saveGame'>;
  engine: TrainingEngine;
  now: () => number;
}

/** How the game ended; fixed once so every save attempt records the same game. */
export interface GoFinish {
  endedAt: number;
  /** Stones the players agreed are dead (area scoring); empty after a resignation. */
  dead: readonly number[];
}

/**
 * Records a game that is over: the result in `gameRecords` and, for games with at least five
 * human stones, ONE training session keyed by the game id. Both writes are idempotent, so running
 * it again after a failure cannot double-count the result or the XP.
 *
 * The draft is first rewritten with a `finished` marker (the board, the dead stones and the end
 * time) and removed last. If anything fails the draft stays, so a reload offers the retry instead
 * of silently losing the result.
 */
export async function finishGoGame(
  deps: FinishDeps,
  draft: GoDraft,
  state: GameState,
  final: GameResult,
  finish: GoFinish,
): Promise<FinishResult> {
  const human = draft.humanColor === 'white' ? WHITE : BLACK;
  const serial = serializeGame(state);
  const outcome: 'win' | 'loss' | 'draw' =
    final.winner === 'draw' ? 'draw' : final.winner === human ? 'win' : 'loss';
  const recorded = movesBy(state, human) >= MIN_RECORDED_MOVES;

  try {
    await saveDraft(
      deps.db,
      {
        ...draft,
        moves: serial.moves,
        resignedBy:
          serial.resignedBy === null ? null : serial.resignedBy === BLACK ? 'black' : 'white',
        finished: { endedAt: finish.endedAt, dead: [...finish.dead] },
      },
      deps.now(),
    );
  } catch {
    // best effort: if storage is failing, the next write reports it
  }

  let session: CompletionOutcome | null = null;
  try {
    if (recorded) {
      // an abandoned game resumed days later must still fit the engine's session limits
      const startedAt = Math.max(draft.startedAt, finish.endedAt - MAX_SESSION_SEC * 1000);
      const signed = final.score ? final.score.margin : 0;
      await deps.repository.saveGame({
        id: draft.gameId,
        level: draft.level,
        size: draft.config.size,
        komi: draft.config.komi,
        handicap: draft.config.handicap,
        color: draft.humanColor,
        result: outcome,
        margin: human === BLACK ? signed : -signed,
        by: final.by,
        startedAt,
        endedAt: finish.endedAt,
        moves: serial.moves,
      });
      const response = await deps.engine.recordSession({
        id: draft.gameId,
        moduleId: 'go',
        activityType: 'game_session',
        startedAt,
        endedAt: Math.max(finish.endedAt, startedAt + 1000),
        source: 'timer',
        score: outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0,
        result: {
          kind: 'game',
          game: 'go',
          size: draft.config.size,
          level: draft.level,
          result: outcome,
          by: final.by,
        },
      });
      if (!response.ok) return { ok: false, message: failureMessage() };
      // a duplicate means an earlier attempt already paid out: nothing new to show
      session = response.value.duplicate ? null : response.value;
    }
    await clearDraft(deps.db);
  } catch {
    return { ok: false, message: failureMessage() };
  }
  return { ok: true, recorded, session };
}

function failureMessage(): string {
  return t('The game could not be saved. Check storage space in Settings and try again.');
}
