import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { BLACK, WHITE, type Board, type Color } from '../domain/board';
import type { BoardEdges } from '../domain/tsumegoTypes';

/**
 * SVG Go board. Draws a rectangle of the board: normally the whole square board, or the cropped
 * region of a tsumego problem (blocked points are drawn as wall tiles, open sides are drawn as
 * lines running off the diagram).
 *
 * Interaction: every intersection that can be acted on is a real button (`role="button"` with a
 * label such as "D4, empty") so assistive technology and tests can use it, and the board also
 * takes arrow keys + Enter. Taps use `click`, which the browser does not fire after a scroll or
 * pan, so a zoomed board can be scrolled without placing stones.
 */

export type PointMark = 'dead' | 'black-area' | 'white-area';

const ALL_EDGES: BoardEdges = { top: true, right: true, bottom: true, left: true };

interface GoBoardProps {
  board: Board;
  /** Accessible name of the whole board, e.g. "9 by 9 Go board". */
  label: string;
  /** Which sides of the drawing are real board edges (the others run off the diagram). */
  edges?: BoardEdges;
  /** Star points to draw (board indices). */
  starPoints?: readonly number[];
  lastMove?: number | null;
  koPoint?: number | null;
  /** A stone shown as a preview before it is confirmed. */
  pending?: { point: number; color: Color } | null;
  /** Extra marks: dead stones and territory (scoring) . */
  marks?: ReadonlyMap<number, PointMark>;
  /** Points to ring (hints, the answer). */
  highlights?: ReadonlySet<number>;
  /** Stones to mark with a small triangle (the group a tsumego problem is about). */
  targets?: ReadonlySet<number>;
  /** `play`: empty points are buttons. `mark`: points holding stones are. `none`: no buttons. */
  mode: 'play' | 'mark' | 'none';
  onPoint?: (point: number) => void;
  /** Spoken name of a point, e.g. "D4". */
  pointLabel: (point: number) => string;
  /** Width multiplier for zoomed boards (the parent scrolls). */
  zoom?: number;
  className?: string;
}

const CELL = 24;
const PAD = 22;

const STONE_LABEL = { [BLACK]: 'black stone', [WHITE]: 'white stone' } as const;

export function GoBoard({
  board,
  label,
  edges = ALL_EDGES,
  starPoints = [],
  lastMove = null,
  koPoint = null,
  pending = null,
  marks,
  highlights,
  targets,
  mode,
  onPoint,
  pointLabel,
  zoom = 1,
  className,
}: GoBoardProps) {
  const uid = useId();
  const t = board.topology;
  const [cursor, setCursor] = useState<number | null>(null);
  // the keyboard cursor is only drawn while the board is being used from the keyboard
  const [keyboardActive, setKeyboardActive] = useState(false);

  // The drawing covers the bounding box of the playable points.
  const box = useMemo(() => {
    let x0 = t.width;
    let y0 = t.height;
    let x1 = -1;
    let y1 = -1;
    for (let p = 0; p < t.count; p++) {
      if (!t.playable[p]) continue;
      const x = p % t.width;
      const y = Math.floor(p / t.width);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    return { x0, y0, cols: x1 - x0 + 1, rows: y1 - y0 + 1 };
  }, [t]);

  const px = (x: number) => PAD + (x - box.x0) * CELL;
  const py = (y: number) => PAD + (y - box.y0) * CELL;
  const width = PAD * 2 + (box.cols - 1) * CELL;
  const height = PAD * 2 + (box.rows - 1) * CELL;
  const xOf = (p: number) => p % t.width;
  const yOf = (p: number) => Math.floor(p / t.width);

  const interactive = (p: number): boolean => {
    if (mode === 'none' || !t.playable[p]) return false;
    const c = board.get(p);
    return mode === 'play' ? c === 0 : c !== 0;
  };

  const move = (dx: number, dy: number) => {
    const from = cursor ?? [...Array(t.count).keys()].find((p) => t.playable[p]) ?? 0;
    let x = xOf(from) + dx;
    let y = yOf(from) + dy;
    // skip over wall tiles
    while (x >= box.x0 && x < box.x0 + box.cols && y >= box.y0 && y < box.y0 + box.rows) {
      const p = y * t.width + x;
      if (t.playable[p]) {
        setCursor(p);
        return;
      }
      x += dx;
      y += dy;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    setKeyboardActive(true);
    if (e.key === 'ArrowRight') move(1, 0);
    else if (e.key === 'ArrowLeft') move(-1, 0);
    else if (e.key === 'ArrowUp') move(0, -1);
    else if (e.key === 'ArrowDown') move(0, 1);
    else if ((e.key === 'Enter' || e.key === ' ') && cursor !== null) {
      if (interactive(cursor)) onPoint?.(cursor);
    } else return;
    e.preventDefault();
  };

  const blackId = `${uid}-black`;
  const whiteId = `${uid}-white`;
  const stoneR = CELL * 0.46;
  const points: number[] = [];
  for (let p = 0; p < t.count; p++) points.push(p);

  const vLines = Array.from({ length: box.cols }, (_, i) => box.x0 + i);
  const hLines = Array.from({ length: box.rows }, (_, i) => box.y0 + i);
  const edgeStroke = 2.2;

  return (
    <div
      role="group"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={() => setKeyboardActive(false)}
      onBlur={() => setKeyboardActive(false)}
      className={cn(
        'touch-manipulation select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      style={{ width: `${zoom * 100}%`, WebkitTouchCallout: 'none' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="presentation">
        <defs>
          <radialGradient id={blackId} cx="35%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#5b5f68" />
            <stop offset="55%" stopColor="#1b1d22" />
            <stop offset="100%" stopColor="#050506" />
          </radialGradient>
          <radialGradient id={whiteId} cx="35%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#ebebe6" />
            <stop offset="100%" stopColor="#b9b9b2" />
          </radialGradient>
        </defs>

        <rect width={width} height={height} rx={10} fill="#dcb35c" />

        {vLines.map((x) => (
          <line
            key={`v${x}`}
            x1={px(x)}
            x2={px(x)}
            y1={edges.top ? py(box.y0) : 0}
            y2={edges.bottom ? py(box.y0 + box.rows - 1) : height}
            stroke="#3d2c10"
            strokeWidth={
              x === box.x0 && edges.left
                ? edgeStroke
                : x === box.x0 + box.cols - 1 && edges.right
                  ? edgeStroke
                  : 1
            }
          />
        ))}
        {hLines.map((y) => (
          <line
            key={`h${y}`}
            y1={py(y)}
            y2={py(y)}
            x1={edges.left ? px(box.x0) : 0}
            x2={edges.right ? px(box.x0 + box.cols - 1) : width}
            stroke="#3d2c10"
            strokeWidth={
              y === box.y0 && edges.top
                ? edgeStroke
                : y === box.y0 + box.rows - 1 && edges.bottom
                  ? edgeStroke
                  : 1
            }
          />
        ))}

        {starPoints.map((p) => (
          <circle key={`s${p}`} cx={px(xOf(p))} cy={py(yOf(p))} r={2.6} fill="#3d2c10" />
        ))}

        {points.map((p) => {
          if (t.playable[p]) return null;
          const x = xOf(p);
          const y = yOf(p);
          if (x < box.x0 || x >= box.x0 + box.cols || y < box.y0 || y >= box.y0 + box.rows) {
            return null;
          }
          return (
            <rect
              key={`w${p}`}
              x={px(x) - CELL / 2}
              y={py(y) - CELL / 2}
              width={CELL}
              height={CELL}
              fill="#6b5a3a"
              opacity={0.85}
              aria-hidden="true"
            />
          );
        })}

        {marks &&
          [...marks].map(([p, mark]) =>
            mark === 'dead' ? null : (
              <rect
                key={`a${p}`}
                x={px(xOf(p)) - 4.5}
                y={py(yOf(p)) - 4.5}
                width={9}
                height={9}
                rx={1.5}
                fill={mark === 'black-area' ? '#111318' : '#fbfbf7'}
                stroke={mark === 'black-area' ? '#fbfbf7' : '#111318'}
                strokeWidth={0.8}
                opacity={0.9}
              />
            ),
          )}

        {points.map((p) => {
          const c = board.get(p);
          if (c === 0 || !t.playable[p]) return null;
          const dead = marks?.get(p) === 'dead';
          return (
            <g key={`t${p}`} opacity={dead ? 0.45 : 1}>
              <circle
                cx={px(xOf(p)) + 0.8}
                cy={py(yOf(p)) + 1.2}
                r={stoneR}
                fill="rgba(0,0,0,0.28)"
              />
              <circle
                cx={px(xOf(p))}
                cy={py(yOf(p))}
                r={stoneR}
                fill={`url(#${c === BLACK ? blackId : whiteId})`}
                stroke={c === WHITE ? '#8e8e86' : '#000'}
                strokeWidth={0.6}
              />
            </g>
          );
        })}

        {marks &&
          [...marks].map(([p, mark]) =>
            mark === 'dead' ? (
              <path
                key={`d${p}`}
                d={`M${px(xOf(p)) - 5} ${py(yOf(p)) - 5}l10 10m0 -10l-10 10`}
                stroke="#dc2626"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            ) : null,
          )}

        {targets &&
          [...targets].map((p) => {
            const cx = px(xOf(p));
            const cy = py(yOf(p));
            return (
              <path
                key={`m${p}`}
                d={`M${cx} ${cy - 5.2}L${cx + 4.8} ${cy + 3.4}L${cx - 4.8} ${cy + 3.4}Z`}
                fill="none"
                stroke={board.get(p) === BLACK ? '#ffffff' : '#111318'}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            );
          })}

        {pending && (
          <circle
            cx={px(xOf(pending.point))}
            cy={py(yOf(pending.point))}
            r={stoneR}
            fill={pending.color === BLACK ? '#111318' : '#fbfbf7'}
            fillOpacity={0.55}
            stroke={pending.color === BLACK ? '#111318' : '#6b6b63'}
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
        )}

        {lastMove !== null && lastMove >= 0 && board.get(lastMove) !== 0 && (
          <circle
            cx={px(xOf(lastMove))}
            cy={py(yOf(lastMove))}
            r={stoneR * 0.42}
            fill="none"
            stroke={board.get(lastMove) === BLACK ? '#ffffff' : '#111318'}
            strokeWidth={1.6}
          />
        )}

        {koPoint !== null && koPoint >= 0 && (
          <rect
            x={px(xOf(koPoint)) - 5}
            y={py(yOf(koPoint)) - 5}
            width={10}
            height={10}
            fill="none"
            stroke="#dc2626"
            strokeWidth={1.8}
          />
        )}

        {highlights &&
          [...highlights].map((p) => (
            <circle
              key={`h${p}`}
              cx={px(xOf(p))}
              cy={py(yOf(p))}
              r={CELL * 0.4}
              fill="none"
              stroke="#16a34a"
              strokeWidth={2.4}
            />
          ))}

        {keyboardActive && cursor !== null && (
          <rect
            x={px(xOf(cursor)) - CELL / 2}
            y={py(yOf(cursor)) - CELL / 2}
            width={CELL}
            height={CELL}
            fill="none"
            stroke="#4f46e5"
            strokeWidth={2}
            rx={3}
          />
        )}

        {points.map((p) => {
          if (!interactive(p)) return null;
          const c = board.get(p);
          const name = c === 0 ? 'empty' : STONE_LABEL[c];
          return (
            <rect
              key={`b${p}`}
              role="button"
              tabIndex={-1}
              aria-label={`${pointLabel(p)}, ${name}`}
              x={px(xOf(p)) - CELL / 2}
              y={py(yOf(p)) - CELL / 2}
              width={CELL}
              height={CELL}
              fill="transparent"
              className="cursor-pointer outline-none"
              onClick={() => {
                setCursor(p);
                onPoint?.(p);
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
