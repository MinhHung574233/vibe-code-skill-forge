import { z } from 'zod';
import type { Clock } from '@/core/time/clock';
import { toLocalDate } from '@/core/time/localDate';
import type { GameRecordRow, PuzzleProgressRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import type { GoRecord } from '../domain/stats';

const DetailsSchema = z.object({
  size: z.union([z.literal(9), z.literal(13), z.literal(19)]),
  komi: z.number(),
  handicap: z.number().int(),
  color: z.enum(['black', 'white']),
  margin: z.number(),
  by: z.enum(['score', 'resign']),
  moves: z.array(z.number().int().nullable()),
});

const LevelSchema = z.enum(['easy', 'medium', 'hard']);

export interface FinishedGame extends GoRecord {
  /** Full move list (`null` = pass) so a game can be replayed later. */
  moves: (number | null)[];
}

function toRow(game: FinishedGame): GameRecordRow {
  return {
    id: game.id,
    game: 'go',
    level: game.level,
    result: game.result,
    details: {
      size: game.size,
      komi: game.komi,
      handicap: game.handicap,
      color: game.color,
      margin: game.margin,
      by: game.by,
      moves: game.moves,
    },
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    localDate: toLocalDate(game.endedAt),
  };
}

/** Rows that do not parse (older or hand-edited data) are skipped, never fatal. */
function fromRow(row: GameRecordRow): GoRecord | null {
  const details = DetailsSchema.safeParse(row.details);
  const level = LevelSchema.safeParse(row.level);
  if (!details.success || !level.success) return null;
  const d = details.data;
  return {
    id: row.id,
    level: level.data,
    size: d.size,
    komi: d.komi,
    handicap: d.handicap,
    color: d.color,
    result: row.result,
    margin: d.margin,
    by: d.by,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
  };
}

export class DexieGoRepository {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
  ) {}

  /** Idempotent per game id: saving the same finished game twice keeps one row. */
  async saveGame(game: FinishedGame): Promise<void> {
    await this.db.gameRecords.put(toRow(game));
  }

  /** Newest first. */
  async games(limit?: number): Promise<GoRecord[]> {
    const rows = await this.db.gameRecords.where('game').equals('go').sortBy('endedAt');
    return rows
      .reverse()
      .flatMap((row) => {
        const record = fromRow(row);
        return record ? [record] : [];
      })
      .slice(0, limit);
  }

  async puzzleProgress(): Promise<Map<string, PuzzleProgressRow>> {
    const rows = await this.db.puzzleProgress.where('game').equals('go').toArray();
    return new Map(rows.map((r) => [r.puzzleId, r]));
  }

  /**
   * Notes one attempt at a problem; `solved` marks it solved (and it stays solved). Returns whether
   * this attempt is the FIRST solve, which is what earns XP.
   */
  async recordPuzzleAttempt(puzzleId: string, solved: boolean): Promise<{ firstSolve: boolean }> {
    const now = this.clock.now();
    return this.db.transaction('rw', this.db.puzzleProgress, async () => {
      const before = await this.db.puzzleProgress.get(puzzleId);
      const wasSolved = before?.solved === 1;
      const solvedAt = wasSolved ? (before?.solvedAt ?? now) : solved ? now : undefined;
      const row: PuzzleProgressRow = {
        puzzleId,
        game: 'go',
        solved: wasSolved || solved ? 1 : 0,
        attempts: (before?.attempts ?? 0) + 1,
        lastAttemptAt: now,
        ...(solvedAt !== undefined ? { solvedAt } : {}),
      };
      await this.db.puzzleProgress.put(row);
      return { firstSolve: solved && !wasSolved };
    });
  }
}
