import { Chess, type Square } from 'chess.js';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { getDb } from '@/db/boot';
import { t } from '@/i18n/core';
import { ListRow, Section } from '@/components/Section';
import {
  loadOpeningProgress,
  recordOpeningRun,
  type OpeningProgress,
} from '../data/chessRepository';
import { OPENINGS, openingById, openingUci, type Opening } from '../domain/openings';
import { checkedKingSquare, legalTargets, needsPromotion, replay } from '../domain/rules';
import { ChessBoard, type BoardFeedback } from './ChessBoard';
import { PromotionSheet } from './PromotionSheet';
import { sideName } from './labels';
import { CHESS_BASE } from './useChess';
import type { PromotionPiece } from '../domain/rules';

const OPPONENT_DELAY_MS = 600;
const FEEDBACK_MS = 700;

/** "Completed · 3 runs · best: no mistakes", or nothing for a line that was never finished. */
function progressText(progress: OpeningProgress | undefined): string | null {
  if (!progress) return null;
  const runs =
    progress.completions === 1
      ? t('Completed · {n} run', { n: progress.completions })
      : t('Completed · {n} runs', { n: progress.completions });
  const best =
    progress.bestMistakes === 0
      ? t('best: no mistakes')
      : progress.bestMistakes === 1
        ? t('best: {n} slip or hint', { n: progress.bestMistakes })
        : t('best: {n} slips or hints', { n: progress.bestMistakes });
  return `${runs} · ${best}`;
}

export function OpeningsList() {
  const progress = useLiveQuery(() => loadOpeningProgress(getDb()), []);
  const done = progress ? OPENINGS.filter((o) => progress.has(o.id)).length : 0;
  return (
    <Screen title={t('Openings')} back={{ to: CHESS_BASE, label: t('Chess') }}>
      <p className="type-subhead text-muted">
        {t(
          'Play the main line move by move. The app plays the other side and tells you when you leave the book.',
        )}
      </p>
      <Section
        title={t('Lines')}
        footer={`${t('{done} of {total} lines completed.', { done, total: OPENINGS.length })} ${t('Sound, commonly played lines, not a complete repertoire.')}`}
      >
        {OPENINGS.map((o) => (
          <ListRow
            key={o.id}
            title={t(o.name)}
            subtitle={[
              t('{eco} · you play {color} · {n} moves', {
                eco: o.eco,
                color: sideName(o.side),
                n: o.moves.length,
              }),
              progressText(progress?.get(o.id)),
            ]
              .filter(Boolean)
              .join(' · ')}
            icon="book"
            iconColor="#64748b"
            to={`${CHESS_BASE}/openings/${o.id}`}
          />
        ))}
      </Section>
    </Screen>
  );
}

export function OpeningDrillRoute() {
  const { openingId } = useParams();
  const opening = openingId ? openingById(openingId) : undefined;
  if (!opening) return <Navigate to={`${CHESS_BASE}/openings`} replace />;
  return <OpeningDrill key={opening.id} opening={opening} />;
}

function OpeningDrill({ opening }: { opening: Opening }) {
  const line = useMemo(() => openingUci(opening), [opening]);
  const learner = opening.side;
  /** Plies of the line already on the board. */
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<Square[]>([]);
  const [feedback, setFeedback] = useState<BoardFeedback | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'failed' | null>(null);
  const recording = useRef(false);

  const chess = useMemo(() => replay(line.slice(0, step)) ?? new Chess(), [line, step]);
  const complete = step >= line.length;

  /** Stores one finished run (once per run; a failed save can be retried). */
  const record = useCallback(() => {
    if (recording.current) return;
    recording.current = true;
    setSaveState('saving');
    recordOpeningRun(getDb(), opening.id, mistakes, Date.now()).then(
      () => setSaveState('saved'),
      () => {
        recording.current = false;
        setSaveState('failed');
      },
    );
  }, [opening.id, mistakes]);
  useEffect(() => {
    if (complete) record();
  }, [complete, record]);
  const learnersTurn = !complete && chess.turn() === learner;
  const lastNote = step > 0 ? opening.moves[step - 1]?.note : undefined;
  const lastUci = step > 0 ? line[step - 1] : undefined;

  // the app plays the other side's book moves
  useEffect(() => {
    if (complete || learnersTurn) return;
    const timer = window.setTimeout(
      () => setStep((s) => s + 1),
      step === 0 ? 300 : OPPONENT_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [complete, learnersTurn, step]);

  const targetsFrom = useCallback((from: Square) => legalTargets(chess, from), [chess]);

  const submit = (uci: string) => {
    const to = uci.slice(2, 4) as Square;
    if (uci === line[step]) {
      setStep((s) => s + 1);
      setHint([]);
      setMessage(null);
      setFeedback({ square: to, tone: 'good' });
    } else {
      setMistakes((m) => m + 1);
      setMessage(t('That is not the book move here. Try again, or use a hint.'));
      setFeedback({ square: to, tone: 'bad' });
    }
    window.setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  const onBoardMove = (from: Square, to: Square) => {
    if (needsPromotion(chess, from, to)) setPromotion({ from, to });
    else submit(from + to);
  };

  const choosePromotion = (piece: PromotionPiece) => {
    if (promotion) submit(promotion.from + promotion.to + piece);
    setPromotion(null);
  };

  const showHint = () => {
    const next = line[step];
    if (!next) return;
    setHint(
      hint.length === 0
        ? [next.slice(0, 2) as Square]
        : [next.slice(0, 2) as Square, next.slice(2, 4) as Square],
    );
  };

  const reveal = () => {
    setMistakes((m) => m + 1);
    setHint([]);
    setMessage(t('Shown from the book. Play it next time without help.'));
    setStep((s) => s + 1);
  };

  const restart = () => {
    recording.current = false;
    setSaveState(null);
    setStep(0);
    setMistakes(0);
    setHint([]);
    setMessage(null);
  };

  const learnerMoves = line.filter((_, i) => (i % 2 === 0) === (learner === 'w')).length;
  const done = Math.ceil((learner === 'w' ? step + 1 : step) / 2);
  const lastMove = lastUci
    ? { from: lastUci.slice(0, 2) as Square, to: lastUci.slice(2, 4) as Square }
    : null;
  const sans = chess.history();
  const lineText = sans.map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san)).join(' ');

  return (
    <Screen title={t(opening.name)} back={{ to: `${CHESS_BASE}/openings`, label: t('Openings') }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge>
            {t('{eco} · you play {color}', { eco: opening.eco, color: sideName(learner) })}
          </Badge>
          <span className="type-subhead text-muted" aria-live="polite">
            {complete
              ? t('Line complete')
              : learnersTurn
                ? t('Your move {done} of {total}', {
                    done: Math.min(done, learnerMoves),
                    total: learnerMoves,
                  })
                : t('Opponent is moving…')}
          </span>
        </div>

        <ChessBoard
          fen={chess.fen()}
          orientation={learner}
          movable={learnersTurn ? learner : null}
          targetsFrom={targetsFrom}
          onMove={onBoardMove}
          lastMove={lastMove}
          checkSquare={checkedKingSquare(chess)}
          hints={hint}
          feedback={feedback}
          label={t('Opening board')}
        />

        <div role="status" aria-live="polite" className="min-h-[1.5rem]">
          {message && <p className="type-body text-danger">{message}</p>}
          {!message && lastNote && <p className="type-body">{t(lastNote)}</p>}
        </div>

        <p
          aria-label={t('Moves so far')}
          className="min-h-[1.25rem] type-subhead tabular-nums text-muted"
        >
          {lineText}
        </p>

        {complete ? (
          <Card role="region" aria-labelledby="done-title">
            <h2 id="done-title" className="type-title-2">
              {t('Line complete')}
            </h2>
            <p className="mt-1 type-subhead text-muted">
              {mistakes === 0
                ? t('No mistakes or hints. Nicely drilled.')
                : mistakes === 1
                  ? t('{n} slip or hint this time. Run it again to make it automatic.', {
                      n: mistakes,
                    })
                  : t('{n} slips or hints this time. Run it again to make it automatic.', {
                      n: mistakes,
                    })}
            </p>
            {saveState === 'saved' && (
              <p className="mt-2 type-footnote text-muted">{t('Progress saved on this device.')}</p>
            )}
            {saveState === 'failed' && (
              <div className="mt-2 space-y-2">
                <p role="alert" className="type-subhead text-danger">
                  {t('Your progress could not be saved.')}
                </p>
                <Button variant="secondary" fullWidth onClick={record}>
                  {t('Try saving again')}
                </Button>
              </div>
            )}
            <Button className="mt-3" fullWidth onClick={restart}>
              {t('Drill again')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={!learnersTurn || hint.length >= 2}
              onClick={showHint}
            >
              {hint.length === 0 ? t('Hint') : t('More hint')}
            </Button>
            <Button variant="ghost" disabled={!learnersTurn} onClick={reveal}>
              {t('Show move')}
            </Button>
          </div>
        )}

        <Card role="region" aria-labelledby="ideas-title">
          <h2 id="ideas-title" className="type-headline">
            {t('The ideas')}
          </h2>
          <p className="mt-1 type-subhead text-muted">{t(opening.summary)}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 type-subhead">
            {opening.ideas.map((idea) => (
              <li key={idea}>{t(idea)}</li>
            ))}
          </ul>
        </Card>
      </div>

      <PromotionSheet
        open={promotion !== null}
        color={learner}
        onChoose={choosePromotion}
        onCancel={() => setPromotion(null)}
      />
    </Screen>
  );
}
