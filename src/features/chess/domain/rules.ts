import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js';

/** Thin helpers over chess.js, the rules authority for everything the user sees. */

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export interface UciMove {
  from: Square;
  to: Square;
  promotion?: PromotionPiece;
}

export function parseUci(uci: string): UciMove {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length > 4 ? { promotion: uci[4] as PromotionPiece } : {}),
  };
}

export const toUci = (m: Pick<Move, 'from' | 'to' | 'promotion'>): string =>
  m.from + m.to + (m.promotion ?? '');

/** Plays a UCI move; null (position untouched) when it is not legal. */
export function playUci(chess: Chess, uci: string): Move | null {
  try {
    return chess.move(parseUci(uci));
  } catch {
    return null; // chess.js throws on illegal moves
  }
}

/** Rebuilds a game from its start position and UCI moves; null if any move is illegal. */
export function replay(moves: readonly string[], startFen?: string): Chess | null {
  const chess = startFen ? new Chess(startFen) : new Chess();
  for (const uci of moves) if (!playUci(chess, uci)) return null;
  return chess;
}

/** Classic piece values in pawns, for material counts and the captured-pieces strip. */
export const PIECE_POINTS: Readonly<Record<PieceSymbol, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/** White's material minus Black's, in pawns. */
export function materialBalance(fen: string): number {
  let total = 0;
  for (const row of new Chess(fen).board()) {
    for (const piece of row) {
      if (piece) total += PIECE_POINTS[piece.type] * (piece.color === 'w' ? 1 : -1);
    }
  }
  return total;
}

export type GameEnd =
  | { over: false }
  | {
      over: true;
      /** `null` for a draw. */
      winner: 'w' | 'b' | null;
      reason:
        | 'checkmate'
        | 'stalemate'
        | 'threefold repetition'
        | 'fifty-move rule'
        | 'insufficient material';
    };

export function gameEnd(chess: Chess): GameEnd {
  if (chess.isCheckmate()) return { over: true, winner: chess.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' };
  if (chess.isStalemate()) return { over: true, winner: null, reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { over: true, winner: null, reason: 'insufficient material' };
  if (chess.isThreefoldRepetition()) return { over: true, winner: null, reason: 'threefold repetition' };
  if (chess.isDrawByFiftyMoves()) return { over: true, winner: null, reason: 'fifty-move rule' };
  return { over: false };
}

/** Pieces taken so far, most valuable first. */
export function capturedPieces(history: readonly Move[]): {
  byWhite: PieceSymbol[];
  byBlack: PieceSymbol[];
} {
  const byWhite: PieceSymbol[] = [];
  const byBlack: PieceSymbol[] = [];
  for (const m of history) {
    if (!m.captured) continue;
    (m.color === 'w' ? byWhite : byBlack).push(m.captured);
  }
  const byValue = (a: PieceSymbol, b: PieceSymbol) => PIECE_POINTS[b] - PIECE_POINTS[a];
  return { byWhite: byWhite.sort(byValue), byBlack: byBlack.sort(byValue) };
}

export const PIECE_NAMES: Readonly<Record<PieceSymbol, string>> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

/** Squares the piece on `from` may legally move to. */
export function legalTargets(chess: Chess, from: Square): Square[] {
  return chess.moves({ square: from, verbose: true }).map((m) => m.to);
}

/** True when moving from -> to is a pawn promotion, so the user must choose a piece. */
export function needsPromotion(chess: Chess, from: Square, to: Square): boolean {
  return chess.moves({ square: from, verbose: true }).some((m) => m.to === to && m.promotion);
}

/** Square of the side-to-move's king when it is in check, else null. */
export function checkedKingSquare(chess: Chess): Square | null {
  if (!chess.inCheck()) return null;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (piece?.type === 'k' && piece.color === chess.turn()) return piece.square;
    }
  }
  return null;
}
