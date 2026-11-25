import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { createSkill, recordSession, renderAt, setupAppDatabase } from '@/test/appHarness';
import { loadSessionDraft, saveSessionDraft } from '../data/sessionDraft';

setupAppDatabase('training-ui-test');

describe('Session timer', () => {
  it('starts for the chosen skill and persists the running timer', async () => {
    const skill = await createSkill('Rubik');
    renderAt(`/practice/session?skill=${skill.id}`);
    await screen.findByRole('button', { name: 'Start' });
    await waitFor(() => expect(screen.getByLabelText('Skill')).toHaveValue(skill.id));

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(await screen.findByRole('timer', { name: 'Elapsed time' })).toHaveTextContent('00:0');
    const draft = await loadSessionDraft(getDb());
    expect(draft).toMatchObject({ skillId: skill.id });
    expect(draft?.sessionId).toBeTruthy();
    // Under a minute: cannot be saved yet, and the button says why.
    expect(screen.getByRole('button', { name: 'Finish (after 1 minute)' })).toBeDisabled();
  });

  it('resumes a timer that was running before a reload', async () => {
    await saveSessionDraft(
      getDb(),
      { sessionId: 'resume-1', startedAt: Date.now() - (5 * 60 + 7) * 1000 },
      Date.now(),
    );
    renderAt('/practice/session');
    const timer = await screen.findByRole('timer', { name: 'Elapsed time' });
    expect(timer).toHaveTextContent(/^05:0[7-9]$/);
    expect(screen.getByRole('button', { name: 'Finish and save' })).toBeEnabled();
  });

  it('finishing records the session, awards XP once, and shows what it earned', async () => {
    const skill = await createSkill('Java');
    await saveSessionDraft(
      getDb(),
      { sessionId: 'finish-1', startedAt: Date.now() - 8 * 60 * 1000, skillId: skill.id },
      Date.now(),
    );
    const router = renderAt('/practice/session');
    await userEvent.type(await screen.findByLabelText('Notes'), 'streams');
    await userEvent.click(screen.getByRole('button', { name: 'Finish and save' }));

    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+10 XP')).toBeInTheDocument();
    expect(within(saved).getByText('1-day streak')).toBeInTheDocument();
    expect(within(saved).getByText('First session')).toBeInTheDocument();

    expect(await getDb().sessions.get('finish-1')).toMatchObject({
      source: 'timer',
      skillId: skill.id,
      notes: 'streams',
      moduleId: 'general',
    });
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await loadSessionDraft(getDb())).toBeNull(); // the running timer is cleared

    await userEvent.click(within(saved).getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('short timed sessions are saved but say why there is no XP', async () => {
    await saveSessionDraft(
      getDb(),
      { sessionId: 'short-1', startedAt: Date.now() - 2 * 60 * 1000 },
      Date.now(),
    );
    renderAt('/practice/session');
    await userEvent.click(await screen.findByRole('button', { name: 'Finish and save' }));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('No XP this time')).toBeInTheDocument();
    expect(within(saved).getByText(/under 5 minutes/)).toBeInTheDocument();
  });

  it('discard asks first, then drops the timer without saving anything', async () => {
    await saveSessionDraft(
      getDb(),
      { sessionId: 'drop-1', startedAt: Date.now() - 3 * 60 * 1000 },
      Date.now(),
    );
    renderAt('/practice/session');
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    const confirm = await screen.findByRole('dialog', { name: 'Discard this session?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));

    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(await loadSessionDraft(getDb())).toBeNull();
    expect(await getDb().sessions.count()).toBe(0);
  });

  it('refuses to save a timer that ran for more than 12 hours', async () => {
    await saveSessionDraft(
      getDb(),
      { sessionId: 'stale-1', startedAt: Date.now() - 13 * 3600 * 1000 },
      Date.now(),
    );
    renderAt('/practice/session');
    expect(await screen.findByText(/over 12 hours/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finish and save' })).toBeDisabled();
  });

  it('ignores a corrupt draft instead of crashing', async () => {
    await getDb().drafts.put({ key: 'session', value: { garbage: true }, updatedAt: 1 });
    renderAt('/practice/session');
    expect(await screen.findByRole('button', { name: 'Start' })).toBeInTheDocument();
  });
});

describe('Progress', () => {
  it('starts empty with a clear message, and locked achievements', async () => {
    renderAt('/progress');
    expect(await screen.findByText('No training recorded yet')).toBeInTheDocument();
    expect(screen.getByText('First session')).toBeInTheDocument();
    expect(screen.queryByText(/Unlocked/)).toBeNull();
    expect(screen.getByText('Needs the English module')).toBeInTheDocument();
    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('shows real totals, consistency, time by skill, history and unlocked achievements', async () => {
    const rubik = await createSkill('Rubik');
    const java = await createSkill('Java');
    await recordSession({ minutes: 30, skillId: rubik.id });
    await recordSession({ minutes: 10, skillId: java.id, endedMinutesAgo: 24 * 60 });
    await recordSession({ minutes: 20, endedMinutesAgo: 24 * 60 + 60 });
    renderAt('/progress');

    expect(
      await screen.findByText('1 h over the last 7 days, trained on 2 of 7 days.'),
    ).toBeInTheDocument(); // 60 min in 7 days
    expect(screen.getByText('Active days')).toBeInTheDocument();
    expect(screen.getByText('2/7')).toBeInTheDocument();
    expect(screen.getByText('Consistency 29%')).toBeInTheDocument();

    const donut = screen.getByLabelText('Time by skill');
    expect(within(donut).getByText('Rubik')).toBeInTheDocument();
    expect(within(donut).getByText('Java')).toBeInTheDocument();
    expect(within(donut).getByText('No specific skill')).toBeInTheDocument();
    expect(within(donut).getByText('30 min · 50%')).toBeInTheDocument();

    // 3 sessions / 60 minutes in total unlock exactly: First session and First hour.
    expect(await screen.findAllByText(/^Unlocked /)).toHaveLength(2);
    expect(screen.getAllByText('Practice session').length).toBeGreaterThan(0);
  });

  it('switches between 7 and 30 days', async () => {
    const skill = await createSkill('Chess');
    await recordSession({ minutes: 15, skillId: skill.id });
    await recordSession({ minutes: 45, skillId: skill.id, endedMinutesAgo: 20 * 24 * 60 });
    renderAt('/progress');
    expect(await screen.findByText(/^15 min over the last 7 days/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));
    expect(
      await screen.findByText('1 h over the last 30 days, trained on 2 of 30 days.'),
    ).toBeInTheDocument();
  });
});
