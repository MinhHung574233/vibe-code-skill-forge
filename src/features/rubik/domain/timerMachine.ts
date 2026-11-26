/**
 * The cube timer's touch protocol (like a stackmat): press and hold until it turns green, release
 * to start, press anywhere to stop. With inspection on, the first touch starts a 15 s inspection
 * countdown and the hold-and-release then starts the solve. Pure and driven by explicit
 * timestamps, so it can be tested without a browser or real time.
 */
import type { Penalty } from './stats';

export const HOLD_MS = 300;
/** WCA: 15 s of inspection; starting after 15 s costs +2, after 17 s the solve is a DNF. */
export const INSPECTION_MS = 15_000;
export const INSPECTION_DNF_MS = 17_000;

/** The penalty for starting the solve `inspectedMs` after inspection began. */
export function inspectionPenalty(inspectedMs: number): Penalty {
  if (inspectedMs > INSPECTION_DNF_MS) return 'dnf';
  if (inspectedMs > INSPECTION_MS) return 'plus2';
  return 'none';
}

export type TimerState =
  | { phase: 'idle' }
  | { phase: 'inspecting'; since: number }
  | { phase: 'holding'; pressedAt: number; since?: number }
  | { phase: 'ready'; since?: number }
  | { phase: 'running'; startedAt: number; penalty: Penalty };

export type TimerEvent =
  | { type: 'press'; at: number }
  | { type: 'release'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'cancel' };

export interface TimerStep {
  state: TimerState;
  /** Set on the step that stops the timer: the solve time in milliseconds. */
  finishedMs?: number;
  /** Set together with `finishedMs`: the inspection penalty for this solve. */
  penalty?: Penalty;
}

export interface TimerOptions {
  inspection: boolean;
}

export const IDLE: TimerState = { phase: 'idle' };

export function step(
  state: TimerState,
  event: TimerEvent,
  { inspection }: TimerOptions = { inspection: false },
): TimerStep {
  switch (event.type) {
    case 'press':
      if (state.phase === 'idle') {
        return {
          state: inspection
            ? { phase: 'inspecting', since: event.at }
            : { phase: 'holding', pressedAt: event.at },
        };
      }
      if (state.phase === 'inspecting') {
        return { state: { phase: 'holding', pressedAt: event.at, since: state.since } };
      }
      // Stopping is on press, not release, so the stop is as fast as the finger.
      if (state.phase === 'running') {
        return {
          state: IDLE,
          finishedMs: Math.max(0, event.at - state.startedAt),
          penalty: state.penalty,
        };
      }
      return { state };
    case 'release':
      if (state.phase === 'holding') {
        // Let go too early: no start (inspection, if any, carries on).
        return {
          state: state.since === undefined ? IDLE : { phase: 'inspecting', since: state.since },
        };
      }
      if (state.phase === 'ready') {
        const penalty =
          state.since === undefined ? 'none' : inspectionPenalty(event.at - state.since);
        return { state: { phase: 'running', startedAt: event.at, penalty } };
      }
      return { state };
    case 'tick':
      if (state.phase === 'holding' && event.at - state.pressedAt >= HOLD_MS) {
        return {
          state:
            state.since === undefined ? { phase: 'ready' } : { phase: 'ready', since: state.since },
        };
      }
      return { state };
    case 'cancel':
      return { state: IDLE };
  }
}
