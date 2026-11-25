/**
 * Level curve. Level 1 starts at 0 XP; reaching level L needs round(100 · (L − 1)^1.5) XP in
 * total (L2 = 100, L3 = 283, L4 = 520, L5 = 800 …). The level is derived from total XP and is
 * never stored, so changing the curve cannot corrupt data (TECHNICAL_DECISIONS D-10).
 */
export const MAX_LEVEL = 200;

export function xpToReach(level: number): number {
  if (!Number.isFinite(level) || level <= 1) return 0;
  return Math.round(100 * Math.pow(Math.min(level, MAX_LEVEL) - 1, 1.5));
}

export function levelForXp(totalXp: number): number {
  const xp = Math.max(0, Number.isFinite(totalXp) ? totalXp : 0);
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReach(level + 1)) level += 1;
  return level;
}

export interface LevelProgress {
  level: number;
  totalXp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP the current level spans (distance to the next level). */
  xpForNextLevel: number;
  /** 0..1 progress to the next level. */
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(Number.isFinite(totalXp) ? totalXp : 0));
  const level = levelForXp(xp);
  const floor = xpToReach(level);
  if (level >= MAX_LEVEL) {
    return { level, totalXp: xp, xpIntoLevel: xp - floor, xpForNextLevel: 0, fraction: 1 };
  }
  const span = xpToReach(level + 1) - floor;
  const into = xp - floor;
  return { level, totalXp: xp, xpIntoLevel: into, xpForNextLevel: span, fraction: into / span };
}
