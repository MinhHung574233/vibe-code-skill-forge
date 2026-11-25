import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  EMPTY_FACTS,
  isUnlocked,
  newlyUnlocked,
  type UserFacts,
} from './achievements';

const facts = (overrides: Partial<UserFacts>): UserFacts => ({ ...EMPTY_FACTS, ...overrides });
const ids = (list: { id: string }[]) => list.map((d) => d.id);

describe('achievements', () => {
  it('has unique ids and includes the six from the PRD', () => {
    const all = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(all).size).toBe(all.length);
    for (const id of [
      'first_session',
      'streak_7',
      'streak_30',
      'vocab_100',
      'java_path',
      'rubik_pb',
    ]) {
      expect(all).toContain(id);
    }
  });

  it('unlocks nothing for a brand new user', () => {
    expect(newlyUnlocked(EMPTY_FACTS, new Set())).toEqual([]);
  });

  it('first session unlocks on the first recorded session', () => {
    expect(ids(newlyUnlocked(facts({ totalSessions: 1 }), new Set()))).toEqual(['first_session']);
  });

  it('streak achievements are based on the longest streak, thresholds 7 and 30', () => {
    expect(
      ids(newlyUnlocked(facts({ totalSessions: 5, longestStreak: 6 }), new Set(['first_session']))),
    ).toEqual([]);
    expect(
      ids(newlyUnlocked(facts({ totalSessions: 7, longestStreak: 7 }), new Set(['first_session']))),
    ).toEqual(['streak_7']);
    expect(
      ids(
        newlyUnlocked(
          facts({ totalSessions: 30, longestStreak: 30 }),
          new Set(['first_session', 'streak_7']),
        ),
      ),
    ).toEqual(['ten_sessions', 'streak_30']);
  });

  it('never re-reports something already unlocked', () => {
    const f = facts({ totalSessions: 12, totalMinutes: 90 });
    const first = ids(newlyUnlocked(f, new Set()));
    expect(first).toEqual(['first_session', 'ten_sessions', 'hour_total']);
    expect(newlyUnlocked(f, new Set(first))).toEqual([]);
  });

  it('module-bound achievements need their module data (all zero today)', () => {
    const f = facts({ totalSessions: 50, totalMinutes: 5000, longestStreak: 40 });
    const locked = ACHIEVEMENTS.filter((a) => !isUnlocked(a, f)).map((a) => a.id);
    expect(locked).toEqual(['vocab_100', 'java_path', 'rubik_pb']);
    for (const def of ACHIEVEMENTS.filter((a) => a.needsModule))
      expect(def.needsModule).toBeTruthy();
  });

  it('unlocks the module ones from real module facts', () => {
    const f = facts({ vocabLearned: 100, javaPathsCompleted: 1, rubikPersonalBests: 1 });
    expect(ids(newlyUnlocked(f, new Set()))).toEqual(['vocab_100', 'java_path', 'rubik_pb']);
  });

  it('progress is capped at the target and starts at zero', () => {
    const def = ACHIEVEMENTS.find((a) => a.id === 'ten_sessions');
    expect(def?.progress(EMPTY_FACTS)).toEqual({ current: 0, target: 10 });
    expect(def?.progress(facts({ totalSessions: 99 }))).toEqual({ current: 10, target: 10 });
  });
});
