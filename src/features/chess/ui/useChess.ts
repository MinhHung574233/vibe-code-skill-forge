import { useLiveQuery } from 'dexie-react-hooks';
import { getDb } from '@/db/boot';
import { useNow } from '@/hooks/useNow';
import { loadChessSummary, type ChessSummary } from '../data/chessRepository';

/** Route prefix where the lead mounts the module. Links are absolute so they work from any depth. */
export const CHESS_BASE = '/practice/chess';

export const LEVEL_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

/** Ratings, solved count, streak, record and any game in progress, live. `undefined` while loading. */
export function useChessSummary(): ChessSummary | undefined {
  const now = useNow();
  return useLiveQuery(() => loadChessSummary(getDb(), now), [now]);
}
