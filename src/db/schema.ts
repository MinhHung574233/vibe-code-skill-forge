import Dexie, { type DexieOptions, type Table, type Transaction } from 'dexie';
import type {
  AchievementRow,
  AlgorithmProgressRow,
  CompletionRow,
  DailySummaryRow,
  DraftRow,
  GameRecordRow,
  LessonProgressRow,
  PuzzleProgressRow,
  RatingRow,
  RubikSolveRow,
  VocabProgressRow,
  SessionRow,
  SettingRow,
  SkillGoalRow,
  SkillRow,
  XpLedgerRow,
  XpRuleRow,
} from './rows';

export const DB_NAME = 'skillforge';

/**
 * One entry per shipped schema version. APPEND-ONLY (DATABASE.md §2): never edit or remove a
 * shipped entry. Only list stores that changed in that version (Dexie carries the rest
 * forward); use `null` to drop a store only after an earlier upgrade has migrated its data.
 */
export interface SchemaVersion {
  version: number;
  stores: Record<string, string | null>;
  upgrade?: (tx: Transaction) => void | PromiseLike<void>;
}

export const SCHEMA_VERSIONS: readonly SchemaVersion[] = [
  {
    version: 1,
    stores: {
      settings: 'key',
      skills: 'id, moduleId, category, isArchived, updatedAt',
      skillGoals: 'id, skillId, metric',
      drafts: 'key',
    },
  },
  {
    // Training engine (DATABASE.md §3 v2). New stores only, so no data upgrade is needed.
    version: 2,
    stores: {
      sessions: 'id, moduleId, skillId, localDate, startedAt, [moduleId+startedAt]',
      // PRIMARY KEY = idempotency anchor: one row per rewardable/completable thing, ever.
      completions: 'activityKey, moduleId, localDate',
      xpRules: 'activityType',
      xpLedger: 'id, &activityKey, localDate, moduleId',
      dailySummary: 'localDate',
      achievements: 'achievementId',
    },
  },
  {
    // Training modules (Phase 3). New stores only, so no data upgrade is needed.
    version: 3,
    stores: {
      rubikSolves: 'id, createdAt, localDate',
      algorithmProgress: 'algId',
      vocabProgress: 'wordId, dueAt, state',
      lessonProgress: 'lessonId, pathId',
      gameRecords: 'id, game, endedAt',
      puzzleProgress: 'puzzleId, game',
      ratings: 'key',
    },
  },
];

export function latestVersion(versions: readonly SchemaVersion[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0);
}

export const CURRENT_SCHEMA_VERSION = latestVersion(SCHEMA_VERSIONS);

export interface SchemaOptions {
  /** Declare only versions <= upTo. Used to recreate an older schema when restoring a snapshot. */
  upTo?: number;
}

export class SkillForgeDB extends Dexie {
  declare settings: Table<SettingRow, string>;
  declare skills: Table<SkillRow, string>;
  declare skillGoals: Table<SkillGoalRow, string>;
  declare drafts: Table<DraftRow, string>;
  declare sessions: Table<SessionRow, string>;
  declare completions: Table<CompletionRow, string>;
  declare xpRules: Table<XpRuleRow, string>;
  declare xpLedger: Table<XpLedgerRow, string>;
  declare dailySummary: Table<DailySummaryRow, string>;
  declare achievements: Table<AchievementRow, string>;
  declare rubikSolves: Table<RubikSolveRow, string>;
  declare algorithmProgress: Table<AlgorithmProgressRow, string>;
  declare vocabProgress: Table<VocabProgressRow, string>;
  declare lessonProgress: Table<LessonProgressRow, string>;
  declare gameRecords: Table<GameRecordRow, string>;
  declare puzzleProgress: Table<PuzzleProgressRow, string>;
  declare ratings: Table<RatingRow, string>;

  constructor(
    name: string = DB_NAME,
    versions: readonly SchemaVersion[] = SCHEMA_VERSIONS,
    options: SchemaOptions & Pick<DexieOptions, 'indexedDB' | 'IDBKeyRange'> = {},
  ) {
    const { upTo, ...dexieOptions } = options;
    super(name, dexieOptions);
    const ordered = [...versions]
      .filter((v) => upTo === undefined || v.version <= upTo)
      .sort((a, b) => a.version - b.version);
    for (const v of ordered) {
      const declared = this.version(v.version).stores(v.stores);
      if (v.upgrade) declared.upgrade(v.upgrade);
    }
  }
}
