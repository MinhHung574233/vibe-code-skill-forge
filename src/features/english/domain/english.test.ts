import { describe, expect, it } from 'vitest';
import {
  buildQueue,
  DAY_MS,
  describeInterval,
  isWordLearned,
  MIN_EASE,
  NEW_CARD,
  type StudyRow,
  RELEARN_DELAY_MS,
  review,
  vocabStats,
} from './srs';
import { WORDS, wordById } from './vocabulary';

const NOW = 1_800_000_000_000;

describe('vocabulary content', () => {
  it('has at least 100 words with unique ids and complete fields', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    for (const w of WORDS) {
      expect(w.definition.length, w.id).toBeGreaterThan(10);
      expect(w.example.length, w.id).toBeGreaterThan(10);
      expect(w.vi.length, w.id).toBeGreaterThan(1);
    }
  });

  it('every example uses its word (or its stem)', () => {
    for (const w of WORDS) {
      const stem = w.term.toLowerCase().slice(0, Math.max(4, w.term.length - 2));
      expect(w.example.toLowerCase(), `${w.id}: "${w.example}"`).toContain(stem);
    }
  });

  it('finds a word by id', () => {
    expect(wordById('pull-request')?.term).toBe('pull request');
    expect(wordById('nope')).toBeUndefined();
  });
});

describe('SM-2 review', () => {
  it('first successes are 1 day, then 6 days, then interval × ease', () => {
    const one = review(NEW_CARD, 'good', NOW);
    expect(one).toMatchObject({ state: 'review', repetitions: 1, intervalDays: 1 });
    expect(one.dueAt).toBe(NOW + DAY_MS);
    const two = review(one, 'good', NOW + DAY_MS);
    expect(two).toMatchObject({ repetitions: 2, intervalDays: 6 });
    const three = review(two, 'good', NOW + 7 * DAY_MS);
    expect(three.repetitions).toBe(3);
    expect(three.intervalDays).toBe(Math.round(6 * two.ease));
  });

  it('ease grows on easy, stays on good, shrinks on hard, never below the floor', () => {
    expect(review(NEW_CARD, 'easy', NOW).ease).toBeCloseTo(2.6);
    expect(review(NEW_CARD, 'good', NOW).ease).toBeCloseTo(2.5);
    expect(review(NEW_CARD, 'hard', NOW).ease).toBeCloseTo(2.36);
    let card = NEW_CARD;
    for (let i = 0; i < 30; i++) card = review(card, 'again', NOW);
    expect(card.ease).toBe(MIN_EASE);
  });

  it('forgetting restarts the chain, counts a lapse and brings the card back soon', () => {
    const learned = review(review(review(NEW_CARD, 'good', NOW), 'good', NOW), 'good', NOW);
    expect(learned.repetitions).toBe(3);
    const forgotten = review(learned, 'again', NOW);
    expect(forgotten).toMatchObject({
      state: 'learning',
      repetitions: 0,
      intervalDays: 0,
      lapses: 1,
      dueAt: NOW + RELEARN_DELAY_MS,
    });
    // Failing a brand-new card is not a lapse.
    expect(review(NEW_CARD, 'again', NOW).lapses).toBe(0);
    // After forgetting, the next success is a 1-day card again.
    expect(review(forgotten, 'good', NOW).intervalDays).toBe(1);
  });

  it('describes the next interval for the buttons', () => {
    expect(describeInterval(NEW_CARD, 'again', NOW)).toBe('10 min');
    expect(describeInterval(NEW_CARD, 'good', NOW)).toBe('1 day');
    const second = review(NEW_CARD, 'good', NOW);
    expect(describeInterval(second, 'good', NOW)).toBe('6 days');
  });

  it('a word is learned after three successful recalls in a row', () => {
    expect(isWordLearned({ state: 'review', repetitions: 2 })).toBe(false);
    expect(isWordLearned({ state: 'review', repetitions: 3 })).toBe(true);
    expect(isWordLearned({ state: 'learning', repetitions: 3 })).toBe(false);
  });
});

const row = (wordId: string, over: Partial<StudyRow> = {}): StudyRow => ({
  wordId,
  ...NEW_CARD,
  state: 'review',
  repetitions: 1,
  intervalDays: 1,
  dueAt: NOW - 1000,
  ...over,
});

describe('study queue', () => {
  const [a, b, c, d, e] = WORDS.slice(0, 5).map((w) => w.id) as [
    string,
    string,
    string,
    string,
    string,
  ];

  it('puts due reviews first (most overdue first), then new words up to the allowance', () => {
    const progress = new Map([
      [a, row(a, { dueAt: NOW - 1000 })],
      [b, row(b, { dueAt: NOW - 5000 })],
      [c, row(c, { dueAt: NOW + DAY_MS })], // not due
    ]);
    const queue = buildQueue(WORDS, progress, { now: NOW, newPerDay: 2, newToday: 0 });
    expect(queue.map((q) => q.word.id).slice(0, 4)).toEqual([b, a, d, e]);
    expect(queue).toHaveLength(4);
    expect(queue[2]?.progress).toBeNull();
  });

  it('respects how many new words were already introduced today', () => {
    const queue = buildQueue(WORDS, new Map(), { now: NOW, newPerDay: 10, newToday: 8 });
    expect(queue).toHaveLength(2);
    expect(buildQueue(WORDS, new Map(), { now: NOW, newPerDay: 10, newToday: 12 })).toEqual([]);
  });

  it('is empty when nothing is due and the allowance is used', () => {
    const progress = new Map([[a, row(a, { dueAt: NOW + DAY_MS })]]);
    expect(buildQueue([WORDS[0]!], progress, { now: NOW, newPerDay: 5, newToday: 5 })).toEqual([]);
  });

  it('summarises progress', () => {
    const progress = new Map([
      [a, row(a, { repetitions: 3 })],
      [b, row(b, { dueAt: NOW + DAY_MS })],
    ]);
    expect(vocabStats(WORDS, progress, NOW)).toEqual({
      total: WORDS.length,
      seen: 2,
      learned: 1,
      dueNow: 1,
      unseen: WORDS.length - 2,
    });
  });
});
