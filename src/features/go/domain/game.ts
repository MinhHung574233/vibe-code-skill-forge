import { BLACK, BOARD_SIZES, Board, WHITE, opponent, type BoardSize, type Color } from './board';
import { handicapPoints, maxHandicap } from './handicap';
import { areaScore, formatMargin, type AreaScore } from './scoring';

/**
 * Game flow on top of the board rules.
 *
 * - **Ko: positional superko.** A move is illegal if it recreates ANY earlier board position
 *   (stones only, regardless of who is to move), starting with the initial position. That covers
 *   the ordinary one-point ko (you cannot retake at once; after a ko threat the board differs, so
 *   you can) and also long cycles such as triple ko. Positions are compared by Zobrist key and
 *   confirmed cell by cell, so a hash collision cannot forbid a legal move.
 * - A pass is always legal. The game moves to scoring after two consecutive passes.
 * - Handicap: stones are placed first and White moves first (see handicap.ts).
 * - Resignation ends the game immediately; the other side wins.
 *
 * `GameState` is immutable; each state links to the previous one, which makes undo trivial and
 * lets superko walk the history without a separate structure.
 */

export interface GameConfig {
  size: BoardSize;
  komi: number;
  handicap: number;
}

/** `point` is `null` for a pass. Colours always alternate, so a record can omit them. */
export interface Move {
  color: Color;
  point: number | null;
}

export interface GameState {
  readonly config: GameConfig;
  readonly board: Board;
  readonly toPlay: Color;
  readonly moves: readonly Move[];
  /** Stones captured BY each colour (prisoners). Not used for area scoring. */
  readonly captures: { readonly black: number; readonly white: number };
  /** Point where the opponent may NOT retake straight away (simple ko), or -1. For the UI marker. */
  readonly ko: number;
  /** Consecutive passes at the end of the move list. */
  readonly passes: number;
  readonly resignedBy: Color | null;
  readonly prev: GameState | null;
}

export type GameStatus = 'playing' | 'scoring' | 'resigned';

export type MoveRejection = 'game-over' | 'occupied' | 'suicide' | 'superko' | 'off-board';
export type MoveResult = { ok: true; state: GameState } | { ok: false; reason: MoveRejection };

export function isValidConfig(config: GameConfig): boolean {
  return (
    BOARD_SIZES.includes(config.size) &&
    Number.isFinite(config.komi) &&
    config.komi >= -50 &&
    config.komi <= 50 &&
    Number.isInteger(config.handicap) &&
    config.handicap >= 0 &&
    config.handicap <= maxHandicap(config.size)
  );
}

export function newGame(config: GameConfig): GameState {
  if (!isValidConfig(config)) throw new RangeError('Invalid game settings.');
  const board = Board.empty(config.size);
  for (const p of handicapPoints(config.size, config.handicap)) board.setStone(p, BLACK);
  return {
    config,
    board,
    toPlay: config.handicap >= 2 ? WHITE : BLACK,
    moves: [],
    captures: { black: 0, white: 0 },
    ko: -1,
    passes: 0,
    resignedBy: null,
    prev: null,
  };
}

export function gameStatus(state: GameState): GameStatus {
  if (state.resignedBy !== null) return 'resigned';
  return state.passes >= 2 ? 'scoring' : 'playing';
}

/** Does `board` equal the position after any earlier move (or the starting position)? */
function repeatsEarlierPosition(state: GameState, board: Board): boolean {
  for (let s: GameState | null = state; s; s = s.prev) {
    if (s.board.equals(board)) return true;
  }
  return false;
}

/** Plays a stone for the side to move. Never throws: illegal moves come back as a reason. */
export function playStone(state: GameState, point: number): MoveResult {
  if (gameStatus(state) !== 'playing') return { ok: false, reason: 'game-over' };
  const board = state.board.clone();
  const result = board.play(point, state.toPlay);
  if (!result.ok) return { ok: false, reason: result.reason };
  if (repeatsEarlierPosition(state, board)) return { ok: false, reason: 'superko' };
  const gained = result.captured.length;
  return {
    ok: true,
    state: {
      ...state,
      board,
      toPlay: opponent(state.toPlay),
      moves: [...state.moves, { color: state.toPlay, point }],
      captures:
        state.toPlay === BLACK
          ? { black: state.captures.black + gained, white: state.captures.white }
          : { black: state.captures.black, white: state.captures.white + gained },
      ko: result.ko,
      passes: 0,
      prev: state,
    },
  };
}

export function passTurn(state: GameState): MoveResult {
  if (gameStatus(state) !== 'playing') return { ok: false, reason: 'game-over' };
  return {
    ok: true,
    state: {
      ...state,
      toPlay: opponent(state.toPlay),
      moves: [...state.moves, { color: state.toPlay, point: null }],
      ko: -1,
      passes: state.passes + 1,
      prev: state,
    },
  };
}

export function resign(state: GameState, color: Color): GameState {
  if (state.resignedBy !== null) return state;
  return { ...state, resignedBy: color, prev: state };
}

/** Takes back the last move (or a resignation). The starting position is returned unchanged. */
export function undoMove(state: GameState): GameState {
  return state.prev ?? state;
}

/**
 * Dead-stone disputes: leave the scoring phase and keep playing. The final pass is taken back, so
 * the player who passed last moves again.
 */
export function resumePlay(state: GameState): GameState {
  return gameStatus(state) === 'scoring' ? (state.prev ?? state) : state;
}

/** All points the side to move may play, superko included. */
export function legalPoints(state: GameState): number[] {
  const out: number[] = [];
  if (gameStatus(state) !== 'playing') return out;
  const { cells, topology } = state.board;
  for (let p = 0; p < topology.count; p++) {
    if (cells[p] === 0 && playStone(state, p).ok) out.push(p);
  }
  return out;
}

export interface GameResult {
  winner: Color | 'draw';
  /** Points; 0 when the game ended by resignation. */
  margin: number;
  by: 'score' | 'resign';
  /** `B+3.5`, `W+R`, `Draw`. */
  text: string;
  score: AreaScore | null;
}

/** Result of a finished game. `dead` is the set of stone points the players agreed are dead. */
export function gameResult(state: GameState, dead: ReadonlySet<number> = new Set()): GameResult {
  if (state.resignedBy !== null) {
    const winner = opponent(state.resignedBy);
    return {
      winner,
      margin: 0,
      by: 'resign',
      text: `${winner === BLACK ? 'B' : 'W'}+R`,
      score: null,
    };
  }
  const score = areaScore(state.board, state.config.komi, dead);
  return {
    winner: score.winner,
    margin: Math.abs(score.margin),
    by: 'score',
    text: formatMargin(score.winner, score.margin),
    score,
  };
}

// --- persistence ----------------------------------------------------------------------------

/** Everything needed to rebuild a game by replaying it. Colours are implied by alternation. */
export interface SerializedGame {
  config: GameConfig;
  /** Board indices; `null` is a pass. */
  moves: (number | null)[];
  resignedBy: Color | null;
}

export function serializeGame(state: GameState): SerializedGame {
  return {
    config: state.config,
    moves: state.moves.map((m) => m.point),
    resignedBy: state.resignedBy,
  };
}

/** Replays a record, returning `null` if any move is illegal (a corrupt or tampered draft). */
export function restoreGame(data: SerializedGame): GameState | null {
  if (!isValidConfig(data.config)) return null;
  let state = newGame(data.config);
  for (const point of data.moves) {
    const next = point === null ? passTurn(state) : playStone(state, point);
    if (!next.ok) return null;
    state = next.state;
  }
  return data.resignedBy === null ? state : resign(state, data.resignedBy);
}

/** Number of moves the human side has made (passes included), used for "worth recording" rules. */
export function movesBy(state: GameState, color: Color): number {
  return state.moves.filter((m) => m.color === color && m.point !== null).length;
}
