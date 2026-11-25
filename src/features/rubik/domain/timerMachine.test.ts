import { describe, expect, it } from 'vitest';
import { HOLD_MS, IDLE, step, type TimerEvent, type TimerState } from './timerMachine';

function run(events: TimerEvent[], from: TimerState = IDLE) {
  let state = from;
  let finishedMs: number | undefined;
  for (const event of events) {
    const next = step(state, event);
    state = next.state;
    if (next.finishedMs !== undefined) finishedMs = next.finishedMs;
  }
  return { state, finishedMs };
}

describe('timer protocol', () => {
  it('hold until ready, release to start, press to stop', () => {
    const { state, finishedMs } = run([
      { type: 'press', at: 1000 },
      { type: 'tick', at: 1000 + HOLD_MS },
      { type: 'release', at: 1500 },
      { type: 'press', at: 13_500 },
    ]);
    expect(finishedMs).toBe(12_000);
    expect(state).toEqual(IDLE);
  });

  it('does not become ready before the hold time', () => {
    expect(
      run([
        { type: 'press', at: 0 },
        { type: 'tick', at: HOLD_MS - 1 },
      ]).state.phase,
    ).toBe('holding');
  });

  it('releasing too early cancels the start', () => {
    const { state } = run([
      { type: 'press', at: 0 },
      { type: 'tick', at: 100 },
      { type: 'release', at: 150 },
    ]);
    expect(state).toEqual(IDLE);
  });

  it('the release that follows a stop does nothing, and a new solve can start straight away', () => {
    const afterStop = run([{ type: 'press', at: 5000 }], { phase: 'running', startedAt: 0 });
    expect(afterStop.finishedMs).toBe(5000);
    expect(step(afterStop.state, { type: 'release', at: 5050 }).state).toEqual(IDLE);
    expect(step(afterStop.state, { type: 'press', at: 6000 }).state.phase).toBe('holding');
  });

  it('ignores presses while ready and cancel returns to idle', () => {
    expect(step({ phase: 'ready' }, { type: 'press', at: 1 }).state).toEqual({ phase: 'ready' });
    expect(step({ phase: 'running', startedAt: 0 }, { type: 'cancel' }).state).toEqual(IDLE);
  });
});
