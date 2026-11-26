import { t } from '@/i18n/core';
import { Icon } from './Icon';

interface NumberStepperProps {
  /** Accessible name of what is being adjusted, e.g. "Daily goal". */
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** How the value is read out, e.g. (v) => `${v} min`. */
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

const BUTTON =
  'flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent transition-[transform,opacity] duration-100 active:scale-95 active:opacity-70 disabled:opacity-30 disabled:active:scale-100';

/** − / + control with 44 px targets. Snaps to the step grid and never leaves [min, max]. */
export function NumberStepper({
  label,
  value,
  min,
  max,
  step,
  format = String,
  onChange,
}: NumberStepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      <button
        type="button"
        aria-label={t('Decrease {label}', { label })}
        disabled={value <= min}
        className={BUTTON}
        onClick={() => onChange(clamp(value - step))}
      >
        <Icon name="minus" size={20} />
      </button>
      <span aria-live="polite" className="min-w-[4.5rem] text-center type-headline tabular-nums">
        {format(value)}
      </span>
      <button
        type="button"
        aria-label={t('Increase {label}', { label })}
        disabled={value >= max}
        className={BUTTON}
        onClick={() => onChange(clamp(value + step))}
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}
