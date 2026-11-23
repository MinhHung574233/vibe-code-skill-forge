import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb } from '@/db/boot';
import { memoryMarkerStore } from '@/db/testing';
import { routes } from './routes';
import { TABS } from './tabs';

const DB = 'app-shell-test';

// The shell reads settings and counts rows, so it needs a real (fake-indexeddb) database,
// exactly as it gets below the BootGate in the app.
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

describe('app shell', () => {
  it('shows the five root tabs in the primary navigation', () => {
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    const labels = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['Home', 'Skills', 'Practice', 'Progress', 'Settings']);
    expect(TABS).toHaveLength(5);
  });

  it('navigates between tabs and marks the active one', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');
    await user.click(screen.getByRole('link', { name: 'Progress' }));
    expect(router.state.location.pathname).toBe('/progress');
    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders the settings screen with its sections', () => {
    renderAt('/settings');
    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    for (const title of ['Appearance', 'Offline', 'Your data', 'About']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('renders a not-found screen for unknown routes', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  });
});
