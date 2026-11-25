import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { OPENINGS, openingById, openingUci } from './openings';
import { playUci } from './rules';

describe('opening library', () => {
  it('has at least eight openings with unique ids', () => {
    expect(OPENINGS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(OPENINGS.map((o) => o.id)).size).toBe(OPENINGS.length);
    expect(openingById('italian')?.name).toMatch(/Italian/);
    expect(openingById('nope')).toBeUndefined();
  });

  it('offers both colours and explains each opening', () => {
    expect(new Set(OPENINGS.map((o) => o.side))).toEqual(new Set(['w', 'b']));
    for (const o of OPENINGS) {
      expect(o.summary.length).toBeGreaterThan(20);
      expect(o.ideas.length).toBeGreaterThanOrEqual(3);
      expect(o.eco).toMatch(/^[A-E]\d\d$/);
      expect(o.moves.some((m) => m.note)).toBe(true);
    }
  });

  it.each(OPENINGS.map((o) => [o.name, o] as const))(
    'every move of %s is legal from the start position',
    (_name, opening) => {
      const chess = new Chess();
      for (const { san } of opening.moves) {
        expect(() => chess.move(san), `${opening.id}: ${san}`).not.toThrow();
      }
      expect(opening.moves.length).toBeGreaterThanOrEqual(12);
      expect(chess.isGameOver()).toBe(false);
    },
  );

  it('the UCI form replays to the same position and the learner always has moves to make', () => {
    for (const opening of OPENINGS) {
      const viaSan = new Chess();
      for (const { san } of opening.moves) viaSan.move(san);
      const viaUci = new Chess();
      for (const uci of openingUci(opening)) expect(playUci(viaUci, uci)).not.toBeNull();
      expect(viaUci.fen()).toBe(viaSan.fen());
      // white moves on even indices; the learner's side must have several moves to practise
      const parity = opening.side === 'w' ? 0 : 1;
      expect(opening.moves.filter((_, i) => i % 2 === parity).length).toBeGreaterThanOrEqual(6);
    }
  });
});
