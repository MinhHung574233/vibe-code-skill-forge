import type { UserFacts } from '@/core/training/achievements';
import type { SkillForgeDB } from '@/db/schema';
import { isWordLearned } from '@/features/english/domain/srs';
import { countPersonalBests } from '@/features/rubik/domain/stats';

/** The achievement facts that come from the training modules rather than from sessions. */
export type ModuleFacts = Pick<
  UserFacts,
  'vocabLearned' | 'javaPathsCompleted' | 'rubikPersonalBests'
>;

/** Tables read by {@link loadModuleFacts}; the engine includes them in its transaction. */
export const moduleFactTables = (db: SkillForgeDB) => [db.rubikSolves, db.vocabProgress];

/** Reads the module facts. Runs inside the engine's transaction, so it only awaits Dexie. */
export async function loadModuleFacts(db: SkillForgeDB): Promise<ModuleFacts> {
  const [solves, vocab] = await Promise.all([
    db.rubikSolves.orderBy('createdAt').toArray(),
    db.vocabProgress.toArray(),
  ]);
  return {
    vocabLearned: vocab.filter(isWordLearned).length,
    javaPathsCompleted: 0,
    rubikPersonalBests: countPersonalBests(solves),
  };
}
