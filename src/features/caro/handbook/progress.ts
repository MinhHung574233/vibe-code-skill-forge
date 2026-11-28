import type { ChapterId } from './types';

/**
 * What the handbook remembers on this device: the chapter you read last and the exercises you
 * solved. It is a convenience, kept in localStorage (no database, no XP), and every read and
 * write is guarded because storage can be blocked or full.
 */
export interface HandbookProgress {
  readonly lastChapter: ChapterId | null;
  readonly solved: readonly string[];
}

export const HANDBOOK_STORAGE_KEY = 'sf-caro-handbook';

export const EMPTY_PROGRESS: HandbookProgress = { lastChapter: null, solved: [] };

export function loadProgress(): HandbookProgress {
  try {
    const raw = localStorage.getItem(HANDBOOK_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return EMPTY_PROGRESS;
    const record = data as { lastChapter?: unknown; solved?: unknown };
    return {
      lastChapter:
        typeof record.lastChapter === 'string' ? (record.lastChapter as ChapterId) : null,
      solved: Array.isArray(record.solved)
        ? record.solved.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: HandbookProgress): void {
  try {
    localStorage.setItem(HANDBOOK_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private mode or a full disk: the handbook still works, it just forgets.
  }
}
