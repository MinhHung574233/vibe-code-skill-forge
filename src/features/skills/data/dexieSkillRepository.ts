import { AppError } from '@/core/errors';
import { newId } from '@/core/ids';
import { err, ok, type Result } from '@/core/result';
import type { Clock } from '@/core/time/clock';
import { toAppError } from '@/db/errors';
import type { SkillGoalRow, SkillRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import {
  SUGGESTED_SKILLS,
  SkillInputSchema,
  type Skill,
  type SkillInput,
  type SkillRepository,
} from '../domain/skill';

/** The one goal kind a skill can have today. */
export const WEEKLY_GOAL_METRIC = 'minutes_per_week';

function toSkill(row: SkillRow, goal: SkillGoalRow | undefined): Skill {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ...(row.moduleId ? { moduleId: row.moduleId } : {}),
    priority: row.priority,
    ...(row.description ? { description: row.description } : {}),
    isArchived: row.isArchived === 1,
    weeklyGoalMinutes: goal ? goal.target : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const byPriorityThenName = (a: Skill, b: Skill) =>
  a.priority - b.priority || a.name.localeCompare(b.name);

export class DexieSkillRepository implements SkillRepository {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
  ) {}

  private async goalFor(skillId: string): Promise<SkillGoalRow | undefined> {
    return this.db.skillGoals
      .where('skillId')
      .equals(skillId)
      .and((g) => g.metric === WEEKLY_GOAL_METRIC)
      .first();
  }

  async list(options: { includeArchived?: boolean } = {}): Promise<Skill[]> {
    const { includeArchived = false } = options;
    const rows = await this.db.skills
      .filter((r) => r.deletedAt === undefined && (includeArchived || r.isArchived === 0))
      .toArray();
    const goals = await this.db.skillGoals.where('metric').equals(WEEKLY_GOAL_METRIC).toArray();
    const goalBySkill = new Map(goals.map((g) => [g.skillId, g]));
    return rows.map((r) => toSkill(r, goalBySkill.get(r.id))).sort(byPriorityThenName);
  }

  async get(id: string): Promise<Skill | undefined> {
    const row = await this.db.skills.get(id);
    if (!row || row.deletedAt !== undefined) return undefined;
    return toSkill(row, await this.goalFor(id));
  }

  async create(input: SkillInput): Promise<Result<Skill, AppError>> {
    const parsed = SkillInputSchema.safeParse(input);
    if (!parsed.success) return err(validation(parsed.error.issues[0]?.message));
    const data = parsed.data;
    const now = this.clock.now();
    const id = newId(now);
    try {
      await this.db.transaction('rw', [this.db.skills, this.db.skillGoals], async () => {
        await this.db.skills.add(rowFrom(id, data, now, now));
        await this.writeGoal(id, data.weeklyGoalMinutes, now);
      });
      const created = await this.get(id);
      return created ? ok(created) : err(new AppError('IO', 'The skill could not be saved.'));
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  async update(id: string, input: SkillInput): Promise<Result<Skill, AppError>> {
    const parsed = SkillInputSchema.safeParse(input);
    if (!parsed.success) return err(validation(parsed.error.issues[0]?.message));
    const data = parsed.data;
    const now = this.clock.now();
    try {
      await this.db.transaction('rw', [this.db.skills, this.db.skillGoals], async () => {
        const existing = await this.db.skills.get(id);
        if (!existing || existing.deletedAt !== undefined) {
          throw new AppError('VALIDATION', 'That skill no longer exists.');
        }
        await this.db.skills.put({
          ...rowFrom(id, data, existing.createdAt, now),
          isArchived: existing.isArchived,
          ...(existing.moduleId && !data.moduleId ? { moduleId: existing.moduleId } : {}),
        });
        await this.writeGoal(id, data.weeklyGoalMinutes, now);
      });
      const updated = await this.get(id);
      return updated ? ok(updated) : err(new AppError('IO', 'The skill could not be saved.'));
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  async setArchived(id: string, archived: boolean): Promise<Result<void, AppError>> {
    try {
      const changed = await this.db.skills.update(id, {
        isArchived: archived ? 1 : 0,
        updatedAt: this.clock.now(),
      });
      return changed === 0
        ? err(new AppError('VALIDATION', 'That skill no longer exists.'))
        : ok(undefined);
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  async remove(id: string): Promise<Result<void, AppError>> {
    const now = this.clock.now();
    try {
      const changed = await this.db.skills.update(id, { deletedAt: now, updatedAt: now });
      return changed === 0
        ? err(new AppError('VALIDATION', 'That skill no longer exists.'))
        : ok(undefined);
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  async addSuggested(): Promise<Result<Skill[], AppError>> {
    try {
      const existing = await this.list({ includeArchived: true });
      const have = new Set(existing.map((s) => s.moduleId).filter(Boolean));
      const created: Skill[] = [];
      for (const suggestion of SUGGESTED_SKILLS) {
        if (suggestion.moduleId && have.has(suggestion.moduleId)) continue;
        const result = await this.create(suggestion);
        if (!result.ok) return result;
        created.push(result.value);
      }
      return ok(created);
    } catch (cause) {
      return err(toAppError(cause));
    }
  }

  /** Sets, changes or clears the single weekly goal (inside the caller's transaction). */
  private async writeGoal(skillId: string, minutes: number | null, now: number): Promise<void> {
    const existing = await this.goalFor(skillId);
    if (minutes === null) {
      if (existing) await this.db.skillGoals.delete(existing.id);
      return;
    }
    if (existing) {
      await this.db.skillGoals.update(existing.id, { target: minutes, updatedAt: now });
    } else {
      await this.db.skillGoals.add({
        id: newId(now),
        skillId,
        metric: WEEKLY_GOAL_METRIC,
        target: minutes,
        direction: 'at_least',
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

const validation = (message: string | undefined) =>
  new AppError('VALIDATION', message ?? 'That is not a valid skill.');

function rowFrom(
  id: string,
  data: ReturnType<typeof SkillInputSchema.parse>,
  createdAt: number,
  updatedAt: number,
): SkillRow {
  return {
    id,
    name: data.name,
    category: data.category,
    ...(data.moduleId ? { moduleId: data.moduleId } : {}),
    priority: data.priority,
    ...(data.description ? { description: data.description } : {}),
    isArchived: 0,
    createdAt,
    updatedAt,
  };
}
