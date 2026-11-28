import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootDatabase, closeActiveDb, getDb } from '@/db/boot';
import { memoryMarkerStore } from '@/db/testing';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import { loadDraft, saveDraft } from '../data/caroRepository';
import { cellIndex } from '../domain/board';
import type { CaroDraft } from '../domain/play';
import { CaroModule } from './CaroModule';
import { cellName } from './labels';

const DB = 'caro-ui-test';
const i = (r: number, c: number) => cellIndex(15, r, c);

beforeEach(async () => {
  window.localStorage.clear();
  const outcome = await bootDatabase({
    name: DB,
    snapshotName: `${DB}-snap`,
    markerStore: memoryMarkerStore(),
  });
  if (outcome.status !== 'ready') throw new Error('test database failed to boot');
});

afterEach(async () => {
  vi.restoreAllMocks();
  cleanup(); // unmount before closing: live queries must not outlive the database
  closeActiveDb();
  await Dexie.delete(DB);
  await Dexie.delete(`${DB}-snap`);
});

function renderModule(path = '/practice/caro') {
  const router = createMemoryRouter(
    [
      { path: '/practice', element: <p>Practice hub</p> },
      { path: '/practice/caro/*', element: <CaroModule /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

/** A cell of the 15 x 15 board by its 1-based row from the TOP and column; named as printed (H8). */
const cell = (row: number, col: number, state = 'empty') =>
  screen.getByRole('button', {
    name: new RegExp(`^${cellName(15, (row - 1) * 15 + (col - 1))}, ${state}`),
  });

const draft = (over: Partial<CaroDraft> = {}): CaroDraft => ({
  id: 'ui-game',
  size: 15,
  rule: 'freestyle',
  obstacles: [],
  level: 'easy',
  humanStone: 1,
  startedAt: Date.now() - 5 * 60_000,
  moves: [],
  undos: 0,
  ...over,
});

/** Person (stone 1) has four on row 7 and the move: playing row 8, column 5 wins. */
const ONE_MOVE_FROM_WINNING = [0, 1, 2, 3].flatMap((c) => [i(7, c), i(8, c)]);

describe('module home', () => {
  it('shows an empty record, starts a game and opens the board with the saved game', async () => {
    const router = renderModule();
    expect(await screen.findByText('No games yet')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resume' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Easy' }));
    await userEvent.click(screen.getByText('Advanced')); // the board size lives under Advanced
    await userEvent.click(screen.getByRole('radio', { name: '9 × 9 quick' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/caro/play'));
    expect(await screen.findByRole('grid', { name: 'Caro board, 9 by 9' })).toBeInTheDocument();
    expect(await loadDraft(getDb())).toMatchObject({ size: 9, level: 'easy', humanStone: 1 });
  });

  it('offers Resume for a game in progress and asks before replacing it', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7), i(7, 8)] }), Date.now());
    const router = renderModule();
    expect(await screen.findByText('Easy · 15×15 · 2 moves')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    const confirm = await screen.findByRole('dialog', { name: 'Replace the game in progress?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect((await loadDraft(getDb()))?.id).toBe('ui-game');

    await userEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/caro/play'));
  });

  it('discarding a game in progress removes it and records nothing', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7)] }), Date.now());
    renderModule();
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    const confirm = await screen.findByRole('dialog', { name: 'Discard this game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByText('Game in progress')).not.toBeInTheDocument());
    expect(await loadDraft(getDb())).toBeNull();
    expect(await getDb().gameRecords.count()).toBe(0);
  });

  it('shows the record: totals, per level and recent games', async () => {
    const base = {
      game: 'caro',
      startedAt: 1,
      localDate: '2026-11-20',
      details: { size: 15, moves: 21 },
    } as const;
    await getDb().gameRecords.bulkPut([
      { ...base, id: 'a', level: 'easy', result: 'win', endedAt: 100 },
      { ...base, id: 'b', level: 'hard', result: 'loss', endedAt: 200 },
      { ...base, id: 'c', level: 'hard', result: 'win', endedAt: 300 },
    ]);
    renderModule();
    expect(await screen.findByText('67%')).toBeInTheDocument();
    expect(screen.getByText('1 W · 1 L · 0 D')).toBeInTheDocument(); // hard
    expect(screen.getAllByText('Win')).toHaveLength(2);
    expect(screen.getByText('Loss')).toBeInTheDocument();
  });

  it('splits the record by game type; old rows without a rule count as Classic', async () => {
    const row = (id: string, result: 'win' | 'loss' | 'draw', details: Record<string, unknown>) =>
      ({
        id,
        game: 'caro' as const,
        level: 'medium',
        result,
        startedAt: 1,
        endedAt: Number(id.slice(1)),
        localDate: '2026-11-20',
        details: { moves: 21, ...details },
      }) as const;
    await getDb().gameRecords.bulkPut([
      row('g1', 'win', { size: 15 }), // saved before variants existed
      row('g2', 'win', { size: 15, rule: 'freestyle', obstacles: 0 }),
      row('g3', 'loss', { size: 15, rule: 'blocked', obstacles: 0 }),
      row('g4', 'draw', { size: 19, rule: 'blocked', obstacles: 3 }),
      row('g5', 'loss', { size: 19, rule: 'freestyle', obstacles: 0 }),
    ]);
    renderModule();
    const section = (await screen.findByRole('heading', { name: 'By game type' })).closest(
      'section',
    );
    if (!section) throw new Error('missing section');
    expect(section).toHaveTextContent('Classic2 played2 W · 0 L · 0 D');
    expect(section).toHaveTextContent('Vietnamese rule1 played0 W · 1 L · 0 D');
    expect(section).toHaveTextContent('Tournament1 played0 W · 0 L · 1 D');
    expect(section).toHaveTextContent('Other1 played0 W · 1 L · 0 D');
  });

  it('only lists the game types that were played', async () => {
    await getDb().gameRecords.put({
      id: 'only',
      game: 'caro',
      level: 'easy',
      result: 'win',
      startedAt: 1,
      endedAt: 2,
      localDate: '2026-11-20',
      details: { size: 15, moves: 12 },
    });
    renderModule();
    const section = (await screen.findByRole('heading', { name: 'By game type' })).closest(
      'section',
    );
    if (!section) throw new Error('missing section');
    expect(section).toHaveTextContent('Classic');
    expect(section).not.toHaveTextContent('Tournament');
    expect(section).not.toHaveTextContent('Other');
  });

  it('sends an unknown sub-path back to the module home', async () => {
    renderModule('/practice/caro/nowhere');
    expect(await screen.findByRole('heading', { name: 'New game' })).toBeInTheDocument();
  });
});

describe('game screen', () => {
  it('without a saved game, returns to the module home', async () => {
    const router = renderModule('/practice/caro/play');
    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/caro'));
  });

  it('plays a move, gets a reply from the engine, and saves progress after each move', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(screen.getByRole('status')).toHaveTextContent('Your move.');

    await userEvent.click(cell(8, 8));
    expect(cell(8, 8, 'your stone')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /computer stone/ })).toHaveLength(1),
    );
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your move.'));

    const saved = await loadDraft(getDb());
    expect(saved?.moves).toHaveLength(2);
    expect(saved?.moves[0]).toBe(i(7, 7));
    expect(screen.getByText('Move list (2)')).toBeInTheDocument();
  });

  it('marks the last move and ignores taps on occupied cells', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7), i(7, 8)] }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(cell(8, 9, 'computer stone, last move')).toBeInTheDocument();
    await userEvent.click(cell(8, 8, 'your stone'));
    expect((await loadDraft(getDb()))?.moves).toHaveLength(2);
  });

  it('lets the computer open when it moves first', async () => {
    await saveDraft(getDb(), draft({ humanStone: 2 }), Date.now());
    renderModule('/practice/caro/play');
    expect(await screen.findByRole('button', { name: /^H8, computer stone/ })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Your move.'));
  });

  it('is keyboard operable: arrows move between cells, Enter places a stone', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    cell(8, 8).focus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    expect(cell(9, 9)).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(cell(9, 9, 'your stone')).toBeInTheDocument();
  });

  it('with "Confirm each move", a first tap only aims and Place stone commits', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm each move' }));
    expect(screen.getByRole('button', { name: 'Place stone' })).toBeDisabled();

    await userEvent.click(cell(5, 5));
    expect(cell(5, 5, 'empty, selected')).toBeInTheDocument();
    await userEvent.click(cell(6, 6)); // aiming elsewhere just moves the marker
    expect(cell(6, 6, 'empty, selected')).toBeInTheDocument();
    expect((await loadDraft(getDb()))?.moves).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: 'Place stone' }));
    expect(cell(6, 6, 'your stone')).toBeInTheDocument();
    expect(window.localStorage.getItem('caro-confirm-moves')).toBe('1');
  });

  it('Undo (Easy) takes back the move and the reply; harder levels have no Undo', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7), i(7, 8), i(6, 6), i(6, 7)] }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(cell(8, 8, 'your stone')).toBeInTheDocument();
    expect(cell(8, 9, 'computer stone')).toBeInTheDocument();
    expect(screen.getByText('Move list (2)')).toBeInTheDocument();
    expect(await loadDraft(getDb())).toMatchObject({ undos: 1 });
    cleanup();

    await saveDraft(getDb(), draft({ level: 'hard', moves: [i(7, 7), i(7, 8)] }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('resigning asks first, then leaves without recording anything', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7), i(7, 8)] }), Date.now());
    const router = renderModule('/practice/caro/play');
    await userEvent.click(await screen.findByRole('button', { name: 'Resign' }));
    const confirm = await screen.findByRole('dialog', { name: 'Resign this game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resign' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/caro'));
    expect(await loadDraft(getDb())).toBeNull();
    expect(await getDb().gameRecords.count()).toBe(0);
    expect(await getDb().sessions.count()).toBe(0);
    expect(await getDb().xpLedger.count()).toBe(0);
  });

  it('winning highlights the line, records the game once and shows the XP earned', async () => {
    await saveDraft(getDb(), draft({ level: 'hard', moves: ONE_MOVE_FROM_WINNING }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    await userEvent.click(cell(8, 5));

    expect(await screen.findByRole('heading', { name: 'You won' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You win!');
    expect(cell(8, 5, 'your stone, last move, winning line')).toBeInTheDocument();
    expect(cell(8, 1, 'your stone, winning line')).toBeInTheDocument();

    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();

    const db = getDb();
    expect(await db.gameRecords.get('ui-game')).toMatchObject({
      game: 'caro',
      level: 'hard',
      result: 'win',
      details: { size: 15, moves: 9, firstMover: 'player' },
    });
    expect(await db.sessions.get('ui-game')).toMatchObject({
      moduleId: 'caro',
      activityType: 'game_session',
      score: 1,
    });
    expect(await db.xpLedger.count()).toBe(1);
    expect(await loadDraft(db)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resign' })).not.toBeInTheDocument();

    await userEvent.click(within(saved).getByRole('button', { name: 'Done' }));
    await userEvent.click(screen.getByRole('button', { name: 'New game' }));
    expect(await screen.findByText('100%')).toBeInTheDocument(); // record updated on the home
  });

  it('names cells the way the board prints them: column letter, row from the bottom', async () => {
    await saveDraft(getDb(), draft({ moves: [i(7, 7)], humanStone: 2 }), Date.now());
    renderModule('/practice/caro/play');
    const grid = await screen.findByRole('grid', { name: 'Caro board, 15 by 15' });
    // the first stone sits on the centre, H8; the top-left cell is A15, the bottom-right O1
    expect(within(grid).getByRole('button', { name: /^H8, computer stone/ })).toBeInTheDocument();
    expect(within(grid).getByRole('button', { name: 'A15, empty' })).toBeInTheDocument();
    expect(within(grid).getByRole('button', { name: 'O1, empty' })).toBeInTheDocument();
    expect(within(grid).getByRole('button', { name: 'K11, empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Row \d/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText(/^Move list/));
    expect(screen.getByText('1. Computer: H8')).toBeInTheDocument();
  });

  it('a failed save keeps the finished board, retries the same recording and pays XP once', async () => {
    const recordSession = vi
      .spyOn(DexieTrainingEngine.prototype, 'recordSession')
      .mockResolvedValueOnce({
        ok: false,
        error: { message: 'The session could not be saved.' },
      } as never);
    await saveDraft(getDb(), draft({ level: 'hard', moves: ONE_MOVE_FROM_WINNING }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    await userEvent.click(cell(8, 5));

    expect(await screen.findByRole('heading', { name: 'You won' })).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('The session could not be saved.');
    expect(cell(8, 5, 'your stone, last move, winning line')).toBeInTheDocument(); // board stays
    expect(await getDb().xpLedger.count()).toBe(0);
    expect(await loadDraft(getDb())).not.toBeNull(); // resume would offer the retry again

    await userEvent.click(screen.getByRole('button', { name: 'Try saving again' }));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();
    expect(recordSession).toHaveBeenCalledTimes(2);
    expect(await getDb().gameRecords.count()).toBe(1);
    expect(await getDb().sessions.count()).toBe(1);
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await loadDraft(getDb())).toBeNull();
    expect(screen.queryByRole('button', { name: 'Try saving again' })).not.toBeInTheDocument();
  });

  it('resuming a game that already ended records it (a crash right after the last move)', async () => {
    await saveDraft(getDb(), draft({ moves: [...ONE_MOVE_FROM_WINNING, i(7, 4)] }), Date.now());
    renderModule('/practice/caro/play');
    expect(await screen.findByRole('heading', { name: 'You won' })).toBeInTheDocument();
    await waitFor(async () => expect(await getDb().gameRecords.count()).toBe(1));
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await loadDraft(getDb())).toBeNull();
  });
});
