import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { newId } from '@/core/ids';
import { t } from '@/i18n/core';
import { toLocalDate } from '@/core/time/localDate';
import { getDb } from '@/db/boot';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import {
  MIN_RATED_PLAYER_MOVES,
  clearGameDraft,
  loadGameDraft,
  saveGameDraft,
  type GameDraft,
} from '../data/chessRepository';
import { finishChessGame } from '../data/finishGame';
import {
  coachGate,
  reviewsAfterUndo,
  toReview,
  withReview,
  type CoachCard,
  type MoveReview,
  type MoveSuggestion,
} from '../domain/coach';
import { LEVEL_RATING, type Level } from '../domain/engine';
import {
  buildPgn,
  movesAfterUndo,
  outcomeFor,
  playerMoveCount,
  type Outcome,
} from '../domain/game';
import type { RatingUpdate } from '../domain/rating';
import {
  capturedPieces,
  checkedKingSquare,
  gameEnd,
  legalTargets,
  needsPromotion,
  parseUci,
  PIECE_POINTS,
  replay,
  type PromotionPiece,
} from '../domain/rules';
import { createEngineClient, type EngineClient } from '../workers/engineClient';
import { ChessBoard } from './ChessBoard';
import { CoachFeedback, CoachHint, CoachReview } from './CoachPanel';
import { PromotionSheet } from './PromotionSheet';
import { PieceGlyph } from './pieces';
import { reasonText, sideName } from './labels';
import { CHESS_BASE, LEVEL_LABEL } from './useChess';
import { useCoachPref } from './useCoachPref';

const LEVEL_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

const LEVEL_BLURB: Record<Level, string> = {
  easy: 'Looks two moves ahead and sometimes plays a slightly weaker move. Good for learning.',
  medium: 'Searches several moves deep for up to 0.7 seconds a move. Punishes simple blunders.',
  hard: 'Searches as deep as it can in 1.4 seconds a move. It is a hobby-grade engine, not a master.',
};

type ColorChoice = 'w' | 'b' | 'random';
const COLOR_OPTIONS = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
] as const;

interface ActiveGame {
  id: string;
  startedAt: number;
  level: Level;
  color: Color;
  moves: readonly string[];
  undos: number;
  /** Learning mode: the engine grades each of the learner's moves; never rated. */
  coach: boolean;
  /** Graded moves of this game (coach games only); kept with the draft. */
  reviews: readonly MoveReview[];
  /** Set when the game is over but its result was not recorded yet (see `GameDraft.finished`). */
  finished?: Finish;
}

/** How a game ended. `endedAt` is fixed at that moment so every save attempt records the same game. */
interface Finish {
  outcome: Outcome;
  reason: string;
  endedAt: number;
}

interface Result {
  outcome: Outcome;
  reason: string;
  rating: RatingUpdate | null;
  rated: boolean;
  coached: boolean;
}

const RESULT_TEXT: Record<Outcome, string> = {
  win: 'You won',
  loss: 'You lost',
  draw: 'Draw',
};

function signed(n: number): string {
  return `${n >= 0 ? '+' : ''}${n}`;
}

export function PlayScreen() {
  const [phase, setPhase] = useState<'loading' | 'setup' | 'playing'>('loading');
  const [draft, setDraft] = useState<GameDraft | null>(null);
  const [game, setGame] = useState<ActiveGame | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGameDraft(getDb())
      .catch(() => null) // an unreadable saved game must not leave the screen loading forever
      .then((d) => {
        if (cancelled) return;
        setDraft(d);
        setPhase('setup');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resume = (d: GameDraft) => {
    const board = replay(d.moves);
    if (!board || (gameEnd(board).over && !d.finished)) {
      // a draft that no longer replays (or already ended) is unusable: drop it rather than crash
      void clearGameDraft(getDb()).then(() => setDraft(null));
      return;
    }
    const { coach, finished, ...rest } = d;
    setGame({
      ...rest,
      coach: coach !== undefined,
      reviews: coach?.reviews ?? [],
      ...(finished ? { finished } : {}),
    });
    setPhase('playing');
  };

  const start = (level: Level, choice: ColorChoice, coach: boolean) => {
    const color: Color = choice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : choice;
    const startedAt = Date.now();
    setGame({
      id: newId(startedAt),
      startedAt,
      level,
      color,
      moves: [],
      undos: 0,
      coach,
      reviews: [],
    });
    setPhase('playing');
  };

  return (
    <Screen title={t('Play')} back={{ to: CHESS_BASE, label: t('Chess') }}>
      {phase === 'loading' && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}
      {phase === 'setup' && <Setup draft={draft} onResume={resume} onStart={start} />}
      {phase === 'playing' && game && (
        <GameView
          key={game.id}
          initial={game}
          onNewGame={() => {
            setDraft(null);
            setGame(null);
            setPhase('setup');
          }}
        />
      )}
    </Screen>
  );
}

function Setup({
  draft,
  onResume,
  onStart,
}: {
  draft: GameDraft | null;
  onResume: (draft: GameDraft) => void;
  onStart: (level: Level, color: ColorChoice, coach: boolean) => void;
}) {
  const [level, setLevel] = useState<Level>('medium');
  const [color, setColor] = useState<ColorChoice>('w');
  const [coach, setCoach] = useCoachPref();
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const begin = () => {
    if (draft) setConfirmDiscard(true);
    else onStart(level, color, coach);
  };

  return (
    <div className="space-y-4">
      {draft && (
        <Card role="region" aria-labelledby="resume-title">
          <h2 id="resume-title" className="type-headline">
            {draft.finished ? t('Game not saved yet') : t('Game in progress')}
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {t('{level} engine, you play {color}, {n} moves played.', {
              level: t(LEVEL_LABEL[draft.level]),
              color: sideName(draft.color),
              n: draft.moves.length,
            })}
          </p>
          {draft.finished && (
            <p className="mt-1 type-subhead text-muted">
              {t('This game is over, but its result has not been saved yet.')}
            </p>
          )}
          <Button className="mt-3" fullWidth onClick={() => onResume(draft)}>
            {draft.finished ? t('Try saving again') : t('Resume game')}
          </Button>
        </Card>
      )}
      <Card>
        <h2 className="type-headline">{t('New game')}</h2>
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-2 type-subhead text-muted">{t('Engine level')}</p>
            <SegmentedControl
              label={t('Engine level')}
              options={LEVEL_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
              value={level}
              onChange={setLevel}
            />
            <p className="mt-2 type-footnote text-muted">{t(LEVEL_BLURB[level])}</p>
          </div>
          <div>
            <p className="mb-2 type-subhead text-muted">{t('You play')}</p>
            <SegmentedControl
              label={t('Your colour')}
              options={COLOR_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
              value={color}
              onChange={setColor}
            />
          </div>
          <div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 type-headline">
              <input
                type="checkbox"
                className="size-6 shrink-0 accent-[var(--accent)]"
                checked={coach}
                onChange={(event) => setCoach(event.target.checked)}
              />
              {t('Coach mode')}
            </label>
            <p className="type-footnote text-muted">
              {t(
                'After each move the engine checks it, explains why it is good or bad, and shows a better move. You can take moves back. Coach games are for learning and do not change your play rating.',
              )}
            </p>
          </div>
          <Button fullWidth onClick={begin}>
            {t('Start game')}
          </Button>
        </div>
      </Card>
      <p className="type-footnote text-muted">
        {t(
          'The engine runs on this device, so it works offline. Finished games with at least {n} of your moves change your play rating and earn XP.',
          { n: MIN_RATED_PLAYER_MOVES },
        )}
      </p>
      <ConfirmDialog
        open={confirmDiscard}
        title={
          draft?.finished ? t('Discard the unsaved game?') : t('Replace the game in progress?')
        }
        message={
          draft?.finished
            ? t(
                'Starting a new game discards the finished game that has not been saved. Its result and XP will be lost.',
              )
            : t('Starting a new game discards the unfinished one. It will not be rated.')
        }
        confirmLabel={t('Start new game')}
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          void clearGameDraft(getDb()).then(() => onStart(level, color, coach));
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}

function CapturedRow({ pieces, color }: { pieces: PieceSymbol[]; color: Color }) {
  return (
    <span className="flex min-h-6 items-center" aria-hidden="true">
      {pieces.map((type, i) => (
        <PieceGlyph key={i} type={type} color={color} className="-mr-1.5 size-6" />
      ))}
    </span>
  );
}

function GameView({ initial, onNewGame }: { initial: ActiveGame; onNewGame: () => void }) {
  const trainingEngine = useTrainingEngine();
  const [game, setGame] = useState<ActiveGame>(initial);
  const [saving, setSaving] = useState(false);
  /** Set from the moment the game ends until its result is saved; kept when saving fails. */
  const [pending, setPending] = useState<Finish | null>(initial.finished ?? null);
  const [result, setResult] = useState<Result | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CoachCard | null>(null);
  const [hint, setHint] = useState<{ fen: string; suggestion: MoveSuggestion } | null>(null);
  const [hinting, setHinting] = useState(false);
  const [hintFailed, setHintFailed] = useState(false);
  const clientRef = useRef<EngineClient | null>(null);
  const savingRef = useRef(false);
  const moveListRef = useRef<HTMLOListElement>(null);

  const { moves, color, level, coach } = game;
  const chess = useMemo(() => replay(moves) ?? new Chess(), [moves]);
  const end = useMemo(() => gameEnd(chess), [chess]);
  /** FEN before each move, then the current one last (the engine needs them for repetitions). */
  const positions = useMemo(() => {
    const walker = new Chess();
    const fens = [walker.fen()];
    for (const uci of moves) {
      walker.move(parseUci(uci));
      fens.push(walker.fen());
    }
    return fens;
  }, [moves]);
  const humansTurn = chess.turn() === color;
  const over = end.over || result !== null || saving || pending !== null;
  // In a coach game the engine waits until the learner's last move has been graded and, if it
  // was a poor one, until they chose to continue or take it back.
  const gate = coach ? coachGate(card, moves.length) : 'open';
  const cardPly = card?.ply ?? -1;
  // while it is the engine's turn in a live game, the search is running
  const thinking = !over && !humansTurn && error === null && gate === 'open';
  const checking = coach && !over && !humansTurn && gate === 'checking';
  const waiting = coach && !over && !humansTurn && gate === 'waiting';
  const history = chess.history({ verbose: true });
  const lastMove = history.at(-1);
  const saveFailed = pending !== null && !saving && error !== null;

  useEffect(() => {
    const client = createEngineClient();
    clientRef.current = client;
    return () => {
      client.dispose();
      clientRef.current = null;
    };
  }, []);

  // keep the unfinished game so a reload (or iOS killing the app) resumes it
  useEffect(() => {
    if (over) return;
    void saveGameDraft(
      getDb(),
      {
        id: game.id,
        startedAt: game.startedAt,
        level: game.level,
        color: game.color,
        moves: [...game.moves],
        undos: game.undos,
        ...(game.coach ? { coach: { reviews: [...game.reviews] } } : {}),
      },
      Date.now(),
    );
  }, [game, over]);

  /**
   * Records the finished game. Safe to run again after a failure: the id, end time and result are
   * fixed in `how`, the game record is idempotent per id and the session per activity key.
   */
  const save = useCallback(
    async (how: Finish, finalGame: ActiveGame) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        const pgn = buildPgn(replay(finalGame.moves) ?? new Chess(), {
          human: finalGame.color,
          level: finalGame.level,
          outcome: how.outcome,
          date: toLocalDate(how.endedAt).replaceAll('-', '.'),
        });
        const done = await finishChessGame(
          { db: getDb(), engine: trainingEngine },
          {
            id: finalGame.id,
            startedAt: finalGame.startedAt,
            level: finalGame.level,
            color: finalGame.color,
            moves: [...finalGame.moves],
            undos: finalGame.undos,
            ...(finalGame.coach ? { coach: { reviews: [...finalGame.reviews] } } : {}),
            finished: how,
          },
          {
            id: finalGame.id,
            level: finalGame.level,
            color: finalGame.color,
            result: how.outcome,
            reason: how.reason,
            moves: finalGame.moves,
            pgn,
            playerMoves: playerMoveCount(finalGame.moves, finalGame.color),
            undos: finalGame.undos,
            startedAt: finalGame.startedAt,
            endedAt: how.endedAt,
            opponentRating: LEVEL_RATING[finalGame.level],
            coached: finalGame.coach,
          },
        );
        if (!done.ok) {
          setError(done.message);
          return;
        }
        setResult({
          outcome: how.outcome,
          reason: how.reason,
          rating: done.saved.rating,
          rated: done.saved.rated,
          coached: done.saved.coached,
        });
        setPending(null);
        if (done.session) setOutcome(done.session);
      } catch {
        setError(t('The game could not be saved. Check storage space in Settings and try again.'));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [trainingEngine],
  );

  const finish = useCallback(
    (outcomeValue: Outcome, reason: string, finalGame: ActiveGame) => {
      if (savingRef.current || pending !== null) return;
      const how: Finish = { outcome: outcomeValue, reason, endedAt: Date.now() };
      setPending(how);
      void save(how, finalGame);
    },
    [save, pending],
  );

  // a game that was over but never saved (a failed save, then a reload): try again straight away
  const resumeSave = useRef(initial.finished !== undefined);
  useEffect(() => {
    if (!resumeSave.current || !initial.finished) return;
    resumeSave.current = false;
    void save(initial.finished, initial);
  }, [initial, save]);

  /** Applies a move (the human's or the engine's) and settles the game if it ended. */
  const commit = useCallback(
    (next: readonly string[]) => {
      const nextGame = { ...game, moves: next };
      setGame(nextGame);
      const board = replay(next);
      const ended = board ? gameEnd(board) : null;
      if (board && ended?.over) {
        finish(outcomeFor(ended.winner, game.color), ended.reason, nextGame);
      }
    },
    [game, finish],
  );

  // the effects below call the latest `commit` without restarting when it changes
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  // coach: grade the learner's move off the main thread
  useEffect(() => {
    if (!coach || over || humansTurn || moves.length === 0) return;
    const ply = moves.length - 1;
    if (cardPly === ply) return;
    const client = clientRef.current;
    if (!client) return;
    let cancelled = false;
    const uci = moves[ply] as string;
    void client
      .analyse(positions[ply] as string, uci, positions.slice(0, ply))
      .then((analysis) => {
        if (cancelled) return;
        setCard({ ply, status: 'done', analysis, acknowledged: false });
        setGame((g) =>
          g.moves[ply] === uci
            ? { ...g, reviews: withReview(g.reviews, toReview(ply, analysis)) }
            : g,
        );
      })
      .catch(() => {
        // a failed check never blocks the game
        if (!cancelled) setCard({ ply, status: 'failed', acknowledged: false });
      });
    return () => {
      cancelled = true;
    };
  }, [coach, over, humansTurn, moves, positions, cardPly]);

  // the engine's turn: search off the main thread, then play the reply if nothing changed
  useEffect(() => {
    if (over || humansTurn || gate !== 'open') return;
    const client = clientRef.current;
    if (!client) return;
    let cancelled = false;
    void client
      .findMove(chess.fen(), level, positions.slice(0, -1))
      .then((r) => {
        if (cancelled || !r.move) return;
        commitRef.current([...moves, r.move]);
      })
      .catch(() => {
        if (!cancelled) setError(t('The engine stopped unexpectedly. Resign or start a new game.'));
      });
    return () => {
      cancelled = true;
    };
  }, [moves, chess, positions, level, over, humansTurn, gate]);

  useEffect(() => {
    const el = moveListRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [moves.length]);

  const targetsFrom = useCallback((from: Square) => legalTargets(chess, from), [chess]);

  const onBoardMove = (from: Square, to: Square) => {
    if (needsPromotion(chess, from, to)) setPromotion({ from, to });
    else commit([...moves, from + to]);
  };

  const choosePromotion = (piece: PromotionPiece) => {
    if (promotion) commit([...moves, promotion.from + promotion.to + piece]);
    setPromotion(null);
  };

  const undo = () => {
    const next = movesAfterUndo(moves, color);
    if (!next) return;
    setGame((g) => ({
      ...g,
      moves: next,
      undos: g.undos + 1,
      reviews: reviewsAfterUndo(g.reviews, next.length),
    }));
    setCard(null);
    setHint(null);
    setHintFailed(false);
  };

  const askForHint = () => {
    const client = clientRef.current;
    if (!client || hinting) return;
    const fen = chess.fen();
    setHinting(true);
    setHintFailed(false);
    client
      .suggest(fen, positions.slice(0, -1))
      .then((suggestion) => setHint({ fen, suggestion }))
      .catch(() => setHintFailed(true))
      .finally(() => setHinting(false));
  };

  const resign = () => {
    setConfirmResign(false);
    finish('loss', 'resignation', game);
  };

  const captured = capturedPieces(history);
  const lead =
    captured.byWhite.reduce((n, p) => n + PIECE_POINTS[p], 0) -
    captured.byBlack.reduce((n, p) => n + PIECE_POINTS[p], 0);
  const mine = color === 'w' ? captured.byWhite : captured.byBlack;
  const theirs = color === 'w' ? captured.byBlack : captured.byWhite;
  const myLead = color === 'w' ? lead : -lead;
  const canUndo = !over && !thinking && movesAfterUndo(moves, color) !== null;

  let status = humansTurn ? t('Your move') : t('Engine is thinking…');
  if (!over && chess.inCheck()) {
    status = humansTurn ? t('Check. Your move') : t('Check. Engine to move');
  }
  if (checking) status = t('Checking your move…');
  else if (waiting) status = t('Take the move back, or continue');

  // the better move is outlined on the board while the learner decides, or after asking for a hint
  const shownHint = coach && hint !== null && hint.fen === chess.fen() && humansTurn && !over;
  const outlined =
    waiting && card?.analysis
      ? parseUci(card.analysis.bestUci)
      : shownHint
        ? parseUci(hint.suggestion.bestUci)
        : null;
  const hintSquares = outlined ? [outlined.from, outlined.to] : [];
  const shownCard = coach && !checking && card?.status === 'done' && card.analysis ? card : null;
  const checkFailed = coach && !over && !humansTurn && card?.status === 'failed';

  const pairs: { n: number; white: string; black?: string }[] = [];
  const sans = history.map((m) => m.san);
  for (let i = 0; i < sans.length; i += 2) {
    const entry: { n: number; white: string; black?: string } = {
      n: i / 2 + 1,
      white: sans[i] ?? '',
    };
    const black = sans[i + 1];
    if (black) entry.black = black;
    pairs.push(entry);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between type-subhead text-muted">
        <span className="flex items-center gap-2">
          {t('{level} engine · you play {color}', {
            level: t(LEVEL_LABEL[level]),
            color: sideName(color),
          })}
          {coach && <Badge>{t('Coach')}</Badge>}
        </span>
        <span aria-label={t('Material')}>
          {myLead > 0 ? `+${myLead}` : myLead < 0 ? `${myLead}` : t('Even')}
        </span>
      </div>

      <CapturedRow pieces={theirs} color={color === 'w' ? 'b' : 'w'} />
      <ChessBoard
        fen={chess.fen()}
        orientation={color}
        movable={!over && humansTurn && !thinking ? color : null}
        targetsFrom={targetsFrom}
        onMove={onBoardMove}
        lastMove={lastMove ? { from: lastMove.from, to: lastMove.to } : null}
        checkSquare={checkedKingSquare(chess)}
        hints={hintSquares}
        label={t('Game board')}
      />
      <CapturedRow pieces={mine} color={color} />

      <div role="status" aria-live="polite" className="min-h-[1.5rem]">
        {!over && <p className="type-headline">{status}</p>}
        {error && (
          <p role="alert" className="type-subhead text-danger">
            {error}
          </p>
        )}
      </div>

      {shownCard?.analysis && !over && (
        <CoachFeedback
          analysis={shownCard.analysis}
          waiting={waiting}
          onTakeBack={undo}
          onContinue={() => setCard({ ...shownCard, acknowledged: true })}
        />
      )}
      {checkFailed && (
        <p className="type-subhead text-muted">
          {t('The coach could not check this move. You can keep playing.')}
        </p>
      )}
      {shownHint && <CoachHint suggestion={hint.suggestion} />}
      {coach && !over && humansTurn && hintFailed && (
        <p className="type-subhead text-muted">
          {t('The coach could not find a good move. Try again.')}
        </p>
      )}

      {result && (
        <Card role="region" aria-labelledby="result-title">
          <h2 id="result-title" className="type-title-2">
            {t(RESULT_TEXT[result.outcome])}
          </h2>
          <p className="mt-1 type-subhead text-muted">{reasonText(result.reason)}.</p>
          <p className="mt-2 type-body">
            {result.rating
              ? t('Play rating {value} ({delta})', {
                  value: result.rating.value,
                  delta: signed(result.rating.delta),
                })
              : result.coached
                ? t('Coach games are for learning, so they do not change your play rating.')
                : t('Not rated: games need at least {n} of your moves.', {
                    n: MIN_RATED_PLAYER_MOVES,
                  })}
          </p>
          <Button className="mt-3" fullWidth onClick={onNewGame}>
            {t('New game')}
          </Button>
        </Card>
      )}
      {!result && pending && saveFailed && (
        <Card role="region" aria-labelledby="result-title">
          <h2 id="result-title" className="type-title-2">
            {t(RESULT_TEXT[pending.outcome])}
          </h2>
          <p className="mt-1 type-subhead text-muted">{reasonText(pending.reason)}.</p>
          <p className="mt-2 type-subhead text-muted">
            {t('Your result is kept on this device. Try again now, or come back to it later.')}
          </p>
          <Button
            className="mt-3"
            fullWidth
            variant="secondary"
            onClick={() => void save(pending, game)}
          >
            {t('Try saving again')}
          </Button>
        </Card>
      )}
      {result?.coached && <CoachReview reviews={game.reviews} />}

      <ol
        ref={moveListRef}
        aria-label={t('Moves')}
        className="flex gap-3 overflow-x-auto whitespace-nowrap rounded-xl border border-border bg-surface px-3 py-2 type-subhead tabular-nums"
      >
        {pairs.length === 0 && <li className="text-muted">{t('No moves yet')}</li>}
        {pairs.map((p) => (
          <li key={p.n}>
            <span className="text-muted">{p.n}.</span> {p.white}
            {p.black ? ` ${p.black}` : ''}
          </li>
        ))}
      </ol>

      {!over && coach && humansTurn && (
        <Button variant="secondary" fullWidth loading={hinting} onClick={askForHint}>
          {t('Show me a good move')}
        </Button>
      )}
      {!over && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!canUndo} onClick={undo}>
            {t('Undo')}
          </Button>
          <Button variant="ghost" onClick={() => setConfirmResign(true)}>
            {t('Resign')}
          </Button>
        </div>
      )}

      <PromotionSheet
        open={promotion !== null}
        color={color}
        onChoose={choosePromotion}
        onCancel={() => setPromotion(null)}
      />
      <ConfirmDialog
        open={confirmResign}
        title={t('Resign this game?')}
        message={t('It counts as a loss.')}
        confirmLabel={t('Resign')}
        destructive
        onConfirm={resign}
        onCancel={() => setConfirmResign(false)}
      />
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </div>
  );
}
