import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { setupAppDatabase } from '@/test/appHarness';
import { loadGameDraft, saveGameDraft } from '../data/chessRepository';
import { updateRating } from '../domain/rating';
import { PUZZLES, puzzleById } from '../domain/puzzles';
import { ChessModule } from './ChessModule';

setupAppDatabase('chess-ui-test');
afterEach(() => cleanup());

function renderChess(path: string) {
  const router = createMemoryRouter([{ path: 'practice/chess/*', element: <ChessModule /> }], {
    initialEntries: [path],
  });
  render(<RouterProvider router={router} />);
  return router;
}

/** Marks every puzzle except `keep` as solved so the trainer must offer `keep`. */
async function solveAllExcept(keep: string) {
  await getDb().puzzleProgress.bulkPut(
    PUZZLES.filter((p) => p.id !== keep).map((p) => ({
      puzzleId: p.id,
      game: 'chess' as const,
      solved: 1 as const,
      attempts: 1,
      lastAttemptAt: 1,
      solvedAt: 1,
    })),
  );
}

/** Rating after losing (score 0) a first attempt at a puzzle, starting from 1000. */
const ratingAfterLoss = (puzzleId: string) =>
  updateRating({ value: 1000, games: 0 }, puzzleById(puzzleId)?.rating ?? 0, 0).value;

const square = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, `) });

describe('module home', () => {
  it('shows ratings, progress and the three ways to train', async () => {
    renderChess('/practice/chess');
    expect(await screen.findByText('Puzzle rating')).toBeInTheDocument();
    expect(screen.getAllByText('1000')).toHaveLength(2);
    expect(screen.getByText(`0/${PUZZLES.length}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Puzzles/ })).toHaveAttribute('href', '/practice/chess/puzzles');
    expect(screen.getByRole('link', { name: /Play the engine/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Openings/ })).toBeInTheDocument();
    expect(screen.queryByText('Game in progress')).not.toBeInTheDocument();
  });

  it('offers to resume a saved game', async () => {
    await saveGameDraft(
      getDb(),
      { id: 'g', startedAt: Date.now(), level: 'hard', color: 'b', moves: ['e2e4'], undos: 0 },
      Date.now(),
    );
    renderChess('/practice/chess');
    expect(await screen.findByText('Game in progress')).toBeInTheDocument();
    expect(screen.getByText(/Hard engine, you play Black, 1 moves played/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Resume game' })).toBeInTheDocument();
  });
});

describe('puzzle trainer', () => {
  it('rejects a wrong move, then accepts the right one and awards XP once', async () => {
    await solveAllExcept('m1-back-rank-rook');
    renderChess('/practice/chess/puzzles');
    expect(await screen.findByText(/White to move: find mate in 1/)).toBeInTheDocument();
    const board = screen.getByRole('group', { name: 'Puzzle board' });
    expect(within(board).getAllByRole('button')).toHaveLength(64);

    // wrong: the rook goes to a7 (select, then the highlighted destination)
    await userEvent.click(square('a1'));
    await userEvent.click(square('a7'));
    expect(await screen.findByText('That is not the move. Try again.')).toBeInTheDocument();
    await waitFor(async () =>
      expect((await getDb().ratings.get('chess-puzzle'))?.value).toBe(
        ratingAfterLoss('m1-back-rank-rook'),
      ),
    );
    expect(square('a1')).toHaveAccessibleName(/white rook/); // the position is unchanged

    // right: Ra8 mate
    await userEvent.click(square('a1'));
    await userEvent.click(square('a8'));
    const saved = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(saved).getByText('+10 XP')).toBeInTheDocument();
    expect(await screen.findByText(/^Solved\./)).toBeInTheDocument();

    expect(await getDb().sessions.get('chess-puzzle:m1-back-rank-rook')).toMatchObject({
      moduleId: 'chess',
      activityType: 'chess_puzzle',
      score: 1,
    });
    expect(await getDb().puzzleProgress.get('m1-back-rank-rook')).toMatchObject({ solved: 1 });
    // the rating moved once, for the first outcome only
    expect((await getDb().ratings.get('chess-puzzle'))?.games).toBe(1);
    expect(await getDb().xpLedger.count()).toBe(1);
  });

  it('a hint names the piece, and using one makes the first attempt a rating loss', async () => {
    await solveAllExcept('m1-arabian');
    renderChess('/practice/chess/puzzles');
    await screen.findByText(/find mate in 1/);
    await userEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(square('a7')).toHaveAccessibleName(/hint/);
    await userEvent.click(square('a7'));
    await userEvent.click(square('h7'));
    await screen.findByRole('dialog', { name: 'Session saved' });
    // a hint makes the first attempt a rating loss (documented under the buttons)
    expect((await getDb().ratings.get('chess-puzzle'))?.value).toBe(ratingAfterLoss('m1-arabian'));
  });

  it('asks which piece to promote to and accepts a mating promotion', async () => {
    await solveAllExcept('m1-promotion');
    renderChess('/practice/chess/puzzles');
    await screen.findByText(/find mate in 1/);
    await userEvent.click(square('b7'));
    await userEvent.click(square('b8'));
    const picker = await screen.findByRole('dialog', { name: 'Promote pawn to' });
    await userEvent.click(within(picker).getByRole('button', { name: 'Queen' }));
    expect(await screen.findByRole('dialog', { name: 'Session saved' })).toBeInTheDocument();
  });

  it('shows the solution without crediting it as solved', async () => {
    await solveAllExcept('m1-back-rank-rook');
    renderChess('/practice/chess/puzzles');
    await screen.findByText(/find mate in 1/);
    await userEvent.click(screen.getByRole('button', { name: 'Show solution' }));
    expect(await screen.findByRole('button', { name: 'Next puzzle' }, { timeout: 3000 })).toBeInTheDocument();
    expect(await getDb().puzzleProgress.get('m1-back-rank-rook')).toMatchObject({ solved: 0 });
    expect(await getDb().sessions.count()).toBe(0);
    expect((await getDb().ratings.get('chess-puzzle'))?.value).toBe(
      ratingAfterLoss('m1-back-rank-rook'),
    );
  });
});

describe('play the engine', () => {
  it('starts a game, answers a move, saves a resumable draft, and resigning records a loss', async () => {
    renderChess('/practice/chess/play');
    await userEvent.click(await screen.findByRole('radio', { name: 'Easy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    expect(await screen.findByText('Your move')).toBeInTheDocument();

    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    const moves = screen.getByRole('list', { name: 'Moves' });
    await waitFor(() => expect(moves.textContent).toMatch(/1\. e4 \S+/), { timeout: 5000 });
    await waitFor(async () => expect((await loadGameDraft(getDb()))?.moves).toHaveLength(2));
    expect(await screen.findByText('Your move')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Resign' }));
    const confirm = await screen.findByRole('dialog', { name: 'Resign this game?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Resign' }));
    expect(await screen.findByText('You lost')).toBeInTheDocument();
    expect(screen.getByText(/Not rated/)).toBeInTheDocument();

    const records = await getDb().gameRecords.toArray();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ game: 'chess', level: 'easy', result: 'loss' });
    expect(records[0]?.details).toMatchObject({ color: 'w', reason: 'resignation' });
    expect(await loadGameDraft(getDb())).toBeNull();
  });

  it('resumes a saved game from the draft', async () => {
    await saveGameDraft(
      getDb(),
      {
        id: 'resume-me',
        startedAt: Date.now() - 1000,
        level: 'easy',
        color: 'w',
        moves: ['e2e4', 'e7e5'],
        undos: 0,
      },
      Date.now(),
    );
    renderChess('/practice/chess/play');
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    expect(await screen.findByText('Your move')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Moves' }).textContent).toContain('1. e4 e5');
    expect(square('e4')).toHaveAccessibleName(/white pawn/);
    // undo is available: the human has moved
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(screen.getByRole('list', { name: 'Moves' }).textContent).toContain('No moves yet'));
    expect(square('e2')).toHaveAccessibleName(/white pawn/);
  });

  it('plays a full short game to checkmate and rates it', async () => {
    // the human (Black) is one move from the fool's mate; the engine has just blundered with g4
    await saveGameDraft(
      getDb(),
      {
        id: 'fools-mate',
        startedAt: Date.now() - 60_000,
        level: 'easy',
        color: 'b',
        moves: ['f2f3', 'e7e5', 'a2a3', 'a7a6', 'g2g4'],
        undos: 0,
      },
      Date.now(),
    );
    renderChess('/practice/chess/play');
    await userEvent.click(await screen.findByRole('button', { name: 'Resume game' }));
    await screen.findByText('Your move');
    await userEvent.click(square('d8'));
    await userEvent.click(square('h4'));
    expect(await screen.findByText('You won')).toBeInTheDocument();
    expect(screen.getByText(/by checkmate/)).toBeInTheDocument();
    // only two of the human's moves: recorded, but too short to rate or reward
    expect(screen.getByText(/Not rated/)).toBeInTheDocument();
    expect(await getDb().gameRecords.get('fools-mate')).toMatchObject({ result: 'win' });
  });
});

describe('openings', () => {
  it('lists the lines and drills one: wrong moves are refused, right moves advance, the opponent replies', async () => {
    const router = renderChess('/practice/chess/openings');
    await userEvent.click(await screen.findByRole('link', { name: /Italian Game/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/practice/chess/openings/italian'));
    expect(await screen.findByText(/Your move 1 of/)).toBeInTheDocument();

    await userEvent.click(square('d2'));
    await userEvent.click(square('d4'));
    expect(await screen.findByText(/not the book move/)).toBeInTheDocument();

    await userEvent.click(square('e2'));
    await userEvent.click(square('e4'));
    expect(await screen.findByText(/Claim the centre/)).toBeInTheDocument();
    // the app answers 1...e5 and the learner is on move again
    await waitFor(() => expect(screen.getByLabelText('Moves so far').textContent).toContain('1. e4 e5'), {
      timeout: 3000,
    });
    expect(await screen.findByText(/Your move 2 of/)).toBeInTheDocument();
  });

  it('plays the first move for the learner who has Black', async () => {
    renderChess('/practice/chess/openings/najdorf');
    await waitFor(() => expect(screen.getByLabelText('Moves so far').textContent).toContain('1. e4'), {
      timeout: 3000,
    });
    expect(await screen.findByText(/Your move 1 of/)).toBeInTheDocument();
  });

  it('explains the ideas behind the line', async () => {
    renderChess('/practice/chess/openings/french');
    await screen.findByText(/The ideas/);
    expect(screen.getByText(/challenges e4 at once/)).toBeInTheDocument();
  });
});
