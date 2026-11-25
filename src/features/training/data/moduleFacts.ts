import type { UserFacts } from '@/core/training/achievements';
import type { SkillForgeDB } from '@/db/schema';
import { isWordLearned } from '@/features/english/domain/srs';
import { JAVA_PATHS } from '@/features/java/domain/content';
import { completedPaths } from '@/features/learning/domain/learning';
import { countPersonalBests } from '@/features/rubik/domain/stats';

/** The achievement facts that come from the training modules rather than from sessions. */
export type ModuleFacts = Pick<
  UserFacts,
  'vocabLearned' | 'javaPathsCompleted' | 'rubikPersonalBests'
>;

/** Tables read by {@link loadModuleFacts}; the engine includes them in its transaction. */
export const moduleFactTables = (db: SkillForgeDB) => [
  db.rubikSolves,
  db.vocabProgress,
  db.lessonProgress,
];

/** Reads the module facts. Runs inside the engine's transaction, so it only awaits Dexie. */
export async function loadModuleFacts(db: SkillForgeDB): Promise<ModuleFacts> {
  const [solves, vocab, lessonIds] = await Promise.all([
    db.rubikSolves.orderBy('createdAt').toArray(),
    db.vocabProgress.toArray(),
    db.lessonProgress.toCollection().primaryKeys(),
  ]);
  return {
    vocabLearned: vocab.filter(isWordLearned).length,
    javaPathsCompleted: completedPaths(JAVA_PATHS, new Set(lessonIds)),
    rubikPersonalBests: countPersonalBests(solves),
  };
}
