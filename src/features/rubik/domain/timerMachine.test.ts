import { describe, expect, it } from 'vitest';
import {
  HOLD_MS,
  IDLE,
  inspectionPenalty,
  step,
  type TimerEvent,
  type TimerState,
} from './timerMachine';

function run(events: TimerEvent[], from: TimerState = IDLE, inspection = false) {
  let state = from;
  let finishedMs: number | undefined;
  let penalty: string | undefined;
  for (const event of events) {
    const next = step(state, event, { inspection });
    state = next.state;
    if (next.finishedMs !== undefined) finishedMs = next.finishedMs;
    if (next.penalty !== undefined) penalty = next.penalty;
  }
  return { state, finishedMs, penalty };
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
    const afterStop = run([{ type: 'press', at: 5000 }], {
      phase: 'running',
      startedAt: 0,
      penalty: 'none',
    });
    expect(afterStop.finishedMs).toBe(5000);
    expect(step(afterStop.state, { type: 'release', at: 5050 }).state).toEqual(IDLE);
    expect(step(afterStop.state, { type: 'press', at: 6000 }).state.phase).toBe('holding');
  });

  it('ignores presses while ready and cancel returns to idle', () => {
    expect(step({ phase: 'ready' }, { type: 'press', at: 1 }).state).toEqual({ phase: 'ready' });
    expect(
      step({ phase: 'running', startedAt: 0, penalty: 'none' }, { type: 'cancel' }).state,
    ).toEqual(IDLE);
  });
});

describe('inspection', () => {
  const inspected = (startAfterMs: number) =>
    run(
      [
        { type: 'press', at: 0 }, // starts inspection
        { type: 'release', at: 50 },
        { type: 'press', at: startAfterMs - 400 },
        { type: 'tick', at: startAfterMs - 400 + HOLD_MS },
        { type: 'release', at: startAfterMs },
        { type: 'press', at: startAfterMs + 9000 },
      ],
      IDLE,
      true,
    );

  it('first touch starts inspection; hold and release then starts the solve', () => {
    expect(run([{ type: 'press', at: 0 }], IDLE, true).state).toEqual({
      phase: 'inspecting',
      since: 0,
    });
    const result = inspected(10_000);
    expect(result.finishedMs).toBe(9000);
    expect(result.penalty).toBe('none');
  });

  it('letting go too early keeps the inspection running', () => {
    const { state } = run(
      [
        { type: 'press', at: 0 },
        { type: 'press', at: 5000 },
        { type: 'release', at: 5100 },
      ],
      IDLE,
      true,
    );
    expect(state).toEqual({ phase: 'inspecting', since: 0 });
  });

  it('starting after 15 s costs +2, after 17 s the solve is a DNF', () => {
    expect(inspectionPenalty(15_000)).toBe('none');
    expect(inspectionPenalty(15_001)).toBe('plus2');
    expect(inspectionPenalty(17_000)).toBe('plus2');
    expect(inspectionPenalty(17_001)).toBe('dnf');
    expect(inspected(16_000).penalty).toBe('plus2');
    expect(inspected(18_000).penalty).toBe('dnf');
  });
});
