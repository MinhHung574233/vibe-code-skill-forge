import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieTrainingEngine } from './trainingEngine';
import type { RecordSessionInput } from '../domain/session';

const NAME = 'training-engine-test';
const MIN = 60_000;
const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour, 0, 0).getTime();
};

let db: SkillForgeDB;
let clock: FakeClock;
let engine: DexieTrainingEngine;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(at('2026-11-25', 18)); // "now" = 25 Nov 2026, 18:00 local
  engine = new DexieTrainingEngine(db, clock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

/** A timed practice session that ended `endHour` on `date` and lasted `minutes`. */
function session(
  id: string,
  over: Partial<RecordSessionInput> & { date?: string; minutes?: number; endHour?: number } = {},
): RecordSessionInput {
  const { date = '2026-11-25', minutes = 10, endHour = 12, ...rest } = over;
  const endedAt = at(date, endHour);
  return {
    id,
    activityType: 'practice_session',
    source: 'timer',
    startedAt: endedAt - minutes * MIN,
    endedAt,
    ...rest,
  };
}

async function record(input: RecordSessionInput) {
  const result = await engine.recordSession(input);
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}: ${result.error.message}`);
  return result.value;
}

const counts = async () => ({
  sessions: await db.sessions.count(),
  completions: await db.completions.count(),
  ledger: await db.xpLedger.count(),
  days: await db.dailySummary.count(),
  achievements: await db.achievements.count(),
});

describe('recording a session', () => {
  it('writes the session, completion, XP, daily rollup and first achievement together', async () => {
    const outcome = await record(
      session('s1', { minutes: 10, skillId: 'sk1', notes: 'cross drills' }),
    );

    expect(outcome).toMatchObject({
      sessionId: 's1',
      duplicate: false,
      xpAwarded: 10,
      totalXp: 10,
      levelBefore: 1,
      levelAfter: 1,
      leveledUp: false,
      newAchievementIds: ['first_session'],
    });
    expect(outcome.streak).toMatchObject({ current: 1, activeToday: true });

    expect(await db.sessions.get('s1')).toMatchObject({
      moduleId: 'general',
      activityType: 'practice_session',
      skillId: 'sk1',
      durationSec: 600,
      localDate: '2026-11-25',
      source: 'timer',
      notes: 'cross drills',
    });
    expect(await db.completions.get('session:s1')).toMatchObject({ sessionId: 's1' });
    expect(await db.xpLedger.toArray()).toEqual([
      expect.objectContaining({ activityKey: 'session:s1', xp: 10, skillId: 'sk1' }),
    ]);
    expect(await db.dailySummary.get('2026-11-25')).toEqual({
      localDate: '2026-11-25',
      durationSec: 600,
      sessions: 1,
      activities: 1,
      xp: 10,
    });
  });

  it('stores the achievement evidence (the facts that satisfied the rule)', async () => {
    await record(session('s1'));
    const row = await db.achievements.get('first_session');
    expect(row?.evidence).toMatchObject({ totalSessions: 1, currentStreak: 1 });
  });

  it('accumulates the daily rollup across several sessions on one day', async () => {
    await record(session('a', { minutes: 10, endHour: 9 }));
    await record(session('b', { minutes: 25, endHour: 15 }));
    expect(await db.dailySummary.get('2026-11-25')).toMatchObject({
      durationSec: 35 * 60,
      sessions: 2,
      xp: 20,
    });
  });

  it('files a session under the local day it ended, not a UTC day', async () => {
    await record(session('late', { date: '2026-11-24', endHour: 23, minutes: 30 }));
    expect((await db.sessions.get('late'))?.localDate).toBe('2026-11-24');
  });
});

describe('idempotent rewards', () => {
  it('recording the same session again changes nothing and awards no XP', async () => {
    const first = await record(session('same'));
    const before = await counts();

    const again = await record(session('same'));
    expect(again).toMatchObject({ duplicate: true, xpAwarded: 0, newAchievementIds: [] });
    expect(again.totalXp).toBe(first.totalXp);
    expect(await counts()).toEqual(before);
  });

  it('concurrent saves of the same session (double tap) award XP exactly once', async () => {
    const results = await Promise.all([
      engine.recordSession(session('race')),
      engine.recordSession(session('race')),
      engine.recordSession(session('race')),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    const outcomes = results.flatMap((r) => (r.ok ? [r.value] : []));
    expect(outcomes.filter((o) => !o.duplicate)).toHaveLength(1);
    expect(outcomes.reduce((sum, o) => sum + o.xpAwarded, 0)).toBe(10);
    expect(await counts()).toMatchObject({ sessions: 1, completions: 1, ledger: 1 });
  });

  it('the database itself refuses a second ledger row for the same activity', async () => {
    await record(session('s1'));
    await expect(
      db.xpLedger.add({
        id: 'dupe',
        activityKey: 'session:s1',
        xp: 10,
        moduleId: 'general',
        localDate: '2026-11-25',
        awardedAt: 1,
      }),
    ).rejects.toMatchObject({ name: 'ConstraintError' });
  });

  it('is atomic: a failure midway leaves no session, completion or rollup behind', async () => {
    // Corrupt state: a ledger row exists for a key that has no completion, so the XP insert fails.
    await db.xpLedger.add({
      id: 'orphan',
      activityKey: 'session:boom',
      xp: 10,
      moduleId: 'general',
      localDate: '2026-11-25',
      awardedAt: 1,
    });
    const result = await engine.recordSession(session('boom'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('CONSTRAINT');

    expect(await db.sessions.get('boom')).toBeUndefined();
    expect(await db.completions.get('session:boom')).toBeUndefined();
    expect(await db.dailySummary.count()).toBe(0);
    expect(await db.achievements.count()).toBe(0);
  });
});

describe('XP rules', () => {
  it('uses the default reward per activity type (configurable data)', async () => {
    const vocab = await record(
      session('v', { activityType: 'vocab_session', moduleId: 'english' }),
    );
    const java = await record(session('j', { activityType: 'java_lesson', moduleId: 'java' }));
    const puzzle = await record(session('p', { activityType: 'chess_puzzle', moduleId: 'chess' }));
    const cube = await record(session('c', { activityType: 'rubik_session', moduleId: 'rubik' }));
    const daily = await record(session('d', { activityType: 'daily_challenge' }));
    expect([vocab, java, puzzle, cube, daily].map((o) => o.xpAwarded)).toEqual([
      20, 30, 10, 15, 50,
    ]);
  });

  it('a stored override wins over the default, and can switch an activity off', async () => {
    await db.xpRules.put({ activityType: 'vocab_session', xp: 35, enabled: 1, updatedAt: 1 });
    expect((await record(session('v1', { activityType: 'vocab_session' }))).xpAwarded).toBe(35);

    await db.xpRules.put({ activityType: 'vocab_session', xp: 35, enabled: 0, updatedAt: 2 });
    const off = await record(session('v2', { activityType: 'vocab_session' }));
    expect(off.xpAwarded).toBe(0);
    expect(off.noXpReason).toMatch(/turned off/);
  });

  it('manual logs count for time and streak but earn no XP', async () => {
    const outcome = await record(session('m', { source: 'manual', minutes: 45 }));
    expect(outcome.xpAwarded).toBe(0);
    expect(outcome.noXpReason).toMatch(/earn no XP/);
    expect(await db.xpLedger.count()).toBe(0);
    expect(await db.dailySummary.get('2026-11-25')).toMatchObject({ durationSec: 45 * 60, xp: 0 });
    expect(outcome.streak.current).toBe(1);
    expect(outcome.newAchievementIds).toContain('first_session');
  });

  it('timed practice under 5 minutes is recorded but earns no XP', async () => {
    const outcome = await record(session('short', { minutes: 4 }));
    expect(outcome.xpAwarded).toBe(0);
    expect(outcome.noXpReason).toMatch(/under 5 minutes/);
    expect(await db.sessions.count()).toBe(1);
  });

  it('reports a level-up when XP crosses a threshold', async () => {
    await db.xpLedger.add({
      id: 'seed',
      activityKey: 'seed:1',
      xp: 95,
      moduleId: 'general',
      localDate: '2026-11-20',
      awardedAt: 1,
    });
    const outcome = await record(session('up'));
    expect(outcome).toMatchObject({ totalXp: 105, levelBefore: 1, levelAfter: 2, leveledUp: true });
  });
});

describe('streaks and achievements from real activity', () => {
  it('builds a streak over consecutive days and unlocks the 7-day streak on day 7', async () => {
    const days = [
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
    ];
    for (const [i, date] of days.entries()) {
      const o = await record(session(`d${i}`, { date }));
      expect(o.newAchievementIds).not.toContain('streak_7');
    }
    const seventh = await record(session('d6', { date: '2026-11-25' }));
    expect(seventh.streak).toMatchObject({ current: 7, longest: 7 });
    expect(seventh.newAchievementIds).toContain('streak_7');

    const eighth = await record(session('extra', { date: '2026-11-25', endHour: 14 }));
    expect(eighth.newAchievementIds).not.toContain('streak_7'); // never re-awarded
    expect(await db.achievements.where('achievementId').equals('streak_7').count()).toBe(1);
  });

  it('unlocks the first hour at 60 total minutes and ten sessions at the tenth', async () => {
    // 7 minutes each: 63 minutes after the 9th session, 10 sessions after the 10th.
    const unlockedAt: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
      const o = await record(session(`t${i}`, { minutes: 7, endHour: 8 + i }));
      for (const id of o.newAchievementIds) unlockedAt[id] = i + 1;
    }
    expect(unlockedAt).toMatchObject({ first_session: 1, hour_total: 9, ten_sessions: 10 });
  });

  it('a gap resets the current streak', async () => {
    await record(session('a', { date: '2026-11-20' }));
    await record(session('b', { date: '2026-11-21' }));
    const today = await record(session('c', { date: '2026-11-25' }));
    expect(today.streak).toMatchObject({ current: 1, longest: 2 });
  });

  it('follows the streak rule setting: goal_met needs the daily goal', async () => {
    await db.settings.bulkPut([
      { key: 'streakRule', value: 'goal_met', updatedAt: 1 },
      { key: 'dailyGoalMinutes', value: 20, updatedAt: 1 },
    ]);
    const small = await record(session('small', { minutes: 10 }));
    expect(small.streak.current).toBe(0);
    const enough = await record(session('enough', { minutes: 15, endHour: 14 }));
    expect(enough.streak.current).toBe(1); // 25 min today >= 20
  });

  it('module-bound achievements stay locked (no module facts exist yet)', async () => {
    for (let i = 0; i < 12; i++) await record(session(`m${i}`, { minutes: 6, endHour: 6 + i }));
    const ids = (await db.achievements.toArray()).map((a) => a.achievementId);
    expect(ids).not.toEqual(expect.arrayContaining(['vocab_100']));
    expect(ids).not.toContain('java_path');
    expect(ids).not.toContain('rubik_pb');
  });
});

describe('validation', () => {
  const expectInvalid = async (input: RecordSessionInput, message?: RegExp) => {
    const result = await engine.recordSession(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
      if (message) expect(result.error.message).toMatch(message);
    }
    expect(await counts()).toMatchObject({ sessions: 0, completions: 0, ledger: 0 });
  };

  it('rejects sessions shorter than a minute or longer than 12 hours', async () => {
    const end = at('2026-11-25', 12);
    await expectInvalid(
      { ...session('x'), startedAt: end - 30_000, endedAt: end },
      /between 1 minute and 12 hours/,
    );
    await expectInvalid(
      { ...session('x'), startedAt: end - 13 * 3_600_000, endedAt: end },
      /12 hours/,
    );
  });

  it('rejects an end that is not after the start, or an unknown activity type', async () => {
    const end = at('2026-11-25', 12);
    await expectInvalid({ ...session('x'), startedAt: end, endedAt: end }, /end after it starts/);
    await expectInvalid({ ...session('x'), activityType: 'nonsense' as never });
  });

  it('rejects sessions that end in the future', async () => {
    await expectInvalid(session('future', { date: '2026-11-26' }), /future/);
  });

  it('rejects a missing id and out-of-range scores', async () => {
    await expectInvalid({ ...session('x'), id: '' });
    await expectInvalid({ ...session('x'), score: 1.5 });
  });
});
