import { Chess, type Square } from 'chess.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { OPENINGS, openingById, openingUci, type Opening } from '../domain/openings';
import { checkedKingSquare, legalTargets, needsPromotion, replay } from '../domain/rules';
import { ChessBoard, type BoardFeedback } from './ChessBoard';
import { PromotionSheet } from './PromotionSheet';
import { CHESS_BASE } from './useChess';
import type { PromotionPiece } from '../domain/rules';

const OPPONENT_DELAY_MS = 600;
const FEEDBACK_MS = 700;

export function OpeningsList() {
  return (
    <Screen title="Openings" back={{ to: CHESS_BASE, label: 'Chess' }}>
      <p className="type-subhead text-muted">
        Play the main line move by move. The app plays the other side and tells you when you leave
        the book.
      </p>
      <Section title="Lines" footer="Sound, commonly played lines, not a complete repertoire.">
        {OPENINGS.map((o) => (
          <ListRow
            key={o.id}
            title={o.name}
            subtitle={`${o.eco} · you play ${o.side === 'w' ? 'White' : 'Black'} · ${o.moves.length} moves`}
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

  const chess = useMemo(() => replay(line.slice(0, step)) ?? new Chess(), [line, step]);
  const complete = step >= line.length;
  const learnersTurn = !complete && chess.turn() === learner;
  const lastNote = step > 0 ? opening.moves[step - 1]?.note : undefined;
  const lastUci = step > 0 ? line[step - 1] : undefined;

  // the app plays the other side's book moves
  useEffect(() => {
    if (complete || learnersTurn) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 300 : OPPONENT_DELAY_MS);
    return () => window.clearTimeout(t);
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
      setMessage('That is not the book move here. Try again, or use a hint.');
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
    setHint(hint.length === 0 ? [next.slice(0, 2) as Square] : [next.slice(0, 2) as Square, next.slice(2, 4) as Square]);
  };

  const reveal = () => {
    setMistakes((m) => m + 1);
    setHint([]);
    setMessage('Shown from the book. Play it next time without help.');
    setStep((s) => s + 1);
  };

  const restart = () => {
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
  const lineText = sans
    .map((san, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${san}` : san))
    .join(' ');

  return (
    <Screen title={opening.name} back={{ to: `${CHESS_BASE}/openings`, label: 'Openings' }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge>
            {opening.eco} · you play {learner === 'w' ? 'White' : 'Black'}
          </Badge>
          <span className="type-subhead text-muted" aria-live="polite">
            {complete
              ? 'Line complete'
              : learnersTurn
                ? `Your move ${Math.min(done, learnerMoves)} of ${learnerMoves}`
                : 'Opponent is moving…'}
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
          label="Opening board"
        />

        <div role="status" aria-live="polite" className="min-h-[1.5rem]">
          {message && <p className="type-body text-danger">{message}</p>}
          {!message && lastNote && <p className="type-body">{lastNote}</p>}
        </div>

        <p aria-label="Moves so far" className="min-h-[1.25rem] type-subhead tabular-nums text-muted">
          {lineText}
        </p>

        {complete ? (
          <Card role="region" aria-labelledby="done-title">
            <h2 id="done-title" className="type-title-2">
              Line complete
            </h2>
            <p className="mt-1 type-subhead text-muted">
              {mistakes === 0
                ? 'No mistakes or hints. Nicely drilled.'
                : `${mistakes} slip${mistakes === 1 ? '' : 's'} or hint${mistakes === 1 ? '' : 's'} this time. Run it again to make it automatic.`}
            </p>
            <Button className="mt-3" fullWidth onClick={restart}>
              Drill again
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={!learnersTurn || hint.length >= 2}
              onClick={showHint}
            >
              {hint.length === 0 ? 'Hint' : 'More hint'}
            </Button>
            <Button variant="ghost" disabled={!learnersTurn} onClick={reveal}>
              Show move
            </Button>
          </div>
        )}

        <Card role="region" aria-labelledby="ideas-title">
          <h2 id="ideas-title" className="type-headline">
            The ideas
          </h2>
          <p className="mt-1 type-subhead text-muted">{opening.summary}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 type-subhead">
            {opening.ideas.map((idea) => (
              <li key={idea}>{idea}</li>
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
