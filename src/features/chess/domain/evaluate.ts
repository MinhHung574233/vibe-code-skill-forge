import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
  type Position,
} from './board';

/** Centipawn values, indexed by piece type. */
export const PIECE_VALUE = [0, 100, 320, 330, 500, 900, 0] as const;

/*
 * Piece-square tables, written from White's point of view with rank 8 on the first row so they
 * read like a board. Values are small positional nudges on top of the material values above.
 */
const PAWN_MG = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];
const PAWN_EG = [
  0, 0, 0, 0, 0, 0, 0, 0,
  90, 90, 90, 90, 90, 90, 90, 90,
  55, 55, 55, 55, 55, 55, 55, 55,
  30, 30, 30, 30, 30, 30, 30, 30,
  15, 15, 15, 15, 15, 15, 15, 15,
  5, 5, 5, 5, 5, 5, 5, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0,
];
const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];
const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];
const ROOK_PST = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];
const QUEEN_PST = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];
const KING_MG = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];
const KING_EG = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

/** Bonus for a passed pawn by how many ranks it has advanced (index = relative rank). */
const PASSED_BONUS = [0, 5, 10, 20, 35, 60, 100, 0] as const;
const BISHOP_PAIR = 30;
const DOUBLED_PAWN = -12;
const TEMPO = 10;
/** Phase weights: 24 = full middlegame material, 0 = bare kings and pawns. */
const PHASE_WEIGHT = [0, 0, 1, 1, 2, 4, 0] as const;
const MAX_PHASE = 24;

/** Combined [material + table] values per piece code (0..15) and 0x88 square, mg and eg. */
const MG = new Int16Array(16 * 128);
const EG = new Int16Array(16 * 128);

function buildTables(): void {
  const tables: Record<number, readonly [readonly number[], readonly number[]]> = {
    [PAWN]: [PAWN_MG, PAWN_EG],
    [KNIGHT]: [KNIGHT_PST, KNIGHT_PST],
    [BISHOP]: [BISHOP_PST, BISHOP_PST],
    [ROOK]: [ROOK_PST, ROOK_PST],
    [QUEEN]: [QUEEN_PST, QUEEN_PST],
    [KING]: [KING_MG, KING_EG],
  };
  for (let type = PAWN; type <= KING; type++) {
    const [mg, eg] = tables[type] as readonly [readonly number[], readonly number[]];
    const value = PIECE_VALUE[type] as number;
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const sq = rank * 16 + file;
        const whiteIdx = (7 - rank) * 8 + file; // tables are drawn with rank 8 on top
        const blackIdx = rank * 8 + file; // mirrored vertically for Black
        MG[(type | (WHITE << 3)) * 128 + sq] = value + (mg[whiteIdx] as number);
        EG[(type | (WHITE << 3)) * 128 + sq] = value + (eg[whiteIdx] as number);
        MG[(type | (BLACK << 3)) * 128 + sq] = value + (mg[blackIdx] as number);
        EG[(type | (BLACK << 3)) * 128 + sq] = value + (eg[blackIdx] as number);
      }
    }
  }
}
buildTables();

// Scratch buffers: evaluation runs millions of times, so it must not allocate.
const lowestPawn = [new Int8Array(10), new Int8Array(10)]; // by colour, file+1 (padded), rank
const highestPawn = [new Int8Array(10), new Int8Array(10)];
const pawnsOnFile = [new Int8Array(10), new Int8Array(10)];

/** Bonus for the winning side: drive the lone king to the edge and bring our king close. */
function mopUp(pos: Position, winner: number): number {
  const loser = pos.kingSq[winner ^ 1] as number;
  const own = pos.kingSq[winner] as number;
  const file = loser & 7;
  const rank = loser >> 4;
  const centreDistance = Math.max(3 - file, file - 4) + Math.max(3 - rank, rank - 4);
  const kingDistance = Math.abs(file - (own & 7)) + Math.abs(rank - (own >> 4));
  return 12 * centreDistance + 4 * (14 - kingDistance);
}

/** Static evaluation in centipawns from the side to move's point of view. */
export function evaluate(pos: Position): number {
  const b = pos.board;
  let mg = 0;
  let eg = 0;
  let phase = 0;
  const bishops = [0, 0];
  const pieceMaterial = [0, 0]; // knights, bishops, rooks and queens only

  for (let c = 0; c < 2; c++) {
    lowestPawn[c]?.fill(8);
    highestPawn[c]?.fill(-1);
    pawnsOnFile[c]?.fill(0);
  }

  // pass 1: material, tables, pawn structure bookkeeping
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const p = b[sq] as number;
    if (!p) continue;
    const color = p >> 3;
    const type = p & 7;
    const sign = color === WHITE ? 1 : -1;
    mg += sign * (MG[p * 128 + sq] as number);
    eg += sign * (EG[p * 128 + sq] as number);
    phase += PHASE_WEIGHT[type] as number;
    if (type === BISHOP) bishops[color]!++;
    if (type !== PAWN && type !== KING) pieceMaterial[color]! += PIECE_VALUE[type] as number;
    if (type === PAWN) {
      const file = (sq & 7) + 1;
      const rank = sq >> 4;
      const low = lowestPawn[color] as Int8Array;
      const high = highestPawn[color] as Int8Array;
      if (rank < (low[file] as number)) low[file] = rank;
      if (rank > (high[file] as number)) high[file] = rank;
      (pawnsOnFile[color] as Int8Array)[file]!++;
    }
  }

  let bonus = 0;
  for (let color = 0; color < 2; color++) {
    const sign = color === WHITE ? 1 : -1;
    if ((bishops[color] as number) >= 2) bonus += sign * BISHOP_PAIR;
    const own = pawnsOnFile[color] as Int8Array;
    const enemyLow = lowestPawn[color ^ 1] as Int8Array;
    const enemyHigh = highestPawn[color ^ 1] as Int8Array;
    for (let file = 1; file <= 8; file++) {
      const count = own[file] as number;
      if (count === 0) continue;
      if (count > 1) bonus += sign * DOUBLED_PAWN * (count - 1);
      // only the most advanced pawn of a file can be passed
      const rank =
        color === WHITE
          ? ((highestPawn[color] as Int8Array)[file] as number)
          : ((lowestPawn[color] as Int8Array)[file] as number);
      let passed = true;
      for (let f = file - 1; f <= file + 1; f++) {
        // the padded outer files hold "no pawn" values, so edges need no special case
        const blocked =
          color === WHITE ? (enemyHigh[f] as number) > rank : (enemyLow[f] as number) < rank;
        if (blocked) {
          passed = false;
          break;
        }
      }
      if (passed) bonus += sign * (PASSED_BONUS[color === WHITE ? rank : 7 - rank] as number);
    }
  }

  // Bare king against pieces: without a push towards the edge the engine would shuffle forever.
  const [whitePieces, blackPieces] = pieceMaterial as [number, number];
  if (blackPieces === 0 && whitePieces >= 300) bonus += mopUp(pos, WHITE);
  else if (whitePieces === 0 && blackPieces >= 300) bonus -= mopUp(pos, BLACK);

  const mgPhase = Math.min(phase, MAX_PHASE);
  const tapered = (mg * mgPhase + eg * (MAX_PHASE - mgPhase)) / MAX_PHASE;
  const score = Math.round(tapered) + bonus;
  return (pos.side === WHITE ? score : -score) + TEMPO;
}
