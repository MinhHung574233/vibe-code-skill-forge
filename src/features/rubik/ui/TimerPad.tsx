import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '@/i18n/core';
import { cn } from '@/utils/cn';
import {
  IDLE,
  INSPECTION_DNF_MS,
  INSPECTION_MS,
  step,
  type TimerEvent,
  type TimerState,
} from '../domain/timerMachine';
import { formatSolveTime, type Penalty } from '../domain/stats';

interface TimerPadProps {
  /** Called once when the timer is stopped, with the raw time and any inspection penalty. */
  onFinish: (timeMs: number, penalty: Penalty) => void;
  /** Shown while idle (the previous solve), in milliseconds. */
  lastMs: number | null;
  /** 15 s inspection before each solve (WCA rules). */
  inspection: boolean;
}

/** What the big number shows during inspection: seconds left, then +2 / DNF. */
function inspectionText(elapsedMs: number): string {
  if (elapsedMs > INSPECTION_DNF_MS) return 'DNF';
  if (elapsedMs > INSPECTION_MS) return '+2';
  return String(Math.ceil((INSPECTION_MS - elapsedMs) / 1000));
}

/**
 * The big touch target. Hold until it turns green, release to start, touch anywhere on it to
 * stop. With inspection on, the first touch starts a 15 second countdown first. It also works
 * with the space bar. The display updates on animation frames only while something is counting.
 */
export function TimerPad({ onFinish, lastMs, inspection }: TimerPadProps) {
  const [state, setState] = useState<TimerState>(IDLE);
  const stateRef = useRef<TimerState>(IDLE);
  const onFinishRef = useRef(onFinish);
  const inspectionRef = useRef(inspection);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    onFinishRef.current = onFinish;
    inspectionRef.current = inspection;
  }, [onFinish, inspection]);

  const send = useCallback((event: TimerEvent) => {
    const result = step(stateRef.current, event, { inspection: inspectionRef.current });
    stateRef.current = result.state;
    setState(result.state);
    if (result.finishedMs !== undefined) {
      onFinishRef.current(result.finishedMs, result.penalty ?? 'none');
    }
  }, []);

  // Become "ready" once the hold time has passed.
  useEffect(() => {
    if (state.phase !== 'holding') return;
    const timer = window.setTimeout(() => send({ type: 'tick', at: performance.now() }), 310);
    return () => window.clearTimeout(timer);
  }, [state, send]);

  // Animate the clock while running, or the countdown while inspecting.
  const inspectionStart = state.phase === 'inspecting' ? state.since : undefined;
  const counting = state.phase === 'running' || state.phase === 'inspecting';
  useEffect(() => {
    if (!counting) return;
    let frame = 0;
    const origin = state.phase === 'running' ? state.startedAt : (inspectionStart ?? 0);
    const loop = () => {
      setElapsed(performance.now() - origin);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [counting, state, inspectionStart]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.repeat) return;
    event.preventDefault();
    send({ type: 'press', at: performance.now() });
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    send({ type: 'release', at: performance.now() });
  };

  const text =
    state.phase === 'running'
      ? formatSolveTime(elapsed)
      : state.phase === 'inspecting'
        ? inspectionText(elapsed)
        : state.phase === 'holding' || state.phase === 'ready'
          ? '0.00'
          : lastMs === null
            ? '0.00'
            : formatSolveTime(lastMs);

  const hint =
    state.phase === 'idle'
      ? inspection
        ? t('Touch to start the 15 second inspection')
        : t('Touch and hold, then let go to start')
      : state.phase === 'inspecting'
        ? t('Inspecting. Touch and hold, then let go to start')
        : state.phase === 'holding'
          ? t('Keep holding…')
          : state.phase === 'ready'
            ? t('Let go to start')
            : t('Touch to stop');

  // The readout and the touch surface are separate on purpose: a button whose accessible name
  // differs from its visible text fails WCAG "label in name", and the time changes every frame.
  // The empty button covers the whole card and carries the gestures and the spoken name.
  return (
    <div
      className={cn(
        'relative flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 transition-colors',
        'bg-surface',
        state.phase === 'idle' && 'border-border',
        state.phase === 'inspecting' && 'border-warning',
        state.phase === 'holding' && 'border-danger',
        state.phase === 'ready' && 'border-success',
        state.phase === 'running' && 'border-accent',
      )}
    >
      <span
        role="timer"
        aria-label={t('Solve time')}
        className={cn(
          'font-mono text-6xl font-semibold tabular-nums tracking-tight',
          state.phase === 'holding' && 'text-danger',
          state.phase === 'ready' && 'text-success',
        )}
      >
        {text}
      </span>
      <span className="mt-3 type-subhead text-muted" aria-live="polite">
        {hint}
      </span>
      <div
        role="button"
        tabIndex={0}
        aria-label={t('Cube timer {time}. {hint}.', { time: text, hint })}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          send({ type: 'press', at: performance.now() });
        }}
        onPointerUp={() => send({ type: 'release', at: performance.now() })}
        onPointerCancel={() => send({ type: 'cancel' })}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={() => stateRef.current.phase !== 'running' && send({ type: 'cancel' })}
        onContextMenu={(event) => event.preventDefault()}
        className="absolute inset-0 touch-none select-none rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </div>
  );
}
