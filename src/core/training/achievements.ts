/**
 * Achievements are rules over persisted facts, never over UI events (PRD §6). The engine loads a
 * `UserFacts` snapshot inside the same transaction that records a session, unlocks whatever now
 * qualifies, and stores the facts that satisfied the rule as evidence.
 */
export interface UserFacts {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  /** Vocabulary words learned. Always 0 until the English module exists (M3.2). */
  vocabLearned: number;
  /** Java learning paths fully completed. Always 0 until the Java module exists (M3.3). */
  javaPathsCompleted: number;
  /** Rubik personal bests set. Always 0 until the Rubik module exists (M3.1). */
  rubikPersonalBests: number;
}

export const EMPTY_FACTS: UserFacts = {
  totalSessions: 0,
  totalMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  vocabLearned: 0,
  javaPathsCompleted: 0,
  rubikPersonalBests: 0,
};

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Icon name from the UI icon set (checked by a test in the UI layer). */
  icon: string;
  /** Current / target for a progress bar. */
  progress: (facts: UserFacts) => { current: number; target: number };
  /** Set when the achievement depends on a module that is not built yet. */
  needsModule?: string;
}

const cap = (current: number, target: number) => ({ current: Math.min(current, target), target });

/** The six achievements from the PRD plus three that can already be earned today. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first_session',
    title: 'First session',
    description: 'Finish your first training session.',
    icon: 'flame',
    progress: (f) => cap(f.totalSessions, 1),
  },
  {
    id: 'ten_sessions',
    title: 'Getting serious',
    description: 'Finish 10 training sessions.',
    icon: 'activity',
    progress: (f) => cap(f.totalSessions, 10),
  },
  {
    id: 'hour_total',
    title: 'First hour',
    description: 'Train for 60 minutes in total.',
    icon: 'clock',
    progress: (f) => cap(Math.floor(f.totalMinutes), 60),
  },
  {
    id: 'streak_7',
    title: '7-day streak',
    description: 'Train 7 days in a row.',
    icon: 'bolt',
    progress: (f) => cap(f.longestStreak, 7),
  },
  {
    id: 'streak_30',
    title: '30-day streak',
    description: 'Train 30 days in a row.',
    icon: 'star',
    progress: (f) => cap(f.longestStreak, 30),
  },
  {
    id: 'vocab_100',
    title: '100 words',
    description: 'Learn your first 100 vocabulary words.',
    icon: 'book',
    progress: (f) => cap(f.vocabLearned, 100),
    needsModule: 'English',
  },
  {
    id: 'java_path',
    title: 'Java path complete',
    description: 'Complete your first Java learning path.',
    icon: 'code',
    progress: (f) => cap(f.javaPathsCompleted, 1),
    needsModule: 'Java & Spring Boot',
  },
  {
    id: 'rubik_pb',
    title: 'Personal best',
    description: 'Set a new personal best on the cube.',
    icon: 'cube',
    progress: (f) => cap(f.rubikPersonalBests, 1),
    needsModule: 'Rubik’s Cube',
  },
];

export function isUnlocked(def: AchievementDef, facts: UserFacts): boolean {
  const { current, target } = def.progress(facts);
  return current >= target;
}

/** Definitions the facts now satisfy that are not already unlocked, in catalogue order. */
export function newlyUnlocked(
  facts: UserFacts,
  alreadyUnlocked: ReadonlySet<string>,
  defs: readonly AchievementDef[] = ACHIEVEMENTS,
): AchievementDef[] {
  return defs.filter((def) => !alreadyUnlocked.has(def.id) && isUnlocked(def, facts));
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
