import { useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n/core';
import { cn } from '@/utils/cn';
import type { BoardSize, Stone } from '../domain/board';

interface CaroBoardProps {
  size: BoardSize;
  /** 0 empty, 1 / 2 stones. */
  cells: Uint8Array;
  /** The stone the person plays (only used to word the cell labels). */
  humanStone: Stone;
  lastMove: number | null;
  winLine: readonly number[];
  /** A cell chosen but not yet confirmed (confirm-each-move mode). */
  preview: number | null;
  /** Clicks are ignored (computer thinking, game over). The board stays readable and focusable. */
  locked: boolean;
  onSelect: (index: number) => void;
}

/** Traditional marker points ("hoshi") that help the eye find the centre. */
const STAR_POINTS: Record<BoardSize, readonly (readonly [number, number])[]> = {
  15: [
    [3, 3],
    [3, 11],
    [7, 7],
    [11, 3],
    [11, 11],
  ],
  9: [
    [2, 2],
    [2, 6],
    [4, 4],
    [6, 2],
    [6, 6],
  ],
};

/** Stone 1 is a filled disc, stone 2 a hollow one: told apart by shape, not by colour alone. */
function StoneMark({
  stone,
  row,
  col,
  ghost = false,
}: {
  stone: Stone;
  row: number;
  col: number;
  ghost?: boolean;
}) {
  return (
    <circle
      cx={col + 0.5}
      cy={row + 0.5}
      r={0.4}
      style={{
        fill: stone === 1 ? 'var(--text)' : 'var(--surface)',
        stroke: 'var(--text)',
        strokeWidth: 0.07,
        opacity: ghost ? 0.45 : 1,
      }}
    />
  );
}

function describeCell(
  size: BoardSize,
  index: number,
  stone: number,
  humanStone: Stone,
  extra: string[],
): string {
  const row = Math.floor(index / size) + 1;
  const col = (index % size) + 1;
  const who =
    stone === 0 ? t('empty') : stone === humanStone ? t('your stone') : t('computer stone');
  return [t('Row {row}, column {col}, {who}', { row, col, who }), ...extra].join(', ');
}

/**
 * The board: an SVG drawing (lines, stones, markers) under a grid of real buttons that carry
 * the interaction and the accessibility. One tab stop with arrow-key navigation (roving
 * tabindex) so keyboard and screen-reader users are not walked through 225 cells.
 *
 * On a 375 pt phone a 15x15 cell is only about 23 pt wide, below the 44 pt target. The page
 * therefore offers "confirm each move" (tap to aim, tap again or press Place stone), which
 * turns a mis-tap into a correction instead of a lost move.
 */
export function CaroBoard({
  size,
  cells,
  humanStone,
  lastMove,
  winLine,
  preview,
  locked,
  onSelect,
}: CaroBoardProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState(Math.floor((size * size) / 2));
  const onWinLine = new Set(winLine);
  const first = winLine[0];
  const last = winLine[winLine.length - 1];

  const moveFocus = (index: number) => {
    setFocusIndex(index);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = step[event.key];
    if (!delta) return;
    event.preventDefault();
    const nextRow = Math.min(size - 1, Math.max(0, row + delta[0]));
    const nextCol = Math.min(size - 1, Math.max(0, col + delta[1]));
    moveFocus(nextRow * size + nextCol);
  };

  const lines = Array.from({ length: size }, (_, k) => k + 0.5);

  return (
    <div className="relative aspect-square w-full touch-manipulation select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 size-full"
        aria-hidden="true"
        focusable="false"
      >
        <rect width={size} height={size} rx={0.35} style={{ fill: 'var(--accent-soft)' }} />
        <g style={{ stroke: 'var(--text-muted)', strokeWidth: 0.04 }}>
          {lines.map((p) => (
            <g key={p}>
              <line x1={0.5} x2={size - 0.5} y1={p} y2={p} />
              <line y1={0.5} y2={size - 0.5} x1={p} x2={p} />
            </g>
          ))}
        </g>
        {STAR_POINTS[size].map(([r, c]) => (
          <circle
            key={`${r}-${c}`}
            cx={c + 0.5}
            cy={r + 0.5}
            r={0.1}
            style={{ fill: 'var(--text-muted)' }}
          />
        ))}
        {Array.from(cells, (stone, index) =>
          stone === 0 ? null : (
            <StoneMark
              key={index}
              stone={stone === 1 ? 1 : 2}
              row={Math.floor(index / size)}
              col={index % size}
            />
          ),
        )}
        {preview !== null && (
          <StoneMark
            ghost
            stone={humanStone}
            row={Math.floor(preview / size)}
            col={preview % size}
          />
        )}
        {first !== undefined && last !== undefined && (
          <line
            x1={(first % size) + 0.5}
            y1={Math.floor(first / size) + 0.5}
            x2={(last % size) + 0.5}
            y2={Math.floor(last / size) + 0.5}
            style={{ stroke: 'var(--success)', strokeWidth: 0.14, strokeLinecap: 'round' }}
          />
        )}
        {winLine.map((index) => (
          <circle
            key={index}
            cx={(index % size) + 0.5}
            cy={Math.floor(index / size) + 0.5}
            r={0.48}
            style={{ fill: 'none', stroke: 'var(--success)', strokeWidth: 0.1 }}
          />
        ))}
        {lastMove !== null && (
          <rect
            x={(lastMove % size) + 0.08}
            y={Math.floor(lastMove / size) + 0.08}
            width={0.84}
            height={0.84}
            rx={0.12}
            style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 0.08 }}
          />
        )}
        {preview !== null && (
          <rect
            x={(preview % size) + 0.08}
            y={Math.floor(preview / size) + 0.08}
            width={0.84}
            height={0.84}
            rx={0.12}
            style={{
              fill: 'none',
              stroke: 'var(--accent)',
              strokeWidth: 0.08,
              strokeDasharray: '0.16 0.14',
            }}
          />
        )}
      </svg>

      <div
        role="grid"
        aria-label={t('Caro board, {size} by {size}', { size })}
        aria-rowcount={size}
        aria-colcount={size}
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {Array.from({ length: size }, (_, row) => (
          <div key={row} role="row" className="contents">
            {Array.from({ length: size }, (_, col) => {
              const index = row * size + col;
              const extra: string[] = [];
              if (index === lastMove) extra.push(t('last move'));
              if (onWinLine.has(index)) extra.push(t('winning line'));
              if (index === preview) extra.push(t('selected'));
              return (
                <div key={col} role="gridcell" className="relative">
                  <button
                    type="button"
                    ref={(el) => {
                      buttons.current[index] = el;
                    }}
                    tabIndex={index === focusIndex ? 0 : -1}
                    aria-label={describeCell(size, index, cells[index] ?? 0, humanStone, extra)}
                    aria-disabled={locked || cells[index] !== 0 || undefined}
                    onFocus={() => setFocusIndex(index)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                    onClick={() => {
                      if (!locked && cells[index] === 0) onSelect(index);
                    }}
                    className={cn(
                      'absolute inset-0 rounded-sm bg-transparent',
                      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                    )}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
