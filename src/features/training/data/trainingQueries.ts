import { addDays, toLocalDate } from '@/core/time/localDate';
import type { SessionRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import type { SessionRecord, TrainingData } from '../domain/overview';

/** How far back sessions are loaded for analytics (covers a 30-day view plus its comparison). */
export const ANALYTICS_WINDOW_DAYS = 60;

function toRecord(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    moduleId: row.moduleId,
    activityType: row.activityType,
    ...(row.skillId ? { skillId: row.skillId } : {}),
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    durationSec: row.durationSec,
    localDate: row.localDate,
    source: row.source,
    ...(row.notes ? { notes: row.notes } : {}),
  };
}

/**
 * Reads what Home and Progress need in one pass. Used inside `liveQuery`, so the screens refresh
 * on their own whenever a session is recorded.
 */
export async function loadTrainingData(db: SkillForgeDB, now: number): Promise<TrainingData> {
  const since = addDays(toLocalDate(now), -ANALYTICS_WINDOW_DAYS);
  const [days, sessions] = await Promise.all([
    db.dailySummary.toArray(),
    db.sessions.where('localDate').aboveOrEqual(since).toArray(),
  ]);
  let totalXp = 0;
  await db.xpLedger.each((row) => {
    totalXp += row.xp;
  });
  return { days, windowSessions: sessions.map(toRecord), totalXp };
}

/** Newest first. Not limited to the analytics window, so history reaches back as far as it goes. */
export async function loadRecentSessions(
  db: SkillForgeDB,
  limit: number,
): Promise<SessionRecord[]> {
  const rows = await db.sessions.orderBy('startedAt').reverse().limit(limit).toArray();
  return rows.map(toRecord);
}

/** All of a skill's sessions, newest first. */
export async function loadSkillSessions(
  db: SkillForgeDB,
  skillId: string,
): Promise<SessionRecord[]> {
  const rows = await db.sessions.where('skillId').equals(skillId).toArray();
  return rows.map(toRecord).sort((a, b) => b.startedAt - a.startedAt);
}

export async function loadUnlockedAchievements(db: SkillForgeDB): Promise<Map<string, number>> {
  const rows = await db.achievements.toArray();
  return new Map(rows.map((r) => [r.achievementId, r.unlockedAt]));
}
