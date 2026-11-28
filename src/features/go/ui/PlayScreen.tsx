import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { t } from '@/i18n/core';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import { cn } from '@/utils/cn';
import { finishGoGame } from '../data/finishGame';
import { clearDraft, draftToSerialized, loadDraft, saveDraft, type GoDraft } from '../data/goDraft';
import { BLACK, WHITE, opponent, type Color } from '../domain/board';
import {
  gameResult,
  gameStatus,
  passTurn,
  playStone,
  restoreGame,
  resign,
  resumePlay,
  serializeGame,
  undoMove,
  type GameResult,
  type GameState,
  type MoveRejection,
} from '../domain/game';
import { createRng } from '../domain/rng';
import { areaScore, toggleDeadGroup } from '../domain/scoring';
import { suggestDeadStones } from '../domain/playout';
import { GoBoard, type PointMark } from './GoBoard';
import { useGoContext, useGoRepository } from './hooks';
import { colorName, pointName, resultNotation, starPoints } from './labels';
import { ResultSheet } from './ResultSheet';

function rejectionText(reason: MoveRejection): string {
  switch (reason) {
    case 'occupied':
      return t('That point is taken.');
    case 'suicide':
      return t('Not allowed: a stone with no liberties and no capture (suicide).');
    case 'superko':
      return t(
        'Not allowed: that would repeat an earlier board position (ko). Play elsewhere first.',
      );
    case 'game-over':
      return t('The game is over.');
    case 'off-board':
      return t('That point is not on the board.');
  }
}

/**
 * The nearest earlier position where it is the human's turn again, so Undo takes back the
 * computer's reply together with the human's move. `null` when there is nothing to undo.
 */
function undoTarget(game: GameState, human: Color): GameState | null {
  for (let s = undoMove(game); s !== game; s = undoMove(s)) {
    if (s.toPlay === human && gameStatus(s) === 'playing') return s;
    if (!s.prev) return null;
  }
  return null;
}

/** One sentence for the screen-reader live region. */
function describeLastMove(game: GameState, human: Color): string {
  const move = game.moves.at(-1);
  if (game.resignedBy !== null) {
    return t('{color} resigned.', { color: colorName(game.resignedBy) });
  }
  if (!move) return '';
  const who = move.color === human ? t('You') : t('The computer');
  if (move.point === null) return t('{who} passed.', { who });
  const before = game.prev?.captures ?? game.captures;
  const taken = game.captures.black + game.captures.white - before.black - before.white;
  const where = pointName(game.config.size, move.point);
  if (taken <= 0) return t('{who} played {where}.', { who, where });
  return taken > 1
    ? t('{who} played {where} and captured {n} stones.', { who, where, n: taken })
    : t('{who} played {where} and captured {n} stone.', { who, where, n: taken });
}

type Stage = 'play' | 'result' | 'xp';

/** A game that is over: how it ended is fixed once, so every save attempt records the same game. */
interface Ending {
  game: GameState;
  result: GameResult;
  endedAt: number;
  dead: readonly number[];
}

export function PlayScreen() {
  const { base, createEngine } = useGoContext();
  const navigate = useNavigate();
  const repository = useGoRepository();
  const trainingEngine = useTrainingEngine();

  const [draft, setDraft] = useState<GoDraft | null | undefined>(undefined);
  const [game, setGame] = useState<GameState | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [dead, setDead] = useState<ReadonlySet<number>>(new Set());
  const [zoomed, setZoomed] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [stage, setStage] = useState<Stage>('play');
  const [result, setResult] = useState<{ game: GameResult; recorded: boolean } | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  /** Set from the moment the game ends until its result is saved; kept when saving fails. */
  const [ending, setEnding] = useState<Ending | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const resumedEnding = useRef(false);
  /** The game is over (saved or not): the computer must not move. */
  const over = useRef(false);
  /** The game was resigned or discarded: its draft is gone and must not be written again. */
  const closed = useRef(false);

  // The AI engine lives as long as the screen; the worker is released on unmount.
  const engine = useMemo(() => createEngine(), [createEngine]);
  useEffect(() => () => engine.dispose(), [engine]);

  useEffect(() => {
    let cancelled = false;
    void loadDraft(getDb())
      .catch(() => null) // an unreadable saved game counts as none
      .then(async (loaded) => {
        if (cancelled) return;
        const restored = loaded ? restoreGame(draftToSerialized(loaded)) : null;
        if (loaded && !restored) await clearDraft(getDb()); // corrupt record: start clean
        if (cancelled) return;
        setDraft(restored ? loaded : null);
        setGame(restored);
        if (!loaded || !restored) return;
        // A game that was over but never saved (a failed save, then a reload): try again at once.
        const dead = new Set(loaded.finished?.dead ?? []);
        if (loaded.finished || gameStatus(restored) === 'resigned') {
          resumedEnding.current = true;
          over.current = true;
          setDead(dead);
          setEnding({
            game: restored,
            result: gameResult(restored, dead),
            endedAt: loaded.finished?.endedAt ?? systemClock.now(),
            dead: [...dead],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const human: Color = draft?.humanColor === 'white' ? WHITE : BLACK;
  const ai = opponent(human);
  const status = game ? gameStatus(game) : 'playing';
  const humanTurn = game !== null && status === 'playing' && game.toPlay === human;

  // Resume after a reload or an iOS suspension: every move is saved as it is made.
  useEffect(() => {
    if (!draft || !game || ending !== null || closed.current) return;
    const serial = serializeGame(game);
    const next: GoDraft = {
      ...draft,
      moves: serial.moves,
      resignedBy:
        serial.resignedBy === null ? null : serial.resignedBy === BLACK ? 'black' : 'white',
    };
    void saveDraft(getDb(), next, systemClock.now());
  }, [draft, game, ending]);

  /**
   * Records the finished game. Safe to run again after a failure: the id, end time and result are
   * fixed in `p`, the game record is idempotent per id and the session per activity key.
   */
  const persist = useCallback(
    async (p: Ending) => {
      if (!draft || savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      setSaveError(null);
      try {
        const done = await finishGoGame(
          { db: getDb(), repository, engine: trainingEngine, now: () => systemClock.now() },
          draft,
          p.game,
          p.result,
          { endedAt: p.endedAt, dead: p.dead },
        );
        if (!done.ok) {
          setSaveError(done.message);
          return;
        }
        closed.current = true; // saved and the draft is gone: never write it again
        setEnding(null);
        setOutcome(done.session);
        setResult({ game: p.result, recorded: done.recorded });
        setStage('result');
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [draft, repository, trainingEngine],
  );

  const finishGame = useCallback(
    (state: GameState, final: GameResult, dead: ReadonlySet<number> = new Set()) => {
      if (savingRef.current || ending !== null) return;
      over.current = true;
      const next: Ending = {
        game: state,
        result: final,
        endedAt: systemClock.now(),
        dead: [...dead],
      };
      setEnding(next);
      void persist(next);
    },
    [persist, ending],
  );

  // a resumed game that was over but not saved: save it as soon as the screen is ready
  useEffect(() => {
    if (ending && draft && resumedEnding.current) {
      resumedEnding.current = false;
      void persist(ending);
    }
  }, [ending, draft, persist]);

  // The computer's turn.
  useEffect(() => {
    if (!draft || !game || status !== 'playing' || game.toPlay !== ai || over.current) return;
    let cancelled = false;
    setThinking(true);
    engine
      .choose(serializeGame(game), draft.level, draft.seed)
      .then((move) => {
        if (cancelled) return;
        setThinking(false);
        if (move.kind === 'resign') {
          const next = resign(game, ai);
          setGame(next);
          finishGame(next, gameResult(next));
          return;
        }
        const applied = move.kind === 'move' ? playStone(game, move.point) : passTurn(game);
        if (applied.ok) {
          setGame(applied.state);
          return;
        }
        const fallback = passTurn(game); // an unexpected rejection must never trap the player
        if (fallback.ok) setGame(fallback.state);
      })
      .catch(() => {
        if (cancelled) return;
        setThinking(false);
        const passed = passTurn(game);
        if (passed.ok) setGame(passed.state); // an engine failure must never trap the player
      });
    return () => {
      cancelled = true;
      setThinking(false);
    };
  }, [draft, game, status, ai, engine, finishGame]);

  const owner = useMemo(
    () => (game && status === 'scoring' ? areaScore(game.board, game.config.komi, dead) : null),
    [game, status, dead],
  );

  const marks = useMemo(() => {
    if (!game || !owner) return undefined;
    const out = new Map<number, PointMark>();
    for (let p = 0; p < game.board.cells.length; p++) {
      if (game.board.get(p) !== 0) {
        if (dead.has(p)) out.set(p, 'dead');
      } else if (owner.owner[p] === BLACK) out.set(p, 'black-area');
      else if (owner.owner[p] === WHITE) out.set(p, 'white-area');
    }
    return out;
  }, [game, owner, dead]);

  const place = (point: number) => {
    if (!game) return;
    const played = playStone(game, point);
    if (!played.ok) {
      setMessage(rejectionText(played.reason));
      return;
    }
    setMessage(null);
    setPending(null);
    setGame(played.state);
  };

  const onPoint = (point: number) => {
    if (!game) return;
    if (ending) return;
    if (status === 'scoring') {
      setDead(toggleDeadGroup(game.board, dead, point));
      return;
    }
    if (!humanTurn || thinking) return;
    if (game.config.size === 9 || pending === point) {
      place(point); // 9x9 points are big enough to place on one tap
      return;
    }
    // larger boards: tap to preview, tap the same point (or "Place stone") to confirm
    const probe = playStone(game, point);
    if (!probe.ok) {
      setMessage(rejectionText(probe.reason));
      setPending(null);
      return;
    }
    setMessage(null);
    setPending(point);
  };

  if (draft === undefined) {
    return (
      <Screen title={t('Game')} back={{ to: base, label: t('Go') }}>
        <p className="type-subhead text-muted" aria-busy="true">
          {t('Loading…')}
        </p>
      </Screen>
    );
  }
  if (!game || !draft) {
    return (
      <Screen title={t('Game')} back={{ to: base, label: t('Go') }}>
        <EmptyState
          icon="stones"
          title={t('No game in progress')}
          description={t('Start a new game from the Go home screen.')}
        />
      </Screen>
    );
  }

  const size = game.config.size;
  const target = undoTarget(game, human);
  const last = game.moves.at(-1);
  const lastPoint = last?.point ?? null;
  const prisoners = game.captures;
  const stoneNames = { you: colorName(human), computer: colorName(ai) };

  const saveFailed = ending !== null && !saving && saveError !== null;
  const statusText = ending
    ? saveFailed
      ? t('The game is over, but its result is not saved yet.')
      : t('Saving the result…')
    : status === 'scoring'
      ? t('Both players passed. Tap groups to mark them dead, then accept the result.')
      : thinking
        ? t('The computer is thinking…')
        : humanTurn
          ? last && last.point === null
            ? t('The computer passed. Your turn ({color})', { color: stoneNames.you })
            : t('Your turn ({color})', { color: stoneNames.you })
          : t('Waiting for the computer…');

  const goHome = () => void navigate(base);

  const doResign = async () => {
    setConfirmResign(false);
    closed.current = true; // resigning records nothing, so there is no draft to keep
    await clearDraft(getDb());
    goHome();
  };

  const runAutoMark = () => {
    setDead(suggestDeadStones(game.board, createRng(draft.seed + game.moves.length)));
  };

  const accept = () => finishGame(game, gameResult(game, dead), dead);

  return (
    <Screen title={t('Game')} back={{ to: base, label: t('Go') }}>
      <p role="status" aria-live="polite" className="sr-only">
        {describeLastMove(game, human)}
      </p>

      <div className="mb-3">
        <p className="type-subhead font-medium" aria-busy={thinking}>
          {statusText}
        </p>
        <p className="type-footnote text-muted tabular-nums">
          {t('Captured: {you} {youCount} · {computer} {computerCount}', {
            you: stoneNames.you,
            youCount: human === BLACK ? prisoners.black : prisoners.white,
            computer: stoneNames.computer,
            computerCount: human === BLACK ? prisoners.white : prisoners.black,
          })}
        </p>
      </div>

      <div className="overflow-x-auto overscroll-contain rounded-xl">
        <GoBoard
          board={game.board}
          label={t('{size} by {size} Go board', { size })}
          starPoints={starPoints(size)}
          lastMove={lastPoint}
          koPoint={status === 'playing' && game.ko >= 0 ? game.ko : null}
          pending={pending !== null ? { point: pending, color: human } : null}
          {...(marks ? { marks } : {})}
          mode={
            ending
              ? 'none'
              : status === 'scoring'
                ? 'mark'
                : humanTurn && !thinking
                  ? 'play'
                  : 'none'
          }
          onPoint={onPoint}
          pointLabel={(p) => pointName(size, p)}
          zoom={zoomed ? 1.9 : 1}
        />
      </div>

      {message && (
        <p role="alert" className="mt-2 type-subhead text-danger">
          {message}
        </p>
      )}

      {ending && saveFailed && (
        <Card className="mt-4" role="region" aria-labelledby="save-failed-heading">
          <h2 id="save-failed-heading" className="type-title-2">
            {t('Result not saved')}
          </h2>
          <p role="alert" className="mt-2 type-subhead text-danger">
            {saveError}
          </p>
          <p className="mt-2 type-subhead text-muted">
            {t('Your result is kept on this device. Try again now, or come back to it later.')}
          </p>
          <Button
            className="mt-3"
            fullWidth
            variant="secondary"
            onClick={() => void persist(ending)}
          >
            {t('Try saving again')}
          </Button>
        </Card>
      )}

      {status === 'playing' && !ending && (
        <div className="mt-4 space-y-2">
          {pending !== null && (
            <Button fullWidth onClick={() => place(pending)}>
              {t('Place stone at {point}', { point: pointName(size, pending) })}
            </Button>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!humanTurn || thinking}
              onClick={() => {
                setPending(null);
                const next = passTurn(game);
                if (next.ok) setGame(next.state);
              }}
            >
              {t('Pass')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!target || thinking}
              onClick={() => {
                if (!target) return;
                setPending(null);
                setMessage(null);
                setGame(target);
              }}
            >
              <Icon name="refresh" size={16} />
              {t('Undo')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmResign(true)}>
              {t('Resign')}
            </Button>
          </div>
          {size > 9 && (
            <Button variant="ghost" size="sm" fullWidth onClick={() => setZoomed((z) => !z)}>
              {zoomed ? t('Zoom out') : t('Zoom in')}
            </Button>
          )}
        </div>
      )}

      {status === 'scoring' && owner && !ending && (
        <Card className="mt-4" aria-labelledby="score-heading" role="region">
          <h2 id="score-heading" className="type-title-2">
            {t('Scoring')}
          </h2>
          <table className="mt-3 w-full type-subhead tabular-nums">
            <thead>
              <tr className="text-left text-muted">
                <th className="font-medium">{t('Area scoring')}</th>
                <th className="text-right font-medium">{t('Stones')}</th>
                <th className="text-right font-medium">{t('Territory')}</th>
                <th className="text-right font-medium">{t('Total')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="text-left font-medium">
                  {t('Black')}
                </th>
                <td className="text-right">{owner.blackStones}</td>
                <td className="text-right">{owner.blackTerritory}</td>
                <td className="text-right">{owner.black}</td>
              </tr>
              <tr>
                <th scope="row" className="text-left font-medium">
                  {t('White (+{komi} komi)', { komi: owner.komi })}
                </th>
                <td className="text-right">{owner.whiteStones}</td>
                <td className="text-right">{owner.whiteTerritory}</td>
                <td className="text-right">{owner.white + owner.komi}</td>
              </tr>
            </tbody>
          </table>
          <p className={cn('mt-3 type-headline')}>
            {owner.winner === 'draw'
              ? resultNotation(gameResult(game, dead).text)
              : owner.winner === human
                ? t('{result} (you win)', { result: gameResult(game, dead).text })
                : t('{result} (computer wins)', { result: gameResult(game, dead).text })}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="secondary" onClick={runAutoMark}>
              {t('Auto-mark dead stones (estimate)')}
            </Button>
            <Button variant="secondary" onClick={() => setDead(new Set())}>
              {t('Clear marks')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDead(new Set());
                setGame(resumePlay(game));
              }}
            >
              {t('Resume play')}
            </Button>
            <Button onClick={accept}>{t('Accept result')}</Button>
          </div>
          <p className="mt-3 type-footnote text-muted">
            {t(
              'Dead stones are removed, then each side counts its stones and the empty points only it touches. Auto-mark is a random-playout guess: check it before accepting.',
            )}
          </p>
        </Card>
      )}

      <details className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer type-subhead font-medium">{t('Move list')}</summary>
        <ol className="mt-2 space-y-0.5 type-footnote text-muted tabular-nums">
          {game.moves.map((m, i) => (
            <li key={i}>
              {t('{n}. {color} {move}', {
                n: i + 1,
                color: colorName(m.color),
                move: m.point === null ? t('pass') : pointName(size, m.point),
              })}
            </li>
          ))}
          {game.moves.length === 0 && <li>{t('No moves yet.')}</li>}
        </ol>
      </details>

      <ConfirmDialog
        open={confirmResign}
        title={t('Resign this game?')}
        message={t('You lose the game and it will not be recorded.')}
        confirmLabel={t('Resign')}
        destructive
        onConfirm={() => void doResign()}
        onCancel={() => setConfirmResign(false)}
      />

      <ResultSheet
        open={stage === 'result' && result !== null}
        result={result?.game ?? null}
        humanColor={human}
        recorded={result?.recorded ?? false}
        onClose={() => (outcome ? setStage('xp') : goHome())}
      />
      <SessionCompleteSheet
        outcome={stage === 'xp' ? outcome : null}
        onClose={() => {
          setStage('play');
          goHome();
        }}
      />
    </Screen>
  );
}
