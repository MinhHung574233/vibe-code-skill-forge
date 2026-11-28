import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { engine, renderAt, setupAppDatabase } from '@/test/appHarness';
import { NEW_CARD } from '../domain/srs';
import { WORDS } from '../domain/vocabulary';

setupAppDatabase('english-ui-test');

describe('English home', () => {
  it('offers ten new words on a fresh install', async () => {
    renderAt('/practice/english');
    expect(await screen.findByText('0 to review, 10 new words.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start review' })).toHaveAttribute(
      'href',
      '/practice/english/review',
    );
    expect(screen.getByText(`0/${WORDS.length}`)).toBeInTheDocument();
  });
});

describe('Review session', () => {
  it('shows a word, reveals the answer, saves your grade and records the session for XP', async () => {
    renderAt('/practice/english/review');
    const first = WORDS[0]!;
    expect(await screen.findByRole('heading', { name: first.term })).toBeInTheDocument();
    expect(screen.queryByText(first.definition)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText(first.definition)).toBeInTheDocument();
    expect(screen.getByText(first.vi, { exact: false })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Good/ }));
    await waitFor(async () => {
      expect(await getDb().vocabProgress.get(first.id)).toMatchObject({
        state: 'review',
        repetitions: 1,
        intervalDays: 1,
      });
    });
    // Next card is shown.
    expect(await screen.findByRole('heading', { name: WORDS[1]!.term })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'End session' }));
    expect(await screen.findByText('Session complete')).toBeInTheDocument();
    expect(screen.getByText(/1 of 1 answers recalled, 1 new word\./)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Save session' }));
    const sheet = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(sheet).getByText('+20 XP')).toBeInTheDocument();
    expect(await getDb().sessions.where('moduleId').equals('english').count()).toBe(1);
  });

  it('"Again" brings the card back later in the same session', async () => {
    renderAt('/practice/english/review');
    const first = WORDS[0]!;
    await screen.findByRole('heading', { name: first.term });
    await userEvent.click(screen.getByRole('button', { name: 'Show answer' }));
    await userEvent.click(screen.getByRole('button', { name: /^Again/ }));
    // 10 new words + the forgotten one again.
    expect(await screen.findByText(/Card 2 of 11/)).toBeInTheDocument();
    const progress = await getDb().vocabProgress.get(first.id);
    expect(progress).toMatchObject({ state: 'learning', repetitions: 0 });
  });

  it('shows only reviews that are due, not cards scheduled for later', async () => {
    const now = Date.now();
    await getDb().vocabProgress.bulkAdd(
      WORDS.slice(0, 10).map((w, i) => ({
        wordId: w.id,
        ...NEW_CARD,
        state: 'review' as const,
        repetitions: 1,
        intervalDays: 1,
        // The first is overdue; the rest are due tomorrow.
        dueAt: i === 0 ? now - 1000 : now + 86_400_000,
        lastReviewedAt: now - 86_400_000,
        createdAt: now - 86_400_000,
      })),
    );
    renderAt('/practice/english');
    // 1 due review + 10 new words (none were introduced today).
    expect(await screen.findByText('1 to review, 10 new words.')).toBeInTheDocument();
  });
});

describe('Words', () => {
  it('searches in English and Vietnamese and filters by topic', async () => {
    renderAt('/practice/english/words');
    await userEvent.type(await screen.findByLabelText('Search'), 'thuật toán');
    expect(await screen.findByText('algorithm')).toBeInTheDocument();
    expect(screen.getByText(`1 of ${WORDS.length} words`)).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Search'));
    await userEvent.click(screen.getByRole('button', { name: 'Security' }));
    expect(await screen.findByText('phishing')).toBeInTheDocument();
    expect(screen.queryByText('algorithm')).toBeNull();
  }, 20_000); // 300 rows render slowly in happy-dom on a loaded machine
});

describe('Achievement: 100 learned words', () => {
  it('unlocks when 100 words have been recalled three times', async () => {
    const now = Date.now();
    await getDb().vocabProgress.bulkAdd(
      WORDS.slice(0, 100).map((w) => ({
        wordId: w.id,
        ...NEW_CARD,
        state: 'review' as const,
        repetitions: 3,
        intervalDays: 15,
        dueAt: now + 15 * 86_400_000,
        lastReviewedAt: now,
        createdAt: now - 30 * 86_400_000,
      })),
    );
    const result = await engine().recordSession({
      id: 'vocab-achievement',
      moduleId: 'english',
      activityType: 'vocab_session',
      startedAt: now - 60_000,
      endedAt: now,
      source: 'timer',
    });
    expect(result.ok && result.value.newAchievementIds).toContain('vocab_100');
  });
});

describe('Quiz', () => {
  it('asks 10 questions, gives feedback, ends with a score, and records nothing', async () => {
    renderAt('/practice/english/quiz');
    for (let i = 1; i <= 10; i++) {
      expect(await screen.findByText(`Question ${i} of 10`)).toBeInTheDocument();
      const answers = within(screen.getByRole('group', { name: 'Answers' })).getAllByRole('button');
      await userEvent.click(answers[0]!);
      // One option is marked correct once you answer.
      expect(screen.getByText('Correct')).toBeInTheDocument();
      await userEvent.click(
        screen.getByRole('button', { name: i === 10 ? 'See result' : 'Next question' }),
      );
    }
    expect(await screen.findByText(/of 10 correct/)).toBeInTheDocument();
    expect(screen.getByText(/do not change your review schedule or earn XP/)).toBeInTheDocument();
    expect(await getDb().vocabProgress.count()).toBe(0);
    expect(await getDb().sessions.count()).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'New quiz' }));
    expect(await screen.findByText('Question 1 of 10')).toBeInTheDocument();
  });
});
