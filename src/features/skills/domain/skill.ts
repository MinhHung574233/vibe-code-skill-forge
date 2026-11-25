import { z } from 'zod';
import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';

export const SKILL_CATEGORIES = ['mind', 'language', 'technical', 'games', 'custom'] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export const CATEGORY_LABELS: Readonly<Record<SkillCategory, string>> = {
  mind: 'Mind',
  language: 'Language',
  technical: 'Technical',
  games: 'Games',
  custom: 'Custom',
};

export const PRIORITY_LABELS = { 1: 'High', 2: 'Medium', 3: 'Low' } as const;
export type SkillPriority = 1 | 2 | 3;

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  /** Set for skills created from a module (links training sessions to the module later). */
  moduleId?: string;
  priority: SkillPriority;
  description?: string;
  isArchived: boolean;
  /** Weekly training goal in minutes, or null for none. Stored as a `minutes_per_week` goal. */
  weeklyGoalMinutes: number | null;
  createdAt: number;
  updatedAt: number;
}

export const WEEKLY_GOAL_MIN = 10;
export const WEEKLY_GOAL_MAX = 3000;

/** Validates user input for creating or editing a skill. */
export const SkillInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the skill a name.')
    .max(60, 'Keep the name under 60 characters.'),
  category: z.enum(SKILL_CATEGORIES),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  description: z.string().trim().max(200, 'Keep the description under 200 characters.').optional(),
  weeklyGoalMinutes: z
    .number()
    .int()
    .min(WEEKLY_GOAL_MIN, `A weekly goal must be at least ${WEEKLY_GOAL_MIN} minutes.`)
    .max(WEEKLY_GOAL_MAX, 'That weekly goal is more than a week has room for.')
    .nullable(),
  moduleId: z.string().optional(),
});
export type SkillInput = z.input<typeof SkillInputSchema>;

/** The starting set offered on an empty Skills screen (never added automatically). */
export const SUGGESTED_SKILLS: readonly SkillInput[] = [
  {
    name: 'Rubik’s Cube',
    category: 'mind',
    priority: 2,
    weeklyGoalMinutes: null,
    moduleId: 'rubik',
  },
  {
    name: 'English',
    category: 'language',
    priority: 1,
    weeklyGoalMinutes: null,
    moduleId: 'english',
  },
  {
    name: 'Java & Spring Boot',
    category: 'technical',
    priority: 1,
    weeklyGoalMinutes: null,
    moduleId: 'java',
  },
  {
    name: 'Developer Tools',
    category: 'technical',
    priority: 2,
    weeklyGoalMinutes: null,
    moduleId: 'tools',
  },
  { name: 'Caro', category: 'games', priority: 3, weeklyGoalMinutes: null, moduleId: 'caro' },
  { name: 'Chess', category: 'games', priority: 3, weeklyGoalMinutes: null, moduleId: 'chess' },
  { name: 'Go', category: 'games', priority: 3, weeklyGoalMinutes: null, moduleId: 'go' },
];

export interface SkillRepository {
  /** Live skills (soft-deleted ones are never returned), best priority first then by name. */
  list(options?: { includeArchived?: boolean }): Promise<Skill[]>;
  get(id: string): Promise<Skill | undefined>;
  create(input: SkillInput): Promise<Result<Skill, AppError>>;
  update(id: string, input: SkillInput): Promise<Result<Skill, AppError>>;
  setArchived(id: string, archived: boolean): Promise<Result<void, AppError>>;
  /** Soft delete: the skill disappears, its recorded sessions are kept. */
  remove(id: string): Promise<Result<void, AppError>>;
  /** Adds the suggested skills that are not present yet (matched by module). */
  addSuggested(): Promise<Result<Skill[], AppError>>;
}
