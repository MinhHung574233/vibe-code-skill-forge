/**
 * A 3×3 cube as 54 stickers in 3D. A sticker has a position (each coordinate −1, 0 or 1) and the
 * direction it faces; its colour is the face it started on. A turn rotates the stickers of some
 * layers about an axis, so every notation (faces, slices, wide turns, whole-cube rotations) is
 * one small table instead of hand-written permutation arrays that are easy to get wrong.
 */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
type Vec = readonly [number, number, number];

export interface Sticker {
  readonly pos: Vec;
  readonly normal: Vec;
  /** The face this sticker belongs to on a solved cube. */
  readonly color: Face;
}

export type Cube = readonly Sticker[];

const FACE_NORMALS: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

export function solvedCube(): Cube {
  const stickers: Sticker[] = [];
  for (const [face, normal] of Object.entries(FACE_NORMALS) as [Face, Vec][]) {
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const pos: Vec =
          normal[0] !== 0
            ? [normal[0], a, b]
            : normal[1] !== 0
              ? [a, normal[1], b]
              : [a, b, normal[2]];
        stickers.push({ pos, normal, color: face });
      }
    }
  }
  return stickers;
}

type Axis = 0 | 1 | 2;

interface TurnSpec {
  axis: Axis;
  /** Layers (coordinate values along the axis) that move. */
  layers: readonly number[];
  /** +1: a clockwise turn is +90° about the positive axis; −1: −90°. */
  sign: 1 | -1;
}

// Clockwise = as seen looking at that face. Slices follow the face noted in the standard
// notation (M follows L, E follows D, S follows F); wide turns move the face plus the slice.
const TURNS: Record<string, TurnSpec> = {
  U: { axis: 1, layers: [1], sign: -1 },
  D: { axis: 1, layers: [-1], sign: 1 },
  R: { axis: 0, layers: [1], sign: -1 },
  L: { axis: 0, layers: [-1], sign: 1 },
  F: { axis: 2, layers: [1], sign: -1 },
  B: { axis: 2, layers: [-1], sign: 1 },
  M: { axis: 0, layers: [0], sign: 1 },
  E: { axis: 1, layers: [0], sign: 1 },
  S: { axis: 2, layers: [0], sign: -1 },
  u: { axis: 1, layers: [0, 1], sign: -1 },
  d: { axis: 1, layers: [-1, 0], sign: 1 },
  r: { axis: 0, layers: [0, 1], sign: -1 },
  l: { axis: 0, layers: [-1, 0], sign: 1 },
  f: { axis: 2, layers: [0, 1], sign: -1 },
  b: { axis: 2, layers: [-1, 0], sign: 1 },
  x: { axis: 0, layers: [-1, 0, 1], sign: -1 },
  y: { axis: 1, layers: [-1, 0, 1], sign: -1 },
  z: { axis: 2, layers: [-1, 0, 1], sign: -1 },
};

/** Rotates by +90° about the positive axis. */
function rotate(v: Vec, axis: Axis): Vec {
  const [x, y, z] = v;
  if (axis === 0) return [x, -z, y];
  if (axis === 1) return [z, y, -x];
  return [-y, x, z];
}

function rotateTimes(v: Vec, axis: Axis, quarterTurns: number): Vec {
  let out = v;
  const n = ((quarterTurns % 4) + 4) % 4;
  for (let i = 0; i < n; i++) out = rotate(out, axis);
  return out;
}

export interface Move {
  name: string;
  /** Quarter turns clockwise: 1, 2 or −1 (counter-clockwise). */
  amount: 1 | 2 | -1;
}

const TOKEN = /^([UDLRFBMESudlrfbxyz])(2'|2|')?$/;

/** Parses `R U R' U2` style notation. Returns null if any token is not understood. */
export function parseAlgorithm(text: string): Move[] | null {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const moves: Move[] = [];
  for (const token of tokens) {
    const match = TOKEN.exec(token);
    if (!match) return null;
    const suffix = match[2];
    moves.push({
      name: match[1] as string,
      amount: suffix === "'" ? -1 : suffix === undefined ? 1 : 2,
    });
  }
  return moves;
}

export function applyMove(cube: Cube, move: Move): Cube {
  const spec = TURNS[move.name];
  if (!spec) throw new Error(`Unknown move ${move.name}`);
  const turns = spec.sign * move.amount;
  return cube.map((sticker) => {
    if (!spec.layers.includes(sticker.pos[spec.axis])) return sticker;
    return {
      ...sticker,
      pos: rotateTimes(sticker.pos, spec.axis, turns),
      normal: rotateTimes(sticker.normal, spec.axis, turns),
    };
  });
}

export function applyAlgorithm(cube: Cube, text: string): Cube {
  const moves = parseAlgorithm(text);
  if (!moves) throw new Error(`Cannot parse algorithm: ${text}`);
  return moves.reduce(applyMove, cube);
}

/** The inverse algorithm: reversed order, each turn undone. */
export function invertAlgorithm(text: string): string {
  const moves = parseAlgorithm(text);
  if (!moves) throw new Error(`Cannot parse algorithm: ${text}`);
  return [...moves]
    .reverse()
    .map((m) => `${m.name}${m.amount === 1 ? "'" : m.amount === -1 ? '' : '2'}`)
    .join(' ');
}

const same = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** Each face shows a single colour (the cube may be held in any orientation). */
export function isSolved(cube: Cube): boolean {
  const byFace = new Map<string, Face>();
  for (const s of cube) {
    const key = s.normal.join(',');
    const seen = byFace.get(key);
    if (seen === undefined) byFace.set(key, s.color);
    else if (seen !== s.color) return false;
  }
  return true;
}

const REORIENT: readonly string[] = (() => {
  const ups = ['', 'x', 'x2', "x'", 'z', "z'"];
  const out: string[] = [];
  for (const up of ups) for (const y of ['', 'y', 'y2', "y'"]) out.push(`${up} ${y}`.trim());
  return out;
})();

/**
 * Rotates the whole cube so each centre is back on its own face (undoing x/y/z/slice moves in an
 * algorithm). Returns null if no whole-cube rotation does (cannot happen for legal states).
 */
export function normalizeOrientation(cube: Cube): Cube | null {
  for (const rotation of REORIENT) {
    const candidate = rotation ? applyAlgorithm(cube, rotation) : cube;
    const centresHome = candidate
      .filter((s) => s.pos.filter((c) => c === 0).length === 2)
      .every((s) => same(s.normal, FACE_NORMALS[s.color]));
    if (centresHome) return candidate;
  }
  return null;
}

// ---- Flat net (scramble preview, case diagrams) -----------------------------------------------

/** How each face is laid out: which 3D direction is "right" and "down" when drawn. */
const FACE_AXES: Record<Face, { right: Vec; down: Vec }> = {
  U: { right: [1, 0, 0], down: [0, 0, 1] },
  F: { right: [1, 0, 0], down: [0, -1, 0] },
  R: { right: [0, 0, -1], down: [0, -1, 0] },
  B: { right: [-1, 0, 0], down: [0, -1, 0] },
  L: { right: [0, 0, 1], down: [0, -1, 0] },
  D: { right: [1, 0, 0], down: [0, 0, -1] },
};

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The 9 colours of one face, row by row from the top-left, as seen from outside the cube. */
export function faceColors(cube: Cube, face: Face): Face[] {
  const grid: Face[] = new Array<Face>(9).fill(face);
  const { right, down } = FACE_AXES[face];
  for (const s of cube) {
    if (!same(s.normal, FACE_NORMALS[face])) continue;
    const col = dot(s.pos, right) + 1;
    const row = dot(s.pos, down) + 1;
    grid[row * 3 + col] = s.color;
  }
  return grid;
}

/** Faces in net order; the layout is  . U .  /  L F R B  /  . D . */
export const NET_FACES: readonly Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];

export function applyScramble(text: string): Cube {
  return applyAlgorithm(solvedCube(), text);
}
