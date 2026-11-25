import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Skeleton } from '@/components/Skeleton';
import { newId } from '@/core/ids';
import { toLocalDate } from '@/core/time/localDate';
import { getDb } from '@/db/boot';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import {
  MIN_RATED_PLAYER_MOVES,
  clearGameDraft,
  loadGameDraft,
  recordFinishedGame,
  saveGameDraft,
  type GameDraft,
} from '../data/chessRepository';
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
  PIECE_POINTS,
  replay,
  type PromotionPiece,
} from '../domain/rules';
import { createEngineClient, type EngineClient } from '../workers/engineClient';
import { ChessBoard } from './ChessBoard';
import { PromotionSheet } from './PromotionSheet';
import { PieceGlyph } from './pieces';
import { CHESS_BASE, LEVEL_LABEL } from './useChess';

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
}

interface Result {
  outcome: Outcome;
  reason: string;
  rating: RatingUpdate | null;
  rated: boolean;
}

const RESULT_TEXT: Record<Outcome, string> = {
  win: 'You won',
  loss: 'You lost',
  draw: 'Draw',
};

export function PlayScreen() {
  const [phase, setPhase] = useState<'loading' | 'setup' | 'playing'>('loading');
  const [draft, setDraft] = useState<GameDraft | null>(null);
  const [game, setGame] = useState<ActiveGame | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadGameDraft(getDb()).then((d) => {
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
    if (!board || gameEnd(board).over) {
      // a draft that no longer replays (or already ended) is unusable: drop it rather than crash
      void clearGameDraft(getDb()).then(() => setDraft(null));
      return;
    }
    setGame({ ...d });
    setPhase('playing');
  };

  const start = (level: Level, choice: ColorChoice) => {
    const color: Color = choice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : choice;
    const startedAt = Date.now();
    setGame({ id: newId(startedAt), startedAt, level, color, moves: [], undos: 0 });
    setPhase('playing');
  };

  return (
    <Screen title="Play" back={{ to: CHESS_BASE, label: 'Chess' }}>
      {phase === 'loading' && (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}
      {phase === 'setup' && (
        <Setup draft={draft} onResume={resume} onStart={start} />
      )}
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
  onStart: (level: Level, color: ColorChoice) => void;
}) {
  const [level, setLevel] = useState<Level>('medium');
  const [color, setColor] = useState<ColorChoice>('w');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const begin = () => {
    if (draft) setConfirmDiscard(true);
    else onStart(level, color);
  };

  return (
    <div className="space-y-4">
      {draft && (
        <Card role="region" aria-labelledby="resume-title">
          <h2 id="resume-title" className="type-headline">
            Game in progress
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {LEVEL_LABEL[draft.level]} engine, you play {draft.color === 'w' ? 'White' : 'Black'},{' '}
            {draft.moves.length} moves played.
          </p>
          <Button className="mt-3" fullWidth onClick={() => onResume(draft)}>
            Resume game
          </Button>
        </Card>
      )}
      <Card>
        <h2 className="type-headline">New game</h2>
        <div className="mt-3 space-y-4">
          <div>
            <p className="mb-2 type-subhead text-muted">Engine level</p>
            <SegmentedControl
              label="Engine level"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
            />
            <p className="mt-2 type-footnote text-muted">{LEVEL_BLURB[level]}</p>
          </div>
          <div>
            <p className="mb-2 type-subhead text-muted">You play</p>
            <SegmentedControl
              label="Your colour"
              options={COLOR_OPTIONS}
              value={color}
              onChange={setColor}
            />
          </div>
          <Button fullWidth onClick={begin}>
            Start game
          </Button>
        </div>
      </Card>
      <p className="type-footnote text-muted">
        The engine runs on this device, so it works offline. Finished games with at least{' '}
        {MIN_RATED_PLAYER_MOVES} of your moves change your play rating and earn XP.
      </p>
      <ConfirmDialog
        open={confirmDiscard}
        title="Replace the game in progress?"
        message="Starting a new game discards the unfinished one. It will not be rated."
        confirmLabel="Start new game"
        destructive
        onConfirm={() => {
          setConfirmDiscard(false);
          void clearGameDraft(getDb()).then(() => onStart(level, color));
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
  const [result, setResult] = useState<Result | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [confirmResign, setConfirmResign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<EngineClient | null>(null);
  const finishing = useRef(false);
  const moveListRef = useRef<HTMLOListElement>(null);

  const { moves, color, level } = game;
  const chess = useMemo(() => replay(moves) ?? new Chess(), [moves]);
  const end = useMemo(() => gameEnd(chess), [chess]);
  const humansTurn = chess.turn() === color;
  const over = end.over || result !== null || saving;
  // while it is the engine's turn in a live game, the search is running
  const thinking = !over && !humansTurn && error === null;
  const history = chess.history({ verbose: true });
  const lastMove = history.at(-1);

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
      },
      Date.now(),
    );
  }, [game, over]);

  const finish = useCallback(
    async (outcomeValue: Outcome, reason: string, finalGame: ActiveGame, finalChess: Chess) => {
      if (finishing.current) return;
      finishing.current = true;
      setSaving(true);
      const endedAt = Date.now();
      const playerMoves = playerMoveCount(finalGame.moves, finalGame.color);
      const pgn = buildPgn(finalChess, {
        human: finalGame.color,
        level: finalGame.level,
        outcome: outcomeValue,
        date: toLocalDate(endedAt).replaceAll('-', '.'),
      });
      try {
        const saved = await recordFinishedGame(getDb(), {
          id: finalGame.id,
          level: finalGame.level,
          color: finalGame.color,
          result: outcomeValue,
          reason,
          moves: finalGame.moves,
          pgn,
          playerMoves,
          undos: finalGame.undos,
          startedAt: finalGame.startedAt,
          endedAt,
          opponentRating: LEVEL_RATING[finalGame.level],
        });
        setResult({ outcome: outcomeValue, reason, rating: saved.rating, rated: saved.rated });
        if (!saved.rated) return;
        // a resumed game can span days: keep the session inside the engine's 12 hour limit
        const startedMs = Math.max(finalGame.startedAt, endedAt - 11 * 60 * 60 * 1000);
        const recorded = await trainingEngine.recordSession({
          id: finalGame.id,
          moduleId: 'chess',
          activityType: 'game_session',
          startedAt: Math.min(startedMs, endedAt - 1000),
          endedAt,
          source: 'timer',
          score: outcomeValue === 'win' ? 1 : outcomeValue === 'draw' ? 0.5 : 0,
          result: {
            level: finalGame.level,
            color: finalGame.color,
            outcome: outcomeValue,
            reason,
            playerMoves,
          },
        });
        if (recorded.ok && !recorded.value.duplicate) setOutcome(recorded.value);
      } catch {
        finishing.current = false;
        setError('The game could not be saved. Check storage space in Settings and try again.');
      } finally {
        setSaving(false);
      }
    },
    [trainingEngine],
  );

  /** Applies a move (the human's or the engine's) and settles the game if it ended. */
  const commit = useCallback(
    (next: readonly string[]) => {
      const nextGame = { ...game, moves: next };
      setGame(nextGame);
      const board = replay(next);
      const ended = board ? gameEnd(board) : null;
      if (board && ended?.over) {
        void finish(outcomeFor(ended.winner, game.color), ended.reason, nextGame, board);
      }
    },
    [game, finish],
  );

  // the engine's turn: search off the main thread, then play the reply if nothing changed
  useEffect(() => {
    if (over || humansTurn) return;
    const client = clientRef.current;
    if (!client) return;
    let cancelled = false;
    const positions: string[] = [];
    const walker = new Chess();
    positions.push(walker.fen());
    for (const uci of moves) {
      walker.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      positions.push(walker.fen());
    }
    void client
      .findMove(chess.fen(), level, positions.slice(0, -1))
      .then((r) => {
        if (cancelled || !r.move) return;
        commit([...moves, r.move]);
      })
      .catch(() => {
        if (!cancelled) setError('The engine stopped unexpectedly. Resign or start a new game.');
      });
    return () => {
      cancelled = true;
    };
  }, [moves, chess, level, over, humansTurn, commit]);

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
    if (next) setGame((g) => ({ ...g, moves: next, undos: g.undos + 1 }));
  };

  const resign = () => {
    setConfirmResign(false);
    void finish('loss', 'resignation', game, chess);
  };

  const captured = capturedPieces(history);
  const lead =
    captured.byWhite.reduce((n, p) => n + PIECE_POINTS[p], 0) -
    captured.byBlack.reduce((n, p) => n + PIECE_POINTS[p], 0);
  const mine = color === 'w' ? captured.byWhite : captured.byBlack;
  const theirs = color === 'w' ? captured.byBlack : captured.byWhite;
  const myLead = color === 'w' ? lead : -lead;
  const canUndo = !over && !thinking && movesAfterUndo(moves, color) !== null;

  let status = humansTurn ? 'Your move' : 'Engine is thinking…';
  if (!over && chess.inCheck()) status = humansTurn ? 'Check. Your move' : 'Check. Engine to move';

  const pairs: { n: number; white: string; black?: string }[] = [];
  const sans = history.map((m) => m.san);
  for (let i = 0; i < sans.length; i += 2) {
    const entry: { n: number; white: string; black?: string } = { n: i / 2 + 1, white: sans[i] ?? '' };
    const black = sans[i + 1];
    if (black) entry.black = black;
    pairs.push(entry);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between type-subhead text-muted">
        <span>
          {LEVEL_LABEL[level]} engine · you play {color === 'w' ? 'White' : 'Black'}
        </span>
        <span aria-label="Material">{myLead > 0 ? `+${myLead}` : myLead < 0 ? `${myLead}` : 'Even'}</span>
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
        label="Game board"
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

      {result && (
        <Card role="region" aria-labelledby="result-title">
          <h2 id="result-title" className="type-title-2">
            {RESULT_TEXT[result.outcome]}
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {result.reason === 'resignation' ? 'by resignation' : `by ${result.reason}`}.
          </p>
          <p className="mt-2 type-body">
            {result.rating
              ? `Play rating ${result.rating.value} (${result.rating.delta >= 0 ? '+' : ''}${result.rating.delta})`
              : `Not rated: games need at least ${MIN_RATED_PLAYER_MOVES} of your moves.`}
          </p>
          <Button className="mt-3" fullWidth onClick={onNewGame}>
            New game
          </Button>
        </Card>
      )}

      <ol
        ref={moveListRef}
        aria-label="Moves"
        className="flex gap-3 overflow-x-auto whitespace-nowrap rounded-xl border border-border bg-surface px-3 py-2 type-subhead tabular-nums"
      >
        {pairs.length === 0 && <li className="text-muted">No moves yet</li>}
        {pairs.map((p) => (
          <li key={p.n}>
            <span className="text-muted">{p.n}.</span> {p.white}
            {p.black ? ` ${p.black}` : ''}
          </li>
        ))}
      </ol>

      {!over && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!canUndo} onClick={undo}>
            Undo
          </Button>
          <Button variant="ghost" onClick={() => setConfirmResign(true)}>
            Resign
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
        title="Resign this game?"
        message="It counts as a loss."
        confirmLabel="Resign"
        destructive
        onConfirm={resign}
        onCancel={() => setConfirmResign(false)}
      />
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </div>
  );
}
