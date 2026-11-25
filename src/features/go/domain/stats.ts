import type { BoardSize } from './board';
import type { Level } from './ai';

/** A finished, recorded match as the stats screens see it (mapped from `GameRecordRow`). */
export interface GoRecord {
  id: string;
  level: Level;
  size: BoardSize;
  komi: number;
  handicap: number;
  /** The human's colour. */
  color: 'black' | 'white';
  result: 'win' | 'loss' | 'draw';
  /** Points from the human's side: positive when the human won on score. 0 after a resignation. */
  margin: number;
  by: 'score' | 'resign';
  startedAt: number;
  endedAt: number;
}

export interface Tally {
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export const emptyTally = (): Tally => ({ games: 0, wins: 0, losses: 0, draws: 0 });

export function tally(records: readonly GoRecord[]): Tally {
  const t = emptyTally();
  for (const r of records) {
    t.games++;
    if (r.result === 'win') t.wins++;
    else if (r.result === 'loss') t.losses++;
    else t.draws++;
  }
  return t;
}

export const LEVEL_ORDER: readonly Level[] = ['easy', 'medium', 'hard'];
export const SIZE_ORDER: readonly BoardSize[] = [9, 13, 19];

/** Win/loss per level and per board size, in the order the UI lists them. */
export function breakdown(records: readonly GoRecord[]): {
  byLevel: { level: Level; tally: Tally }[];
  bySize: { size: BoardSize; tally: Tally }[];
} {
  return {
    byLevel: LEVEL_ORDER.map((level) => ({
      level,
      tally: tally(records.filter((r) => r.level === level)),
    })),
    bySize: SIZE_ORDER.map((size) => ({
      size,
      tally: tally(records.filter((r) => r.size === size)),
    })),
  };
}

/** Result line for a recent-games row, e.g. `Won by 3.5` or `Lost by resignation`. */
export function describeResult(r: Pick<GoRecord, 'result' | 'margin' | 'by'>): string {
  if (r.result === 'draw') return 'Draw';
  const verb = r.result === 'win' ? 'Won' : 'Lost';
  if (r.by === 'resign') return `${verb} by resignation`;
  const amount = Math.abs(r.margin);
  return `${verb} by ${Number.isInteger(amount) ? amount : amount.toFixed(1)}`;
}
