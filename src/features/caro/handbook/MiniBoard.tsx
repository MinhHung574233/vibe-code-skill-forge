import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n/core';
import { cn } from '@/utils/cn';
import type { Edge, Mark, MarkKind, Spot } from './types';

/** Column letters for the spoken names of cells (C4 = third column, fourth row of the window). */
const LETTERS = 'ABCDEFGHIJKLMNOPQRS';

export const spotName = (spot: Spot): string => `${LETTERS[spot[1]] ?? '?'}${spot[0] + 1}`;

const edgeLabel = (edge: Edge): string => {
  switch (edge) {
    case 'top':
      return t('top side');
    case 'bottom':
      return t('bottom side');
    case 'left':
      return t('left side');
    case 'right':
      return t('right side');
  }
};

/**
 * The sentence a screen reader gets for a static diagram: size, who has stones where, the walls,
 * the real board edges and the marked cells. Built from the data so it can never drift from the
 * picture. Cell names are column letter + row number inside the window ("C4").
 */
export function describeDiagram(
  rows: readonly string[],
  edges: readonly Edge[] = [],
  marks: readonly Mark[] = [],
): string {
  const first: string[] = [];
  const second: string[] = [];
  const blocked: string[] = [];
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      const name = spotName([r, c]);
      if (ch === 'X') first.push(name);
      else if (ch === 'O') second.push(name);
      else if (ch === '#') blocked.push(name);
    });
  });
  const parts = [
    t('Board section, {rows} rows by {cols} columns.', {
      rows: rows.length,
      cols: rows[0]?.length ?? 0,
    }),
  ];
  if (first.length + second.length === 0) parts.push(t('No stones.'));
  if (first.length > 0)
    parts.push(t('First player (filled stones): {cells}.', { cells: first.join(', ') }));
  if (second.length > 0) {
    parts.push(t('Second player (ring stones): {cells}.', { cells: second.join(', ') }));
  }
  if (blocked.length > 0) parts.push(t('Blocked squares: {cells}.', { cells: blocked.join(', ') }));
  if (edges.length > 0) {
    parts.push(t('Board edge: {sides}.', { sides: edges.map(edgeLabel).join(', ') }));
  }
  const byKind = new Map<MarkKind, string[]>();
  for (const mark of marks) {
    const list = byKind.get(mark.kind) ?? [];
    const name = spotName(mark.at);
    list.push(mark.label ? `${mark.label} ${name}` : name);
    byKind.set(mark.kind, list);
  }
  const cells = (kind: MarkKind): string => (byKind.get(kind) ?? []).join(', ');
  if (byKind.has('move')) parts.push(t('Suggested move: {cells}.', { cells: cells('move') }));
  if (byKind.has('win')) parts.push(t('Winning line: {cells}.', { cells: cells('win') }));
  if (byKind.has('end')) parts.push(t('End cells: {cells}.', { cells: cells('end') }));
  if (byKind.has('key')) parts.push(t('Look here: {cells}.', { cells: cells('key') }));
  if (byKind.has('bad')) parts.push(t('Wrong move: {cells}.', { cells: cells('bad') }));
  return parts.join(' ');
}

function Stone({
  stone,
  row,
  col,
  ghost,
}: {
  stone: 1 | 2;
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

function Cross({ row, col, color }: { row: number; col: number; color: string }) {
  const x = col + 0.5;
  const y = row + 0.5;
  const d = 0.26;
  return (
    <path
      d={`M${x - d} ${y - d}L${x + d} ${y + d}M${x + d} ${y - d}L${x - d} ${y + d}`}
      style={{ stroke: color, strokeWidth: 0.13, strokeLinecap: 'round', fill: 'none' }}
    />
  );
}

function MarkShape({ mark }: { mark: Mark }) {
  const [row, col] = mark.at;
  const cx = col + 0.5;
  const cy = row + 0.5;
  switch (mark.kind) {
    case 'move':
      return (
        <g>
          <rect
            x={col + 0.08}
            y={row + 0.08}
            width={0.84}
            height={0.84}
            rx={0.12}
            style={{
              fill: 'var(--accent-soft)',
              stroke: 'var(--accent)',
              strokeWidth: 0.08,
              strokeDasharray: '0.16 0.14',
            }}
          />
          {mark.label ? (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fill: 'var(--accent)', fontSize: 0.5, fontWeight: 700 }}
            >
              {mark.label}
            </text>
          ) : (
            <path
              d={`M${cx - 0.2} ${cy}H${cx + 0.2}M${cx} ${cy - 0.2}V${cy + 0.2}`}
              style={{ stroke: 'var(--accent)', strokeWidth: 0.1, strokeLinecap: 'round' }}
            />
          )}
        </g>
      );
    case 'win':
      return (
        <circle
          cx={cx}
          cy={cy}
          r={0.48}
          style={{ fill: 'none', stroke: 'var(--success)', strokeWidth: 0.1 }}
        />
      );
    case 'end':
      return (
        <g>
          <rect
            x={col + 0.1}
            y={row + 0.1}
            width={0.8}
            height={0.8}
            rx={0.12}
            style={{ fill: 'none', stroke: 'var(--danger)', strokeWidth: 0.06 }}
          />
          <Cross row={row} col={col} color="var(--danger)" />
        </g>
      );
    case 'key':
      return <circle cx={cx} cy={cy} r={0.15} style={{ fill: 'var(--accent)' }} />;
    case 'bad':
      return (
        <g>
          <rect
            x={col + 0.08}
            y={row + 0.08}
            width={0.84}
            height={0.84}
            rx={0.12}
            style={{
              fill: 'none',
              stroke: 'var(--danger)',
              strokeWidth: 0.08,
              strokeDasharray: '0.16 0.14',
            }}
          />
          <Cross row={row} col={col} color="var(--danger)" />
        </g>
      );
  }
}

export interface MiniBoardProps {
  rows: readonly string[];
  edges?: readonly Edge[];
  marks?: readonly Mark[];
  /** Accessible name. Static boards default to a generated description of the position. */
  label?: string;
  /** When set the board is a grid of buttons and tapping a square calls this. */
  onSelect?: (spot: Spot) => void;
  /** The square the person tapped: drawn as a ghost first-player stone. */
  pick?: Spot | null;
  /** Taps are ignored (the exercise is over) but the board stays readable. */
  locked?: boolean;
  className?: string;
}

const CELL_PX = 46;

/**
 * A small, static picture of part of a Caro board (an SVG). Filled stones are the first player,
 * rings the second, hatched squares are blocked. With `onSelect` it also takes taps, through a
 * grid of real buttons laid over the drawing (one tab stop, arrow keys), like the game board.
 */
export function MiniBoard({
  rows,
  edges = [],
  marks = [],
  label,
  onSelect,
  pick = null,
  locked = false,
  className,
}: MiniBoardProps) {
  const patternId = `hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const [focusIndex, setFocusIndex] = useState(Math.floor((height * width) / 2));
  const edgeSet = new Set(edges);
  const x1 = edgeSet.has('left') ? 0.5 : 0;
  const x2 = edgeSet.has('right') ? width - 0.5 : width;
  const y1 = edgeSet.has('top') ? 0.5 : 0;
  const y2 = edgeSet.has('bottom') ? height - 0.5 : height;
  // A winning line is drawn between neighbouring `win` marks, so several lines can share a picture.
  const wins = marks.filter((m) => m.kind === 'win');
  const winLinks = wins.flatMap((mark, i) => {
    const next = wins[i + 1];
    return next && Math.abs(next.at[0] - mark.at[0]) <= 1 && Math.abs(next.at[1] - mark.at[1]) <= 1
      ? [{ from: mark.at, to: next.at }]
      : [];
  });
  const interactive = onSelect !== undefined;

  const symbolAt = (r: number, c: number): string => rows[r]?.[c] ?? '.';

  const describeSquare = (r: number, c: number): string => {
    const ch = symbolAt(r, c);
    const what =
      ch === 'X'
        ? t('first-player stone')
        : ch === 'O'
          ? t('second-player stone')
          : ch === '#'
            ? t('blocked square')
            : t('empty square');
    return t('Row {row}, column {col}: {what}', { row: r + 1, col: c + 1, what });
  };

  const moveFocus = (r: number, c: number) => {
    const index = r * width + c;
    setFocusIndex(index);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, r: number, c: number) => {
    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const delta = step[event.key];
    if (!delta) return;
    event.preventDefault();
    moveFocus(
      Math.min(height - 1, Math.max(0, r + delta[0])),
      Math.min(width - 1, Math.max(0, c + delta[1])),
    );
  };

  const drawing = (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="block h-auto w-full"
      role={interactive ? undefined : 'img'}
      aria-label={interactive ? undefined : (label ?? describeDiagram(rows, edges, marks))}
      aria-hidden={interactive ? true : undefined}
      focusable="false"
    >
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={0.22}
          height={0.22}
          patternTransform="rotate(45)"
        >
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={0.22}
            style={{ stroke: 'var(--text-muted)', strokeWidth: 0.07 }}
          />
        </pattern>
      </defs>
      <rect width={width} height={height} rx={0.3} style={{ fill: 'var(--accent-soft)' }} />
      <g style={{ stroke: 'var(--text-muted)', strokeWidth: 0.04 }}>
        {Array.from({ length: height }, (_, r) => (
          <line key={`h${r}`} x1={x1} x2={x2} y1={r + 0.5} y2={r + 0.5} />
        ))}
        {Array.from({ length: width }, (_, c) => (
          <line key={`v${c}`} x1={c + 0.5} x2={c + 0.5} y1={y1} y2={y2} />
        ))}
      </g>
      {/* The real edge of the board is drawn thick; the other sides just stop the picture. */}
      <g style={{ stroke: 'var(--text)', strokeWidth: 0.12, strokeLinecap: 'square' }}>
        {edgeSet.has('top') && <line x1={x1} x2={x2} y1={0.5} y2={0.5} />}
        {edgeSet.has('bottom') && <line x1={x1} x2={x2} y1={height - 0.5} y2={height - 0.5} />}
        {edgeSet.has('left') && <line x1={0.5} x2={0.5} y1={y1} y2={y2} />}
        {edgeSet.has('right') && <line x1={width - 0.5} x2={width - 0.5} y1={y1} y2={y2} />}
      </g>
      {rows.flatMap((line, r) =>
        [...line].map((ch, c) =>
          ch === '#' ? (
            <rect
              key={`b${r}-${c}`}
              x={c + 0.1}
              y={r + 0.1}
              width={0.8}
              height={0.8}
              rx={0.1}
              style={{ fill: `url(#${patternId})`, stroke: 'var(--text-muted)', strokeWidth: 0.06 }}
            />
          ) : null,
        ),
      )}
      {rows.flatMap((line, r) =>
        [...line].map((ch, c) =>
          ch === 'X' || ch === 'O' ? (
            <Stone key={`s${r}-${c}`} stone={ch === 'X' ? 1 : 2} row={r} col={c} />
          ) : null,
        ),
      )}
      {winLinks.map((link) => (
        <line
          key={`${link.from[0]}-${link.from[1]}`}
          x1={link.from[1] + 0.5}
          y1={link.from[0] + 0.5}
          x2={link.to[1] + 0.5}
          y2={link.to[0] + 0.5}
          style={{ stroke: 'var(--success)', strokeWidth: 0.14, strokeLinecap: 'round' }}
        />
      ))}
      {marks.map((mark) => (
        <MarkShape key={`${mark.kind}-${mark.at[0]}-${mark.at[1]}`} mark={mark} />
      ))}
      {pick && (
        <>
          <Stone ghost stone={1} row={pick[0]} col={pick[1]} />
          <rect
            x={pick[1] + 0.08}
            y={pick[0] + 0.08}
            width={0.84}
            height={0.84}
            rx={0.12}
            style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 0.08 }}
          />
        </>
      )}
    </svg>
  );

  return (
    <div
      className={cn('relative mx-auto w-full touch-manipulation select-none', className)}
      style={{ maxWidth: width * CELL_PX }}
    >
      {drawing}
      {interactive && (
        <div
          role="grid"
          aria-label={label}
          aria-rowcount={height}
          aria-colcount={width}
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
          }}
        >
          {Array.from({ length: height }, (_, r) => (
            <div key={r} role="row" className="contents">
              {Array.from({ length: width }, (_, c) => (
                <div key={c} role="gridcell" className="relative">
                  <button
                    type="button"
                    ref={(el) => {
                      buttons.current[r * width + c] = el;
                    }}
                    tabIndex={r * width + c === focusIndex ? 0 : -1}
                    aria-label={describeSquare(r, c)}
                    aria-disabled={locked || symbolAt(r, c) !== '.' || undefined}
                    onFocus={() => setFocusIndex(r * width + c)}
                    onKeyDown={(e) => onKeyDown(e, r, c)}
                    onClick={() => {
                      if (!locked && symbolAt(r, c) === '.') onSelect([r, c]);
                    }}
                    className={cn(
                      'absolute inset-0 rounded-sm bg-transparent',
                      'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent',
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
