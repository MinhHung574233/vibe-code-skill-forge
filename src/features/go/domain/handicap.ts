import { pointOf, squareTopology, type BoardSize } from './board';

/** Even-game komi under area scoring (the usual Chinese-rules value is 7.5; 6.5 is the default here). */
export const DEFAULT_KOMI = 6.5;
/** With a handicap the extra stones already compensate Black, so komi falls to a tie-breaker. */
export const HANDICAP_KOMI = 0.5;

export const defaultKomi = (handicap: number): number =>
  handicap >= 2 ? HANDICAP_KOMI : DEFAULT_KOMI;

/**
 * Most handicap stones a board takes. 19x19 and 13x13 have the nine standard star points; 9x9 only
 * gets the four 3-3 corners plus the centre (five), because more stones would fill the board.
 */
export const maxHandicap = (size: BoardSize): number => (size === 9 ? 5 : 9);

/** The standard star-point lines (0-based): 3-3 on 9x9, 4-4 on 13x13 and 19x19. */
function starLines(size: BoardSize): { near: number; mid: number; far: number } {
  const near = size === 9 ? 2 : 3;
  return { near, mid: (size - 1) / 2, far: size - 1 - near };
}

/**
 * Fixed handicap points, in the order the stones are added (the usual convention: bottom-left and
 * top-right first, then bottom-right, top-left, centre, then the side points). A handicap of 0 or
 * 1 places nothing (one stone is just Black moving first). Throws for values the board cannot take.
 */
export function handicapPoints(size: BoardSize, handicap: number): number[] {
  if (!Number.isInteger(handicap) || handicap < 0 || handicap > maxHandicap(size)) {
    throw new RangeError(
      `A ${size}x${size} board takes 0 to ${maxHandicap(size)} handicap stones.`,
    );
  }
  if (handicap < 2) return [];
  const t = squareTopology(size);
  const { near, mid, far } = starLines(size);
  const at = (x: number, y: number) => pointOf(t, x, y);
  const corners = [at(near, far), at(far, near), at(far, far), at(near, near)];
  const centre = at(mid, mid);
  const sides = [at(near, mid), at(far, mid), at(mid, near), at(mid, far)];

  if (handicap <= 4) return corners.slice(0, handicap);
  if (handicap === 5) return [...corners, centre];
  if (handicap === 6) return [...corners, sides[0] as number, sides[1] as number];
  if (handicap === 7) return [...corners, sides[0] as number, sides[1] as number, centre];
  if (handicap === 8) return [...corners, ...sides];
  return [...corners, ...sides, centre];
}
