import type { Color, PieceSymbol, Square } from 'chess.js';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { PIECE_NAMES } from '../domain/rules';
import { PieceGlyph } from './pieces';

const FILES = 'abcdefgh';

interface Placed {
  type: PieceSymbol;
  color: Color;
}

/** FEN piece placement -> map of square to piece (no chess.js instance needed to draw). */
function piecesFromFen(fen: string): Map<Square, Placed> {
  const out = new Map<Square, Placed>();
  const rows = (fen.split(' ')[0] ?? '').split('/');
  rows.forEach((row, i) => {
    let file = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
      } else {
        const square = `${FILES[file]}${8 - i}` as Square;
        out.set(square, {
          type: ch.toLowerCase() as PieceSymbol,
          color: ch === ch.toLowerCase() ? 'b' : 'w',
        });
        file++;
      }
    }
  });
  return out;
}

export interface BoardFeedback {
  square: Square;
  tone: 'good' | 'bad';
}

interface ChessBoardProps {
  fen: string;
  /** The side drawn at the bottom. */
  orientation: Color;
  /** The side the user may move right now, or null when the board is read-only. */
  movable: Color | null;
  /** Legal destinations for the piece on `from`. */
  targetsFrom: (from: Square) => readonly Square[];
  onMove: (from: Square, to: Square) => void;
  lastMove?: { from: Square; to: Square } | null;
  /** Square of the king that is in check. */
  checkSquare?: Square | null;
  /** Squares outlined as a hint. */
  hints?: readonly Square[];
  feedback?: BoardFeedback | null;
  label?: string;
}

const LIGHT = 'color-mix(in srgb, var(--accent) 10%, var(--surface))';
const DARK = 'color-mix(in srgb, var(--accent) 42%, var(--surface))';
const KEY_DELTA: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function overlayColor(
  isSelected: boolean,
  feedback: 'good' | 'bad' | null,
): string {
  if (isSelected) return 'color-mix(in srgb, var(--accent) 60%, transparent)';
  if (feedback === 'good') return 'color-mix(in srgb, var(--success) 55%, transparent)';
  if (feedback === 'bad') return 'color-mix(in srgb, var(--danger) 55%, transparent)';
  return 'color-mix(in srgb, var(--xp) 45%, transparent)'; // last move
}

/**
 * One board for puzzles, games and openings. Tap a piece, then a highlighted square. Squares are
 * buttons with spoken coordinates and occupant; arrow keys move between them (roving tabindex).
 */
export function ChessBoard({
  fen,
  orientation,
  movable,
  targetsFrom,
  onMove,
  lastMove,
  checkSquare,
  hints = [],
  feedback,
  label = 'Chess board',
}: ChessBoardProps) {
  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const [selected, setSelected] = useState<{ fen: string; square: Square } | null>(null);
  const [focused, setFocused] = useState<Square | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // a selection belongs to one position: any move or reset (new fen) drops it
  const selectedSquare = selected && selected.fen === fen ? selected.square : null;
  const targets = useMemo(
    () => new Set(selectedSquare ? targetsFrom(selectedSquare) : []),
    [selectedSquare, targetsFrom],
  );

  const ranks = orientation === 'w' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === 'w' ? [...FILES] : [...FILES].reverse();
  const squares = ranks.flatMap((rank) => files.map((file) => `${file}${rank}` as Square));
  const tabSquare = focused ?? selectedSquare ?? squares[0];

  const press = (square: Square) => {
    setFocused(square);
    if (movable === null) return;
    const piece = pieces.get(square);
    if (selectedSquare && targets.has(square)) {
      setSelected(null);
      onMove(selectedSquare, square);
      return;
    }
    if (piece?.color === movable && square !== selectedSquare) {
      setSelected({ fen, square });
      return;
    }
    setSelected(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = KEY_DELTA[event.key];
    const current = event.target instanceof HTMLElement ? event.target.dataset['square'] : undefined;
    if (!delta || !current) return;
    event.preventDefault();
    const index = squares.indexOf(current as Square);
    const col = Math.min(7, Math.max(0, (index % 8) + delta[0]));
    const row = Math.min(7, Math.max(0, Math.floor(index / 8) + delta[1]));
    const next = squares[row * 8 + col];
    if (!next) return;
    setFocused(next);
    rootRef.current?.querySelector<HTMLElement>(`[data-square="${next}"]`)?.focus();
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="mx-auto grid aspect-square w-full max-w-[34rem] touch-none select-none grid-cols-8 grid-rows-8 overflow-hidden rounded-xl border border-border"
    >
      {squares.map((square, i) => {
        const file = square.charCodeAt(0) - 97;
        const rank = Number(square[1]);
        const dark = (file + rank) % 2 === 0;
        const piece = pieces.get(square);
        const isTarget = targets.has(square);
        const isSelected = square === selectedSquare;
        const isLast = lastMove ? square === lastMove.from || square === lastMove.to : false;
        const isCheck = square === checkSquare;
        const isHint = hints.includes(square);
        const tone = feedback?.square === square ? feedback.tone : null;
        const occupant = piece
          ? `${square}, ${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}`
          : `${square}, empty`;
        const spoken = [
          occupant,
          isSelected && 'selected',
          isTarget && (piece ? 'capture' : 'legal move'),
          isCheck && 'king in check',
          isHint && 'hint',
        ]
          .filter(Boolean)
          .join(', ');
        return (
          <button
            key={square}
            type="button"
            data-square={square}
            aria-label={spoken}
            tabIndex={square === tabSquare ? 0 : -1}
            onClick={() => press(square)}
            onFocus={() => setFocused(square)}
            className="relative flex items-center justify-center p-0 outline-offset-[-3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent"
            style={{ background: dark ? DARK : LIGHT }}
          >
            {(isLast || isSelected || tone) && (
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: overlayColor(isSelected, tone) }}
              />
            )}
            {isCheck && (
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in srgb, var(--danger) 85%, transparent) 0%, transparent 70%)',
                }}
              />
            )}
            {isHint && (
              <span
                aria-hidden="true"
                className="absolute inset-[3px] rounded-md border-[3px]"
                style={{ borderColor: 'var(--success)' }}
              />
            )}
            {piece && (
              <PieceGlyph type={piece.type} color={piece.color} className="relative size-full" />
            )}
            {isTarget && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute rounded-full',
                  piece ? 'inset-[6%] border-[3px]' : 'size-[28%]',
                )}
                style={
                  piece
                    ? { borderColor: 'color-mix(in srgb, var(--text) 55%, transparent)' }
                    : { background: 'color-mix(in srgb, var(--text) 45%, transparent)' }
                }
              />
            )}
            {i % 8 === 0 && (
              <span
                aria-hidden="true"
                className="absolute left-0.5 top-0 text-[10px] font-semibold leading-tight"
                style={{ color: dark ? LIGHT : DARK }}
              >
                {rank}
              </span>
            )}
            {i >= 56 && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0.5 text-[10px] font-semibold leading-tight"
                style={{ color: dark ? LIGHT : DARK }}
              >
                {square[0]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
