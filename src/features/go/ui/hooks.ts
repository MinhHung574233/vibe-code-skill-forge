import { useLiveQuery } from 'dexie-react-hooks';
import { createContext, useContext, useMemo } from 'react';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import type { PuzzleProgressRow } from '@/db/rows';
import { loadDraft, type GoDraft } from '../data/goDraft';
import { DexieGoRepository } from '../data/goRepository';
import type { GoRecord } from '../domain/stats';
import type { AiEngine } from './aiEngine';

/** Services bound to the open database. Only usable below the BootGate. */
export function useGoRepository(): DexieGoRepository {
  return useMemo(() => new DexieGoRepository(getDb(), systemClock), []);
}

/** All recorded matches, newest first (`undefined` while loading). */
export function useGoGames(): GoRecord[] | undefined {
  const repository = useGoRepository();
  return useLiveQuery(() => repository.games(), [repository]);
}

/** Solved / attempted state per problem id (`undefined` while loading). */
export function usePuzzleProgress(): Map<string, PuzzleProgressRow> | undefined {
  const repository = useGoRepository();
  return useLiveQuery(() => repository.puzzleProgress(), [repository]);
}

/** The match in progress: `null` when none, `undefined` while loading. */
export function useGoDraft(): GoDraft | null | undefined {
  return useLiveQuery(() => loadDraft(getDb()).then((d) => d ?? null), []);
}

/** Where the module is mounted (`/practice/go`) and how to make an AI engine; set by `GoModule`. */
export interface GoContext {
  base: string;
  practice: string;
  createEngine: () => AiEngine;
}

export const GoRouteContext = createContext<GoContext | null>(null);

export function useGoContext(): GoContext {
  const ctx = useContext(GoRouteContext);
  if (!ctx) throw new Error('Go screens must be rendered inside GoModule.');
  return ctx;
}
