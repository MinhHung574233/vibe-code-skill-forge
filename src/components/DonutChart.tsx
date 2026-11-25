export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** CSS colour. */
  color: string;
}

interface DonutChartProps {
  slices: readonly DonutSlice[];
  /** Text in the centre, e.g. "3 h 20 min". */
  centerLabel: string;
  formatValue: (value: number) => string;
  /** Accessible name; the legend below carries the exact numbers as text. */
  label: string;
}

const SIZE = 132;
const STROKE = 18;

/** Share of the total as a rounded percentage (0 when the total is 0). */
export function percentOf(value: number, total: number): number {
  return total <= 0 ? 0 : Math.round((value / total) * 100);
}

/**
 * In-house SVG donut with an always-visible legend. Colour never carries meaning alone: every
 * slice is also named, with its time and share, in the legend.
 */
export function DonutChart({ slices, centerLabel, formatValue, label }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="m-0" aria-label={label}>
      <div className="flex justify-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth={STROKE}
            />
            {total > 0 &&
              slices.map((s) => {
                const length = (s.value / total) * circumference;
                const dash = `${Math.max(0, length - 1.5)} ${circumference - Math.max(0, length - 1.5)}`;
                const circle = (
                  <circle
                    key={s.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={radius}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={STROKE}
                    strokeDasharray={dash}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return circle;
              })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center type-subhead font-semibold">
            {centerLabel}
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-3 type-subhead">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="min-w-0 flex-1 break-words">{s.label}</span>
            <span className="tabular-nums text-muted">
              {formatValue(s.value)} · {percentOf(s.value, total)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
