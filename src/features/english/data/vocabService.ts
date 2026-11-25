import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { Clock } from '@/core/time/clock';
import { toLocalDate } from '@/core/time/localDate';
import type { VocabProgressRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import type { CompletionOutcome, TrainingEngine } from '@/features/training/domain/session';
import { NEW_CARD, review, type Grade } from '../domain/srs';

export interface ReviewSummary {
  /** Cards graded in the session, including repeats of forgotten cards. */
  answers: number;
  /** Answers that were not "again". */
  recalled: number;
  newWords: number;
}

export class VocabService {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
    private readonly engine: TrainingEngine,
  ) {}

  async progress(): Promise<Map<string, VocabProgressRow>> {
    const rows = await this.db.vocabProgress.toArray();
    return new Map(rows.map((r) => [r.wordId, r]));
  }

  /** How many words were introduced (first graded) on the given local day. */
  async newWordsOn(localDate: string): Promise<number> {
    let count = 0;
    await this.db.vocabProgress.each((row) => {
      if (toLocalDate(row.createdAt) === localDate) count++;
    });
    return count;
  }

  /** Grades one card and saves its next state immediately, so leaving mid-session loses nothing. */
  async grade(wordId: string, grade: Grade): Promise<VocabProgressRow> {
    const now = this.clock.now();
    return this.db.transaction('rw', this.db.vocabProgress, async () => {
      const existing = await this.db.vocabProgress.get(wordId);
      const next = review(existing ?? NEW_CARD, grade, now);
      const row: VocabProgressRow = {
        wordId,
        ...next,
        lastReviewedAt: now,
        createdAt: existing?.createdAt ?? now,
      };
      await this.db.vocabProgress.put(row);
      return row;
    });
  }

  /** Records the finished review session for XP, streak and analytics (idempotent by id). */
  async finishSession(
    sessionId: string,
    startedAt: number,
    summary: ReviewSummary,
  ): Promise<Result<CompletionOutcome, AppError>> {
    const endedAt = Math.max(this.clock.now(), startedAt + 1000);
    return this.engine.recordSession({
      id: sessionId,
      moduleId: 'english',
      activityType: 'vocab_session',
      startedAt,
      endedAt,
      source: 'timer',
      score: summary.answers === 0 ? 0 : summary.recalled / summary.answers,
      result: { ...summary },
    });
  }
}
