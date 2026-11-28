import { describe, expect, it } from 'vitest';
import { createEngineClient } from './engineClient';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// jsdom has no Worker, so these run the same request handler on the main thread
describe('engine client (main-thread fallback)', () => {
  it('answers moves, hints and move analysis with the real engine', async () => {
    const client = createEngineClient();
    try {
      const move = await client.findMove(START, 'easy', []);
      expect(move.move).toMatch(/^[a-h][1-8][a-h][1-8]/);

      const hint = await client.suggest(START, []);
      expect(hint.bestSan).toMatch(/^[NBRQKa-h]/);
      expect(hint.depth).toBeGreaterThan(0);

      const graded = await client.analyse(START, 'e2e4', []);
      expect(graded.playedSan).toBe('e4');
      expect(['best', 'good', 'inaccuracy']).toContain(graded.grade);
    } finally {
      client.dispose();
    }
  });

  it('rejects an illegal move instead of hanging', async () => {
    const client = createEngineClient();
    await expect(client.analyse(START, 'e2e5', [])).rejects.toThrow(/Illegal move/);
    client.dispose();
  });
});
