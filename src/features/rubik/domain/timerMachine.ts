/**
 * The cube timer's touch protocol (like a stackmat): press and hold until it turns green, release
 * to start, press anywhere to stop. Pure and driven by explicit timestamps, so it can be tested
 * without a browser or real time.
 */
export const HOLD_MS = 300;

export type TimerState =
  | { phase: 'idle' }
  | { phase: 'holding'; pressedAt: number }
  | { phase: 'ready' }
  | { phase: 'running'; startedAt: number };

export type TimerEvent =
  | { type: 'press'; at: number }
  | { type: 'release'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'cancel' };

export interface TimerStep {
  state: TimerState;
  /** Set on the step that stops the timer: the solve time in milliseconds. */
  finishedMs?: number;
}

export const IDLE: TimerState = { phase: 'idle' };

export function step(state: TimerState, event: TimerEvent): TimerStep {
  switch (event.type) {
    case 'press':
      if (state.phase === 'idle') return { state: { phase: 'holding', pressedAt: event.at } };
      // Stopping is on press, not release, so the stop is as fast as the finger.
      if (state.phase === 'running') {
        return { state: IDLE, finishedMs: Math.max(0, event.at - state.startedAt) };
      }
      return { state };
    case 'release':
      if (state.phase === 'holding') return { state: IDLE }; // let go too early: no start
      if (state.phase === 'ready') return { state: { phase: 'running', startedAt: event.at } };
      return { state };
    case 'tick':
      if (state.phase === 'holding' && event.at - state.pressedAt >= HOLD_MS) {
        return { state: { phase: 'ready' } };
      }
      return { state };
    case 'cancel':
      return { state: IDLE };
  }
}
