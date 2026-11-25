import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import type { VocabProgressRow } from '@/db/rows';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import { VocabService } from '../data/vocabService';

/** New words introduced per day. Small on purpose: reviews pile up faster than you expect. */
export const NEW_WORDS_PER_DAY = 10;

export function useVocabService(): VocabService {
  const engine = useTrainingEngine();
  return useMemo(() => new VocabService(getDb(), systemClock, engine), [engine]);
}

/** Learning state of every studied word (live); `undefined` while loading. */
export function useVocabProgress(): Map<string, VocabProgressRow> | undefined {
  const service = useVocabService();
  return useLiveQuery(() => service.progress(), [service]);
}

/** How many new words were introduced today (live). */
export function useNewWordsToday(today: string): number | undefined {
  const service = useVocabService();
  return useLiveQuery(() => service.newWordsOn(today), [service, today]);
}
