import { z } from 'zod';
import type { SkillForgeDB } from '@/db/schema';

/**
 * A running timer survives reloads, an iOS app suspension and a crash: only the start instant and
 * the ids are stored, and the elapsed time is always computed from the wall clock. The session id
 * is fixed at start, so saving the same session twice is idempotent (XP is awarded once).
 */
const DRAFT_KEY = 'session';

const SessionDraftSchema = z.object({
  sessionId: z.string().min(1),
  startedAt: z.number().int().positive(),
  skillId: z.string().min(1).optional(),
});
export type SessionDraft = z.infer<typeof SessionDraftSchema>;

export async function loadSessionDraft(db: SkillForgeDB): Promise<SessionDraft | null> {
  const row = await db.drafts.get(DRAFT_KEY);
  const parsed = SessionDraftSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null; // missing or corrupt: treat as no running timer
}

export async function saveSessionDraft(
  db: SkillForgeDB,
  draft: SessionDraft,
  now: number,
): Promise<void> {
  await db.drafts.put({ key: DRAFT_KEY, value: draft, updatedAt: now });
}

export async function clearSessionDraft(db: SkillForgeDB): Promise<void> {
  await db.drafts.delete(DRAFT_KEY);
}
