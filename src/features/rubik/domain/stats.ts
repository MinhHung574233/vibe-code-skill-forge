export type Penalty = 'none' | 'plus2' | 'dnf';

export interface Solve {
  timeMs: number;
  penalty: Penalty;
}

/** Time counted for a solve: +2 adds two seconds; a DNF has no time (null). */
export function effectiveMs(solve: Solve): number | null {
  if (solve.penalty === 'dnf') return null;
  return solve.penalty === 'plus2' ? solve.timeMs + 2000 : solve.timeMs;
}

/** An average result: milliseconds, or DNF when too many solves did not finish. */
export type AverageResult = number | 'DNF';

/**
 * Trimmed mean of the last `n` solves, as in WCA rules: drop the single best and single worst
 * solve and average the rest. A DNF counts as the worst; two or more DNFs make the average a DNF.
 * Returns null while there are fewer than `n` solves.
 */
export function averageOf(solves: readonly Solve[], n: number): AverageResult | null {
  if (solves.length < n || n < 3) return null;
  const window = solves.slice(-n).map(effectiveMs);
  const dnfs = window.filter((t) => t === null).length;
  if (dnfs >= 2) return 'DNF';
  const times = window.filter((t): t is number => t !== null).sort((a, b) => a - b);
  // One DNF is the worst solve; otherwise drop the slowest finisher.
  const kept = dnfs === 1 ? times.slice(1) : times.slice(1, -1);
  return kept.reduce((sum, t) => sum + t, 0) / kept.length;
}

/** The best average of `n` over every window of consecutive solves. */
export function bestAverageOf(solves: readonly Solve[], n: number): number | null {
  let best: number | null = null;
  for (let end = n; end <= solves.length; end++) {
    const avg = averageOf(solves.slice(0, end), n);
    if (typeof avg === 'number' && (best === null || avg < best)) best = avg;
  }
  return best;
}

export function bestSingle(solves: readonly Solve[]): number | null {
  let best: number | null = null;
  for (const solve of solves) {
    const t = effectiveMs(solve);
    if (t !== null && (best === null || t < best)) best = t;
  }
  return best;
}

export function meanOf(solves: readonly Solve[]): number | null {
  const times = solves.map(effectiveMs).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return times.reduce((sum, t) => sum + t, 0) / times.length;
}

/**
 * How many solves beat every earlier finished solve. The first solve is the baseline, not a
 * personal best: there has to be something to beat.
 */
export function countPersonalBests(solvesInOrder: readonly Solve[]): number {
  let best: number | null = null;
  let count = 0;
  for (const solve of solvesInOrder) {
    const t = effectiveMs(solve);
    if (t === null) continue;
    if (best !== null && t < best) count++;
    if (best === null || t < best) best = t;
  }
  return count;
}

/** `12.34`, or `1:02.34` from one minute; truncated (not rounded) to hundredths as on a timer. */
export function formatSolveTime(ms: number): string {
  const centis = Math.floor(ms / 10);
  const minutes = Math.floor(centis / 6000);
  const seconds = Math.floor((centis % 6000) / 100);
  const hundredths = centis % 100;
  const frac = String(hundredths).padStart(2, '0');
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}.${frac}`
    : `${seconds}.${frac}`;
}

/** A solve as shown in lists: `DNF`, `12.34+` for a +2, or the plain time. */
export function formatSolve(solve: Solve): string {
  if (solve.penalty === 'dnf') return 'DNF';
  const t = effectiveMs(solve) ?? 0;
  return formatSolveTime(t) + (solve.penalty === 'plus2' ? '+' : '');
}

export function formatAverage(result: AverageResult | null): string {
  if (result === null) return '–';
  return result === 'DNF' ? 'DNF' : formatSolveTime(result);
}
