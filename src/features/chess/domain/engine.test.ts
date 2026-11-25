import { Chess, type Move } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { ChessEngine, LEVEL_CONFIG, LEVELS } from './engine';
import { Searcher, type SearchLimits } from './search';
import { seededRandom } from './testRandom';

const SHALLOW: SearchLimits = { maxDepth: 4, maxNodes: 200_000, maxTimeMs: 2000 };
const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

function uciOf(m: Move): string {
  return m.from + m.to + (m.promotion ?? '');
}

function play(chess: Chess, uci: string): Move {
  return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
}

describe('tactics', () => {
  const engine = () => new ChessEngine();

  it('finds mate in 1 for White (back rank)', () => {
    const r = engine().search('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', SHALLOW);
    expect(r.move).toBe('a1a8');
    expect(r.mateIn).toBe(1);
  });

  it('finds mate in 1 for Black (fool’s mate)', () => {
    const r = engine().search(
      'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
      SHALLOW,
    );
    expect(r.move).toBe('d8h4');
    expect(r.mateIn).toBe(1);
  });

  it('finds mate in 2 (two rooks, ladder mate)', () => {
    const r = engine().search('6k1/8/8/8/8/8/R7/1R4K1 w - - 0 1', SHALLOW);
    expect(r.mateIn).toBe(2);
  });

  it('finds a mate in 2 as Black', () => {
    const r = engine().search('1r4k1/r7/8/8/8/8/8/6K1 b - - 0 1', SHALLOW);
    expect(r.mateIn).toBe(2);
  });

  it('reports no move when mated or stalemated', () => {
    const mated = engine().search(
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
      SHALLOW,
    );
    expect(mated.move).toBeNull();
    expect(mated.mateIn).toBe(0);
    const stalemate = engine().search('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', SHALLOW);
    expect(stalemate.move).toBeNull();
    expect(stalemate.score).toBe(0);
  });

  it('takes a free queen', () => {
    const r = engine().search('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', SHALLOW);
    expect(r.move).toBe('d1d5');
    expect(r.score).toBeGreaterThan(400);
  });

  it('does not leave its queen en prise when a pawn attacks it, on any level', () => {
    const fen = 'rnbqkbnr/pp2pppp/2p5/3Q4/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 3';
    for (const level of LEVELS) {
      const chess = new Chess(fen);
      const r = new ChessEngine().findMove({ fen, level, random: seededRandom(7) });
      const move = play(chess, r.move as string);
      const queenLost = chess.moves({ verbose: true }).some((m) => m.captured === 'q');
      // either the queen moved to safety or it traded itself for the other queen
      expect(queenLost && move.captured !== 'q').toBe(false);
    }
  });
});

describe('legality and completion', () => {
  it('never returns an illegal move, over many real positions', () => {
    const random = seededRandom(99);
    const quickLimits: SearchLimits = { maxDepth: 3, maxNodes: 3000, maxTimeMs: 200 };
    let checked = 0;
    for (let game = 0; game < 4; game++) {
      const chess = new Chess();
      const engine = new ChessEngine();
      for (let ply = 0; ply < 40 && !chess.isGameOver(); ply++) {
        const legal = new Set(chess.moves({ verbose: true }).map(uciOf));
        const easy = engine.findMove({ fen: chess.fen(), level: 'easy', random });
        const quick = engine.search(chess.fen(), quickLimits);
        expect(legal.has(easy.move as string)).toBe(true);
        expect(legal.has(quick.move as string)).toBe(true);
        checked += 2;
        const moves = chess.moves();
        chess.move(moves[Math.floor(random() * moves.length)] as string);
      }
    }
    expect(checked).toBeGreaterThan(250);
  }, 30_000);

  it('respects the time budget', () => {
    const r = new Searcher().search(KIWIPETE, { maxDepth: 30, maxNodes: 1e9, maxTimeMs: 200 });
    expect(r.timeMs).toBeLessThan(200 + 400); // generous slack: a loaded CI machine delays the clock check
    expect(r.move).not.toBeNull();
    expect(r.depth).toBeGreaterThanOrEqual(3);
  });

  it('respects the node budget', () => {
    const r = new Searcher().search(KIWIPETE, { maxDepth: 30, maxNodes: 5000, maxTimeMs: 10_000 });
    expect(r.nodes).toBeLessThan(5000 + 1100);
    expect(r.move).not.toBeNull();
  });

  it('hard level searches several plies inside its clock', () => {
    const fen = 'r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 1';
    const r = new ChessEngine().findMove({ fen, level: 'hard' });
    expect(r.timeMs).toBeLessThan(LEVEL_CONFIG.hard.maxTimeMs + 500);
    expect(r.depth).toBeGreaterThanOrEqual(5);
  });

  it.each([
    ['White', 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'],
    ['Black', 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'],
  ])('plays a full legal game to the end, engine against engine (%s to move)', (_side, start) => {
    const limits: SearchLimits = { maxDepth: 2, maxNodes: 4000, maxTimeMs: 100 };
    const random = seededRandom(start.length);
    const chess = new Chess(start);
    const engine = new ChessEngine();
    const history: string[] = [];
    let plies = 0;
    while (!chess.isGameOver() && plies < 800) {
      const legal = new Set(chess.moves({ verbose: true }).map(uciOf));
      const r = engine.search(chess.fen(), limits, history);
      expect(legal.has(r.move as string)).toBe(true);
      // the first moves are drawn from the best two so the sides do not replay one fixed game
      const choice =
        plies < 8
          ? engine.scoreRootMoves(chess.fen(), 2, history).slice(0, 2)
          : [{ move: r.move as string }];
      const pick = choice[Math.floor(random() * choice.length)];
      history.push(chess.fen());
      play(chess, pick?.move as string);
      plies++;
    }
    expect(chess.isGameOver()).toBe(true);
  });

  it('treats bare material and the fifty-move clock as draws', () => {
    const engine = new ChessEngine();
    // a lone knight can never be won: the engine must score it as a draw
    const drawn = engine.search('8/8/8/4k3/8/8/8/3NK3 w - - 0 1', SHALLOW);
    expect(drawn.score).toBe(0);
    // one quiet move from the fifty-move draw while a pawn move would reset the clock
    const fifty = engine.search('8/8/8/4k3/8/8/4P3/4K3 w - - 98 90', SHALLOW);
    expect(fifty.move).not.toBeNull();
  });

  it('plays a lone-queen ending through to checkmate', () => {
    const chess = new Chess('8/8/8/4k3/8/8/8/3QK3 w - - 0 1');
    const engine = new ChessEngine();
    const history: string[] = [];
    const limits: SearchLimits = { maxDepth: 6, maxNodes: 100_000, maxTimeMs: 300 };
    while (!chess.isGameOver() && history.length < 120) {
      const r = engine.search(chess.fen(), limits, history);
      history.push(chess.fen());
      play(chess, r.move as string);
    }
    expect(chess.isCheckmate()).toBe(true);
  });
});

describe('levels', () => {
  it('easy plays varied moves and never passes up a mate', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const engine = new ChessEngine();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      seen.add(engine.findMove({ fen, level: 'easy', random: seededRandom(i + 1) }).move as string);
    }
    expect(seen.size).toBeGreaterThan(1);

    const mate = engine.findMove({
      fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
      level: 'easy',
      random: () => 0.999,
    });
    expect(mate.move).toBe('a1a8');
  });

  it('easy does not blunder its queen to a one-move capture', () => {
    const fen = 'rnb1kbnr/ppp2ppp/8/3pp3/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 3';
    for (let i = 0; i < 15; i++) {
      const chess = new Chess(fen);
      const r = new ChessEngine().findMove({ fen, level: 'easy', random: seededRandom(i + 11) });
      play(chess, r.move as string);
      expect(chess.moves({ verbose: true }).some((m) => m.captured === 'q')).toBe(false);
    }
  });

  it('deeper levels are configured with more depth, and the clock stays phone-friendly', () => {
    expect(LEVEL_CONFIG.easy.maxDepth).toBeLessThan(LEVEL_CONFIG.medium.maxDepth);
    expect(LEVEL_CONFIG.medium.maxDepth).toBeLessThan(LEVEL_CONFIG.hard.maxDepth);
    expect(LEVEL_CONFIG.hard.maxTimeMs).toBeLessThanOrEqual(1500);
  });
});
