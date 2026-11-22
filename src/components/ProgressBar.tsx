import { useEffect, useState } from 'react';
import { clamp01 } from './ProgressRing';

interface ProgressBarProps {
  /** 0..1 (values outside are clamped). */
  value: number;
  color?: string;
  label: string;
}

export function ProgressBar({ value, color = 'var(--accent)', label }: ProgressBarProps) {
  const target = clamp01(value);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const percent = Math.round(target * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent} percent`}
      className="h-2 w-full overflow-hidden rounded-full bg-border"
    >
      <div
        className="h-full origin-left rounded-full"
        style={{
          background: color,
          transform: `scaleX(${shown})`,
          transition: 'transform 600ms ease-out',
        }}
      />
    </div>
  );
}
