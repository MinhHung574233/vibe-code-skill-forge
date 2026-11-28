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
import { buildQuiz, shuffle } from './quiz';
import { TOPIC_LABELS, WORDS, wordById, type WordTopic } from './vocabulary';

function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const NOW = 1_800_000_000_000;

describe('vocabulary content', () => {
  it('has at least 300 words with unique ids and complete fields', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(300);
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    expect(new Set(WORDS.map((w) => w.term.toLowerCase())).size).toBe(WORDS.length);
    // Every topic is well stocked, so quiz distractors can always come from the same topic.
    for (const topic of Object.keys(TOPIC_LABELS) as WordTopic[]) {
      expect(WORDS.filter((w) => w.topic === topic).length, topic).toBeGreaterThanOrEqual(40);
    }
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

describe('quiz', () => {
  it('builds the requested number of questions with four distinct options, one right', () => {
    const quiz = buildQuiz(WORDS, 10, seeded(1));
    expect(quiz).toHaveLength(10);
    expect(new Set(quiz.map((q) => q.wordId)).size).toBe(10);
    for (const q of quiz) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      const word = wordById(q.wordId);
      expect(q.options[q.correct]).toBe(word?.term);
      expect(q.prompt).toBe(word?.definition);
    }
  });

  it('prefers distractors from the same topic', () => {
    const quiz = buildQuiz(WORDS, 20, seeded(2));
    for (const q of quiz) {
      const topic = wordById(q.wordId)?.topic;
      const sameTopicOptions = q.options.filter(
        (term) => WORDS.find((w) => w.term === term)?.topic === topic,
      );
      expect(sameTopicOptions.length).toBe(4); // every topic has far more than 4 words
    }
  });

  it('is reproducible with a seed, different with another, and handles tiny inputs', () => {
    expect(buildQuiz(WORDS, 5, seeded(3))).toEqual(buildQuiz(WORDS, 5, seeded(3)));
    expect(buildQuiz(WORDS, 5, seeded(3))).not.toEqual(buildQuiz(WORDS, 5, seeded(4)));
    expect(buildQuiz(WORDS, 0)).toEqual([]);
    expect(buildQuiz(WORDS.slice(0, 2), 5, seeded(5))).toHaveLength(2);
  });

  it('shuffle keeps every item', () => {
    expect([...shuffle([1, 2, 3, 4, 5], seeded(9))].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
