import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import './zodSetup';

describe('zod setup', () => {
  it('runs in jitless mode so it never needs eval (CSP forbids it)', () => {
    expect(z.config().jitless).toBe(true);
  });

  it('still validates correctly in jitless mode', () => {
    const schema = z.object({ id: z.string(), n: z.number().int().min(1) });
    expect(schema.safeParse({ id: 'a', n: 2 }).success).toBe(true);
    expect(schema.safeParse({ id: 'a', n: 0 }).success).toBe(false);
    expect(schema.safeParse({ id: 1, n: 2 }).success).toBe(false);
  });
});
