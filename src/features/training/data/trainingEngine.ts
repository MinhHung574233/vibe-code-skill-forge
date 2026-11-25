import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { newId } from '@/core/ids';
import type { Clock } from '@/core/time/clock';
import { toLocalDate } from '@/core/time/localDate';
import { newlyUnlocked, type UserFacts } from '@/core/training/achievements';
import {
  DEFAULT_XP_RULES,
  MIN_REWARDED_TIMER_SESSION_SEC,
  isActivityType,
  type ActivityType,
} from '@/core/training/config';
import { levelForXp } from '@/core/training/levels';
import { computeStreak, qualifyingDates, type StreakState } from '@/core/training/streak';
import { toAppError } from '@/db/errors';
import type { SkillForgeDB } from '@/db/schema';
import { DexieSettingsRepository } from '@/features/settings/data/dexieSettingsRepository';
import { loadModuleFacts, moduleFactTables } from './moduleFacts';
import {
  RecordSessionSchema,
  sessionActivityKey,
  type CompletionOutcome,
  type RecordSessionInput,
  type TrainingEngine,
} from '../domain/session';

/** Everything a session write touches. They are all in ONE read-write transaction. */
const tables = (db: SkillForgeDB) => [
  db.sessions,
  db.completions,
  db.xpRules,
  db.xpLedger,
  db.dailySummary,
  db.achievements,
  db.settings,
  ...moduleFactTables(db),
];

interface Reward {
  xp: number;
  /** Set when a reward was withheld, for the UI. */
  withheld?: string;
}

/**
 * XP for one completed activity: a configurable rule (a stored override wins over the default),
 * which can be disabled. Generic practice is only rewarded for a real timed session of at least
 * five minutes, so a manual log cannot be used to farm XP (it still counts for time and streak).
 */
async function rewardFor(
  db: SkillForgeDB,
  activityType: ActivityType,
  source: 'timer' | 'manual',
  durationSec: number,
): Promise<Reward> {
  const override = await db.xpRules.get(activityType);
  const enabled = override ? override.enabled === 1 : true;
  const xp = override ? override.xp : DEFAULT_XP_RULES[activityType];
  if (!enabled || xp <= 0) return { xp: 0, withheld: 'XP is turned off for this activity.' };
  if (activityType === 'practice_session') {
    if (source === 'manual')
      return { xp: 0, withheld: 'Logged sessions count for time but earn no XP.' };
    if (durationSec < MIN_REWARDED_TIMER_SESSION_SEC) {
      return { xp: 0, withheld: 'Sessions under 5 minutes earn no XP.' };
    }
  }
  return { xp };
}

export class DexieTrainingEngine implements TrainingEngine {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
  ) {}

  async recordSession(input: RecordSessionInput): Promise<Result<CompletionOutcome, AppError>> {
    const parsed = RecordSessionSchema.safeParse(input);
    if (!parsed.success) {
      return err(new AppError('VALIDATION', parsed.error.issues[0]?.message ?? 'Invalid session.'));
    }
    const s = parsed.data;
    if (!isActivityType(s.activityType)) {
      return err(new AppError('VALIDATION', 'Unknown activity type.'));
    }
    if (s.endedAt > this.clock.now() + 5 * 60 * 1000) {
      return err(new AppError('VALIDATION', 'A session cannot end in the future.'));
    }

    try {
      const outcome = await this.db.transaction('rw', tables(this.db), () => this.apply(s));
      return ok(outcome);
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  /** Runs inside the transaction. Only awaits Dexie operations (IndexedDB auto-commits otherwise). */
  private async apply(s: ReturnType<typeof RecordSessionSchema.parse>): Promise<CompletionOutcome> {
    const db = this.db;
    const now = this.clock.now();
    const activityKey = sessionActivityKey(s.id);
    const durationSec = Math.floor((s.endedAt - s.startedAt) / 1000);
    const localDate = toLocalDate(s.endedAt);
    const activityType = s.activityType;

    const totalXpBefore = await this.sumXp();
    const levelBefore = levelForXp(totalXpBefore);

    // Idempotency: checked inside the transaction (overlapping read-write transactions are
    // serialised by IndexedDB) and enforced again by the completions primary key.
    if (await db.completions.get(activityKey)) {
      return {
        sessionId: s.id,
        duplicate: true,
        xpAwarded: 0,
        totalXp: totalXpBefore,
        levelBefore,
        levelAfter: levelBefore,
        leveledUp: false,
        streak: await this.currentStreak(now),
        newAchievementIds: [],
      };
    }

    await db.sessions.add({
      id: s.id,
      moduleId: s.moduleId,
      activityType,
      ...(s.skillId ? { skillId: s.skillId } : {}),
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec,
      localDate,
      source: s.source,
      ...(s.score !== undefined ? { score: s.score } : {}),
      ...(s.result ? { result: s.result } : {}),
      ...(s.notes ? { notes: s.notes } : {}),
      createdAt: now,
    });
    await db.completions.add({
      activityKey,
      moduleId: s.moduleId,
      activityType,
      sessionId: s.id,
      completedAt: now,
      localDate,
    });

    const reward = await rewardFor(db, activityType, s.source, durationSec);
    if (reward.xp > 0) {
      await db.xpLedger.add({
        id: newId(now),
        activityKey,
        xp: reward.xp,
        ...(s.skillId ? { skillId: s.skillId } : {}),
        moduleId: s.moduleId,
        localDate,
        awardedAt: now,
      });
    }

    const day = await db.dailySummary.get(localDate);
    await db.dailySummary.put({
      localDate,
      durationSec: (day?.durationSec ?? 0) + durationSec,
      sessions: (day?.sessions ?? 0) + 1,
      activities: (day?.activities ?? 0) + 1,
      xp: (day?.xp ?? 0) + reward.xp,
    });

    const totalXp = totalXpBefore + reward.xp;
    const streak = await this.currentStreak(now);
    const newAchievementIds = await this.unlockAchievements(streak, now);

    const levelAfter = levelForXp(totalXp);
    return {
      sessionId: s.id,
      duplicate: false,
      xpAwarded: reward.xp,
      ...(reward.withheld ? { noXpReason: reward.withheld } : {}),
      totalXp,
      levelBefore,
      levelAfter,
      leveledUp: levelAfter > levelBefore,
      streak,
      newAchievementIds,
    };
  }

  private async sumXp(): Promise<number> {
    let total = 0;
    await this.db.xpLedger.each((row) => {
      total += row.xp;
    });
    return total;
  }

  private async currentStreak(now: number): Promise<StreakState> {
    const settings = new DexieSettingsRepository(this.db, this.clock);
    const [rule, goal, days] = await Promise.all([
      settings.get('streakRule'),
      settings.get('dailyGoalMinutes'),
      this.db.dailySummary.toArray(),
    ]);
    return computeStreak(qualifyingDates(days, rule, goal), toLocalDate(now));
  }

  /** Loads the facts, unlocks what now qualifies, and stores the facts as evidence. */
  private async unlockAchievements(streak: StreakState, now: number): Promise<string[]> {
    const db = this.db;
    const [totalSessions, days, unlockedIds, moduleFacts] = await Promise.all([
      db.sessions.count(),
      db.dailySummary.toArray(),
      db.achievements.toCollection().primaryKeys(),
      loadModuleFacts(db),
    ]);
    const facts: UserFacts = {
      totalSessions,
      totalMinutes: days.reduce((sum, d) => sum + d.durationSec, 0) / 60,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      ...moduleFacts,
    };
    const fresh = newlyUnlocked(facts, new Set(unlockedIds));
    for (const def of fresh) {
      await db.achievements.add({
        achievementId: def.id,
        unlockedAt: now,
        evidence: { ...facts },
      });
    }
    return fresh.map((d) => d.id);
  }
}
