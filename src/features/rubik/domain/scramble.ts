const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
const SUFFIXES = ['', "'", '2'] as const;
/** Opposite faces share an axis; turning them in either order gives the same cube. */
const AXIS: Record<string, number> = { U: 0, D: 0, L: 1, R: 1, F: 2, B: 2 };

export const SCRAMBLE_LENGTH = 20;

/** Small seedable generator (mulberry32) so scrambles are reproducible in tests. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A random-move 3×3 scramble: 20 turns where no face repeats back to back and no axis is used
 * three times in a row (so `R L R` cannot collapse into fewer turns). This is a random-move
 * scramble, not WCA's random-state scramble, which needs a solver; for practice timing the
 * difference is negligible.
 */
export function generateScramble(
  random: () => number = Math.random,
  length: number = SCRAMBLE_LENGTH,
): string {
  const moves: string[] = [];
  let last = '';
  let beforeLast = '';
  while (moves.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)] as string;
    if (face === last) continue;
    if (beforeLast && AXIS[face] === AXIS[last] && AXIS[face] === AXIS[beforeLast]) continue;
    const suffix = SUFFIXES[Math.floor(random() * SUFFIXES.length)] as string;
    moves.push(face + suffix);
    beforeLast = last;
    last = face;
  }
  return moves.join(' ');
}
