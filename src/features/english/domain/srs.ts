import { t } from '@/i18n/core';
import type { Word } from './vocabulary';

/**
 * Spaced repetition with the SM-2 algorithm (Piotr Woźniak, 1987), the basis of most flashcard
 * apps. A card you recall easily comes back after longer and longer gaps; a card you forget
 * restarts. Pure and deterministic: callers pass `now`.
 */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

export const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

/** Quality scores 0–5 from SM-2; the four buttons map onto the useful range. */
const QUALITY: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };

export const DAY_MS = 24 * 60 * 60 * 1000;
/** A forgotten card comes back in the same session, after this long. */
export const RELEARN_DELAY_MS = 10 * 60 * 1000;
export const MIN_EASE = 1.3;
export const START_EASE = 2.5;

export interface CardState {
  state: 'learning' | 'review';
  /** SM-2 ease factor, never below 1.3. */
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  /** Epoch ms when the card is next due. */
  dueAt: number;
}

/** A studied word: its id plus its card state (the stored row has more fields). */
export interface StudyRow extends CardState {
  wordId: string;
}

export const NEW_CARD: CardState = {
  state: 'learning',
  ease: START_EASE,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
  dueAt: 0,
};

/** The next state of a card after it is graded. */
export function review(card: CardState, grade: Grade, now: number): CardState {
  const q = QUALITY[grade];
  // Ease moves with how hard recall was; never below 1.3 so cards cannot collapse to daily forever.
  const ease = Math.max(MIN_EASE, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    return {
      state: 'learning',
      ease,
      intervalDays: 0,
      repetitions: 0,
      lapses: card.lapses + (card.repetitions > 0 || card.state === 'review' ? 1 : 0),
      dueAt: now + RELEARN_DELAY_MS,
    };
  }

  const repetitions = card.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(card.intervalDays * ease);
  return {
    state: 'review',
    ease,
    intervalDays,
    repetitions,
    lapses: card.lapses,
    dueAt: now + intervalDays * DAY_MS,
  };
}

/** Short label for a button, e.g. "10 min", "1 day", "2 wk". */
export function describeInterval(card: CardState, grade: Grade, now: number): string {
  const next = review(card, grade, now);
  if (next.intervalDays === 0) return t('{n} min', { n: Math.round(RELEARN_DELAY_MS / 60_000) });
  if (next.intervalDays < 14)
    return next.intervalDays === 1 ? t('1 day') : t('{n} days', { n: next.intervalDays });
  if (next.intervalDays < 60) return t('{n} wk', { n: Math.round(next.intervalDays / 7) });
  return t('{n} mo', { n: Math.round(next.intervalDays / 30) });
}

/**
 * A word counts as learned once you have recalled it three times in a row across review
 * sessions (gaps of about 1, 6 and 15 days), not just seen it.
 */
export function isWordLearned(card: Pick<CardState, 'state' | 'repetitions'>): boolean {
  return card.state === 'review' && card.repetitions >= 3;
}

export interface QueueItem {
  word: Word;
  /** `null` for a word shown for the first time. */
  progress: StudyRow | null;
}

export interface QueueOptions {
  now: number;
  /** New words allowed per day. */
  newPerDay: number;
  /** New words already introduced today. */
  newToday: number;
  maxReviews?: number;
}

/**
 * What to study now: due reviews first (most overdue first), then new words in the bundled
 * order, up to today's allowance. Words in `learning` that are not due yet wait.
 */
export function buildQueue(
  words: readonly Word[],
  progress: ReadonlyMap<string, StudyRow>,
  { now, newPerDay, newToday, maxReviews = 50 }: QueueOptions,
): QueueItem[] {
  const due: QueueItem[] = [];
  for (const word of words) {
    const row = progress.get(word.id);
    if (row && row.dueAt <= now) due.push({ word, progress: row });
  }
  due.sort((a, b) => (a.progress?.dueAt ?? 0) - (b.progress?.dueAt ?? 0));

  const allowance = Math.max(0, newPerDay - newToday);
  const fresh: QueueItem[] = [];
  for (const word of words) {
    if (fresh.length >= allowance) break;
    if (!progress.has(word.id)) fresh.push({ word, progress: null });
  }
  return [...due.slice(0, maxReviews), ...fresh];
}

export interface VocabStats {
  total: number;
  seen: number;
  learned: number;
  dueNow: number;
  unseen: number;
}

export function vocabStats(
  words: readonly Word[],
  progress: ReadonlyMap<string, StudyRow>,
  now: number,
): VocabStats {
  let seen = 0;
  let learned = 0;
  let dueNow = 0;
  for (const word of words) {
    const row = progress.get(word.id);
    if (!row) continue;
    seen++;
    if (isWordLearned(row)) learned++;
    if (row.dueAt <= now) dueNow++;
  }
  return { total: words.length, seen, learned, dueNow, unseen: words.length - seen };
}
