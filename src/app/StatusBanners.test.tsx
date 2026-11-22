import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dexie from 'dexie';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootDatabase, closeActiveDb, getDb } from '@/db/boot';
import { memoryMarkerStore, skill } from '@/db/testing';
import { usePwaStore } from '@/pwa/pwaStore';
import { StatusBanners } from './StatusBanners';

const DB = 'banners-test';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const originalUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', { value, configurable: true });
}

const initialPwa = usePwaStore.getState();

beforeEach(async () => {
  const outcome = await bootDatabase({
    name: DB,
    snapshotName: `${DB}-snap`,
    markerStore: memoryMarkerStore(),
  });
  if (outcome.status !== 'ready') throw new Error('test database failed to boot');
  usePwaStore.setState({ ...initialPwa, needRefresh: false, readiness: { state: 'unknown' } });
});

afterEach(async () => {
  setUserAgent(originalUserAgent);
  closeActiveDb();
  await Dexie.delete(DB);
  await Dexie.delete(`${DB}-snap`);
});

const renderBanners = () =>
  render(
    <MemoryRouter>
      <StatusBanners />
    </MemoryRouter>,
  );

describe('StatusBanners', () => {
  it('shows nothing on a clean, installed, healthy app', async () => {
    renderBanners();
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  });

  it('offers a restart when an update is waiting, and applies it on tap', async () => {
    const applyUpdate = vi.fn().mockResolvedValue(undefined);
    usePwaStore.setState({ needRefresh: true, applyUpdate });
    renderBanners();
    expect(screen.getByRole('status')).toHaveTextContent('An update is ready.');
    await userEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('asks to repair missing offline files', async () => {
    const repairReadiness = vi.fn().mockResolvedValue(undefined);
    usePwaStore.setState({
      readiness: { state: 'incomplete', expected: 65, missing: 3 },
      repairReadiness,
    });
    renderBanners();
    expect(screen.getByRole('status')).toHaveTextContent(/offline files are missing/i);
    await userEvent.click(screen.getByRole('button', { name: 'Repair' }));
    expect(repairReadiness).toHaveBeenCalledTimes(1);
  });

  it('reminds the user to make a first backup once data exists', async () => {
    await getDb().skills.add(skill('s1', 'Rubik'));
    renderBanners();
    expect(await screen.findByText(/not backed up yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back up' })).toHaveAttribute('href', '/settings');
  });

  it('is quiet about backups right after one was made', async () => {
    await getDb().skills.add(skill('s1', 'Rubik'));
    await getDb().settings.bulkPut([
      { key: 'lastBackupAt', value: Date.now(), updatedAt: 1 },
      { key: 'lastBackupRowCount', value: 1, updatedAt: 1 },
    ]);
    renderBanners();
    await waitFor(() => expect(screen.queryByText(/backed up|backup was/i)).toBeNull());
  });

  it('shows only the highest-priority banner: update beats offline repair beats backup', async () => {
    await getDb().skills.add(skill('s1', 'Rubik'));
    usePwaStore.setState({
      needRefresh: true,
      readiness: { state: 'incomplete', expected: 65, missing: 3 },
    });
    renderBanners();
    expect(await screen.findByText('An update is ready.')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.queryByText(/offline files/i)).toBeNull();
  });

  it('offers Add to Home Screen on iOS outside the installed app, and stops once dismissed', async () => {
    setUserAgent(IPHONE);
    renderBanners();
    const how = await screen.findByRole('button', { name: 'How' });
    await userEvent.click(how);
    const sheet = await screen.findByRole('dialog', { name: /Add SkillForge to your Home Screen/ });
    expect(sheet).toHaveTextContent(/Share/);
    expect(sheet).toHaveTextContent(/own storage/i);

    await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'How' })).toBeNull());
    expect((await getDb().settings.get('installCoachDismissedAt'))?.value).toEqual(
      expect.any(Number),
    );
  });

  it('never shows the install banner on a non-iOS browser', async () => {
    renderBanners();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'How' })).toBeNull());
  });
});
