import { Chess, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { getDb } from '@/db/boot';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import {
  loadPuzzleProgress,
  loadRatings,
  recordPuzzleOutcome,
  type PuzzleRecordResult,
} from '../data/chessRepository';
import type { RatingState } from '../domain/rating';
import {
  applyReply,
  giveHint,
  isCleanSolve,
  pickPuzzle,
  revealStep,
  startRun,
  tryMove,
  type PuzzleRun,
} from '../domain/puzzleRun';
import { PUZZLES, THEME_LABELS } from '../domain/puzzles';
import {
  checkedKingSquare,
  legalTargets,
  needsPromotion,
  type PromotionPiece,
} from '../domain/rules';
import { ChessBoard, type BoardFeedback } from './ChessBoard';
import { PromotionSheet } from './PromotionSheet';
import { CHESS_BASE } from './useChess';

const REPLY_DELAY_MS = 500;
const REVEAL_DELAY_MS = 800;
const FEEDBACK_MS = 700;

type Message = { tone: 'good' | 'bad' | 'info'; text: string };

/** Puzzle trainer: one puzzle at a time, chosen near the player's puzzle rating. */
export function PuzzlesScreen() {
  const trainingEngine = useTrainingEngine();
  const [ready, setReady] = useState(false);
  const [run, setRun] = useState<PuzzleRun | null>(null);
  const [practice, setPractice] = useState(false);
  const [rating, setRating] = useState<RatingState | null>(null);
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [feedback, setFeedback] = useState<BoardFeedback | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);

  const solvedRef = useRef<Set<string>>(new Set());
  const startedAt = useRef(0);
  /** Whether this run's first failure has been stored (rating moves once per puzzle). */
  const failureStored = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const begin = useCallback((puzzleRun: PuzzleRun, isPractice: boolean) => {
    failureStored.current = false;
    startedAt.current = Date.now();
    setRun(puzzleRun);
    setPractice(isPractice);
    setMessage(null);
    setFeedback(null);
    setRevealing(false);
    setRatingDelta(null);
  }, []);

  // load progress once, then pick the first puzzle
  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadPuzzleProgress(getDb()), loadRatings(getDb())]).then(
      ([progress, ratings]) => {
        if (cancelled) return;
        const solved = new Set([...progress.values()].filter((p) => p.solved === 1).map((p) => p.puzzleId));
        solvedRef.current = solved;
        setReady(true);
        setRating(ratings.puzzle);
        const pick = pickPuzzle(PUZZLES, solved, ratings.puzzle.value);
        if (pick) begin(startRun(pick.puzzle), pick.practice);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [begin]);

  const fen = run?.fen ?? null;
  const chess = useMemo(() => (fen ? new Chess(fen) : null), [fen]);
  const targetsFrom = useCallback(
    (from: Square) => (chess ? legalTargets(chess, from) : []),
    [chess],
  );

  const store = useCallback(async (r: PuzzleRun, solved: boolean): Promise<PuzzleRecordResult> => {
    const result = await recordPuzzleOutcome(getDb(), {
      puzzleId: r.puzzle.id,
      puzzleRating: r.puzzle.rating,
      solved,
      clean: isCleanSolve(r),
      now: Date.now(),
    });
    if (result.rating) {
      setRating({ value: result.rating.value, games: result.rating.games });
      setRatingDelta(result.rating.delta);
    }
    return result;
  }, []);

  const storeFailure = useCallback(
    (r: PuzzleRun) => {
      if (failureStored.current) return;
      failureStored.current = true;
      void store(r, false);
    },
    [store],
  );

  const onSolved = useCallback(
    async (solvedRun: PuzzleRun) => {
      const result = await store(solvedRun, true);
      solvedRef.current.add(solvedRun.puzzle.id);
      const clean = isCleanSolve(solvedRun);
      setMessage({
        tone: 'good',
        text: clean ? 'Solved! Well spotted.' : 'Solved. Try the next one without help.',
      });
      if (!result.firstSolve) return;
      // XP is idempotent per puzzle id in the engine, so a replay can never farm it
      const startedMs = startedAt.current;
      const endedMs = Math.max(Date.now(), startedMs + 1000);
      const recorded = await trainingEngine.recordSession({
        id: `chess-puzzle:${solvedRun.puzzle.id}`,
        moduleId: 'chess',
        activityType: 'chess_puzzle',
        startedAt: startedMs,
        endedAt: endedMs,
        source: 'timer',
        score: 1,
        result: {
          puzzleId: solvedRun.puzzle.id,
          rating: solvedRun.puzzle.rating,
          themes: [...solvedRun.puzzle.themes],
          mistakes: solvedRun.mistakes,
          hints: solvedRun.hints,
        },
      });
      if (recorded.ok && !recorded.value.duplicate) setOutcome(recorded.value);
    },
    [store, trainingEngine],
  );

  const submit = useCallback(
    (uci: string) => {
      if (!run) return;
      const result = tryMove(run, uci);
      if (result.kind === 'illegal') return;
      const to = uci.slice(2, 4) as Square;
      if (result.kind === 'wrong') {
        setRun(result.run);
        setFeedback({ square: to, tone: 'bad' });
        later(() => setFeedback(null), FEEDBACK_MS);
        setMessage({ tone: 'bad', text: 'That is not the move. Try again.' });
        storeFailure(result.run);
        return;
      }
      setRun(result.run);
      setFeedback({ square: to, tone: 'good' });
      later(() => setFeedback(null), FEEDBACK_MS);
      if (result.run.status === 'solved') {
        void onSolved(result.run);
      } else {
        setMessage({ tone: 'good', text: 'Correct. Keep going.' });
        later(() => setRun((current) => (current ? applyReply(current) : current)), REPLY_DELAY_MS);
      }
    },
    [run, later, storeFailure, onSolved],
  );

  const onBoardMove = (from: Square, to: Square) => {
    if (chess && needsPromotion(chess, from, to)) setPromotion({ from, to });
    else submit(from + to);
  };

  const choosePromotion = (piece: PromotionPiece) => {
    if (promotion) submit(promotion.from + promotion.to + piece);
    setPromotion(null);
  };

  // "show solution": play the stored moves one by one
  useEffect(() => {
    if (!revealing || !run || run.status !== 'playing') return;
    const t = window.setTimeout(() => setRun((r) => (r ? revealStep(r) : r)), REVEAL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [revealing, run]);

  const onReveal = () => {
    if (!run || run.status !== 'playing') return;
    storeFailure(run);
    setRevealing(true);
    setMessage({ tone: 'info', text: 'Here is the solution. It will not count as solved.' });
  };

  const onNext = () => {
    if (!run) return;
    const pick = pickPuzzle(PUZZLES, solvedRef.current, rating?.value ?? 1000, {
      exclude: run.puzzle.id,
    });
    if (pick) begin(startRun(pick.puzzle), pick.practice);
  };

  const finished = run?.status === 'solved' || run?.status === 'revealed';
  const lastPlayed = run && run.played.length > 0 ? run.played[run.played.length - 1] : undefined;
  const lastMove = lastPlayed
    ? { from: lastPlayed.slice(0, 2) as Square, to: lastPlayed.slice(2, 4) as Square }
    : null;
  const solverColor = run ? new Chess(run.puzzle.fen).turn() : 'w';
  const yourTurn = run?.status === 'playing' && run.ply % 2 === 0 && !revealing;
  const goalText =
    run?.puzzle.goal.type === 'mate'
      ? `Find mate in ${run.puzzle.goal.in}`
      : 'Win material';

  return (
    <Screen title="Puzzles" back={{ to: CHESS_BASE, label: 'Chess' }}>
      {!ready || !run || !chess ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-headline">
                {solverColor === 'w' ? 'White' : 'Black'} to move: {goalText.toLowerCase()}
              </p>
              <p className="type-footnote text-muted">Difficulty {run.puzzle.rating}</p>
            </div>
            <div className="text-right">
              <p className="type-footnote text-muted">Your rating</p>
              <p className="type-headline tabular-nums">
                {rating?.value ?? 1000}
                {ratingDelta !== null && (
                  <span className="ml-1 type-subhead text-muted">
                    ({ratingDelta >= 0 ? '+' : ''}
                    {ratingDelta})
                  </span>
                )}
              </p>
            </div>
          </div>

          <ChessBoard
            fen={run.fen}
            orientation={solverColor}
            movable={yourTurn ? solverColor : null}
            targetsFrom={targetsFrom}
            onMove={onBoardMove}
            lastMove={lastMove}
            checkSquare={checkedKingSquare(chess)}
            hints={run.hintSquares}
            feedback={feedback}
            label="Puzzle board"
          />

          <div role="status" aria-live="polite" className="min-h-[1.5rem]">
            {message && (
              <p
                className={
                  message.tone === 'bad'
                    ? 'type-body text-danger'
                    : message.tone === 'good'
                      ? 'type-body text-success'
                      : 'type-body text-muted'
                }
              >
                {message.text}
              </p>
            )}
          </div>

          {finished && (
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                {run.puzzle.themes.map((t) => (
                  <Chip key={t}>{THEME_LABELS[t]}</Chip>
                ))}
                {practice && <Badge tone="neutral">Practice, no XP</Badge>}
              </div>
              {run.puzzle.goal.type === 'material' && (
                <p className="mt-2 type-subhead text-muted">
                  The idea wins {run.puzzle.goal.gain} pawns of material once the opponent has
                  replied.
                </p>
              )}
            </Card>
          )}

          <div className="grid grid-cols-2 gap-2">
            {finished ? (
              <div className="col-span-2">
                <Button fullWidth onClick={onNext}>
                  Next puzzle
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={run.status !== 'playing' || revealing || run.hintSquares.length >= 2}
                  onClick={() => setRun(giveHint(run))}
                >
                  {run.hintSquares.length === 0 ? 'Hint' : 'More hint'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={run.status !== 'playing' || revealing}
                  onClick={onReveal}
                >
                  Show solution
                </Button>
              </>
            )}
          </div>
          <p className="type-footnote text-muted">
            Hints and a shown solution count against the first attempt at a puzzle.
          </p>
        </div>
      )}

      <PromotionSheet
        open={promotion !== null}
        color={solverColor}
        onChoose={choosePromotion}
        onCancel={() => setPromotion(null)}
      />
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </Screen>
  );
}
