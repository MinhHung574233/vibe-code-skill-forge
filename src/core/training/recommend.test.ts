import { describe, expect, it } from 'vitest';
import { recommend, type RecommendationSkill } from './recommend';
import { EMPTY_STREAK, type StreakState } from './streak';

const skill = (over: Partial<RecommendationSkill> & { id: string }): RecommendationSkill => ({
  name: over.id.toUpperCase(),
  priority: 2,
  lastSessionAt: null,
  minutesThisWeek: 0,
  weeklyGoalMinutes: null,
  ...over,
});

const streak = (over: Partial<StreakState>): StreakState => ({ ...EMPTY_STREAK, ...over });
const base = { todayMinutes: 0, dailyGoalMinutes: 20, streak: EMPTY_STREAK };

describe('recommend', () => {
  it('asks for a first skill when there are none, and nothing else', () => {
    expect(recommend({ ...base, skills: [] })).toEqual([
      expect.objectContaining({ kind: 'create_skill' }),
    ]);
  });

  it('suggests reaching today’s goal with the top-priority, least-recently trained skill', () => {
    const recs = recommend({
      ...base,
      skills: [
        skill({ id: 'low', priority: 3 }),
        skill({ id: 'old', priority: 1, lastSessionAt: 100 }),
        skill({ id: 'recent', priority: 1, lastSessionAt: 900 }),
      ],
    });
    expect(recs[0]).toMatchObject({
      kind: 'reach_goal',
      skillId: 'old',
      title: '20 min to today’s goal',
    });
  });

  it('never-trained beats trained at equal priority', () => {
    const recs = recommend({
      ...base,
      skills: [skill({ id: 'trained', lastSessionAt: 5 }), skill({ id: 'fresh' })],
    });
    expect(recs[0]?.skillId).toBe('fresh');
  });

  it('puts protecting an at-risk streak first', () => {
    const recs = recommend({
      ...base,
      streak: streak({ current: 6, atRisk: true }),
      skills: [skill({ id: 'a' })],
    });
    expect(recs.map((r) => r.kind)).toEqual(['protect_streak', 'reach_goal']);
    expect(recs[0]?.title).toBe('Keep your 6-day streak');
  });

  it('stops asking for minutes once the daily goal is met', () => {
    const recs = recommend({ ...base, todayMinutes: 25, skills: [skill({ id: 'a' })] });
    expect(recs.find((r) => r.kind === 'reach_goal')).toBeUndefined();
  });

  it('flags the skill furthest behind its weekly goal', () => {
    const recs = recommend({
      ...base,
      todayMinutes: 30,
      skills: [
        skill({ id: 'ok', weeklyGoalMinutes: 60, minutesThisWeek: 60 }),
        skill({ id: 'behind', weeklyGoalMinutes: 120, minutesThisWeek: 20 }),
        skill({ id: 'slightly', weeklyGoalMinutes: 60, minutesThisWeek: 50 }),
      ],
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ kind: 'skill_behind', skillId: 'behind' });
    expect(recs[0]?.title).toBe('BEHIND: 100 min left this week');
  });

  it('does not repeat a skill already suggested, and returns at most 3', () => {
    const recs = recommend({
      ...base,
      streak: streak({ current: 2, atRisk: true }),
      skills: [skill({ id: 'only', weeklyGoalMinutes: 100, minutesThisWeek: 0 })],
    });
    expect(recs.map((r) => r.kind)).toEqual(['protect_streak', 'reach_goal']);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic for identical input', () => {
    const input = { ...base, skills: [skill({ id: 'b' }), skill({ id: 'a' })] };
    expect(recommend(input)).toEqual(recommend(input));
  });

  it('every suggestion explains itself', () => {
    const recs = recommend({
      ...base,
      streak: streak({ current: 1, atRisk: true }),
      skills: [skill({ id: 'a', weeklyGoalMinutes: 90, minutesThisWeek: 10 })],
    });
    for (const r of recs) expect(r.reason.length).toBeGreaterThan(5);
  });
});
