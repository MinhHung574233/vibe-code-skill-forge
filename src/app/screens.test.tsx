import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { MODULES } from '@/features/registry';
import { createSkill, recordSession, renderAt, setupAppDatabase } from '@/test/appHarness';

setupAppDatabase('screens-test');

describe('Home for a new user', () => {
  it('shows an empty, honest dashboard with the default 20-minute goal', async () => {
    renderAt('/');
    const today = await screen.findByRole('region', { name: 'Today' });
    expect(await within(today).findByText('0/20')).toBeInTheDocument();
    expect(within(today).getByText(/No training yet/)).toHaveTextContent('20 min a day');
    expect(screen.getByText('No streak yet')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Your status')).getByText('Level 1')).toBeInTheDocument();
    expect(await screen.findByText('Add your first skill')).toBeInTheDocument();
    expect(screen.getByText('No skills yet')).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('follows the daily-goal setting live', async () => {
    renderAt('/');
    await screen.findByText('0/20');
    await getDb().settings.put({ key: 'dailyGoalMinutes', value: 45, updatedAt: 1 });
    expect(await screen.findByText('0/45')).toBeInTheDocument();
  });

  it('starts a session from Home', async () => {
    const router = renderAt('/');
    await userEvent.click(await screen.findByRole('link', { name: 'Start a session' }));
    expect(router.state.location.pathname).toBe('/practice/session');
  });
});

describe('Home with recorded training', () => {
  it('shows real minutes, streak, level progress and recent activity', async () => {
    const skill = await createSkill('Rubik', { weeklyGoalMinutes: 120 });
    await recordSession({ minutes: 12, skillId: skill.id, notes: 'F2L drills' });
    renderAt('/');

    const today = await screen.findByRole('region', { name: 'Today' });
    expect(await within(today).findByText('12/20')).toBeInTheDocument();
    expect(screen.getByText('1-day streak')).toBeInTheDocument();
    expect(screen.getByText('10 / 100 XP')).toBeInTheDocument(); // 10 XP for a 12-minute timed session
    expect(within(today).getByText('12 min of 20 min.')).toBeInTheDocument();

    // Skills: weekly progress against the goal. Recent activity: the session with its note.
    expect(await screen.findByText(/12 min \/ 2 h this week/)).toBeInTheDocument();
    expect(screen.getByText('F2L drills')).toBeInTheDocument();
    expect(screen.queryByText('No activity yet')).toBeNull();
  });

  it('suggests training the skill with the biggest weekly gap, linking to a pre-filled session', async () => {
    const skill = await createSkill('Chess', { weeklyGoalMinutes: 300 });
    renderAt('/');
    const link = await screen.findByRole('link', { name: /min to today’s goal/ });
    expect(link).toHaveAttribute('href', `/practice/session?skill=${skill.id}`);
  });

  it('warns that the streak is at risk when yesterday was trained but today was not', async () => {
    const skill = await createSkill('Go');
    await recordSession({ minutes: 20, skillId: skill.id, endedMinutesAgo: 24 * 60 });
    renderAt('/');
    expect(await screen.findByText('Train today to keep your streak.')).toBeInTheDocument();
    expect(screen.getByText('1-day streak')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Keep your 1-day streak/ })).toBeInTheDocument();
  });
});

describe('Practice hub', () => {
  it('lets you start or log a session, and lists every module (built ones open, the rest coming soon)', async () => {
    renderAt('/practice');
    const train = await screen.findByRole('region', { name: 'Train' });
    expect(within(train).getByRole('link', { name: 'Start a session' })).toHaveAttribute(
      'href',
      '/practice/session',
    );
    expect(within(train).getByRole('button', { name: 'Log a session' })).toBeInTheDocument();

    for (const module of MODULES) expect(screen.getByText(module.title)).toBeInTheDocument();
    const planned = MODULES.filter((m) => m.status === 'planned');
    const open = MODULES.filter((m) => m.status === 'available');
    if (planned.length > 0) expect(screen.getAllByText('Coming soon')).toHaveLength(planned.length);
    else expect(screen.queryByText('Coming soon')).toBeNull();
    // Built modules are links; planned ones are not. The rest of the links is the Start button.
    const main = screen.getByRole('main', { hidden: true });
    expect(
      within(main)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Start a session', ...open.map((m) => m.title + m.subtitle)]);
  });

  it('logs a session by hand and explains that it earns time but no XP', async () => {
    const skill = await createSkill('English');
    renderAt('/practice');
    await userEvent.click(await screen.findByRole('button', { name: 'Log a session' }));
    const form = await screen.findByRole('dialog', { name: 'Log a session' });

    await within(form).findByRole('option', { name: 'English' }); // skills load asynchronously
    await userEvent.selectOptions(within(form).getByLabelText('Skill'), skill.id);
    await userEvent.type(within(form).getByLabelText('Minutes'), '45');
    await userEvent.type(within(form).getByLabelText('Notes'), 'flashcards');
    await userEvent.click(within(form).getByRole('button', { name: 'Save session' }));

    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('No XP this time')).toBeInTheDocument();
    expect(within(saved).getByText(/earn no XP/)).toBeInTheDocument();
    expect(within(saved).getByText('First session')).toBeInTheDocument();

    const sessions = await getDb().sessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      source: 'manual',
      skillId: skill.id,
      durationSec: 2700,
      notes: 'flashcards',
    });
  });

  it('shows validation messages instead of saving bad input', async () => {
    renderAt('/practice');
    await userEvent.click(await screen.findByRole('button', { name: 'Log a session' }));
    const form = await screen.findByRole('dialog', { name: 'Log a session' });
    await userEvent.click(within(form).getByRole('button', { name: 'Save session' }));
    expect(await within(form).findByText('Enter the minutes.')).toBeInTheDocument();

    await userEvent.type(within(form).getByLabelText('Minutes'), '9999');
    await userEvent.click(within(form).getByRole('button', { name: 'Save session' }));
    expect(await within(form).findByText(/At most 12 hours/)).toBeInTheDocument();
    expect(await getDb().sessions.count()).toBe(0);
  });
});

describe('Settings → training rules', () => {
  it('adjusts and persists the daily goal in 5-minute steps', async () => {
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

  it('switches the streak rule and persists it', async () => {
    renderAt('/settings');
    const group = await screen.findByRole('radiogroup', { name: 'Streak rule' });
    await waitFor(() =>
      expect(within(group).getByRole('radio', { name: 'Any session' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
    await userEvent.click(within(group).getByRole('radio', { name: 'Goal reached' }));
    await waitFor(async () =>
      expect((await getDb().settings.get('streakRule'))?.value).toBe('goal_met'),
    );
  });
});
