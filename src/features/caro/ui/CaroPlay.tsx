import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { t } from '@/i18n/core';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import { clearDraft, loadDraft, saveDraft } from '../data/caroRepository';
import { finishGame, type FinishResult } from '../data/finishGame';
import { isLegalMove, playMove, replay, stoneToMove, type GameState } from '../domain/game';
import {
  MIN_PLAYER_MOVES_FOR_SESSION,
  canUndo,
  outcomeOf,
  undoPair,
  type CaroDraft,
  type Outcome,
} from '../domain/play';
import { CaroBoard } from './CaroBoard';
import { CARO_HOME, levelLabel } from './labels';
import { useAiClient, useConfirmMoves } from './useCaroPrefs';

/** `practice/caro/play`: loads the saved game; without one there is nothing to play. */
export function CaroPlay() {
  const [draft, setDraft] = useState<CaroDraft | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void loadDraft(getDb()).then((saved) => {
      if (!cancelled) setDraft(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (draft === undefined) {
    return (
      <Screen title={t('Play')} back={{ to: CARO_HOME, label: t('Caro') }}>
        <Skeleton className="aspect-square w-full" />
      </Screen>
    );
  }
  if (draft === null) return <Navigate to={CARO_HOME} replace />;
  return <GameScreen key={draft.id} draft={draft} />;
}

function statusText(args: {
  outcome: Outcome | null;
  thinking: boolean;
  aiFailed: boolean;
  aiming: boolean;
}): string {
  if (args.outcome === 'win') return t('You win!');
  if (args.outcome === 'loss') return t('The computer wins.');
  if (args.outcome === 'draw') return t('Draw: the board is full.');
  if (args.aiFailed) return t('The computer could not move.');
  if (args.thinking) return t('Computer is thinking…');
  return args.aiming ? t('Tap the marked cell again, or press Place stone.') : t('Your move.');
}

function GameScreen({ draft }: { draft: CaroDraft }) {
  const navigate = useNavigate();
  const engine = useTrainingEngine();
  const ai = useAiClient();
  const [confirmMoves, setConfirmMoves] = useConfirmMoves();

  const [game, setGame] = useState<GameState>(() => replay(draft.size, draft.moves));
  const [preview, setPreview] = useState<number | null>(null);
  const [resignOpen, setResignOpen] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [aiAttempt, setAiAttempt] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);
  const [finish, setFinish] = useState<FinishResult | null>(null);
  const [finishAttempt, setFinishAttempt] = useState(0);
  const [sheet, setSheet] = useState<CompletionOutcome | null>(null);
  const undos = useRef(draft.undos);
  const finishing = useRef(false);

  const human = draft.humanStone;
  const outcome = outcomeOf(game.status, human);
  const thinking = outcome === null && stoneToMove(game) !== human;
  const locked = outcome !== null || thinking;
  const lastMove = game.moves.at(-1) ?? null;

  /** Every position change goes through here so the saved game never lags the board. */
  const commit = useCallback(
    (next: GameState) => {
      setGame(next);
      setPreview(null);
      const saved: CaroDraft = { ...draft, moves: next.moves, undos: undos.current };
      void saveDraft(getDb(), saved, systemClock.now()).then(
        () => setSaveFailed(false),
        () => setSaveFailed(true),
      );
    },
    [draft],
  );

  // The computer's turn. Cancelled (result ignored) if the position changes or the screen closes.
  useEffect(() => {
    if (!thinking) return;
    let cancelled = false;
    void ai
      .chooseMove({ size: draft.size, moves: game.moves, level: draft.level })
      .then((result) => {
        if (cancelled) return;
        if (isLegalMove(game, result.move)) {
          setAiFailed(false);
          commit(playMove(game, result.move));
        } else {
          setAiFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAiFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [thinking, game, draft.size, draft.level, ai, commit, aiAttempt]);

  // The game just ended on the board: record it once (a retry after an error bumps the attempt).
  useEffect(() => {
    if (outcome === null || finishing.current) return;
    finishing.current = true;
    void finishGame({ db: getDb(), engine, clock: systemClock }, draft, game).then((result) => {
      setFinish(result);
      if (result.ok && result.session) setSheet(result.session);
    });
  }, [outcome, draft, game, engine, finishAttempt]);

  const place = (index: number) => {
    if (locked || !isLegalMove(game, index)) return;
    commit(playMove(game, index));
  };

  const onSelect = (index: number) => {
    if (confirmMoves && preview !== index) setPreview(index);
    else place(index);
  };

  const undo = () => {
    undos.current += 1;
    commit(undoPair(game));
  };

  const resign = async () => {
    setResignOpen(false);
    try {
      await clearDraft(getDb()); // resigning records nothing: no result, no session, no XP
    } finally {
      void navigate(CARO_HOME);
    }
  };

  const retryFinish = () => {
    finishing.current = false;
    setFinish(null);
    setFinishAttempt((n) => n + 1);
  };

  const youPlay = human === 1 ? t('You play filled stones') : t('You play hollow stones');
  const size = draft.size;

  return (
    <Screen title={t('Play')} back={{ to: CARO_HOME, label: t('Caro') }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 type-subhead text-muted">
          <span>
            {levelLabel(draft.level)} · {size}×{size}
          </span>
          <span>{youPlay}</span>
        </div>

        <p role="status" className="min-h-6 type-headline">
          {statusText({ outcome, thinking, aiFailed, aiming: confirmMoves && preview !== null })}
        </p>

        <div className="-mx-2">
          <CaroBoard
            size={size}
            cells={game.cells}
            humanStone={human}
            lastMove={lastMove}
            winLine={game.status.kind === 'won' ? game.status.line : []}
            preview={preview}
            locked={locked}
            onSelect={onSelect}
          />
        </div>

        {aiFailed && (
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              setAiFailed(false);
              setAiAttempt((n) => n + 1);
            }}
          >
            {t('Try again')}
          </Button>
        )}

        {saveFailed && (
          <p role="alert" className="type-footnote text-danger">
            {t(
              'Could not save your progress. The game is still playable here, but may not resume.',
            )}
          </p>
        )}

        {outcome === null ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip selected={confirmMoves} onClick={() => setConfirmMoves(!confirmMoves)}>
                {t('Confirm each move')}
              </Chip>
            </div>
            <div className="flex gap-2">
              {confirmMoves && (
                <Button
                  className="flex-1"
                  disabled={preview === null || locked}
                  onClick={() => preview !== null && place(preview)}
                >
                  {t('Place stone')}
                </Button>
              )}
              {draft.level === 'easy' && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={thinking || !canUndo(game, draft)}
                  onClick={undo}
                >
                  {t('Undo')}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => setResignOpen(true)}
              >
                {t('Resign')}
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <h2 className="type-title-2">
              {outcome === 'win' ? t('You won') : outcome === 'loss' ? t('You lost') : t('Draw')}
            </h2>
            <p className="mt-1 type-subhead text-muted">
              {t('{count} moves on {level}.', {
                count: game.moves.length,
                level: levelLabel(draft.level),
              })}
              {finish?.ok && finish.session === null
                ? ` ${t('Games with fewer than {count} of your own moves earn no XP.', { count: MIN_PLAYER_MOVES_FOR_SESSION })}`
                : ''}
            </p>
            {finish && !finish.ok && (
              <div className="mt-3 space-y-2">
                <p role="alert" className="type-subhead text-danger">
                  {finish.message}
                </p>
                <Button variant="secondary" fullWidth onClick={retryFinish}>
                  {t('Try saving again')}
                </Button>
              </div>
            )}
            <Button
              fullWidth
              className="mt-4"
              disabled={finish === null}
              onClick={() => void navigate(CARO_HOME)}
            >
              {t('New game')}
            </Button>
          </Card>
        )}

        <details className="rounded-2xl border border-border bg-surface px-4">
          <summary className="flex min-h-[44px] cursor-pointer items-center type-subhead">
            {t('Move list ({count})', { count: game.moves.length })}
          </summary>
          <ol className="space-y-1 pb-3 type-footnote tabular-nums">
            {game.moves.map((cell, k) => {
              const stone = k % 2 === 0 ? 1 : 2;
              return (
                <li key={k}>
                  {t('{n}. {who}: row {row}, column {col}', {
                    n: k + 1,
                    who: stone === human ? t('You') : t('Computer'),
                    row: Math.floor(cell / size) + 1,
                    col: (cell % size) + 1,
                  })}
                </li>
              );
            })}
          </ol>
        </details>
      </div>

      <ConfirmDialog
        open={resignOpen}
        destructive
        title={t('Resign this game?')}
        message={t('The game ends and nothing is recorded: no result, no XP.')}
        confirmLabel={t('Resign')}
        onConfirm={() => void resign()}
        onCancel={() => setResignOpen(false)}
      />
      <SessionCompleteSheet outcome={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
