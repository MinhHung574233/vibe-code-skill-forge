import type { Word } from './vocabulary';

export interface QuizQuestion {
  wordId: string;
  /** The definition to recognise. */
  prompt: string;
  /** Four terms, one of them right. */
  options: readonly string[];
  correct: number;
}

/** Fisher–Yates shuffle with an injectable random source (tests pass a seeded one). */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * A recognition quiz: read a definition, pick the term. Wrong options come from the same topic
 * first (so they are plausible), then from anywhere. It is practice only and never touches the
 * spaced-repetition schedule or XP, so it cannot be used to farm either.
 */
export function buildQuiz(
  words: readonly Word[],
  count: number,
  random: () => number = Math.random,
): QuizQuestion[] {
  const chosen = shuffle(words, random).slice(0, Math.max(0, count));
  return chosen.map((word) => {
    const sameTopic = shuffle(
      words.filter((w) => w.id !== word.id && w.topic === word.topic),
      random,
    );
    const others = shuffle(
      words.filter((w) => w.id !== word.id && w.topic !== word.topic),
      random,
    );
    const wrong = [...sameTopic, ...others].slice(0, 3).map((w) => w.term);
    const options = shuffle([word.term, ...wrong], random);
    return {
      wordId: word.id,
      prompt: word.definition,
      options,
      correct: options.indexOf(word.term),
    };
  });
}
