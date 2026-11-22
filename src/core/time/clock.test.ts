import { describe, expect, it } from 'vitest';
import { FakeClock, systemClock } from './clock';

describe('FakeClock', () => {
  it('advances wall and monotonic time together', () => {
    const c = new FakeClock(1_000, 50);
    c.advance(250);
    expect(c.now()).toBe(1_250);
    expect(c.monotonic()).toBe(300);
  });

  it('wall-clock jumps do not affect monotonic durations', () => {
    const c = new FakeClock(0, 0);
    const start = c.monotonic();
    c.advance(1_000);
    c.jumpWallClock(-3_600_000); // user changes the system clock back an hour
    expect(c.monotonic() - start).toBe(1_000);
  });
});

describe('systemClock', () => {
  it('monotonic never goes backwards', () => {
    const a = systemClock.monotonic();
    const b = systemClock.monotonic();
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it('now is a plausible epoch in ms', () => {
    expect(systemClock.now()).toBeGreaterThan(1_700_000_000_000);
  });
});
