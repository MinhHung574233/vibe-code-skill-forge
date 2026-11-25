import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { SUGGESTED_SKILLS, type SkillInput } from '../domain/skill';
import { DexieSkillRepository } from './dexieSkillRepository';

const NAME = 'skill-repo-test';
let db: SkillForgeDB;
let clock: FakeClock;
let repo: DexieSkillRepository;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(1_000_000);
  repo = new DexieSkillRepository(db, clock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const input = (over: Partial<SkillInput> = {}): SkillInput => ({
  name: 'Rubik',
  category: 'mind',
  priority: 2,
  weeklyGoalMinutes: null,
  ...over,
});

async function create(over: Partial<SkillInput> = {}) {
  const result = await repo.create(input(over));
  if (!result.ok) throw new Error(result.error.message);
  clock.advance(10);
  return result.value;
}

describe('create', () => {
  it('stores a trimmed, validated skill and returns it', async () => {
    const skill = await create({ name: '  Chess  ', description: ' openings ', priority: 1 });
    expect(skill).toMatchObject({
      name: 'Chess',
      description: 'openings',
      priority: 1,
      isArchived: false,
      weeklyGoalMinutes: null,
      createdAt: 1_000_000,
    });
    expect(await repo.get(skill.id)).toEqual(skill);
  });

  it.each([
    [{ name: '   ' }, /name/i],
    [{ name: 'x'.repeat(61) }, /60 characters/],
    [{ weeklyGoalMinutes: 5 }, /at least 10/],
    [{ weeklyGoalMinutes: 5000 }, /more than a week/],
    [{ weeklyGoalMinutes: 30.5 }, undefined],
    [{ description: 'y'.repeat(201) }, /200 characters/],
  ])('rejects invalid input %j without storing anything', async (bad, message) => {
    const result = await repo.create(input(bad));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
      if (message) expect(result.error.message).toMatch(message);
    }
    expect(await db.skills.count()).toBe(0);
  });
});

describe('weekly goal', () => {
  it('is stored as a minutes_per_week goal and can be changed and cleared', async () => {
    const skill = await create({ weeklyGoalMinutes: 120 });
    expect(skill.weeklyGoalMinutes).toBe(120);
    expect(await db.skillGoals.toArray()).toEqual([
      expect.objectContaining({ skillId: skill.id, metric: 'minutes_per_week', target: 120 }),
    ]);

    const changed = await repo.update(skill.id, input({ weeklyGoalMinutes: 200 }));
    expect(changed.ok && changed.value.weeklyGoalMinutes).toBe(200);
    expect(await db.skillGoals.count()).toBe(1); // updated in place, not duplicated

    const cleared = await repo.update(skill.id, input({ weeklyGoalMinutes: null }));
    expect(cleared.ok && cleared.value.weeklyGoalMinutes).toBeNull();
    expect(await db.skillGoals.count()).toBe(0);
  });
});

describe('list', () => {
  it('orders by priority then name, hides archived and deleted skills', async () => {
    const low = await create({ name: 'Zed', priority: 3 });
    await create({ name: 'Beta', priority: 1 });
    await create({ name: 'Alpha', priority: 1 });
    const archived = await create({ name: 'Old', priority: 1 });
    const gone = await create({ name: 'Gone', priority: 1 });
    await repo.setArchived(archived.id, true);
    await repo.remove(gone.id);

    expect((await repo.list()).map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Zed']);
    expect((await repo.list({ includeArchived: true })).map((s) => s.name)).toEqual([
      'Alpha',
      'Beta',
      'Old',
      'Zed',
    ]);
    expect((await repo.get(low.id))?.name).toBe('Zed');
    expect(await repo.get(gone.id)).toBeUndefined();
  });
});

describe('update, archive and remove', () => {
  it('update keeps creation time, archive state and module link, and bumps updatedAt', async () => {
    const skill = await create({ moduleId: 'rubik' });
    await repo.setArchived(skill.id, true);
    clock.advance(500);
    const result = await repo.update(skill.id, input({ name: 'Cube', priority: 1 }));
    expect(result.ok).toBe(true);
    const row = await db.skills.get(skill.id);
    expect(row).toMatchObject({
      name: 'Cube',
      priority: 1,
      isArchived: 1,
      moduleId: 'rubik',
      createdAt: skill.createdAt,
    });
    expect(row?.updatedAt).toBeGreaterThan(skill.updatedAt);
  });

  it('editing or archiving a missing or deleted skill is a validation error', async () => {
    const skill = await create();
    await repo.remove(skill.id);
    expect((await repo.update(skill.id, input())).ok).toBe(false);
    expect((await repo.update('nope', input())).ok).toBe(false);
    expect((await repo.setArchived('nope', true)).ok).toBe(false);
    expect((await repo.remove('nope')).ok).toBe(false);
  });

  it('remove is a soft delete: the row and the skill’s sessions are kept', async () => {
    const skill = await create();
    await db.sessions.add({
      id: 's1',
      moduleId: 'general',
      activityType: 'practice_session',
      skillId: skill.id,
      startedAt: 1,
      endedAt: 2,
      durationSec: 60,
      localDate: '2026-11-25',
      source: 'timer',
      createdAt: 1,
    });
    await repo.remove(skill.id);
    expect((await db.skills.get(skill.id))?.deletedAt).toBeDefined();
    expect(await db.sessions.count()).toBe(1);
  });
});

describe('addSuggested', () => {
  it('adds the seven module skills once, and is idempotent', async () => {
    const first = await repo.addSuggested();
    expect(first.ok && first.value).toHaveLength(SUGGESTED_SKILLS.length);
    const again = await repo.addSuggested();
    expect(again.ok && again.value).toHaveLength(0);
    expect((await repo.list()).map((s) => s.moduleId).sort()).toEqual(
      ['caro', 'chess', 'english', 'go', 'java', 'rubik', 'tools'].sort(),
    );
  });

  it('only adds the ones that are missing (including archived ones)', async () => {
    const mine = await create({ name: 'My cube', moduleId: 'rubik' });
    await repo.setArchived(mine.id, true);
    const result = await repo.addSuggested();
    expect(result.ok && result.value.map((s) => s.moduleId)).not.toContain('rubik');
    expect(result.ok && result.value).toHaveLength(SUGGESTED_SKILLS.length - 1);
  });
});
