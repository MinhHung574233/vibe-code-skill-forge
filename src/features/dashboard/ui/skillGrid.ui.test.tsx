import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { loadSessionDraft, saveSessionDraft } from '@/features/training/data/sessionDraft';
import { createSkill, recordSession, renderAt, setupAppDatabase } from '@/test/appHarness';

setupAppDatabase('skill-grid-test');

describe('Home skill grid', () => {
  it('lists every skill as a tile with this week’s minutes and a way to start', async () => {
    const rubik = await createSkill('Rubik');
    await createSkill('Java', { weeklyGoalMinutes: 120 });
    await createSkill('Chess');
    await createSkill('Go');
    await createSkill('Caro'); // more than the old four-row limit
    await recordSession({ skillId: rubik.id, minutes: 30 });
    renderAt('/');

    const grid = await screen.findByRole('list', { name: 'Your skills' });
    const tiles = within(grid).getAllByRole('listitem');
    expect(tiles).toHaveLength(5 + 1); // five skills and the "Add or edit skills" tile
    expect(within(grid).getByText('Rubik')).toBeInTheDocument();
    expect(within(grid).getByText('30 min this week')).toBeInTheDocument();
    expect(within(grid).getAllByRole('link', { name: /Start timer/ })).toHaveLength(5);
    expect(within(grid).getByRole('link', { name: 'Add or edit skills' })).toHaveAttribute(
      'href',
      '/skills',
    );
  });

  it('one tap on a tile starts the timer for that skill, once, with no second screen', async () => {
    await createSkill('Rubik');
    const java = await createSkill('Java');
    const router = renderAt('/');
    const tile = (await screen.findByText('Java')).closest('a');
    expect(tile).not.toBeNull();
    await userEvent.click(tile!);

    expect(await screen.findByRole('timer', { name: 'Elapsed time' })).toBeInTheDocument();
    const draft = await loadSessionDraft(getDb());
    expect(draft?.skillId).toBe(java.id);
    // the one-shot flag is gone, so a reload or Back cannot start another timer
    await waitFor(() => expect(router.state.location.search).not.toContain('autostart'));
  });

  it('does not replace a timer that is already running', async () => {
    const rubik = await createSkill('Rubik');
    const java = await createSkill('Java');
    await saveSessionDraft(
      getDb(),
      { sessionId: 'running-1', startedAt: Date.now() - 60_000, skillId: rubik.id },
      Date.now(),
    );
    renderAt(`/practice/session?skill=${java.id}&autostart=1`);
    await screen.findByRole('timer', { name: 'Elapsed time' });
    const draft = await loadSessionDraft(getDb());
    expect(draft).toMatchObject({ sessionId: 'running-1', skillId: rubik.id });
  });

  it('with no skills it still offers to add some', async () => {
    renderAt('/');
    expect(await screen.findByText('No skills yet')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Your skills' })).not.toBeInTheDocument();
  });
});
