import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import type { AlgorithmProgressRow, RubikSolveRow } from '@/db/rows';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import { RubikService } from '../data/rubikService';

export function useRubikService(): RubikService {
  const engine = useTrainingEngine();
  return useMemo(() => new RubikService(getDb(), systemClock, engine), [engine]);
}

/** Every solve, oldest first; `undefined` while loading. */
export function useSolves(): RubikSolveRow[] | undefined {
  return useLiveQuery(() => getDb().rubikSolves.orderBy('createdAt').toArray(), []);
}

/** Solves of the currently open session, oldest first. */
export function useOpenSessionSolves(): RubikSolveRow[] | undefined {
  const service = useRubikService();
  return useLiveQuery(() => service.openSessionSolves(), [service]);
}

export function useAlgorithmProgress(): Map<string, AlgorithmProgressRow['status']> | undefined {
  return useLiveQuery(async () => {
    const rows = await getDb().algorithmProgress.toArray();
    return new Map(rows.map((r) => [r.algId, r.status]));
  }, []);
}
