import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { BootOutcome } from '@/db/boot';
import type { SkillForgeDB } from '@/db/schema';
import { BootGate } from './BootGate';
import type { BootHooks } from './bootApp';

const ready: BootOutcome = {
  status: 'ready',
  db: {} as SkillForgeDB,
  migratedFrom: null,
  snapshotTaken: false,
};

const recovery = (
  reason: Extract<BootOutcome, { status: 'recovery' }>['reason'],
  hasSnapshot = false,
): BootOutcome => ({
  status: 'recovery',
  reason,
  message: `message for ${reason}`,
  hasSnapshot,
});

describe('BootGate', () => {
  it('shows a busy indicator, then the app once the database is ready', async () => {
    let finish: (o: BootOutcome) => void = () => undefined;
    const boot = vi.fn(() => new Promise<BootOutcome>((resolve) => (finish = resolve)));
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    expect(screen.getByRole('status', { name: 'Loading SkillForge' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByText('the app')).toBeNull();

    await act(async () => {
      finish(ready);
      await Promise.resolve();
    });
    expect(await screen.findByText('the app')).toBeInTheDocument();
    expect(boot).toHaveBeenCalledTimes(1);
  });

  it('never renders the app when recovery is needed; Try again re-runs boot', async () => {
    const boot = vi
      .fn<(h: BootHooks) => Promise<BootOutcome>>()
      .mockResolvedValueOnce(recovery('open-failed'))
      .mockResolvedValueOnce(ready);
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('message for open-failed');
    expect(screen.queryByText('the app')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('the app')).toBeInTheDocument();
    expect(boot).toHaveBeenCalledTimes(2);
  });

  it('offers only the actions that fit the reason', async () => {
    const boot = vi.fn().mockResolvedValue(recovery('data-loss-suspected', true));
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    await screen.findByRole('alert');
    expect(
      screen.getByRole('button', { name: /Restore the copy saved before the last update/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with empty data' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Erase local data and start over' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('hides the snapshot action when no snapshot exists, and offers no erase when storage is unavailable', async () => {
    const boot = vi.fn().mockResolvedValue(recovery('unavailable', false));
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: /Restore the copy/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Erase local data/ })).toBeNull();
  });

  it('asks for confirmation before erasing', async () => {
    const boot = vi.fn().mockResolvedValue(recovery('open-failed'));
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: 'Erase local data and start over' }));
    expect(
      await screen.findByRole('dialog', { name: 'Erase all local data?' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(boot).toHaveBeenCalledTimes(1);
  });

  it('asks the user to reload when another instance needs the database', async () => {
    let hooks: BootHooks | undefined;
    const boot = vi.fn((h: BootHooks) => {
      hooks = h;
      return Promise.resolve(ready);
    });
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    await screen.findByText('the app');
    act(() => hooks?.onVersionChange());
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Reload to finish updating' }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('the app')).toBeNull();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('treats a crash inside boot as a recovery state, not a blank screen', async () => {
    const boot = vi.fn().mockRejectedValue(new Error('unexpected'));
    render(
      <BootGate boot={boot}>
        <p>the app</p>
      </BootGate>,
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('the app')).toBeNull();
  });
});
