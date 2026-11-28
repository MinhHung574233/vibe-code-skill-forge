import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/db/boot';
import { setLanguagePreference } from '@/i18n/core';
import { setupAppDatabase } from '@/test/appHarness';
import { loadGameDraft, saveGameDraft } from '../data/chessRepository';
import type { MoveAnalysis, MoveSuggestion } from '../domain/coach';
import type { SearchResult } from '../domain/search';
import { ChessModule } from './ChessModule';

/** A scripted engine: the tests decide what the coach and the opponent say, and when. */
const engine = vi.hoisted(() => ({
  findMove: vi.fn(),
  analyse: vi.fn(),
  suggest: vi.fn(),
}));

vi.mock('../workers/engineClient', () => ({
  createEngineClient: () => ({
    findMove: engine.findMove,
    analyse: engine.analyse,
    suggest: engine.suggest,
    dispose: () => undefined,
  }),
}));

setupAppDatabase('chess-coach-ui-test');

beforeEach(() => {
  window.localStorage.clear();
  engine.findMove.mockReset();
  engine.analyse.mockReset();
  engine.suggest.mockReset();
  // by default the opponent answers 1...e5 (or whatever legal reply the test queues)
  engine.findMove.mockResolvedValue(reply('e7e5'));
});
afterEach(() => {
  cleanup();
  setLanguagePreference('en');
});

function reply(move: string): SearchResult {
  return { move, score: 0, mateIn: null, depth: 1, nodes: 1, timeMs: 1, pv: [move] };
}

function analysis(over: Partial<MoveAnalysis> = {}): MoveAnalysis {
  return {
    playedUci: 'e2e4',
    playedSan: 'e4',
    bestUci: 'e2e4',
    bestSan: 'e4',
    bestScore: 20,
    playedScore: 20,
    bestMate: null,
    playedMate: null,
    lossCp: 0,
    grade: 'best',
    reasons: [],
    plan: null,
    depth: 6,
    ...over,
  };
}

const blunder = (): MoveAnalysis =>
  analysis({
    playedUci: 'e2e4',
    playedSan: 'e4',
    bestUci: 'g1f3',
    bestSan: 'Nf3',
    lossCp: 420,
    grade: 'blunder',
    reasons: [{ code: 'hangs', piece: 'q', square: 'd5', reply: 'Rxd5' }],
    plan: { kind: 'capture', piece: 'n', check: false },
  });

/** A promise the test settles by hand, to see the screen while the coach is still thinking. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderPlay() {
  const router = createMemoryRouter([{ path: 'practice/chess/*', element: <ChessModule /> }], {
    initialEntries: ['/practice/chess/play'],
  });
  render(<RouterProvider router={router} />);
}

const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, `) });
const movesText = () => screen.getByRole('list', { name: 'Moves' }).textContent ?? '';

async function startCoachGame() {
  renderPlay();
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Coach mode' }));
  await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
  await screen.findByText('Your move');
}

describe('coach setup', () => {
  it('is off by default, remembers the choice, and starts a plain game without any coaching', async () => {
    renderPlay();
    const toggle = await screen.findByRole('checkbox', { name: 'Coach mode' });
    expect(toggle).not.toBeChecked();
    expect(
      screen.getByText(/Coach games are for learning and do not change your play rating/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByText('Your move');
    expect(screen.queryByRole('button', { name: 'Show me a good move' })).not.toBeInTheDocument();
    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(engine.analyse).not.toHaveBeenCalled();
    expect(await loadGameDraft(getDb())).not.toHaveProperty('coach');
    expect(window.localStorage.getItem('chess-coach')).toBeNull(); // never switched on
  });

  it('stores the choice on this device', async () => {
    renderPlay();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Coach mode' }));
    expect(window.localStorage.getItem('chess-coach')).toBe('1');
    cleanup();
    renderPlay();
    expect(await screen.findByRole('checkbox', { name: 'Coach mode' })).toBeChecked();
  });
});

describe('coach game', () => {
  it('checks the move first, holds the engine back on a blunder, shows the better move, then continues', async () => {
    const pending = deferred<MoveAnalysis>();
    engine.analyse.mockReturnValueOnce(pending.promise);
    await startCoachGame();
    expect(screen.getByText('Coach')).toBeInTheDocument(); // the badge in the header

    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    // while the coach thinks: a status line, no verdict, the opponent has not been asked yet
    expect(await screen.findByText('Checking your move…')).toBeInTheDocument();
    expect(engine.analyse).toHaveBeenCalledWith(expect.stringContaining('rnbqkbnr'), 'e2e4', []);
    expect(engine.findMove).not.toHaveBeenCalled();
    expect(screen.queryByRole('region', { name: 'Coach' })).not.toBeInTheDocument();

    await act(async () => {
      pending.resolve(blunder());
      await pending.promise;
    });
    const card = await screen.findByRole('region', { name: 'Coach' });
    // rating badge as text, the explanation, and the better move
    expect(within(card).getByText('Blunder')).toBeInTheDocument();
    expect(within(card).getByText('Your queen on d5 can be captured by Rxd5.')).toBeInTheDocument();
    expect(within(card).getByText('A better move was Nf3.')).toBeInTheDocument();
    expect(within(card).getByText('Nf3 wins a knight.')).toBeInTheDocument();
    // the card is a polite live region
    expect(card.querySelector('[aria-live="polite"]')).not.toBeNull();
    // the better move is outlined on the board
    expect(square('g1')).toHaveAccessibleName(/hint/);
    expect(square('f3')).toHaveAccessibleName(/hint/);
    // buttons are real, 44 px or taller targets
    for (const name of ['Take back and try again', 'Continue']) {
      expect(within(card).getByRole('button', { name }).className).toMatch(/min-h-\[(44|50)px\]/);
    }
    expect(screen.getByText('Take the move back, or continue')).toBeInTheDocument();
    // the engine still waits, and the learner cannot move
    await new Promise((r) => setTimeout(r, 50));
    expect(engine.findMove).not.toHaveBeenCalled();
    expect(movesText()).toMatch(/1\. e4\s*$/);

    await userEvent.click(within(card).getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(engine.findMove).toHaveBeenCalledTimes(1); // answered once, never twice
    // the verdict stays visible, without the buttons
    expect(screen.getByText('Blunder')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
    // the graded move is kept with the draft
    await waitFor(async () =>
      expect((await loadGameDraft(getDb()))?.coach?.reviews).toEqual([
        { ply: 0, san: 'e4', bestSan: 'Nf3', grade: 'blunder', lossCp: 420 },
      ]),
    );
  });

  it('take back removes the move, forgets its card and review, and never asks the engine', async () => {
    engine.analyse.mockResolvedValueOnce(blunder());
    await startCoachGame();
    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    await userEvent.click(await screen.findByRole('button', { name: 'Take back and try again' }));

    await waitFor(() => expect(movesText()).toContain('No moves yet'));
    expect(screen.queryByRole('region', { name: 'Coach' })).not.toBeInTheDocument();
    expect(square('e2')).toHaveAccessibleName(/white pawn/);
    expect(engine.findMove).not.toHaveBeenCalled();
    await waitFor(async () => {
      const draft = await loadGameDraft(getDb());
      expect(draft?.moves).toEqual([]);
      expect(draft?.coach?.reviews).toEqual([]);
      expect(draft?.undos).toBe(1);
    });

    // trying again: a new check, and this time the move is fine, so the engine answers by itself
    engine.analyse.mockResolvedValueOnce(
      analysis({ playedUci: 'g1f3', playedSan: 'Nf3', bestUci: 'g1f3', bestSan: 'Nf3' }),
    );
    await userEvent.click(square('g1'));
    await userEvent.click(square('f3'));
    await waitFor(() => expect(movesText()).toMatch(/1\. Nf3 e5/));
    expect(engine.analyse).toHaveBeenCalledTimes(2);
    expect(engine.findMove).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Best move')).toBeInTheDocument();
    expect(screen.getByText('The engine agrees with your move.')).toBeInTheDocument();
  });

  it('lets a good move through without stopping the learner', async () => {
    engine.analyse.mockResolvedValueOnce(
      analysis({ grade: 'good', lossCp: 30, bestUci: 'd2d4', bestSan: 'd4' }),
    );
    await startCoachGame();
    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(screen.getByText('Good move')).toBeInTheDocument();
    expect(screen.getByText('A solid move. The engine slightly prefers d4.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).not.toBeInTheDocument();
    expect(square('d2')).not.toHaveAccessibleName(/hint/);
  });

  it('never blocks the game when the check fails', async () => {
    engine.analyse.mockRejectedValueOnce(new Error('worker died'));
    await startCoachGame();
    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(engine.findMove).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers a good move before moving, outlines it, and drops the hint after the move', async () => {
    const suggestion: MoveSuggestion = {
      bestUci: 'g1f3',
      bestSan: 'Nf3',
      score: 20,
      mate: null,
      plan: null,
      depth: 6,
    };
    engine.suggest.mockResolvedValueOnce(suggestion);
    engine.analyse.mockResolvedValue(analysis());
    await startCoachGame();
    await userEvent.click(screen.getByRole('button', { name: 'Show me a good move' }));
    const card = await screen.findByRole('region', { name: 'Coach' });
    expect(within(card).getByText('Try Nf3.')).toBeInTheDocument();
    expect(
      within(card).getByText('It is the engine’s top choice in this position.'),
    ).toBeInTheDocument();
    expect(square('g1')).toHaveAccessibleName(/hint/);
    expect(square('f3')).toHaveAccessibleName(/hint/);
    expect(engine.suggest).toHaveBeenCalledWith(expect.stringContaining('rnbqkbnr'), []);

    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(screen.queryByText('Try Nf3.')).not.toBeInTheDocument();
    expect(square('g1')).not.toHaveAccessibleName(/hint/);
  });
});

describe('resuming a coach game', () => {
  const baseDraft = {
    id: 'coach-resume',
    startedAt: Date.now() - 1000,
    level: 'hard' as const,
    color: 'w' as const,
    undos: 0,
  };

  it('keeps the coach on and the earlier review, and grades the next move into it', async () => {
    await saveGameDraft(
      getDb(),
      {
        ...baseDraft,
        moves: ['e2e4', 'e7e5'],
        coach: { reviews: [{ ply: 0, san: 'e4', bestSan: 'e4', grade: 'best', lossCp: 0 }] },
      },
      Date.now(),
    );
    engine.analyse.mockResolvedValueOnce(
      analysis({ playedUci: 'g1f3', playedSan: 'Nf3', bestUci: 'g1f3', bestSan: 'Nf3' }),
    );
    engine.findMove.mockResolvedValueOnce(reply('b8c6'));
    renderPlay();
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    await screen.findByText('Your move');
    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show me a good move' })).toBeInTheDocument();

    await userEvent.click(square('g1'));
    await userEvent.click(square('f3'));
    await waitFor(() => expect(movesText()).toContain('2. Nf3 Nc6'));
    await waitFor(async () =>
      expect((await loadGameDraft(getDb()))?.coach?.reviews.map((r) => r.ply)).toEqual([0, 2]),
    );
  });

  it('grades again a move whose verdict was lost (the app closed during the check)', async () => {
    await saveGameDraft(
      getDb(),
      { ...baseDraft, moves: ['e2e4'], coach: { reviews: [] } },
      Date.now(),
    );
    engine.analyse.mockResolvedValueOnce(blunder());
    renderPlay();
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    expect(await screen.findByText('Blunder')).toBeInTheDocument();
    expect(engine.analyse).toHaveBeenCalledWith(expect.stringContaining('rnbqkbnr'), 'e2e4', []);
    expect(engine.findMove).not.toHaveBeenCalled(); // still waiting for the learner
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(movesText()).toMatch(/1\. e4 e5/));
    expect(engine.findMove).toHaveBeenCalledTimes(1);
  });

  it('a plain game resumes without the coach', async () => {
    await saveGameDraft(getDb(), { ...baseDraft, moves: ['e2e4', 'e7e5'] }, Date.now());
    renderPlay();
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    await screen.findByText('Your move');
    expect(screen.queryByText('Coach')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show me a good move' })).not.toBeInTheDocument();
  });

  it('undo after a coached move also removes its review', async () => {
    await saveGameDraft(
      getDb(),
      {
        ...baseDraft,
        moves: ['e2e4', 'e7e5'],
        coach: { reviews: [{ ply: 0, san: 'e4', bestSan: 'e4', grade: 'best', lossCp: 0 }] },
      },
      Date.now(),
    );
    renderPlay();
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    await screen.findByText('Your move');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(async () => expect((await loadGameDraft(getDb()))?.coach?.reviews).toEqual([]));
  });
});

describe('end of a coach game', () => {
  it('shows the review, does not rate the game, and still records the practice', async () => {
    // 1.a3 a6 2.e4 e5 3.Bc4 Nc6 4.Qh5 Nf6 and the learner plays 5.Qxf7#
    await saveGameDraft(
      getDb(),
      {
        id: 'scholar',
        startedAt: Date.now() - 120_000,
        level: 'easy',
        color: 'w',
        undos: 0,
        moves: ['a2a3', 'a7a6', 'e2e4', 'e7e5', 'f1c4', 'b8c6', 'd1h5', 'g8f6'],
        coach: {
          reviews: [
            { ply: 0, san: 'a3', bestSan: 'e4', grade: 'inaccuracy', lossCp: 70 },
            { ply: 2, san: 'e4', bestSan: 'e4', grade: 'best', lossCp: 0 },
            { ply: 4, san: 'Bc4', bestSan: 'Nf3', grade: 'mistake', lossCp: 180 },
            { ply: 6, san: 'Qh5', bestSan: 'Nf3', grade: 'blunder', lossCp: 400 },
          ],
        },
      },
      Date.now(),
    );
    renderPlay();
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    await screen.findByText('Your move');
    await userEvent.click(square('h5'));
    await userEvent.click(square('f7'));

    expect(await screen.findByText('You won')).toBeInTheDocument();
    expect(
      screen.getByText('Coach games are for learning, so they do not change your play rating.'),
    ).toBeInTheDocument();
    const review = await screen.findByRole('region', { name: 'Game review' });
    // grades counted from the four earlier reviews (the final mate was never graded)
    expect(within(review).getByText('Accuracy: 59%')).toBeInTheDocument(); // (82.5+100+55+0)/4
    expect(within(review).getByText('Where you lost the most')).toBeInTheDocument();
    // the three costliest moves, worst first (Qh5 is move 4, Bc4 move 3, a3 move 1)
    expect(
      within(review).getByText('Move 4: you played Qh5. A better move was Nf3.'),
    ).toBeInTheDocument();
    expect(
      within(review).getByText('Move 3: you played Bc4. A better move was Nf3.'),
    ).toBeInTheDocument();
    expect(
      within(review).getByText('Move 1: you played a3. A better move was e4.'),
    ).toBeInTheDocument();
    // the grade names appear in the counts and on each listed move (text, not colour alone)
    expect(within(review).getAllByText('Blunder')).toHaveLength(2);
    expect(await getDb().ratings.get('chess-play')).toBeUndefined();
    const record = await getDb().gameRecords.get('scholar');
    expect(record).toMatchObject({ result: 'win' });
    expect(record?.details).toMatchObject({ coached: true });
    await waitFor(async () => expect(await getDb().sessions.get('scholar')).toBeDefined());
    expect((await getDb().sessions.get('scholar'))?.result).toMatchObject({ coached: true });
  });
});

describe('Vietnamese', () => {
  it('shows the coach verdict in Vietnamese', async () => {
    setLanguagePreference('vi');
    engine.analyse.mockResolvedValueOnce(blunder());
    renderPlay();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Chế độ hướng dẫn' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bắt đầu ván' }));
    await userEvent.click(await screen.findByRole('button', { name: /^e2, / }));
    await userEvent.click(screen.getByRole('button', { name: /^e4, / }));
    expect(await screen.findByText('Sai lầm nặng')).toBeInTheDocument();
    expect(screen.getByText('Quân hậu của bạn ở d5 có thể bị ăn bằng Rxd5.')).toBeInTheDocument();
    expect(screen.getByText('Nước đi tốt hơn là Nf3.')).toBeInTheDocument();
  });
});

describe('how to beat Hard', () => {
  it('is on the Chess home as a short list of tips, with only claims the engine design supports', async () => {
    const router = createMemoryRouter([{ path: 'practice/chess/*', element: <ChessModule /> }], {
      initialEntries: ['/practice/chess'],
    });
    render(<RouterProvider router={router} />);
    const card = await screen.findByRole('region', { name: 'How to beat Hard' });
    expect(within(card).getAllByRole('listitem').length).toBeGreaterThanOrEqual(5);
    expect(
      within(card).getByText(/up to 12 half-moves ahead and stops after 1\.4 seconds/),
    ).toBeInTheDocument();
    expect(within(card).getByText(/no opening book/)).toBeInTheDocument();
    expect(within(card).getByText(/no endgame tables/)).toBeInTheDocument();
  });
});
