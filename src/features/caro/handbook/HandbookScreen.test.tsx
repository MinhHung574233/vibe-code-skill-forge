import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setLanguagePreference } from '@/i18n/core';
import { ALL_EXERCISES, CHAPTERS } from './content';
import { HandbookScreen } from './HandbookScreen';
import { HANDBOOK_STORAGE_KEY } from './progress';

function renderScreen() {
  return render(
    <MemoryRouter>
      <HandbookScreen />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  setLanguagePreference('en');
  window.localStorage.clear();
});

/** The first exercise of "Winning combinations": the answer is row 5, column 4 (window spot [4,3]). */
const openCombinations = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Winning combinations/ }));
};

describe('HandbookScreen', () => {
  it('lists every chapter under the title, with a back link to the Caro home', () => {
    renderScreen();
    expect(screen.getByRole('heading', { level: 1, name: 'Caro handbook' })).toBeInTheDocument();
    for (const chapter of CHAPTERS) {
      expect(screen.getByRole('button', { name: new RegExp(chapter.title) })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: /Back to Caro/ })).toHaveAttribute(
      'href',
      '/practice/caro',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'How to read the diagrams' }),
    ).toBeInTheDocument();
  });

  it('opens a chapter, keeps the headings in order and moves between chapters', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /The goal and the basics/ }));

    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    expect(levels[1]).toBe(2);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
    expect(
      screen.getByRole('heading', { level: 2, name: 'The goal and the basics' }),
    ).toHaveFocus();
    expect(screen.getByText(/Chapter 1 of 8/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Next: Rule variants/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Rule variants' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Previous: The goal and the basics/ }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'The goal and the basics' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All chapters' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Chapters' })).toBeInTheDocument();
  });

  it('describes every diagram in words for screen readers', async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByRole('button', { name: /Rule variants/ }));
    const pictures = screen.getAllByRole('img');
    expect(pictures.length).toBeGreaterThanOrEqual(5);
    for (const picture of pictures) {
      expect(picture.getAttribute('aria-label')).toMatch(
        /Board section, \d+ rows by \d+ columns\./,
      );
    }
    const blocked = pictures.find((p) =>
      /Blocked squares/.test(p.getAttribute('aria-label') ?? ''),
    );
    expect(blocked).toBeDefined();
    const edge = pictures.find((p) =>
      /Board edge: left side/.test(p.getAttribute('aria-label') ?? ''),
    );
    expect(edge).toBeDefined();
  });

  it('accepts the right square: feedback in a polite live region, solved badge, saved', async () => {
    const user = userEvent.setup();
    renderScreen();
    await openCombinations(user);
    const exercise = screen.getByRole('group', { name: 'Exercise 1' });
    const board = within(exercise);

    expect(board.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    await user.click(board.getByRole('button', { name: 'Row 5, column 4: empty square' }));

    expect(board.getByRole('status')).toHaveTextContent('Correct!');
    expect(board.getByRole('status')).toHaveTextContent(/both ends are empty/);
    expect(board.getByText('Solved')).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(HANDBOOK_STORAGE_KEY) ?? '{}') as {
      solved: string[];
      lastChapter: string;
    };
    expect(saved.solved).toEqual(['combo-open-four-1']);
    expect(saved.lastChapter).toBe('combinations');
  });

  it('explains a wrong square, lets you retry and show the answer without counting it', async () => {
    const user = userEvent.setup();
    renderScreen();
    await openCombinations(user);
    const exercise = screen.getByRole('group', { name: 'Exercise 1' });
    const board = within(exercise);

    await user.click(board.getByRole('button', { name: 'Row 5, column 7: empty square' }));
    expect(board.getByRole('status')).toHaveTextContent('Not quite.');
    expect(board.getByRole('status')).toHaveTextContent(
      /only one square, the gap, finishes the five/,
    );
    expect(board.queryByText('Solved')).not.toBeInTheDocument();

    await user.click(board.getByRole('button', { name: 'Row 1, column 1: empty square' }));
    expect(board.getByRole('status')).toHaveTextContent(/does not make an open four/);

    await user.click(board.getByRole('button', { name: 'Show the answer' }));
    expect(board.getByRole('status')).toHaveTextContent('Answer shown.');
    expect(board.queryByText('Solved')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HANDBOOK_STORAGE_KEY)).not.toContain('combo-open-four-1');

    await user.click(board.getByRole('button', { name: 'Try again' }));
    expect(board.getByRole('status')).toBeEmptyDOMElement();
  });

  it('ignores taps on stones, which are not squares you can play', async () => {
    const user = userEvent.setup();
    renderScreen();
    await openCombinations(user);
    const board = within(screen.getByRole('group', { name: 'Exercise 1' }));
    await user.click(board.getByRole('button', { name: 'Row 5, column 3: first-player stone' }));
    expect(board.getByRole('status')).toBeEmptyDOMElement();
  });

  it('remembers the last chapter and the solved exercises next time', async () => {
    const user = userEvent.setup();
    const first = renderScreen();
    await openCombinations(user);
    await user.click(
      within(screen.getByRole('group', { name: 'Exercise 1' })).getByRole('button', {
        name: 'Row 5, column 4: empty square',
      }),
    );
    first.unmount();

    renderScreen();
    expect(screen.getByText('Continue where you left off')).toBeInTheDocument();
    const combinations = CHAPTERS.find((c) => c.id === 'combinations')!;
    const total = combinations.blocks.filter((b) => b.kind === 'exercise').length;
    expect(screen.getAllByText(new RegExp(`Exercises 1 of ${total}`)).length).toBeGreaterThan(0);
    expect(screen.getByText(`Exercises solved: 1 of ${ALL_EXERCISES.length}`)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Winning combinations' }));
    expect(
      within(screen.getByRole('group', { name: 'Exercise 1' })).getByText('Solved'),
    ).toBeInTheDocument();
  });

  it('copes with broken saved progress', () => {
    window.localStorage.setItem(HANDBOOK_STORAGE_KEY, '{not json');
    renderScreen();
    expect(screen.getByRole('heading', { level: 1, name: 'Caro handbook' })).toBeInTheDocument();
    expect(screen.queryByText('Continue where you left off')).not.toBeInTheDocument();
    cleanup();
    window.localStorage.setItem(
      HANDBOOK_STORAGE_KEY,
      JSON.stringify({ lastChapter: 5, solved: 'x' }),
    );
    renderScreen();
    expect(screen.getByText(`Exercises solved: 0 of ${ALL_EXERCISES.length}`)).toBeInTheDocument();
  });

  it('is available in Vietnamese', async () => {
    setLanguagePreference('vi');
    const user = userEvent.setup();
    renderScreen();
    expect(screen.getByRole('heading', { level: 1, name: 'Cẩm nang Caro' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Các đòn phối hợp thắng/ }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'Các đòn phối hợp thắng' }),
    ).toBeInTheDocument();
    const exercise = screen.getByRole('group', { name: 'Bài tập 1' });
    await user.click(within(exercise).getByRole('button', { name: 'Hàng 5, cột 4: ô trống' }));
    expect(within(exercise).getByRole('status')).toHaveTextContent('Chính xác!');
  });
});
