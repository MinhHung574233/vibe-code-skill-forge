import { z } from 'zod';
import { toLocalDate } from '@/core/time/localDate';
import type { SkillForgeDB } from '@/db/schema';
import { LEVELS, isLevel } from '../domain/ai/levels';
import { isBoardSize } from '../domain/board';
import { replay } from '../domain/game';
import type { CaroDraft, Outcome } from '../domain/play';
import type { FinishedGame } from '../domain/stats';

/**
 * The game in progress lives in `drafts` under this key, so a reload, an iOS suspension or a
 * crash resumes it. The move list is the whole state; the board is rebuilt by replaying it.
 */
export const DRAFT_KEY = 'caro-game';

const DraftSchema = z.object({
  id: z.string().min(1),
  size: z.union([z.literal(15), z.literal(9)]),
  level: z.enum(LEVELS),
  humanStone: z.union([z.literal(1), z.literal(2)]),
  startedAt: z.number().int().positive(),
  moves: z.array(z.number().int().min(0)).max(225),
  undos: z.number().int().min(0),
});

/** The saved game, or null when there is none or it is corrupt (it then simply cannot be resumed). */
export async function loadDraft(db: SkillForgeDB): Promise<CaroDraft | null> {
  const row = await db.drafts.get(DRAFT_KEY);
  const parsed = DraftSchema.safeParse(row?.value);
  if (!parsed.success) return null;
  try {
    replay(parsed.data.size, parsed.data.moves); // every move must be legal and in order
  } catch {
    return null;
  }
  return parsed.data;
}

export async function saveDraft(db: SkillForgeDB, draft: CaroDraft, now: number): Promise<void> {
  await db.drafts.put({ key: DRAFT_KEY, value: draft, updatedAt: now });
}

export async function clearDraft(db: SkillForgeDB): Promise<void> {
  await db.drafts.delete(DRAFT_KEY);
}

export interface FinishedGameInput {
  id: string;
  level: string;
  outcome: Outcome;
  size: number;
  moves: number;
  /** Who moved first, from the person's point of view. */
  firstMover: 'player' | 'computer';
  undos: number;
  startedAt: number;
  endedAt: number;
}

/** Stores a finished match in `gameRecords`. Keyed by the game id, so storing twice is harmless. */
export async function saveFinishedGame(db: SkillForgeDB, game: FinishedGameInput): Promise<void> {
  await db.gameRecords.put({
    id: game.id,
    game: 'caro',
    level: game.level,
    result: game.outcome,
    details: {
      size: game.size,
      moves: game.moves,
      firstMover: game.firstMover,
      undos: game.undos,
    },
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    localDate: toLocalDate(game.endedAt),
  });
}

const DetailsSchema = z.object({
  size: z.number(),
  moves: z.number().int().min(0),
});

/** Every stored Caro game, newest first. Rows that do not look like ours are skipped, not fatal. */
export async function loadFinishedGames(db: SkillForgeDB): Promise<FinishedGame[]> {
  const rows = await db.gameRecords.where('game').equals('caro').toArray();
  const games: FinishedGame[] = [];
  for (const row of rows) {
    const details = DetailsSchema.safeParse(row.details);
    if (!isLevel(row.level) || !details.success || !isBoardSize(details.data.size)) continue;
    games.push({
      id: row.id,
      level: row.level,
      outcome: row.result,
      endedAt: row.endedAt,
      size: details.data.size,
      moves: details.data.moves,
    });
  }
  return games.sort((a, b) => b.endedAt - a.endedAt);
}
