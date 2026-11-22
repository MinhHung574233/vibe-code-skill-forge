import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieSettingsRepository } from './dexieSettingsRepository';

const NAME = 'settings-repo-test';
let db: SkillForgeDB;
let repo: DexieSettingsRepository;
let clock: FakeClock;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(1_000);
  repo = new DexieSettingsRepository(db, clock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

describe('DexieSettingsRepository', () => {
  it('returns defaults for settings that were never stored', async () => {
    expect(await repo.get('streakRule')).toBe('any_session');
    expect(await repo.get('dailyGoalMinutes')).toBe(20);
    expect(await repo.get('onboardingDone')).toBe(false);
    expect(await repo.get('lastBackupAt')).toBeNull();
  });

  it('round-trips validated values and stamps updatedAt from the clock', async () => {
    expect((await repo.set('dailyGoalMinutes', 45)).ok).toBe(true);
    expect(await repo.get('dailyGoalMinutes')).toBe(45);
    expect((await db.settings.get('dailyGoalMinutes'))?.updatedAt).toBe(1_000);

    await repo.set('lastBackupAt', 1_700_000_000_000);
    expect(await repo.get('lastBackupAt')).toBe(1_700_000_000_000);
    await repo.set('lastBackupAt', null);
    expect(await repo.get('lastBackupAt')).toBeNull();
  });

  it('rejects invalid values as a VALIDATION error without storing anything', async () => {
    const result = await repo.set('dailyGoalMinutes', 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('VALIDATION');

    const tooBig = await repo.set('dailyGoalMinutes', 10_000);
    expect(tooBig.ok).toBe(false);
    const fraction = await repo.set('dailyGoalMinutes', 12.5);
    expect(fraction.ok).toBe(false);
    expect(await db.settings.get('dailyGoalMinutes')).toBeUndefined();
  });

  it('falls back to the default when the stored value is corrupt or outdated', async () => {
    await db.settings.put({ key: 'streakRule', value: 'removed_rule', updatedAt: 1 });
    await db.settings.put({ key: 'dailyGoalMinutes', value: 'abc', updatedAt: 1 });
    expect(await repo.get('streakRule')).toBe('any_session');
    expect(await repo.get('dailyGoalMinutes')).toBe(20);
  });

  it('reports storage failures as a Result instead of throwing', async () => {
    db.close();
    const result = await repo.set('onboardingDone', true);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['IO', 'UNKNOWN']).toContain(result.error.code);
  });
});
