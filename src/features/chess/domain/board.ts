/**
 * Search board: a 0x88 mailbox with incremental make/unmake and Zobrist hashing.
 *
 * chess.js stays the rules authority for the game itself (legality shown to the user, SAN, draw
 * detection). It is far too slow to search with (measured ~7-10k nodes/s in Node, because every
 * `move()` regenerates and validates all moves), so the engine has its own generator. That
 * generator is proven against chess.js by perft counts and move-set comparisons in the tests.
 */

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const WHITE = 0;
export const BLACK = 1;

const PIECE_CHARS = 'pnbrqk';

/** Move = from | to << 7 | promotion << 14 | flags << 17. */
export const FLAG_CAPTURE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE = 4;
export const FLAG_DOUBLE = 8;

export const moveFrom = (m: number): number => m & 127;
export const moveTo = (m: number): number => (m >> 7) & 127;
export const movePromotion = (m: number): number => (m >> 14) & 7;
export const moveFlags = (m: number): number => m >> 17;
const encode = (from: number, to: number, promo: number, flags: number): number =>
  from | (to << 7) | (promo << 14) | (flags << 17);

export const pieceType = (p: number): number => p & 7;
export const pieceColor = (p: number): number => p >> 3;

const CASTLE_WK = 1;
const CASTLE_WQ = 2;
const CASTLE_BK = 4;
const CASTLE_BQ = 8;

/** Which castling rights survive a move touching this square (king and rook home squares). */
const CASTLE_MASK = new Int8Array(128).fill(15);
CASTLE_MASK[0] = 15 & ~CASTLE_WQ;
CASTLE_MASK[7] = 15 & ~CASTLE_WK;
CASTLE_MASK[4] = 15 & ~(CASTLE_WK | CASTLE_WQ);
CASTLE_MASK[112] = 15 & ~CASTLE_BQ;
CASTLE_MASK[119] = 15 & ~CASTLE_BK;
CASTLE_MASK[116] = 15 & ~(CASTLE_BK | CASTLE_BQ);

const KNIGHT_STEPS = [31, 33, 18, 14, -31, -33, -18, -14] as const;
const KING_STEPS = [1, -1, 16, -16, 15, 17, -15, -17] as const;
const BISHOP_STEPS = [15, 17, -15, -17] as const;
const ROOK_STEPS = [1, -1, 16, -16] as const;
const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT] as const;

/** Deterministic PRNG so hashes (and therefore tests) are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) | 0;
  };
}

const rand = mulberry32(0x5eed1234);
const Z_PIECE_LO = new Int32Array(16 * 128);
const Z_PIECE_HI = new Int32Array(16 * 128);
for (let i = 0; i < Z_PIECE_LO.length; i++) {
  Z_PIECE_LO[i] = rand();
  Z_PIECE_HI[i] = rand();
}
const Z_CASTLE_LO = new Int32Array(16);
const Z_CASTLE_HI = new Int32Array(16);
for (let i = 0; i < 16; i++) {
  Z_CASTLE_LO[i] = rand();
  Z_CASTLE_HI[i] = rand();
}
const Z_EP_LO = new Int32Array(8);
const Z_EP_HI = new Int32Array(8);
for (let i = 0; i < 8; i++) {
  Z_EP_LO[i] = rand();
  Z_EP_HI[i] = rand();
}
const Z_SIDE_LO = rand();
const Z_SIDE_HI = rand();

/** Room for the game so far plus the deepest search line. */
const HISTORY_SIZE = 1024;

export const squareName = (sq: number): string =>
  String.fromCharCode(97 + (sq & 7)) + String((sq >> 4) + 1);

export const squareIndex = (name: string): number =>
  (name.charCodeAt(0) - 97) + (name.charCodeAt(1) - 49) * 16;

export function moveToUci(m: number): string {
  const promo = movePromotion(m);
  return (
    squareName(moveFrom(m)) + squareName(moveTo(m)) + (promo ? PIECE_CHARS.charAt(promo - 1) : '')
  );
}

export class Position {
  readonly board = new Int8Array(128);
  side = WHITE;
  castling = 0;
  /** En-passant target square, or -1. */
  ep = -1;
  halfmove = 0;
  readonly kingSq = [4, 116];
  hashLo = 0;
  hashHi = 0;

  /** Hashes of every position before the current one (game history + search line). */
  private readonly loStack = new Int32Array(HISTORY_SIZE);
  private readonly hiStack = new Int32Array(HISTORY_SIZE);
  private readonly capStack = new Int8Array(HISTORY_SIZE);
  private readonly castleStack = new Int8Array(HISTORY_SIZE);
  private readonly epStack = new Int16Array(HISTORY_SIZE);
  private readonly halfStack = new Int16Array(HISTORY_SIZE);
  /** Number of entries in the stacks; also the index of the current position. */
  length = 0;

  static fromFen(fen: string): Position {
    const p = new Position();
    p.setFen(fen);
    return p;
  }

  setFen(fen: string): void {
    const parts = fen.trim().split(/\s+/);
    const [placement, side, castling, ep, half] = parts;
    if (!placement || !side) throw new Error(`Invalid FEN: ${fen}`);
    this.board.fill(0);
    this.length = 0;
    const rows = placement.split('/');
    if (rows.length !== 8) throw new Error(`Invalid FEN: ${fen}`);
    rows.forEach((row, i) => {
      let file = 0;
      const rank = 7 - i;
      for (const ch of row) {
        if (ch >= '1' && ch <= '8') {
          file += Number(ch);
          continue;
        }
        const type = PIECE_CHARS.indexOf(ch.toLowerCase()) + 1;
        if (type === 0 || file > 7) throw new Error(`Invalid FEN: ${fen}`);
        const color = ch === ch.toLowerCase() ? BLACK : WHITE;
        const sq = rank * 16 + file;
        this.board[sq] = type | (color << 3);
        if (type === KING) this.kingSq[color] = sq;
        file++;
      }
    });
    this.side = side === 'b' ? BLACK : WHITE;
    const rights = castling ?? '-';
    this.castling =
      (rights.includes('K') ? CASTLE_WK : 0) |
      (rights.includes('Q') ? CASTLE_WQ : 0) |
      (rights.includes('k') ? CASTLE_BK : 0) |
      (rights.includes('q') ? CASTLE_BQ : 0);
    this.ep = ep && ep !== '-' ? squareIndex(ep) : -1;
    this.halfmove = Number(half ?? 0) || 0;
    this.computeHash();
  }

  private computeHash(): void {
    let lo = 0;
    let hi = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = this.board[sq] as number;
      if (p) {
        lo ^= Z_PIECE_LO[p * 128 + sq] as number;
        hi ^= Z_PIECE_HI[p * 128 + sq] as number;
      }
    }
    lo ^= Z_CASTLE_LO[this.castling] as number;
    hi ^= Z_CASTLE_HI[this.castling] as number;
    if (this.ep >= 0) {
      lo ^= Z_EP_LO[this.ep & 7] as number;
      hi ^= Z_EP_HI[this.ep & 7] as number;
    }
    if (this.side === BLACK) {
      lo ^= Z_SIDE_LO;
      hi ^= Z_SIDE_HI;
    }
    this.hashLo = lo;
    this.hashHi = hi;
  }

  /** Registers an earlier position of the game so repetitions across the root are detected. */
  pushHistoryOf(earlier: Position): void {
    this.loStack[this.length] = earlier.hashLo;
    this.hiStack[this.length] = earlier.hashHi;
    this.castleStack[this.length] = earlier.castling;
    this.epStack[this.length] = earlier.ep;
    this.halfStack[this.length] = earlier.halfmove;
    this.capStack[this.length] = 0;
    this.length++;
  }

  /** True when the current position already occurred since the last irreversible move. */
  isRepetition(): boolean {
    const oldest = Math.max(0, this.length - this.halfmove);
    for (let i = this.length - 2; i >= oldest; i -= 2) {
      if (this.loStack[i] === this.hashLo && this.hiStack[i] === this.hashHi) return true;
    }
    return false;
  }

  /** Same rule as chess.js: K vs K, K+minor vs K, or only same-coloured bishops. */
  insufficientMaterial(): boolean {
    let knights = 0;
    let bishops = 0;
    const bishopColors = new Set<number>();
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const t = pieceType(this.board[sq] as number);
      if (t === PAWN || t === ROOK || t === QUEEN) return false;
      if (t === KNIGHT) knights++;
      if (t === BISHOP) {
        bishops++;
        bishopColors.add(((sq >> 4) + (sq & 7)) & 1);
      }
    }
    if (knights + bishops <= 1) return true;
    return knights === 0 && bishopColors.size === 1;
  }

  isAttacked(sq: number, by: number): boolean {
    const b = this.board;
    const bit = by << 3;
    // pawns attack diagonally forward, so the attacker sits one rank behind `sq` from its side
    const pawn = PAWN | bit;
    const back = by === WHITE ? -16 : 16;
    let t = sq + back - 1;
    if (!(t & 0x88) && b[t] === pawn) return true;
    t = sq + back + 1;
    if (!(t & 0x88) && b[t] === pawn) return true;
    const knight = KNIGHT | bit;
    for (let i = 0; i < 8; i++) {
      t = sq + (KNIGHT_STEPS[i] as number);
      if (!(t & 0x88) && b[t] === knight) return true;
    }
    const king = KING | bit;
    for (let i = 0; i < 8; i++) {
      t = sq + (KING_STEPS[i] as number);
      if (!(t & 0x88) && b[t] === king) return true;
    }
    const bishop = BISHOP | bit;
    const rook = ROOK | bit;
    const queen = QUEEN | bit;
    for (let i = 0; i < 4; i++) {
      const step = BISHOP_STEPS[i] as number;
      t = sq + step;
      while (!(t & 0x88)) {
        const p = b[t] as number;
        if (p) {
          if (p === bishop || p === queen) return true;
          break;
        }
        t += step;
      }
    }
    for (let i = 0; i < 4; i++) {
      const step = ROOK_STEPS[i] as number;
      t = sq + step;
      while (!(t & 0x88)) {
        const p = b[t] as number;
        if (p) {
          if (p === rook || p === queen) return true;
          break;
        }
        t += step;
      }
    }
    return false;
  }

  inCheck(): boolean {
    return this.isAttacked(this.kingSq[this.side] as number, this.side ^ 1);
  }

  /**
   * Fills `out` with pseudo-legal moves (the caller drops those that leave the king in check by
   * calling `make`). `capturesOnly` is for quiescence: captures and promotions.
   */
  generate(out: Int32Array, capturesOnly: boolean): number {
    const b = this.board;
    const us = this.side;
    const them = us ^ 1;
    const ownBit = us << 3;
    let n = 0;

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = b[sq] as number;
      if (!p || p >> 3 !== us) continue;
      const type = p & 7;

      if (type === PAWN) {
        const dir = us === WHITE ? 16 : -16;
        const startRank = us === WHITE ? 1 : 6;
        const promoRank = us === WHITE ? 6 : 1;
        const rank = sq >> 4;
        const fwd = sq + dir;
        if (b[fwd] === 0) {
          if (rank === promoRank) {
            n = this.addPromotions(out, n, sq, fwd, 0, capturesOnly);
          } else if (!capturesOnly) {
            out[n++] = encode(sq, fwd, 0, 0);
            if (rank === startRank && b[fwd + dir] === 0) {
              out[n++] = encode(sq, fwd + dir, 0, FLAG_DOUBLE);
            }
          }
        }
        for (let side = -1; side <= 1; side += 2) {
          const t = sq + dir + side;
          if (t & 0x88) continue;
          const target = b[t] as number;
          if (target && target >> 3 === them) {
            if (rank === promoRank) {
              n = this.addPromotions(out, n, sq, t, FLAG_CAPTURE, capturesOnly);
            } else {
              out[n++] = encode(sq, t, 0, FLAG_CAPTURE);
            }
          } else if (t === this.ep) {
            out[n++] = encode(sq, t, 0, FLAG_CAPTURE | FLAG_EP);
          }
        }
        continue;
      }

      if (type === KNIGHT || type === KING) {
        const steps = type === KNIGHT ? KNIGHT_STEPS : KING_STEPS;
        for (let i = 0; i < 8; i++) {
          const t = sq + (steps[i] as number);
          if (t & 0x88) continue;
          const target = b[t] as number;
          if (target === 0) {
            if (!capturesOnly) out[n++] = encode(sq, t, 0, 0);
          } else if (target >> 3 === them) {
            out[n++] = encode(sq, t, 0, FLAG_CAPTURE);
          }
        }
        continue;
      }

      const steps = type === BISHOP ? BISHOP_STEPS : type === ROOK ? ROOK_STEPS : KING_STEPS;
      const count = type === QUEEN ? 8 : 4;
      for (let i = 0; i < count; i++) {
        const step = steps[i] as number;
        let t = sq + step;
        while (!(t & 0x88)) {
          const target = b[t] as number;
          if (target === 0) {
            if (!capturesOnly) out[n++] = encode(sq, t, 0, 0);
          } else {
            if (target >> 3 === them) out[n++] = encode(sq, t, 0, FLAG_CAPTURE);
            break;
          }
          t += step;
        }
      }
    }

    if (!capturesOnly) n = this.addCastles(out, n, ownBit);
    return n;
  }

  private addPromotions(
    out: Int32Array,
    start: number,
    from: number,
    to: number,
    flags: number,
    queenOnly: boolean,
  ): number {
    let n = start;
    const count = queenOnly ? 1 : 4;
    for (let i = 0; i < count; i++) out[n++] = encode(from, to, PROMOTIONS[i] as number, flags);
    return n;
  }

  private addCastles(out: Int32Array, start: number, ownBit: number): number {
    let n = start;
    const b = this.board;
    const them = this.side ^ 1;
    const base = this.side === WHITE ? 0 : 112;
    const kingSide = this.side === WHITE ? CASTLE_WK : CASTLE_BK;
    const queenSide = this.side === WHITE ? CASTLE_WQ : CASTLE_BQ;
    if (!(this.castling & (kingSide | queenSide)) || b[base + 4] !== (KING | ownBit)) return n;
    if (this.isAttacked(base + 4, them)) return n;
    if (
      this.castling & kingSide &&
      b[base + 5] === 0 &&
      b[base + 6] === 0 &&
      !this.isAttacked(base + 5, them)
    ) {
      out[n++] = encode(base + 4, base + 6, 0, FLAG_CASTLE);
    }
    if (
      this.castling & queenSide &&
      b[base + 3] === 0 &&
      b[base + 2] === 0 &&
      b[base + 1] === 0 &&
      !this.isAttacked(base + 3, them)
    ) {
      out[n++] = encode(base + 4, base + 2, 0, FLAG_CASTLE);
    }
    return n;
  }

  /** Plays a pseudo-legal move. Returns false (and restores the position) if it left our king in check. */
  make(m: number): boolean {
    const from = m & 127;
    const to = (m >> 7) & 127;
    const promo = (m >> 14) & 7;
    const flags = m >> 17;
    const b = this.board;
    const us = this.side;
    const piece = b[from] as number;
    const h = this.length;

    this.loStack[h] = this.hashLo;
    this.hiStack[h] = this.hashHi;
    this.castleStack[h] = this.castling;
    this.epStack[h] = this.ep;
    this.halfStack[h] = this.halfmove;

    let lo = this.hashLo;
    let hi = this.hashHi;
    if (this.ep >= 0) {
      lo ^= Z_EP_LO[this.ep & 7] as number;
      hi ^= Z_EP_HI[this.ep & 7] as number;
    }
    lo ^= Z_CASTLE_LO[this.castling] as number;
    hi ^= Z_CASTLE_HI[this.castling] as number;

    let captured = b[to] as number;
    if (flags & FLAG_EP) {
      const capSq = us === WHITE ? to - 16 : to + 16;
      captured = b[capSq] as number;
      b[capSq] = 0;
      lo ^= Z_PIECE_LO[captured * 128 + capSq] as number;
      hi ^= Z_PIECE_HI[captured * 128 + capSq] as number;
    } else if (captured) {
      lo ^= Z_PIECE_LO[captured * 128 + to] as number;
      hi ^= Z_PIECE_HI[captured * 128 + to] as number;
    }
    this.capStack[h] = captured;

    const placed = promo ? promo | (us << 3) : piece;
    b[from] = 0;
    b[to] = placed;
    lo ^= (Z_PIECE_LO[piece * 128 + from] as number) ^ (Z_PIECE_LO[placed * 128 + to] as number);
    hi ^= (Z_PIECE_HI[piece * 128 + from] as number) ^ (Z_PIECE_HI[placed * 128 + to] as number);

    if (flags & FLAG_CASTLE) {
      const base = us === WHITE ? 0 : 112;
      const [rookFrom, rookTo] = to > from ? [base + 7, base + 5] : [base, base + 3];
      const rook = b[rookFrom] as number;
      b[rookFrom] = 0;
      b[rookTo] = rook;
      lo ^= (Z_PIECE_LO[rook * 128 + rookFrom] as number) ^ (Z_PIECE_LO[rook * 128 + rookTo] as number);
      hi ^= (Z_PIECE_HI[rook * 128 + rookFrom] as number) ^ (Z_PIECE_HI[rook * 128 + rookTo] as number);
    }
    if ((piece & 7) === KING) this.kingSq[us] = to;

    this.castling &= (CASTLE_MASK[from] as number) & (CASTLE_MASK[to] as number);
    lo ^= Z_CASTLE_LO[this.castling] as number;
    hi ^= Z_CASTLE_HI[this.castling] as number;

    this.ep = flags & FLAG_DOUBLE ? (from + to) >> 1 : -1;
    if (this.ep >= 0) {
      lo ^= Z_EP_LO[this.ep & 7] as number;
      hi ^= Z_EP_HI[this.ep & 7] as number;
    }
    this.halfmove = (piece & 7) === PAWN || captured ? 0 : this.halfmove + 1;
    this.side = us ^ 1;
    this.hashLo = lo ^ Z_SIDE_LO;
    this.hashHi = hi ^ Z_SIDE_HI;
    this.length = h + 1;

    if (this.isAttacked(this.kingSq[us] as number, us ^ 1)) {
      this.unmake(m);
      return false;
    }
    return true;
  }

  unmake(m: number): void {
    const from = m & 127;
    const to = (m >> 7) & 127;
    const promo = (m >> 14) & 7;
    const flags = m >> 17;
    const b = this.board;
    const h = this.length - 1;
    const us = this.side ^ 1;
    const captured = this.capStack[h] as number;
    const placed = b[to] as number;
    const piece = promo ? PAWN | (us << 3) : placed;

    b[from] = piece;
    if (flags & FLAG_EP) {
      b[to] = 0;
      b[us === WHITE ? to - 16 : to + 16] = captured;
    } else {
      b[to] = captured;
    }
    if (flags & FLAG_CASTLE) {
      const base = us === WHITE ? 0 : 112;
      const [rookFrom, rookTo] = to > from ? [base + 7, base + 5] : [base, base + 3];
      b[rookFrom] = b[rookTo] as number;
      b[rookTo] = 0;
    }
    if ((piece & 7) === KING) this.kingSq[us] = from;

    this.side = us;
    this.castling = this.castleStack[h] as number;
    this.ep = this.epStack[h] as number;
    this.halfmove = this.halfStack[h] as number;
    this.hashLo = this.loStack[h] as number;
    this.hashHi = this.hiStack[h] as number;
    this.length = h;
  }

  /** Passing the move: used by null-move pruning. */
  makeNull(): void {
    const h = this.length;
    this.loStack[h] = this.hashLo;
    this.hiStack[h] = this.hashHi;
    this.castleStack[h] = this.castling;
    this.epStack[h] = this.ep;
    this.halfStack[h] = this.halfmove;
    if (this.ep >= 0) {
      this.hashLo ^= Z_EP_LO[this.ep & 7] as number;
      this.hashHi ^= Z_EP_HI[this.ep & 7] as number;
    }
    this.ep = -1;
    this.side ^= 1;
    this.hashLo ^= Z_SIDE_LO;
    this.hashHi ^= Z_SIDE_HI;
    this.halfmove++;
    this.length = h + 1;
  }

  unmakeNull(): void {
    const h = this.length - 1;
    this.side ^= 1;
    this.ep = this.epStack[h] as number;
    this.halfmove = this.halfStack[h] as number;
    this.hashLo = this.loStack[h] as number;
    this.hashHi = this.hiStack[h] as number;
    this.length = h;
  }
}

/** Legal-move count to a depth; the reference numbers are published perft results. */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = new Int32Array(256);
  const n = pos.generate(moves, false);
  let total = 0;
  for (let i = 0; i < n; i++) {
    const m = moves[i] as number;
    if (!pos.make(m)) continue;
    total += perft(pos, depth - 1);
    pos.unmake(m);
  }
  return total;
}
