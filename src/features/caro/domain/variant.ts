import type { BoardSize } from './board';
import type { ObstacleCount } from './obstacles';
import type { CaroRule } from './rules';

export type PresetId = 'classic' | 'vietnamese' | 'tournament';

export interface Preset {
  id: PresetId;
  size: BoardSize;
  rule: CaroRule;
  obstacleCount: ObstacleCount;
}

/** The big choices on the setup screen. */
export const PRESETS: readonly Preset[] = [
  { id: 'classic', size: 15, rule: 'freestyle', obstacleCount: 0 },
  { id: 'vietnamese', size: 15, rule: 'blocked', obstacleCount: 0 },
  { id: 'tournament', size: 19, rule: 'blocked', obstacleCount: 3 },
];

/** The preset a (size, rule, obstacle count) triple equals exactly, if any. */
export function matchPreset(size: number, rule: CaroRule, obstacleCount: number): PresetId | null {
  return (
    PRESETS.find((p) => p.size === size && p.rule === rule && p.obstacleCount === obstacleCount)
      ?.id ?? null
  );
}
