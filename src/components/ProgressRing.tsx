import { t } from '@/i18n/core';
import { useEffect, useState, type ReactNode } from 'react';

interface ProgressRingProps {
  /** 0..1 (values outside are clamped). */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** CSS colour for the arc; defaults to the accent token. */
  color?: string;
  /** Accessible description, e.g. "Daily goal". The percentage is appended automatically. */
  label: string;
  children?: ReactNode;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Circular progress. The arc animates from 0 on mount and between values (CSS transition). */
export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  color = 'var(--accent)',
  label,
  children,
}: ProgressRingProps) {
  const target = clamp01(value);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.round(target * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={t('{percent} percent', { percent })}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
