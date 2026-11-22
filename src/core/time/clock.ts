/**
 * Time port. Wall-clock time is for records; the monotonic clock is for measuring
 * durations (Rubik timer, session length) so system clock changes cannot corrupt them.
 */
export interface Clock {
  /** Epoch milliseconds (UTC). Use for persisted timestamps. */
  now(): number;
  /** Monotonic milliseconds with sub-millisecond precision. Use for durations only. */
  monotonic(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  monotonic: () => performance.now(),
};

/** Deterministic clock for tests. */
export class FakeClock implements Clock {
  private wall: number;
  private mono: number;

  constructor(startEpochMs = Date.UTC(2026, 0, 1, 12, 0, 0), startMonotonicMs = 0) {
    this.wall = startEpochMs;
    this.mono = startMonotonicMs;
  }

  now(): number {
    return this.wall;
  }

  monotonic(): number {
    return this.mono;
  }

  advance(ms: number): void {
    this.wall += ms;
    this.mono += ms;
  }

  /** Simulates the user (or iOS) changing the system clock without time passing. */
  jumpWallClock(ms: number): void {
    this.wall += ms;
  }
}
