import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { Position, moveToUci, perft } from './board';
import { seededRandom } from './testRandom';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Published perft results (chessprogramming.org "Perft Results"). */
const PERFT: { name: string; fen: string; counts: number[] }[] = [
  { name: 'start', fen: START, counts: [20, 400, 8902, 197_281] },
  {
    name: 'kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    counts: [48, 2039, 97_862],
  },
  {
    name: 'rook endgame',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    counts: [14, 191, 2812, 43_238],
  },
  {
    name: 'castling and promotion',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    counts: [6, 264, 9467],
  },
  {
    name: 'promotion with check',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    counts: [44, 1486, 62_379],
  },
];

describe('move generator', () => {
  it.each(PERFT)('matches published perft counts: $name', ({ fen, counts }) => {
    counts.forEach((expected, i) => {
      expect(perft(Position.fromFen(fen), i + 1)).toBe(expected);
    });
  });

  it('lists exactly the legal moves chess.js lists along random games', () => {
    const random = seededRandom(12345);
    let positions = 0;
    for (let game = 0; game < 12; game++) {
      const chess = new Chess();
      for (let ply = 0; ply < 120 && !chess.isGameOver(); ply++) {
        const pos = Position.fromFen(chess.fen());
        const list = new Int32Array(256);
        const n = pos.generate(list, false);
        const mine: string[] = [];
        for (let i = 0; i < n; i++) {
          const m = list[i] as number;
          if (pos.make(m)) {
            mine.push(moveToUci(m));
            pos.unmake(m);
          }
        }
        const theirs = chess
          .moves({ verbose: true })
          .map((m) => m.from + m.to + (m.promotion ?? ''));
        expect(mine.sort()).toEqual(theirs.sort());
        positions++;
        const moves = chess.moves();
        chess.move(moves[Math.floor(random() * moves.length)] as string);
      }
    }
    expect(positions).toBeGreaterThan(500);
  }, 30_000);

  it('restores the position exactly after unmake (hash included)', () => {
    const pos = Position.fromFen(PERFT[1]!.fen);
    const before = { lo: pos.hashLo, hi: pos.hashHi, castling: pos.castling, ep: pos.ep };
    const list = new Int32Array(256);
    const n = pos.generate(list, false);
    for (let i = 0; i < n; i++) {
      const m = list[i] as number;
      if (pos.make(m)) pos.unmake(m);
      expect({ lo: pos.hashLo, hi: pos.hashHi, castling: pos.castling, ep: pos.ep }).toEqual(
        before,
      );
    }
  });

  it('gives the same hash for the same position reached by different move orders', () => {
    const play = (ucis: string[]) => {
      const chess = new Chess();
      for (const u of ucis) chess.move({ from: u.slice(0, 2), to: u.slice(2, 4) });
      return chess.fen();
    };
    const a = Position.fromFen(play(['g1f3', 'g8f6', 'b1c3', 'b8c6']));
    const b = Position.fromFen(play(['b1c3', 'b8c6', 'g1f3', 'g8f6']));
    expect([a.hashLo, a.hashHi]).toEqual([b.hashLo, b.hashHi]);
  });

  it('detects insufficient material like chess.js', () => {
    const cases = [
      '8/8/8/4k3/8/8/8/4K3 w - - 0 1',
      '8/8/8/4k3/8/8/8/3BK3 w - - 0 1',
      '8/8/8/4k3/8/8/8/3NK3 w - - 0 1',
      '8/8/8/4kb2/8/8/8/3BK3 w - - 0 1',
      '8/8/8/4kb2/8/8/8/4KB2 w - - 0 1',
      '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1',
      '8/8/8/4k3/8/8/8/2NNK3 w - - 0 1',
    ];
    for (const fen of cases) {
      expect(Position.fromFen(fen).insufficientMaterial()).toBe(
        new Chess(fen).isInsufficientMaterial(),
      );
    }
  });
});
