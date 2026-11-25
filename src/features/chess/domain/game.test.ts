import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { buildPgn, movesAfterUndo, outcomeFor, playerMoveCount } from './game';
import { capturedPieces, gameEnd, replay } from './rules';

describe('game helpers', () => {
  it('maps the winner to the human’s outcome', () => {
    expect(outcomeFor('w', 'w')).toBe('win');
    expect(outcomeFor('w', 'b')).toBe('loss');
    expect(outcomeFor(null, 'b')).toBe('draw');
  });

  it('counts the human’s own moves for either colour', () => {
    const moves = ['e2e4', 'e7e5', 'g1f3'];
    expect(playerMoveCount(moves, 'w')).toBe(2);
    expect(playerMoveCount(moves, 'b')).toBe(1);
  });

  it('undo takes back the reply and the human’s move, and never the engine’s opening move', () => {
    expect(movesAfterUndo(['e2e4', 'e7e5', 'g1f3', 'b8c6'], 'w')).toEqual(['e2e4', 'e7e5']);
    expect(movesAfterUndo(['e2e4', 'e7e5', 'g1f3'], 'b')).toEqual(['e2e4']);
    expect(movesAfterUndo(['e2e4'], 'b')).toBeNull();
    expect(movesAfterUndo([], 'w')).toBeNull();
    // human just moved and the engine has not answered yet: only that move is taken back
    expect(movesAfterUndo(['e2e4'], 'w')).toEqual([]);
  });

  it('writes a PGN with players and result', () => {
    const chess = replay(['f2f3', 'e7e5', 'g2g4', 'd8h4']) as Chess;
    const pgn = buildPgn(chess, { human: 'w', level: 'easy', outcome: 'loss', date: '2026.11.25' });
    expect(pgn).toContain('[White "You"]');
    expect(pgn).toContain('[Black "SkillForge engine (easy)"]');
    expect(pgn).toContain('[Result "0-1"]');
    expect(pgn).toContain('1. f3 e5 2. g4 Qh4#');
  });
});

describe('rules helpers', () => {
  it('replays UCI and rejects illegal lines', () => {
    expect(replay(['e2e4', 'e7e5'])?.fen()).toContain('4p3/4P3');
    expect(replay(['e2e5'])).toBeNull();
  });

  it('reports every way a game can end', () => {
    expect(gameEnd(replay(['f2f3', 'e7e5', 'g2g4', 'd8h4']) as Chess)).toEqual({
      over: true,
      winner: 'b',
      reason: 'checkmate',
    });
    expect(gameEnd(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toMatchObject({ reason: 'stalemate' });
    expect(gameEnd(new Chess('8/8/8/4k3/8/8/8/4KN2 w - - 0 1'))).toMatchObject({
      reason: 'insufficient material',
    });
    expect(gameEnd(new Chess('8/8/8/4k3/8/8/4P3/4K3 w - - 100 90'))).toMatchObject({
      reason: 'fifty-move rule',
    });
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'];
    expect(gameEnd(replay(shuffle) as Chess)).toMatchObject({ reason: 'threefold repetition' });
    expect(gameEnd(new Chess())).toEqual({ over: false });
  });

  it('lists captured pieces, most valuable first', () => {
    const chess = replay(['e2e4', 'd7d5', 'e4d5', 'd8d5', 'b1c3', 'd5g2', 'f1g2']) as Chess;
    const { byWhite, byBlack } = capturedPieces(chess.history({ verbose: true }));
    expect(byWhite).toEqual(['q', 'p']);
    expect(byBlack).toEqual(['p', 'p']);
  });
});
