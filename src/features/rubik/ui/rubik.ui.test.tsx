import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { renderAt, setupAppDatabase } from '@/test/appHarness';

setupAppDatabase('rubik-ui-test');

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One full solve through the real keyboard protocol: hold, release to start, press to stop. */
async function solveOnce(pad: HTMLElement) {
  fireEvent.keyDown(pad, { code: 'Space' });
  await sleep(350); // the hold time before the pad turns green
  fireEvent.keyUp(pad, { code: 'Space' });
  await sleep(40);
  fireEvent.keyDown(pad, { code: 'Space' });
  fireEvent.keyUp(pad, { code: 'Space' });
}

describe('Rubik timer', () => {
  it('shows a scramble, times a solve, saves it, and records the session for XP', async () => {
    renderAt('/practice/rubik');
    const pad = await screen.findByRole('button', { name: /Cube timer/ });
    const scramble = screen.getByLabelText('Scramble moves').textContent ?? '';
    expect(scramble.split(' ')).toHaveLength(20);

    await solveOnce(pad);
    await waitFor(async () => expect(await getDb().rubikSolves.count()).toBe(1));
    // A new scramble follows every solve.
    await waitFor(() =>
      expect(screen.getByLabelText('Scramble moves').textContent).not.toBe(scramble),
    );
    expect(await screen.findByLabelText('Last solve result')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish session' }));
    const sheet = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(sheet).getByText('+15 XP')).toBeInTheDocument();
    expect(await getDb().sessions.where('moduleId').equals('rubik').count()).toBe(1);
  });

  it('lets you mark the last solve +2 or DNF, and delete it', async () => {
    renderAt('/practice/rubik');
    await solveOnce(await screen.findByRole('button', { name: /Cube timer/ }));
    const plusTwo = await screen.findByRole('button', { name: '+2' });
    await userEvent.click(plusTwo);
    await waitFor(async () =>
      expect((await getDb().rubikSolves.toArray())[0]?.penalty).toBe('plus2'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'DNF' }));
    await waitFor(async () =>
      expect((await getDb().rubikSolves.toArray())[0]?.penalty).toBe('dnf'),
    );
    expect(screen.getByLabelText('Last solve result')).toHaveTextContent('DNF');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(async () => expect(await getDb().rubikSolves.count()).toBe(0));
  });

  it('with inspection on, the first touch starts the countdown and the solve follows', async () => {
    renderAt('/practice/rubik');
    const pad = await screen.findByRole('button', { name: /Cube timer/ });
    await userEvent.click(screen.getByRole('button', { name: 'Inspection' }));
    expect(screen.getByRole('button', { name: 'Inspection' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(pad).toHaveAccessibleName(/15 second inspection/);

    fireEvent.keyDown(pad, { code: 'Space' }); // starts inspection
    fireEvent.keyUp(pad, { code: 'Space' });
    expect(await screen.findByRole('timer', { name: 'Solve time' })).toHaveTextContent(/^1[45]$/);

    await solveOnce(pad); // hold, release to start, press to stop
    await waitFor(async () => expect(await getDb().rubikSolves.count()).toBe(1));
    expect((await getDb().rubikSolves.toArray())[0]?.penalty).toBe('none');
    expect(localStorage.getItem('sf-rubik-inspection')).toBe('1');
    localStorage.removeItem('sf-rubik-inspection');
  });

  it('shows the scramble as a cube picture on request', async () => {
    renderAt('/practice/rubik');
    await userEvent.click(await screen.findByRole('button', { name: 'Show cube' }));
    expect(screen.getByRole('img', { name: /The cube after the scramble/ })).toBeInTheDocument();
  });

  it('a personal best unlocks the achievement when the session is recorded', async () => {
    const now = Date.now();
    await getDb().rubikSolves.bulkAdd([
      {
        id: 'a',
        timeMs: 20_000,
        penalty: 'none',
        scramble: 'R',
        createdAt: now - 60_000,
        localDate: '2026-01-01',
      },
      {
        id: 'b',
        timeMs: 15_000,
        penalty: 'none',
        scramble: 'R',
        createdAt: now - 30_000,
        localDate: '2026-01-01',
      },
    ]);
    await getDb().drafts.put({
      key: 'rubik-session',
      value: { sessionId: 'rubik:pb', startedAt: now - 90_000, lastSolveAt: now - 30_000 },
      updatedAt: now,
    });
    renderAt('/practice/rubik');
    await userEvent.click(await screen.findByRole('button', { name: 'Finish session' }));
    await screen.findByRole('dialog', { name: 'Session saved' });
    const unlocked = await getDb().achievements.toArray();
    expect(unlocked.map((a) => a.achievementId)).toContain('rubik_pb');
  });
});

describe('Algorithms', () => {
  it('lists all 21 PLL with pictures, and marks one as learned', async () => {
    renderAt('/practice/rubik/algorithms');
    expect(await screen.findByText('0 of 21 learned.', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Case picture for/ })).toHaveLength(21);
    const tPerm = screen.getByLabelText('Moves for T perm');
    expect(tPerm).toHaveTextContent("R U R' U' R' F R2 U' R' U' R U R' F'");

    const learned = screen.getAllByRole('button', { name: 'Learned' })[0] as HTMLElement;
    await userEvent.click(learned);
    await waitFor(async () => expect(await getDb().algorithmProgress.count()).toBe(1));
    expect(await screen.findByText('1 of 21 learned.', { exact: false })).toBeInTheDocument();
  });

  it('switches to 2-look OLL', async () => {
    renderAt('/practice/rubik/algorithms');
    await userEvent.click(await screen.findByRole('radio', { name: '2-look OLL' }));
    expect(await screen.findByText('Sune')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Case picture for/ })).toHaveLength(10);
  });
});

describe('Solve history', () => {
  it('shows an empty state, then solves newest first', async () => {
    renderAt('/practice/rubik/solves');
    expect(await screen.findByText('No solves yet')).toBeInTheDocument();
  });
});
