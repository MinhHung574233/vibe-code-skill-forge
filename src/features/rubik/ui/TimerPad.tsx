import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
import { IDLE, step, type TimerEvent, type TimerState } from '../domain/timerMachine';
import { formatSolveTime } from '../domain/stats';

interface TimerPadProps {
  /** Called once when the timer is stopped, with the raw time. */
  onFinish: (timeMs: number) => void;
  /** Shown while idle (the previous solve), in milliseconds. */
  lastMs: number | null;
}

/**
 * The big touch target. Hold until it turns green, release to start, touch anywhere on it to
 * stop. It also works with the space bar. Display updates run on animation frames only while
 * the timer is running.
 */
export function TimerPad({ onFinish, lastMs }: TimerPadProps) {
  const [state, setState] = useState<TimerState>(IDLE);
  const stateRef = useRef<TimerState>(IDLE);
  const onFinishRef = useRef(onFinish);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const send = useCallback((event: TimerEvent) => {
    const result = step(stateRef.current, event);
    stateRef.current = result.state;
    setState(result.state);
    if (result.finishedMs !== undefined) onFinishRef.current(result.finishedMs);
  }, []);

  // Become "ready" once the hold time has passed.
  useEffect(() => {
    if (state.phase !== 'holding') return;
    const timer = window.setTimeout(() => send({ type: 'tick', at: performance.now() }), 310);
    return () => window.clearTimeout(timer);
  }, [state, send]);

  // Animate the clock only while running.
  useEffect(() => {
    if (state.phase !== 'running') return;
    let frame = 0;
    const loop = () => {
      setElapsed(performance.now() - state.startedAt);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state]);

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
      : state.phase === 'holding' || state.phase === 'ready'
        ? '0.00'
        : lastMs === null
          ? '0.00'
          : formatSolveTime(lastMs);

  const hint =
    state.phase === 'idle'
      ? 'Touch and hold, then let go to start'
      : state.phase === 'holding'
        ? 'Keep holding…'
        : state.phase === 'ready'
          ? 'Let go to start'
          : 'Touch to stop';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Cube timer. ${hint}.`}
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
      className={cn(
        'flex min-h-56 touch-none select-none flex-col items-center justify-center rounded-3xl border-2 outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-accent',
        'bg-surface',
        state.phase === 'idle' && 'border-border',
        state.phase === 'holding' && 'border-danger',
        state.phase === 'ready' && 'border-success',
        state.phase === 'running' && 'border-accent',
      )}
    >
      <span
        role="timer"
        aria-label="Solve time"
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
    </div>
  );
}
