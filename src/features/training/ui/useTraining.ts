import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { useSetting } from '@/features/settings/ui/useSettings';
import { DexieSkillRepository } from '@/features/skills/data/dexieSkillRepository';
import type { Skill } from '@/features/skills/domain/skill';
import { useNow } from '@/hooks/useNow';
import { DexieTrainingEngine } from '../data/trainingEngine';
import {
  loadRecentSessions,
  loadSkillSessions,
  loadTrainingData,
  loadUnlockedAchievements,
} from '../data/trainingQueries';
import {
  buildOverview,
  type Overview,
  type SessionRecord,
  type TrainingData,
} from '../domain/overview';

/** Services bound to the open database. Only usable below the BootGate. */
export function useTrainingEngine(): DexieTrainingEngine {
  return useMemo(() => new DexieTrainingEngine(getDb(), systemClock), []);
}

export function useSkillRepository(): DexieSkillRepository {
  return useMemo(() => new DexieSkillRepository(getDb(), systemClock), []);
}

/** Live list of skills (re-renders on any change). `undefined` while loading. */
export function useSkills(includeArchived = false): Skill[] | undefined {
  const repository = useSkillRepository();
  return useLiveQuery(() => repository.list({ includeArchived }), [repository, includeArchived]);
}

export function useSkill(id: string | undefined): Skill | null | undefined {
  const repository = useSkillRepository();
  return useLiveQuery(
    async () => (id ? ((await repository.get(id)) ?? null) : null),
    [repository, id],
  );
}

/** Raw rollups + the analytics window of sessions + total XP, refreshed live. */
export function useTrainingData(): TrainingData | undefined {
  const now = useNow();
  return useLiveQuery(() => loadTrainingData(getDb(), now), [now]);
}

/** Everything Home needs, derived from live data and the two settings that shape it. */
export function useOverview(): { overview: Overview; data: TrainingData } | undefined {
  const data = useTrainingData();
  const streakRule = useSetting('streakRule');
  const dailyGoalMinutes = useSetting('dailyGoalMinutes');
  const now = useNow();
  return useMemo(() => {
    if (!data || streakRule === undefined || dailyGoalMinutes === undefined) return undefined;
    return { overview: buildOverview(data, { now, streakRule, dailyGoalMinutes }), data };
  }, [data, streakRule, dailyGoalMinutes, now]);
}

export function useRecentSessions(limit: number): SessionRecord[] | undefined {
  return useLiveQuery(() => loadRecentSessions(getDb(), limit), [limit]);
}

export function useSkillSessions(skillId: string | undefined): SessionRecord[] | undefined {
  return useLiveQuery(
    () => (skillId ? loadSkillSessions(getDb(), skillId) : Promise.resolve([])),
    [skillId],
  );
}

/** Unlocked achievements: id -> unlock time. */
export function useUnlockedAchievements(): Map<string, number> | undefined {
  return useLiveQuery(() => loadUnlockedAchievements(getDb()), []);
}
