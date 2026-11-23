import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/db/boot';
import { useSetting } from '@/features/settings/ui/useSettings';

export interface DashboardData {
  /** Daily goal in minutes (a real setting; default 20). `undefined` while loading. */
  dailyGoalMinutes: number | undefined;
  /**
   * Minutes trained today. Always 0 until training sessions exist (training engine, M2.2);
   * this is the single place to swap in the real figure, so the UI never shows an invented one.
   */
  todayMinutes: number;
  /** Number of (non-deleted) skills the user has. `undefined` while loading. */
  skillCount: number | undefined;
}

export function useDashboardData(): DashboardData {
  const dailyGoalMinutes = useSetting('dailyGoalMinutes');
  const skillCount = useLiveQuery(
    () =>
      getDb()
        .skills.filter((s) => s.deletedAt === undefined)
        .count(),
    [],
  );
  return { dailyGoalMinutes, todayMinutes: 0, skillCount };
}
