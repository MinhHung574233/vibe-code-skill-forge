import { applyAlgorithm, faceColors, invertAlgorithm, solvedCube, type Face } from './cube';

export type AlgorithmSet = 'oll' | 'pll';

export interface AlgorithmDef {
  id: string;
  set: AlgorithmSet;
  name: string;
  /** Moves in standard notation, for a yellow-top cube held with green in front. */
  moves: string;
  /** What to look for to recognise the case. */
  recognise: string;
}

/**
 * The 2-look OLL and full PLL sets: the algorithms a CFOP solver needs for the last layer.
 * Every entry is checked in tests by simulating the cube (see algorithms.test.ts), so a typo in
 * a move cannot ship as a "learned" algorithm that does not work.
 */
export const ALGORITHMS: readonly AlgorithmDef[] = [
  // ---- 2-look OLL: edges ----
  {
    id: 'oll-line',
    set: 'oll',
    name: 'Line (two edges, opposite)',
    moves: "F R U R' U' F'",
    recognise: 'Two yellow edges form a horizontal line. Hold the line left-to-right.',
  },
  {
    id: 'oll-l-shape',
    set: 'oll',
    name: 'L shape (two edges, adjacent)',
    moves: "f R U R' U' f'",
    recognise: 'Two yellow edges form an L. Hold the L at the back-left.',
  },
  {
    id: 'oll-dot',
    set: 'oll',
    name: 'Dot (no edges)',
    moves: "F R U R' U' F' f R U R' U' f'",
    recognise: 'Only the centre is yellow. Do the line algorithm and the L algorithm back to back.',
  },
  // ---- 2-look OLL: corners ----
  {
    id: 'oll-sune',
    set: 'oll',
    name: 'Sune',
    moves: "R U R' U R U2 R'",
    recognise: 'One corner twisted up; a yellow sticker faces the front on the lower left.',
  },
  {
    id: 'oll-antisune',
    set: 'oll',
    name: 'Anti-Sune',
    moves: "R U2 R' U' R U' R'",
    recognise: 'The mirror of Sune: one corner up, a yellow sticker faces the front on the right.',
  },
  {
    id: 'oll-h',
    set: 'oll',
    name: 'H (all four corners twisted)',
    moves: "R U R' U R U' R' U R U2 R'",
    recognise: 'No yellow on top corners; yellow stickers face the front and back as pairs.',
  },
  {
    id: 'oll-pi',
    set: 'oll',
    name: 'Pi',
    moves: "R U2 R2 U' R2 U' R2 U2 R",
    recognise:
      'No yellow on top corners; yellow on the left and right sides forms a pair, plus a single.',
  },
  {
    id: 'oll-u',
    set: 'oll',
    name: 'U (headlights)',
    moves: "R2 D R' U2 R D' R' U2 R'",
    recognise: 'Two yellow headlights on the front, no yellow on the back corners.',
  },
  {
    id: 'oll-t',
    set: 'oll',
    name: 'T',
    moves: "r U R' U' r' F R F'",
    recognise: 'Two yellow corners on the right side with a yellow sticker facing the front.',
  },
  {
    id: 'oll-l',
    set: 'oll',
    name: 'L',
    moves: "F R' F' r U R U' r'",
    recognise: 'Two yellow corners diagonal, a yellow sticker facing the front at the lower right.',
  },
  // ---- PLL: edges only ----
  {
    id: 'pll-ua',
    set: 'pll',
    name: 'Ua perm',
    moves: "R U' R U R U R U' R' U' R2",
    recognise: 'Corners solved; three edges cycle, the solved edge is at the back.',
  },
  {
    id: 'pll-ub',
    set: 'pll',
    name: 'Ub perm',
    moves: "R2 U R U R' U' R' U' R' U R'",
    recognise: 'Corners solved; three edges cycle the other way, the solved edge is at the back.',
  },
  {
    id: 'pll-h',
    set: 'pll',
    name: 'H perm',
    moves: 'M2 U M2 U2 M2 U M2',
    recognise: 'Corners solved; the opposite edges are swapped in both pairs.',
  },
  {
    id: 'pll-z',
    set: 'pll',
    name: 'Z perm',
    moves: "M' U M2 U M2 U M' U2 M2",
    recognise: 'Corners solved; two adjacent edge pairs are swapped.',
  },
  // ---- PLL: corners only ----
  {
    id: 'pll-aa',
    set: 'pll',
    name: 'Aa perm',
    moves: "x R' U R' D2 R U' R' D2 R2 x'",
    recognise: 'Edges fit the sides; three corners cycle. Headlights on the left side.',
  },
  {
    id: 'pll-ab',
    set: 'pll',
    name: 'Ab perm',
    moves: "x R2 D2 R U R' D2 R U' R x'",
    recognise: 'Edges fit the sides; three corners cycle the other way. Headlights on the left.',
  },
  {
    id: 'pll-e',
    set: 'pll',
    name: 'E perm',
    moves: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    recognise: 'No headlights; all four corners need to swap diagonally.',
  },
  // ---- PLL: swap two corners and two edges ----
  {
    id: 'pll-t',
    set: 'pll',
    name: 'T perm',
    moves: "R U R' U' R' F R2 U' R' U' R U R' F'",
    recognise: 'Headlights on the left, and a solved block on the right.',
  },
  {
    id: 'pll-ja',
    set: 'pll',
    name: 'Ja perm',
    moves: "R' U L' U2 R U' R' U2 R L",
    recognise: 'Headlights on the front; swap the corners next to them.',
  },
  {
    id: 'pll-jb',
    set: 'pll',
    name: 'Jb perm',
    moves: "R U R' F' R U R' U' R' F R2 U' R'",
    recognise: 'Headlights on the back; swap the corners next to them.',
  },
  {
    id: 'pll-f',
    set: 'pll',
    name: 'F perm',
    moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    recognise: 'Headlights on the right, and the colour on the left matches in the front.',
  },
  {
    id: 'pll-y',
    set: 'pll',
    name: 'Y perm',
    moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    recognise: 'No headlights; two diagonal corners swap.',
  },
  {
    id: 'pll-ra',
    set: 'pll',
    name: 'Ra perm',
    moves: "R U' R' U' R U R D R' U' R D' R' U2 R'",
    recognise: 'Headlights on the left; a three-colour block on the front.',
  },
  {
    id: 'pll-rb',
    set: 'pll',
    name: 'Rb perm',
    moves: "R' U2 R U2 R' F R U R' U' R' F' R2",
    recognise: 'Headlights on the right; a block on the left.',
  },
  {
    id: 'pll-v',
    set: 'pll',
    name: 'V perm',
    moves: "R' U R' U' y R' F' R2 U' R' U R' F R F",
    recognise: 'No headlights; diagonal corners and two edges swap.',
  },
  {
    id: 'pll-na',
    set: 'pll',
    name: 'Na perm',
    moves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    recognise: 'No headlights; two diagonal pairs swap.',
  },
  {
    id: 'pll-nb',
    set: 'pll',
    name: 'Nb perm',
    moves: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    recognise: 'No headlights; two diagonal pairs swap, the mirror of Na.',
  },
  // ---- PLL: G perms (corners and edges) ----
  {
    id: 'pll-ga',
    set: 'pll',
    name: 'Ga perm',
    moves: "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    recognise: 'No headlights, a solved corner pair and a 3-colour bar on the left.',
  },
  {
    id: 'pll-gb',
    set: 'pll',
    name: 'Gb perm',
    moves: "R' U' R U D' R2 U R' U R U' R U' R2 D",
    recognise: 'No headlights, a solved corner pair and a 3-colour bar on the front.',
  },
  {
    id: 'pll-gc',
    set: 'pll',
    name: 'Gc perm',
    moves: "R2 U' R U' R U R' U R2 D' U R U' R' D",
    recognise: 'No headlights, a solved corner pair and a 3-colour bar on the back.',
  },
  {
    id: 'pll-gd',
    set: 'pll',
    name: 'Gd perm',
    moves: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    recognise: 'No headlights, a solved corner pair and a 3-colour bar on the right.',
  },
];

export function algorithmById(id: string): AlgorithmDef | undefined {
  return ALGORITHMS.find((a) => a.id === id);
}

export function algorithmsInSet(set: AlgorithmSet): AlgorithmDef[] {
  return ALGORITHMS.filter((a) => a.set === set);
}

/** Colours of the last-layer "case": top face plus the top row of each side (3 stickers each). */
export interface CaseDiagram {
  top: Face[];
  back: Face[];
  right: Face[];
  front: Face[];
  left: Face[];
}

/**
 * The case this algorithm solves, drawn by simulation: start solved, undo the algorithm, and
 * read the last layer. Applying the algorithm to that picture restores the solved cube.
 */
export function caseDiagram(moves: string): CaseDiagram {
  const cube = applyAlgorithm(solvedCube(), invertAlgorithm(moves));
  const topRow = (face: Face) => faceColors(cube, face).slice(0, 3);
  return {
    top: faceColors(cube, 'U'),
    back: topRow('B').reverse(),
    right: topRow('R').reverse(),
    front: topRow('F'),
    left: topRow('L').reverse(),
  };
}
