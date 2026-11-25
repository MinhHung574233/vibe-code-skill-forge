import { z } from 'zod';
import type { SkillForgeDB } from '@/db/schema';
import { BLACK, WHITE } from '../domain/board';
import { isValidConfig, type SerializedGame } from '../domain/game';

/** The in-progress match, stored under this `drafts` key so a reload or app suspension resumes it. */
export const GO_DRAFT_KEY = 'go-game';

export const GoDraftSchema = z.object({
  gameId: z.string().min(1),
  startedAt: z.number().int().positive(),
  level: z.enum(['easy', 'medium', 'hard']),
  humanColor: z.enum(['black', 'white']),
  config: z.object({
    size: z.union([z.literal(9), z.literal(13), z.literal(19)]),
    komi: z.number().min(-50).max(50),
    handicap: z.number().int().min(0).max(9),
  }),
  /** Board indices; `null` is a pass. */
  moves: z.array(z.number().int().min(0).max(360).nullable()).max(2000),
  resignedBy: z.enum(['black', 'white']).nullable(),
  /** Seed for the AI's choices, fixed per game so a resumed game is not a different opponent. */
  seed: z.number().int().min(0),
});
export type GoDraft = z.infer<typeof GoDraftSchema>;

export async function loadDraft(db: SkillForgeDB): Promise<GoDraft | null> {
  const row = await db.drafts.get(GO_DRAFT_KEY);
  const parsed = GoDraftSchema.safeParse(row?.value);
  // a corrupt draft or an impossible setting counts as "no game in progress"
  if (!parsed.success || !isValidConfig(parsed.data.config)) return null;
  return parsed.data;
}

export async function saveDraft(db: SkillForgeDB, draft: GoDraft, now: number): Promise<void> {
  await db.drafts.put({ key: GO_DRAFT_KEY, value: draft, updatedAt: now });
}

export async function clearDraft(db: SkillForgeDB): Promise<void> {
  await db.drafts.delete(GO_DRAFT_KEY);
}

export function draftToSerialized(draft: GoDraft): SerializedGame {
  return {
    config: draft.config,
    moves: draft.moves,
    resignedBy: draft.resignedBy === null ? null : draft.resignedBy === 'black' ? BLACK : WHITE,
  };
}
