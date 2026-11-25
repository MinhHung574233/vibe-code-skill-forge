import { newId } from '@/core/ids';
import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import { ok } from '@/core/result';
import type { Clock } from '@/core/time/clock';
import { toLocalDate } from '@/core/time/localDate';
import type { SkillForgeDB } from '@/db/schema';
import type { AlgorithmProgressRow, RubikSolveRow } from '@/db/rows';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import { bestSingle, type Penalty } from '../domain/stats';

/** A solve session is closed automatically once nothing has been solved for this long. */
export const SESSION_IDLE_MS = 90 * 60 * 1000;
const DRAFT_KEY = 'rubik-session';

interface SessionDraft {
  sessionId: string;
  startedAt: number;
  lastSolveAt: number;
}

function isDraft(value: unknown): value is SessionDraft {
  const v = value as Partial<SessionDraft> | null;
  return (
    !!v &&
    typeof v.sessionId === 'string' &&
    typeof v.startedAt === 'number' &&
    typeof v.lastSolveAt === 'number'
  );
}

export interface AddSolveResult {
  solve: RubikSolveRow;
  /** Set when a stale session was closed automatically before this solve. */
  closedStale?: CompletionOutcome;
}

/**
 * Rubik solves and the training session around them. Solves are stored as they happen; a
 * "session" (for XP, streak and analytics) is the run of solves between the first one and the
 * moment the user finishes, or the idle timeout. Each session is recorded once, by id.
 */
export class RubikService {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
    private readonly engine: TrainingEngine,
  ) {}

  /** Stores a finished solve (`timeMs` is the raw timer reading) and opens/extends the session. */
  async addSolve(input: {
    timeMs: number;
    scramble: string;
    penalty?: Penalty;
  }): Promise<AddSolveResult> {
    const now = this.clock.now();
    let closedStale: CompletionOutcome | undefined;

    const draft = await this.readDraft();
    if (draft && now - draft.lastSolveAt > SESSION_IDLE_MS) {
      const closed = await this.closeSession(draft);
      if (closed.ok) closedStale = closed.value ?? undefined;
    }

    const solve: RubikSolveRow = {
      id: newId(now),
      timeMs: Math.max(0, Math.round(input.timeMs)),
      penalty: input.penalty ?? 'none',
      scramble: input.scramble,
      createdAt: now,
      localDate: toLocalDate(now),
    };
    await this.db.transaction('rw', [this.db.rubikSolves, this.db.drafts], async () => {
      await this.db.rubikSolves.add(solve);
      const current = await this.readDraft();
      const open =
        current && now - current.lastSolveAt <= SESSION_IDLE_MS
          ? { ...current, lastSolveAt: now }
          : {
              sessionId: `rubik:${solve.id}`,
              startedAt: Math.max(1, now - solve.timeMs),
              lastSolveAt: now,
            };
      await this.db.drafts.put({ key: DRAFT_KEY, value: open, updatedAt: now });
    });
    return { solve, ...(closedStale ? { closedStale } : {}) };
  }

  async setPenalty(id: string, penalty: Penalty): Promise<void> {
    await this.db.rubikSolves.update(id, { penalty });
  }

  async deleteSolve(id: string): Promise<void> {
    await this.db.rubikSolves.delete(id);
  }

  async solves(): Promise<RubikSolveRow[]> {
    return this.db.rubikSolves.orderBy('createdAt').toArray();
  }

  /** The solves that belong to the open session, oldest first. */
  async openSessionSolves(): Promise<RubikSolveRow[]> {
    const draft = await this.readDraft();
    if (!draft) return [];
    return this.db.rubikSolves.where('createdAt').aboveOrEqual(draft.startedAt).toArray();
  }

  /**
   * Ends the open session and records it for XP/streak. Returns null outcome when there is
   * nothing to record (no open session, or every solve of it was deleted).
   */
  async finishSession(): Promise<Result<CompletionOutcome | null, AppError>> {
    const draft = await this.readDraft();
    if (!draft) return ok(null);
    return this.closeSession(draft);
  }

  private async closeSession(
    draft: SessionDraft,
  ): Promise<Result<CompletionOutcome | null, AppError>> {
    const solves = await this.db.rubikSolves
      .where('createdAt')
      .aboveOrEqual(draft.startedAt)
      .toArray();
    const last = solves.at(-1);
    if (!last) {
      await this.db.drafts.delete(DRAFT_KEY);
      return ok(null);
    }
    const asSolves = solves.map((s) => ({ timeMs: s.timeMs, penalty: s.penalty }));
    const best = bestSingle(asSolves);
    const result = await this.engine.recordSession({
      id: draft.sessionId,
      moduleId: 'rubik',
      activityType: 'rubik_session',
      startedAt: draft.startedAt,
      endedAt: Math.max(draft.startedAt + 1000, last.createdAt),
      source: 'timer',
      result: { solves: solves.length, bestMs: best },
    });
    // Keep the draft if recording failed, so the user can retry; clear it on success.
    if (result.ok) await this.db.drafts.delete(DRAFT_KEY);
    return result;
  }

  private async readDraft(): Promise<SessionDraft | null> {
    const row = await this.db.drafts.get(DRAFT_KEY);
    return row && isDraft(row.value) ? row.value : null;
  }

  async setAlgorithmStatus(
    algId: string,
    status: AlgorithmProgressRow['status'] | null,
  ): Promise<void> {
    if (status === null) {
      await this.db.algorithmProgress.delete(algId);
      return;
    }
    await this.db.algorithmProgress.put({ algId, status, updatedAt: this.clock.now() });
  }
}
