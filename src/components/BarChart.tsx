import { useState, type PointerEvent } from 'react';

export interface BarDatum {
  /** Short x-axis label (e.g. "M", "24"). */
  label: string;
  /** Full description for the readout (e.g. "Tue 24 Nov"). */
  title: string;
  value: number;
}

interface BarChartProps {
  data: readonly BarDatum[];
  /** How a value reads out, e.g. (v) => `${Math.round(v)} min`. */
  formatValue: (value: number) => string;
  /** One sentence for assistive tech and as visible caption (DESIGN_SYSTEM §12). */
  summary: string;
  /** Show an x label only every N bars (long ranges). */
  labelEvery?: number;
  color?: string;
}

const W = 300;
const H = 110;

/** Index of the bar under a horizontal position (0..1 of the chart width). */
export function barIndexAt(fraction: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.floor(fraction * count)));
}

/**
 * In-house SVG bar chart. Touch: press or drag across the bars to read a value (pointer events
 * work for finger and mouse). The selection readout is above the chart; the summary sentence
 * below it is what VoiceOver reads, since individual bars are decorative.
 */
export function BarChart({
  data,
  formatValue,
  summary,
  labelEvery = 1,
  color = 'var(--accent)',
}: BarChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const count = data.length;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = W / Math.max(1, count);
  const barWidth = Math.max(2, slot * 0.62);
  const active = selected ?? count - 1;
  const current = data[active];

  const select = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    setSelected(barIndexAt((event.clientX - rect.left) / rect.width, count));
  };

  return (
    <figure className="m-0">
      <p className="mb-2 min-h-5 type-subhead" aria-hidden="true">
        {current ? (
          <>
            <span className="text-muted">{current.title} · </span>
            <span className="font-semibold tabular-nums">{formatValue(current.value)}</span>
          </>
        ) : null}
      </p>
      <div
        className="touch-pan-y select-none"
        onPointerDown={select}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'touch') select(e);
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-28 w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--border)" strokeWidth="1" />
          <line
            x1="0"
            x2={W}
            y1={H / 2}
            y2={H / 2}
            stroke="var(--border)"
            strokeWidth="0.5"
            strokeDasharray="3 4"
          />
          {data.map((d, i) => {
            const h = d.value <= 0 ? 0 : Math.max(3, (d.value / max) * (H - 6));
            return (
              <rect
                key={i}
                x={i * slot + (slot - barWidth) / 2}
                y={H - h}
                width={barWidth}
                height={h}
                rx={Math.min(3, barWidth / 2)}
                fill={color}
                opacity={i === active ? 1 : 0.45}
              />
            );
          })}
        </svg>
        <div
          className="mt-1 grid type-footnote text-muted"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, count)}, minmax(0, 1fr))` }}
          aria-hidden="true"
        >
          {data.map((d, i) => (
            <span key={i} className="text-center">
              {i % labelEvery === 0 || i === count - 1 ? d.label : ''}
            </span>
          ))}
        </div>
      </div>
      <figcaption className="mt-2 type-footnote text-muted">{summary}</figcaption>
    </figure>
  );
}
