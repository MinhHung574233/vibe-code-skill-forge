import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb, getDb } from '@/db/boot';
import { memoryMarkerStore, skill } from '@/db/testing';
import { MODULES } from '@/features/registry';
import { routes } from './routes';

const DB = 'screens-test';

beforeEach(async () => {
  const outcome = await bootDatabase({
    name: DB,
    snapshotName: `${DB}-snap`,
    markerStore: memoryMarkerStore(),
  });
  if (outcome.status !== 'ready') throw new Error('test database failed to boot');
});

afterEach(async () => {
  cleanup(); // unmount first: live queries must not run against a closed database
  closeActiveDb();
  await Dexie.delete(DB);
  await Dexie.delete(`${DB}-snap`);
});

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('Home (dashboard)', () => {
  it('shows today’s goal from the setting (default 20 min) with nothing recorded', async () => {
    renderAt('/');
    const today = await screen.findByRole('region', { name: 'Today' });
    expect(await within(today).findByText('0/20')).toBeInTheDocument();
    expect(within(today).getByText(/No training recorded yet/)).toHaveTextContent('20 min a day');
    expect(screen.getByRole('progressbar', { name: 'Daily training goal' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('follows the daily-goal setting live', async () => {
    renderAt('/');
    await screen.findByText('0/20');
    await getDb().settings.put({ key: 'dailyGoalMinutes', value: 45, updatedAt: 1 });
    expect(await screen.findByText('0/45')).toBeInTheDocument();
  });

  it('is honest about data that does not exist yet instead of inventing it', async () => {
    renderAt('/');
    expect(await screen.findByText('Nothing recommended yet')).toBeInTheDocument();
    expect(await screen.findByText('No skills yet')).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.queryByText(/streak/i)).toBeNull();
    expect(screen.queryByText(/\bXP\b/)).toBeNull();
  });

  it('counts real skills and ignores deleted ones', async () => {
    await getDb().skills.bulkAdd([
      skill('a', 'A'),
      skill('b', 'B'),
      { ...skill('c', 'C'), deletedAt: 5 },
    ]);
    renderAt('/');
    expect(await screen.findByText('2 skills tracked')).toBeInTheDocument();
  });

  it('points to Practice, the only place where sessions can start', async () => {
    const router = renderAt('/');
    await userEvent.click(await screen.findByRole('link', { name: 'Browse practice' }));
    expect(router.state.location.pathname).toBe('/practice');
  });
});

describe('Practice hub', () => {
  it('lists every module from the registry, none tappable, all marked Coming soon', async () => {
    renderAt('/practice');
    await screen.findByRole('heading', { name: 'Practice', level: 1 });
    for (const module of MODULES) {
      expect(screen.getByText(module.title)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Coming soon')).toHaveLength(MODULES.length);
    const main = screen.getByRole('main', { hidden: true });
    expect(within(main).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByText(/No module is available yet/)).toBeInTheDocument();
  });
});

describe('Settings → daily goal', () => {
  it('adjusts and persists the goal in 5-minute steps', async () => {
    renderAt('/settings');
    await screen.findByText('20 min');
    await userEvent.click(screen.getByRole('button', { name: 'Increase daily goal' }));
    expect(await screen.findByText('25 min')).toBeInTheDocument();
    await waitFor(async () =>
      expect((await getDb().settings.get('dailyGoalMinutes'))?.value).toBe(25),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Decrease daily goal' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrease daily goal' }));
    expect(await screen.findByText('15 min')).toBeInTheDocument();
  });
});
