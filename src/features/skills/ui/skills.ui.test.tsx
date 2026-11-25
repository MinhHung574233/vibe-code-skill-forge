import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import {
  createSkill,
  recordSession,
  renderAt,
  skillRepo,
  setupAppDatabase,
} from '@/test/appHarness';
import { SUGGESTED_SKILLS } from '../domain/skill';

setupAppDatabase('skills-ui-test');

describe('Skills list', () => {
  it('offers the suggested skills and a custom one when empty', async () => {
    renderAt('/skills');
    expect(await screen.findByText('No skills yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add the 7 suggested skills' }));
    for (const s of SUGGESTED_SKILLS) expect(await screen.findByText(s.name)).toBeInTheDocument();
    expect(await getDb().skills.count()).toBe(SUGGESTED_SKILLS.length);
    expect(screen.queryByText('No skills yet')).toBeNull();
  });

  it('creates a skill with a weekly goal through the form', async () => {
    renderAt('/skills');
    await userEvent.click(await screen.findByRole('button', { name: 'Create my own' }));
    const form = await screen.findByRole('dialog', { name: 'New skill' });

    await userEvent.type(within(form).getByLabelText('Name'), 'Algorithms');
    await userEvent.selectOptions(within(form).getByLabelText('Category'), 'technical');
    await userEvent.click(within(form).getByRole('radio', { name: 'High' }));
    await userEvent.type(within(form).getByLabelText('Weekly goal (minutes)'), '90');
    await userEvent.click(within(form).getByRole('button', { name: 'Add skill' }));

    expect(await screen.findByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText(/0 min of 1 h 30 min this week/)).toBeInTheDocument();
    const [saved] = await skillRepo().list();
    expect(saved).toMatchObject({
      name: 'Algorithms',
      category: 'technical',
      priority: 1,
      weeklyGoalMinutes: 90,
    });
  });

  it('explains what is wrong instead of saving an invalid skill', async () => {
    renderAt('/skills');
    await userEvent.click(await screen.findByRole('button', { name: 'Create my own' }));
    const form = await screen.findByRole('dialog', { name: 'New skill' });

    await userEvent.click(within(form).getByRole('button', { name: 'Add skill' }));
    expect(await within(form).findByText('Give the skill a name.')).toBeInTheDocument();

    await userEvent.type(within(form).getByLabelText('Name'), 'Valid');
    await userEvent.type(within(form).getByLabelText('Weekly goal (minutes)'), '3');
    await userEvent.click(within(form).getByRole('button', { name: 'Add skill' }));
    expect(await within(form).findByText(/at least 10 minutes/)).toBeInTheDocument();

    await userEvent.clear(within(form).getByLabelText('Weekly goal (minutes)'));
    await userEvent.type(within(form).getByLabelText('Weekly goal (minutes)'), 'abc');
    await userEvent.click(within(form).getByRole('button', { name: 'Add skill' }));
    expect(await within(form).findByText('Enter a whole number of minutes.')).toBeInTheDocument();
    expect(await getDb().skills.count()).toBe(0);
  });

  it('hides archived skills until asked', async () => {
    const keep = await createSkill('Active one');
    const old = await createSkill('Old one');
    await skillRepo().setArchived(old.id, true);
    renderAt('/skills');
    expect(await screen.findByText(keep.name)).toBeInTheDocument();
    expect(screen.queryByText('Old one')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show archived' }));
    expect(await screen.findByText('Old one')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});

describe('Skill detail', () => {
  it('shows this week’s time against the goal, totals, and the skill’s sessions', async () => {
    const skill = await createSkill('Rubik', { weeklyGoalMinutes: 100 });
    await recordSession({ minutes: 25, skillId: skill.id, notes: 'PLL' });
    renderAt(`/skills/${skill.id}`);

    expect(await screen.findByRole('heading', { name: 'Rubik', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('Goal 1 h 40 min a week')).toBeInTheDocument();
    // The weekly minutes load a moment after the skill itself.
    await waitFor(() =>
      expect(screen.getByRole('progressbar', { name: 'Rubik weekly goal' })).toHaveAttribute(
        'aria-valuenow',
        '25',
      ),
    );
    expect(screen.getByText('PLL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start a session' })).toHaveAttribute(
      'href',
      `/practice/session?skill=${skill.id}`,
    );
    expect(screen.getByRole('link', { name: 'Back to Skills' })).toHaveAttribute('href', '/skills');
  });

  it('edits the skill', async () => {
    const skill = await createSkill('Old name');
    renderAt(`/skills/${skill.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const form = await screen.findByRole('dialog', { name: 'Edit skill' });
    const name = within(form).getByLabelText('Name');
    expect(name).toHaveValue('Old name');
    await userEvent.clear(name);
    await userEvent.type(name, 'New name');
    await userEvent.click(within(form).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('heading', { name: 'New name', level: 1 })).toBeInTheDocument();
  });

  it('archives and unarchives', async () => {
    const skill = await createSkill('Chess');
    renderAt(`/skills/${skill.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Archive' }));
    expect(await screen.findByRole('button', { name: 'Unarchive' })).toBeInTheDocument();
    expect((await getDb().skills.get(skill.id))?.isArchived).toBe(1);
  });

  it('deleting asks first, keeps recorded sessions, and returns to the list', async () => {
    const skill = await createSkill('Go');
    await recordSession({ minutes: 15, skillId: skill.id });
    const router = renderAt(`/skills/${skill.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete skill' }));
    const confirm = await screen.findByRole('dialog', { name: /Delete “Go”\?/ });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete skill' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/skills'));
    expect((await getDb().skills.get(skill.id))?.deletedAt).toBeDefined();
    expect(await getDb().sessions.count()).toBe(1); // history survives
    expect(await getDb().dailySummary.count()).toBe(1);
  });

  it('shows a clear message for a skill that does not exist', async () => {
    renderAt('/skills/does-not-exist');
    expect(await screen.findByText('Skill not found')).toBeInTheDocument();
  });
});
