import type { CaseDiagram } from '../domain/algorithms';
import { faceColors, NET_FACES, type Cube, type Face } from '../domain/cube';

/** Real cube colours (white top, green front) for the scramble preview. */
const SCRAMBLE_COLORS: Record<Face, string> = {
  U: '#f8fafc',
  D: '#facc15',
  F: '#22c55e',
  B: '#2563eb',
  R: '#ef4444',
  L: '#f97316',
};

/**
 * Last-layer pictures use a yellow-top cube (the usual CFOP orientation): yellow up, green
 * front, orange right, red left. The chirality matches a real cube, so what you see here is what
 * you will see in your hands.
 */
const LL_COLORS: Record<Face, string> = {
  U: '#facc15',
  D: '#f8fafc',
  F: '#22c55e',
  B: '#2563eb',
  R: '#f97316',
  L: '#ef4444',
};

const STROKE = 'var(--border-strong, #94a3b8)';

function Face9({
  colors,
  palette,
  x,
  y,
  size,
}: {
  colors: readonly Face[];
  palette: Record<Face, string>;
  x: number;
  y: number;
  size: number;
}) {
  return (
    <g>
      {colors.map((color, i) => (
        <rect
          key={i}
          x={x + (i % 3) * size}
          y={y + Math.floor(i / 3) * size}
          width={size}
          height={size}
          rx={size * 0.12}
          fill={palette[color]}
          stroke={STROKE}
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}

/** Flat net of a cube state: the scramble preview. */
export function CubeNet({ cube, label }: { cube: Cube; label: string }) {
  const s = 9;
  const face = (f: Face) => faceColors(cube, f);
  const pos: Record<Face, [number, number]> = {
    U: [3 * s + 2, 0],
    L: [0, 3 * s + 2],
    F: [3 * s + 2, 3 * s + 2],
    R: [6 * s + 4, 3 * s + 2],
    B: [9 * s + 6, 3 * s + 2],
    D: [3 * s + 2, 6 * s + 4],
  };
  return (
    <svg
      viewBox={`0 0 ${12 * s + 6} ${9 * s + 4}`}
      role="img"
      aria-label={label}
      className="mx-auto w-full max-w-72"
    >
      {NET_FACES.map((f) => (
        <Face9
          key={f}
          colors={face(f)}
          palette={SCRAMBLE_COLORS}
          x={pos[f][0]}
          y={pos[f][1]}
          size={s}
        />
      ))}
    </svg>
  );
}

/** A last-layer case: the top face with the first row of each side around it. */
export function CaseView({ diagram, label }: { diagram: CaseDiagram; label: string }) {
  const s = 12;
  const g = 3; // gap between the top face and the side strips
  const strip = s * 0.45;
  const origin = strip + g;
  const side = (colors: readonly Face[], horizontal: boolean, x: number, y: number) =>
    colors.map((color, i) => (
      <rect
        key={`${x}-${y}-${i}`}
        x={horizontal ? x + i * s : x}
        y={horizontal ? y : y + i * s}
        width={horizontal ? s : strip}
        height={horizontal ? strip : s}
        rx={1.5}
        fill={LL_COLORS[color]}
        stroke={STROKE}
        strokeWidth={0.6}
      />
    ));
  const total = 3 * s + 2 * (strip + g);
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={label}
      className="size-24 shrink-0"
    >
      <Face9 colors={diagram.top} palette={LL_COLORS} x={origin} y={origin} size={s} />
      {side(diagram.back, true, origin, 0)}
      {side(diagram.front, true, origin, origin + 3 * s + g)}
      {side(diagram.left, false, 0, origin)}
      {side(diagram.right, false, origin + 3 * s + g, origin)}
    </svg>
  );
}
