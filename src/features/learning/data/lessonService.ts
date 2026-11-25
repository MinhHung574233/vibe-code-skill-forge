import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import { ok } from '@/core/result';
import type { Clock } from '@/core/time/clock';
import type { ActivityType } from '@/core/training/config';
import type { LessonProgressRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import type { QuizResult } from '../domain/learning';

export interface SubmitInput {
  moduleId: string;
  activityType: ActivityType;
  pathId: string;
  lessonId: string;
  /** When the learner opened the lesson. */
  startedAt: number;
  result: QuizResult;
}

export interface SubmitOutcome {
  /** This attempt completed the lesson for the first time. */
  firstCompletion: boolean;
  /** XP/streak outcome, only on a first completion. */
  outcome: CompletionOutcome | null;
}

/**
 * Stores quiz attempts. A lesson is completed on the first passing attempt and only then earns
 * XP (activity key `lesson:<id>`, so retaking it can never earn again).
 */
export class LessonService {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
    private readonly engine: TrainingEngine,
  ) {}

  async completedIds(): Promise<Set<string>> {
    const keys = await this.db.lessonProgress.toCollection().primaryKeys();
    return new Set(keys);
  }

  async submit(input: SubmitInput): Promise<Result<SubmitOutcome, AppError>> {
    const now = this.clock.now();
    const { result } = input;
    if (!result.passed) return ok({ firstCompletion: false, outcome: null });

    const existing = await this.db.lessonProgress.get(input.lessonId);
    const row: LessonProgressRow = {
      lessonId: input.lessonId,
      pathId: input.pathId,
      completedAt: existing?.completedAt ?? now,
      bestScore: Math.max(existing?.bestScore ?? 0, result.score),
      attempts: (existing?.attempts ?? 0) + 1,
    };
    if (existing) {
      await this.db.lessonProgress.put(row);
      return ok({ firstCompletion: false, outcome: null });
    }

    // Written first so the engine's achievement check (e.g. "path completed") already sees it.
    await this.db.lessonProgress.put(row);
    const recorded = await this.engine.recordSession({
      id: `lesson:${input.lessonId}`,
      moduleId: input.moduleId,
      activityType: input.activityType,
      startedAt: input.startedAt,
      endedAt: Math.max(now, input.startedAt + 1000),
      source: 'timer',
      score: result.score,
      result: { lessonId: input.lessonId, pathId: input.pathId, correct: result.correct },
    });
    if (!recorded.ok) {
      await this.db.lessonProgress.delete(input.lessonId); // not completed without its record
      return recorded;
    }
    return ok({ firstCompletion: true, outcome: recorded.value });
  }
}
