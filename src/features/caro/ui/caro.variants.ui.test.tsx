import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb, getDb } from '@/db/boot';
import { memoryMarkerStore } from '@/db/testing';
import { loadDraft, saveDraft } from '../data/caroRepository';
import { cellIndex } from '../domain/board';
import { isValidObstacleSet } from '../domain/obstacles';
import type { CaroDraft } from '../domain/play';
import { CaroModule } from './CaroModule';
import { cellName } from './labels';

const DB = 'caro-variants-ui-test';
const k = (r: number, c: number) => cellIndex(19, r, c);
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
  cleanup();
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

const OBSTACLES = [k(3, 3), k(3, 15), k(15, 9)];

const draft = (over: Partial<CaroDraft> = {}): CaroDraft => ({
  id: 'var-game',
  size: 19,
  rule: 'blocked',
  obstacles: OBSTACLES,
  level: 'easy',
  humanStone: 1,
  startedAt: Date.now() - 5 * 60_000,
  moves: [],
  undos: 0,
  ...over,
});

const preset = (name: RegExp) => screen.getByRole('radio', { name });

describe('setup: presets and advanced options', () => {
  it('offers three presets with Classic selected, and starts a classic game by default', async () => {
    const router = renderModule();
    await screen.findByRole('heading', { name: 'New game' });
    expect(preset(/^Classic/)).toBeChecked();
    expect(preset(/^Vietnamese rule/)).not.toBeChecked();
    expect(preset(/^Tournament/)).not.toBeChecked();
    expect(screen.getByText('15 × 15. Five or more in a row wins.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/caro/play'));
    expect(await loadDraft(getDb())).toMatchObject({ size: 15, rule: 'freestyle', obstacles: [] });
  });

  it('the Vietnamese rule preset starts a 15x15 game with blocked ends and no blocked squares', async () => {
    renderModule();
    await userEvent.click(await screen.findByRole('radio', { name: /^Vietnamese rule/ }));
    expect(preset(/^Vietnamese rule/)).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByRole('grid', { name: 'Caro board, 15 by 15' });
    expect(await loadDraft(getDb())).toMatchObject({ size: 15, rule: 'blocked', obstacles: [] });
  });

  it('the Tournament preset starts a 19x19 blocked-ends game with 3 valid blocked squares', async () => {
    renderModule();
    await userEvent.click(await screen.findByRole('radio', { name: /^Tournament/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByRole('grid', { name: 'Caro board, 19 by 19' });
    const saved = await loadDraft(getDb());
    expect(saved).toMatchObject({ size: 19, rule: 'blocked' });
    expect(saved?.obstacles).toHaveLength(3);
    expect(isValidObstacleSet(19, saved?.obstacles ?? [])).toBe(true);
    expect(screen.getAllByRole('gridcell', { name: /blocked square/ })).toHaveLength(3);
  });

  it('Advanced has separate controls that move the preset selection', async () => {
    renderModule();
    await screen.findByRole('heading', { name: 'New game' });
    await userEvent.click(screen.getByText('Advanced'));

    // Each rule has a one-sentence explanation with a tiny example.
    expect(
      screen.getByText(/^Five or more in a row win, even with an opponent stone/),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: 'Blocked ends' }));
    expect(screen.getByText(/The edge of the board does not block/)).toBeVisible();
    expect(preset(/^Vietnamese rule/)).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: '19 × 19' }));
    await userEvent.click(screen.getByRole('radio', { name: '3 squares' }));
    expect(preset(/^Tournament/)).toBeChecked();

    // A combination that is none of the presets leaves them all unchecked.
    await userEvent.click(screen.getByRole('radio', { name: 'Free rule' }));
    for (const name of [/^Classic/, /^Vietnamese rule/, /^Tournament/]) {
      expect(preset(name)).not.toBeChecked();
    }
    await userEvent.click(screen.getByRole('radio', { name: 'Easy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByRole('grid', { name: 'Caro board, 19 by 19' });
    const saved = await loadDraft(getDb());
    expect(saved).toMatchObject({ size: 19, rule: 'freestyle', level: 'easy' });
    expect(saved?.obstacles).toHaveLength(3);
  });

  it('a 9 x 9 game is still available under Advanced', async () => {
    renderModule();
    await screen.findByRole('heading', { name: 'New game' });
    await userEvent.click(screen.getByText('Advanced'));
    await userEvent.click(screen.getByRole('radio', { name: '9 × 9 quick' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    expect(await screen.findByRole('grid', { name: 'Caro board, 9 by 9' })).toBeInTheDocument();
  });
});

describe('resume card and game header', () => {
  it('names the variant in the resume card', async () => {
    await saveDraft(getDb(), draft({ moves: [k(9, 9), k(9, 10)] }), Date.now());
    renderModule();
    expect(await screen.findByText('Easy · 19×19 · 2 moves')).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'Game in progress' });
    expect(within(region).getByText('Tournament')).toBeInTheDocument();
  });

  it('names a custom variant by its rule and blocked squares', async () => {
    await saveDraft(
      getDb(),
      draft({ size: 15, obstacles: [i(2, 2), i(2, 12), i(12, 7)] }),
      Date.now(),
    );
    renderModule();
    expect(await screen.findByText('Blocked ends · 3 blocked squares')).toBeInTheDocument();
  });

  it('shows the variant in the play header', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(screen.getByText('Easy · 19×19')).toBeInTheDocument();
    expect(screen.getByText('Tournament')).toBeInTheDocument();
  });
});

describe('the board with blocked squares', () => {
  it('draws them with an accessible name, and they are not move targets', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    const grid = await screen.findByRole('grid', { name: 'Caro board, 19 by 19' });
    const blocked = within(grid).getAllByRole('gridcell', { name: /blocked square/ });
    expect(blocked).toHaveLength(3);
    expect(blocked[0]).toHaveAccessibleName('D16, blocked square');
    expect(within(grid).queryByRole('button', { name: /blocked square/ })).not.toBeInTheDocument();
    expect(within(grid).getAllByRole('button')).toHaveLength(19 * 19 - 3);
  });

  it('labels the coordinates A to S across a 19x19 board', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    const labels = [...document.querySelectorAll('svg text')].map((node) => node.textContent);
    expect(labels).toHaveLength(38);
    expect(labels.slice(0, 2)).toEqual(['A', '19']); // rows are counted from the bottom
    expect(labels).toContain('S');
    expect(labels).toContain('19');
    expect(labels).not.toContain('T');
  });

  it('arrow keys step over a blocked square instead of landing on it', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    const cell = (r: number, c: number) =>
      screen.getByRole('button', {
        name: new RegExp(`^${cellName(19, (r - 1) * 19 + (c - 1))}, empty`),
      });
    cell(4, 3).focus(); // C16; the square to its right, D16, is blocked
    await userEvent.keyboard('{ArrowRight}');
    expect(cell(4, 5)).toHaveFocus();
  });

  it('the computer never answers on a blocked square', async () => {
    // Blocked squares sit as near the centre as the rules allow.
    const near = [k(6, 6), k(6, 12), k(12, 9)];
    await saveDraft(getDb(), draft({ obstacles: near }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    await userEvent.click(screen.getByRole('button', { name: /^J10, empty/ }));
    await waitFor(() => expect(screen.getByText('Move list (2)')).toBeInTheDocument());
    const saved = await loadDraft(getDb());
    expect(saved?.moves).toHaveLength(2);
    for (const cell of near) expect(saved?.moves).not.toContain(cell);
    expect(saved?.obstacles).toEqual(near); // a resumed game keeps the same squares
  });
});

describe('the dead-five hint', () => {
  // X (the person) completes row 7, columns 4-8, between O stones at columns 3 and 9.
  const DEAD_FIVE = [
    i(7, 4),
    i(7, 3),
    i(7, 5),
    i(7, 9),
    i(7, 6),
    i(0, 0),
    i(7, 7),
    i(0, 5),
    i(7, 8),
  ];
  const HINT = 'That five is blocked at both ends, so the game goes on.';

  it('teaches the rule once the first doubly blocked five appears, and the game goes on', async () => {
    await saveDraft(getDb(), draft({ size: 15, obstacles: [], moves: DEAD_FIVE }), Date.now());
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'You won' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resign' })).toBeInTheDocument();
  });

  it('is absent before the five, and under the free rule the same moves win', async () => {
    await saveDraft(
      getDb(),
      draft({ size: 15, obstacles: [], moves: DEAD_FIVE.slice(0, 8) }),
      Date.now(),
    );
    renderModule('/practice/caro/play');
    await screen.findByRole('grid');
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    cleanup();

    await saveDraft(
      getDb(),
      draft({ size: 15, rule: 'freestyle', obstacles: [], moves: DEAD_FIVE }),
      Date.now(),
    );
    renderModule('/practice/caro/play');
    expect(await screen.findByRole('heading', { name: 'You won' })).toBeInTheDocument();
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });
});
