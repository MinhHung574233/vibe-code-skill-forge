import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDb } from '@/db/boot';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import { setupAppDatabase } from '@/test/appHarness';
import { loadDraft, saveDraft, type GoDraft } from '../data/goDraft';
import { chooseMove } from '../domain/ai';
import { restoreGame } from '../domain/game';
import { createRng } from '../domain/rng';
import type { AiEngine } from './aiEngine';
import { GoModule } from './GoModule';

setupAppDatabase('go-ui-test');
afterEach(() => vi.restoreAllMocks());

/** A scripted opponent: a real (easy, seeded) engine move, but it always answers a pass with a pass. */
const scriptedEngine = (): AiEngine => ({
  choose: (game) => {
    const state = restoreGame(game);
    if (!state) return Promise.reject(new Error('bad game'));
    const last = state.moves.at(-1);
    if (last && last.point === null) return Promise.resolve({ kind: 'pass' });
    return Promise.resolve(
      chooseMove(state, { level: 'easy', rng: createRng(5), maxMs: Infinity, playouts: 12 }),
    );
  },
  dispose: () => undefined,
});

function renderGo(path: string) {
  const router = createMemoryRouter(
    [{ path: 'practice/go/*', element: <GoModule createEngine={scriptedEngine} /> }],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const draft = (over: Partial<GoDraft> = {}): GoDraft => ({
  gameId: 'game-1',
  startedAt: Date.now() - 10 * 60_000,
  level: 'easy',
  humanColor: 'black',
  config: { size: 9, komi: 6.5, handicap: 0 },
  moves: [],
  resignedBy: null,
  seed: 3,
  ...over,
});

const OPENINGS = ['E5', 'C3', 'G7', 'C7', 'G3', 'E3', 'E7', 'C5', 'G5', 'E1', 'E9'];

/** Plays the first free point from OPENINGS, once it is the human's turn. */
async function humanMove() {
  await screen.findByText(/Your turn/);
  for (const name of OPENINGS) {
    const point = screen.queryByRole('button', { name: `${name}, empty` });
    if (point) {
      await userEvent.click(point);
      return name;
    }
  }
  throw new Error('no free opening point');
}

describe('Go home', () => {
  it('starts a configured game and saves it as a resumable draft', async () => {
    renderGo('/practice/go');
    await userEvent.click(await screen.findByRole('radio', { name: '13×13' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Hard' }));
    await userEvent.click(screen.getByRole('radio', { name: 'White' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increase Handicap' })); // 0 -> 2: one stone is not a handicap
    // with a handicap the komi falls back to 0.5 until the player edits it
    expect(screen.getByText('0.5 pts')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(await screen.findByRole('group', { name: '13 by 13 Go board' })).toBeInTheDocument();
    const saved = await loadDraft(getDb());
    expect(saved).toMatchObject({
      level: 'hard',
      humanColor: 'white',
      config: { size: 13, komi: 0.5, handicap: 2 },
      moves: [],
    });
  });

  it('asks before a new game replaces the one in progress', async () => {
    await saveDraft(getDb(), draft({ moves: [40] }), Date.now());
    renderGo('/practice/go');
    await userEvent.click(await screen.findByRole('button', { name: 'Start game' }));
    const confirm = await screen.findByRole('dialog', { name: 'Start a new game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect((await loadDraft(getDb()))?.gameId).toBe('game-1'); // untouched
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Start a new game?' })).getByRole('button', {
        name: 'Start new game',
      }),
    );
    await screen.findByRole('group', { name: '9 by 9 Go board' });
    expect((await loadDraft(getDb()))?.gameId).not.toBe('game-1');
  });

  it('offers to resume a game in progress and to discard it', async () => {
    await saveDraft(getDb(), draft({ moves: [40, 30] }), Date.now());
    renderGo('/practice/go');
    expect(await screen.findByText(/2 moves played/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resume game' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Discard it' }));
    const confirm = await screen.findByRole('dialog', { name: 'Discard this game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Resume game' })).toBeNull());
    expect(await loadDraft(getDb())).toBeNull();
  });
});

describe('Playing a game', () => {
  it('plays moves, passes twice to reach scoring, and records the finished game', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderGo('/practice/go/play');

    for (let i = 0; i < 5; i++) await humanMove();
    // the live region and the move list both know what happened
    expect(screen.getAllByText(/^\d+\. Black [A-J]\d$/).length).toBe(5);

    await screen.findByText(/Your turn/);
    await userEvent.click(screen.getByRole('button', { name: 'Pass' })); // the scripted engine passes back

    const scoring = await screen.findByRole('region', { name: 'Scoring' });
    expect(within(scoring).getByText(/komi/)).toBeInTheDocument();
    await userEvent.click(within(scoring).getByRole('button', { name: 'Accept result' }));

    const result = await screen.findByRole('dialog', { name: /^(You won|You lost|Draw)$/ });
    await userEvent.click(within(result).getByRole('button', { name: 'Continue' }));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();

    expect(await getDb().gameRecords.count()).toBe(1);
    const row = await getDb().gameRecords.get('game-1');
    expect(row).toMatchObject({ game: 'go', level: 'easy' });
    expect(row?.details).toMatchObject({ size: 9, handicap: 0, color: 'black', by: 'score' });
    expect(await getDb().sessions.get('game-1')).toMatchObject({
      moduleId: 'go',
      activityType: 'game_session',
    });
    expect(await loadDraft(getDb())).toBeNull(); // nothing left to resume
  });

  it('marking a group dead changes the score before accepting', async () => {
    // Black owns the left with a column of stones; White has one stone inside.
    const moves = [40, 41, 31, 32, 49, 50, 22, 23]; // black/white alternate, no captures
    await saveDraft(getDb(), draft({ moves: [...moves, null, null] }), Date.now());
    renderGo('/practice/go/play');
    const scoring = await screen.findByRole('region', { name: 'Scoring' });
    const before = within(scoring).getByText(/^[BW]\+/).textContent;
    // tap a white stone: it is marked dead, so the result must change
    await userEvent.click(screen.getByRole('button', { name: 'F5, white stone' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('region', { name: 'Scoring' })).getByText(/^[BW]\+/).textContent,
      ).not.toBe(before),
    );
  });

  it('refuses illegal moves with a plain explanation', async () => {
    // Black has surrounded the corner point A9; White playing there would be suicide.
    const moves = [1, 40, 9]; // black B9, white E5, black A8
    await saveDraft(getDb(), draft({ humanColor: 'white', moves }), Date.now());
    renderGo('/practice/go/play');
    await userEvent.click(await screen.findByRole('button', { name: 'A9, empty' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/suicide/);
  });

  it('undo takes back the computer reply together with the move', async () => {
    await saveDraft(getDb(), draft(), Date.now());
    renderGo('/practice/go/play');
    await humanMove();
    await screen.findByText(/Your turn/);
    await waitFor(() => expect(screen.getAllByText(/^\d+\. /).length).toBe(2));
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('No moves yet.')).toBeInTheDocument();
  });

  it('resuming after a reload shows the saved moves', async () => {
    await saveDraft(getDb(), draft({ moves: [40, 30, 50], humanColor: 'white' }), Date.now());
    renderGo('/practice/go/play');
    expect(await screen.findByText('1. Black E5')).toBeInTheDocument();
    expect(screen.getByText('2. White D6')).toBeInTheDocument();
  });

  it('resigning asks first, records nothing and clears the game', async () => {
    await saveDraft(getDb(), draft({ moves: [40, 30] }), Date.now());
    const router = renderGo('/practice/go/play');
    await userEvent.click(await screen.findByRole('button', { name: 'Resign' }));
    const confirm = await screen.findByRole('dialog', { name: 'Resign this game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resign' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/go'));
    expect(await loadDraft(getDb())).toBeNull();
    expect(await getDb().gameRecords.count()).toBe(0);
    expect(await getDb().sessions.count()).toBe(0);
  });

  it('shows an empty state when there is no game', async () => {
    renderGo('/practice/go/play');
    expect(await screen.findByText('No game in progress')).toBeInTheDocument();
  });
});

describe('a game that cannot be saved', () => {
  /** Black has five stones and both sides have passed: only "Accept result" is left. */
  const SCORING = [40, 41, 31, 32, 49, 50, 22, 23, 58, null, null];

  it('keeps the board, offers a retry, and records the result and XP once', async () => {
    const spy = vi
      .spyOn(DexieTrainingEngine.prototype, 'recordSession')
      .mockResolvedValueOnce({ ok: false, error: new Error('IO') } as never);
    await saveDraft(getDb(), draft({ moves: SCORING }), Date.now());
    renderGo('/practice/go/play');
    const scoring = await screen.findByRole('region', { name: 'Scoring' });
    await userEvent.click(within(scoring).getByRole('button', { name: 'Accept result' }));

    const failed = await screen.findByRole('region', { name: 'Result not saved' });
    expect(within(failed).getByRole('alert')).toHaveTextContent(/could not be saved/);
    expect(screen.getByRole('group', { name: '9 by 9 Go board' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept result' })).not.toBeInTheDocument();
    expect(await getDb().xpLedger.count()).toBe(0);
    expect((await loadDraft(getDb()))?.finished).toMatchObject({ dead: [] });

    await userEvent.click(within(failed).getByRole('button', { name: 'Try saving again' }));
    const result = await screen.findByRole('dialog', { name: /^(You won|You lost|Draw)$/ });
    await userEvent.click(within(result).getByRole('button', { name: 'Continue' }));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(await getDb().gameRecords.count()).toBe(1);
    expect(await getDb().sessions.count()).toBe(1);
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await loadDraft(getDb())).toBeNull();
  });

  it('is not lost on leaving: Go home and the game screen both offer the retry', async () => {
    vi.spyOn(DexieTrainingEngine.prototype, 'recordSession').mockRejectedValueOnce(
      new Error('quota'),
    );
    await saveDraft(getDb(), draft({ moves: SCORING }), Date.now());
    renderGo('/practice/go/play');
    await userEvent.click(
      within(await screen.findByRole('region', { name: 'Scoring' })).getByRole('button', {
        name: 'Accept result',
      }),
    );
    await screen.findByRole('region', { name: 'Result not saved' });
    cleanup(); // leave without retrying

    renderGo('/practice/go');
    expect(await screen.findByText('Game not saved yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try saving again' })).toBeInTheDocument();
    cleanup();

    // coming back saves it straight away: the dead stones and end time were kept
    renderGo('/practice/go/play');
    const result = await screen.findByRole('dialog', { name: /^(You won|You lost|Draw)$/ });
    await userEvent.click(within(result).getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('dialog', { name: 'Session saved' })).toBeInTheDocument();
    expect(await getDb().gameRecords.count()).toBe(1);
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await loadDraft(getDb())).toBeNull();
  });

  it('a game the computer resigned, interrupted before saving, is saved on resume', async () => {
    await saveDraft(
      getDb(),
      draft({
        moves: [40, 41, 31, 32, 49, 50, 22, 23, 58],
        resignedBy: 'white',
        finished: { endedAt: Date.now() - 1000, dead: [] },
      }),
      Date.now(),
    );
    renderGo('/practice/go/play');
    const result = await screen.findByRole('dialog', { name: 'You won' });
    expect(within(result).getByText(/wins by resignation/)).toBeInTheDocument();
    expect(await getDb().gameRecords.get('game-1')).toMatchObject({ result: 'win' });
    expect(await loadDraft(getDb())).toBeNull();
  });
});

describe('Tsumego', () => {
  it('lists problems by difficulty and ticks a problem once it is solved', async () => {
    renderGo('/practice/go/tsumego/straight-three-kill');
    const title = await screen.findByRole('heading', { name: 'Straight three: kill', level: 1 });
    expect(title).toBeInTheDocument();
    expect(
      screen.getByText('White to play and kill the group with the triangle'),
    ).toBeInTheDocument();

    // a tempting wrong move: the end of the three
    await userEvent.click(screen.getByRole('button', { name: 'column 3, row 1, empty' }));
    expect(await screen.findByText('Not this move')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    // the vital point
    await userEvent.click(screen.getByRole('button', { name: 'column 4, row 1, empty' }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();

    const progress = await getDb().puzzleProgress.get('straight-three-kill');
    expect(progress).toMatchObject({ game: 'go', solved: 1, attempts: 2 });
    expect(await getDb().sessions.get('go-puzzle:straight-three-kill')).toMatchObject({
      moduleId: 'go',
      result: { kind: 'tsumego', puzzleId: 'straight-three-kill' },
      score: 1,
    });
  });

  it('a solve whose XP could not be saved offers a retry and pays once', async () => {
    vi.spyOn(DexieTrainingEngine.prototype, 'recordSession').mockResolvedValueOnce({
      ok: false,
      error: new Error('IO'),
    } as never);
    renderGo('/practice/go/tsumego/straight-three-kill');
    await userEvent.click(await screen.findByRole('button', { name: 'column 4, row 1, empty' }));
    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    expect(await screen.findByText('Your progress could not be saved.')).toBeInTheDocument();
    expect(await getDb().xpLedger.count()).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Try saving again' }));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+15 XP')).toBeInTheDocument();
    expect(await getDb().xpLedger.count()).toBe(1);
    expect(await getDb().sessions.count()).toBe(1);
    expect(screen.queryByText('Your progress could not be saved.')).not.toBeInTheDocument();
  });

  it('solving again earns nothing more, and a revealed answer is not a solve', async () => {
    const router = renderGo('/practice/go/tsumego/straight-three-live');
    await userEvent.click(await screen.findByRole('button', { name: 'Show the answer' }));
    expect(await screen.findByText('Answer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'column 4, row 1, empty' }));
    await screen.findByText('Correct!');
    await waitFor(async () =>
      expect(await getDb().puzzleProgress.get('straight-three-live')).toMatchObject({ solved: 0 }),
    );
    expect(await getDb().sessions.count()).toBe(0);
    expect(router.state.location.pathname).toBe('/practice/go/tsumego/straight-three-live');
  });

  it('the list shows a tick for a solved problem', async () => {
    await getDb().puzzleProgress.put({
      puzzleId: 'straight-three-kill',
      game: 'go',
      solved: 1,
      attempts: 1,
      lastAttemptAt: 1,
      solvedAt: 1,
    });
    renderGo('/practice/go/tsumego');
    const row = await screen.findByRole('link', { name: /Straight three: kill/ });
    expect(await within(row).findByRole('img', { name: 'Solved' })).toBeInTheDocument();
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
  });

  it('an unknown problem id shows a message instead of crashing', async () => {
    renderGo('/practice/go/tsumego/nope');
    expect(await screen.findByText('Problem not found')).toBeInTheDocument();
  });
});
