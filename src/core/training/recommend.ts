import type { StreakState } from './streak';

/**
 * Rule-based "what should I practise next" (PRD module 1, ARCHITECTURE §7). Deterministic and
 * explainable: every suggestion carries the reason it was made. This is the seam where a future
 * AI coach could replace or add to the rules; nothing here pretends to be AI.
 */
export interface RecommendationSkill {
  id: string;
  name: string;
  /** 1 = highest priority. */
  priority: 1 | 2 | 3;
  lastSessionAt: number | null;
  minutesThisWeek: number;
  weeklyGoalMinutes: number | null;
}

export interface RecommendationInput {
  skills: readonly RecommendationSkill[];
  todayMinutes: number;
  dailyGoalMinutes: number;
  streak: StreakState;
}

export type RecommendationKind = 'create_skill' | 'protect_streak' | 'reach_goal' | 'skill_behind';

export interface Recommendation {
  kind: RecommendationKind;
  title: string;
  reason: string;
  /** Skill to start a session for, when the suggestion is about one. */
  skillId?: string;
}

export const MAX_RECOMMENDATIONS = 3;

/** Highest priority first; among equals the one trained longest ago (never trained = oldest). */
function pickSkill(skills: readonly RecommendationSkill[]): RecommendationSkill | undefined {
  return [...skills].sort(
    (a, b) =>
      a.priority - b.priority ||
      (a.lastSessionAt ?? -Infinity) - (b.lastSessionAt ?? -Infinity) ||
      (a.name < b.name ? -1 : 1),
  )[0];
}

export function recommend(input: RecommendationInput): Recommendation[] {
  const { skills, todayMinutes, dailyGoalMinutes, streak } = input;
  const out: Recommendation[] = [];

  if (skills.length === 0) {
    return [
      {
        kind: 'create_skill',
        title: 'Add your first skill',
        reason: 'Skills let you see progress for what you practise.',
      },
    ];
  }

  const next = pickSkill(skills);

  if (streak.atRisk && next) {
    out.push({
      kind: 'protect_streak',
      title: `Keep your ${streak.current}-day streak`,
      reason: 'You have not trained today. A session keeps the streak alive.',
      skillId: next.id,
    });
  }

  const remaining = Math.ceil(dailyGoalMinutes - todayMinutes);
  if (remaining > 0 && next) {
    out.push({
      kind: 'reach_goal',
      title: `${remaining} min to today’s goal`,
      reason:
        next.lastSessionAt === null
          ? `${next.name} has not been trained yet.`
          : `${next.name} is your top-priority skill, trained least recently.`,
      skillId: next.id,
    });
  }

  const behind = skills
    .filter((s) => s.weeklyGoalMinutes !== null && s.minutesThisWeek < s.weeklyGoalMinutes)
    .sort(
      (a, b) =>
        (b.weeklyGoalMinutes ?? 0) -
          b.minutesThisWeek -
          ((a.weeklyGoalMinutes ?? 0) - a.minutesThisWeek) || a.priority - b.priority,
    )[0];
  if (behind && behind.weeklyGoalMinutes !== null && !out.some((r) => r.skillId === behind.id)) {
    const left = Math.ceil(behind.weeklyGoalMinutes - behind.minutesThisWeek);
    out.push({
      kind: 'skill_behind',
      title: `${behind.name}: ${left} min left this week`,
      reason: `Weekly goal ${behind.weeklyGoalMinutes} min, ${Math.floor(behind.minutesThisWeek)} done.`,
      skillId: behind.id,
    });
  }

  return out.slice(0, MAX_RECOMMENDATIONS);
}
