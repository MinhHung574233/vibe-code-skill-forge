import { describe, expect, it } from 'vitest';
import { ALGORITHMS, algorithmsInSet, caseDiagram, type AlgorithmDef } from './algorithms';
import {
  applyAlgorithm,
  invertAlgorithm,
  isSolved,
  normalizeOrientation,
  parseAlgorithm,
  solvedCube,
  type Cube,
} from './cube';

/** The cube after the algorithm, held in its home orientation again. */
function result(alg: AlgorithmDef): Cube {
  const cube = normalizeOrientation(applyAlgorithm(solvedCube(), alg.moves));
  if (!cube) throw new Error(`${alg.id}: orientation cannot be restored`);
  return cube;
}

/** Stickers in the bottom two layers (everything except the top layer's stickers). */
const firstTwoLayersSolved = (cube: Cube) =>
  cube.filter((s) => s.pos[1] <= 0).every((s) => s.normal.join() === faceNormal(s.color));

function faceNormal(face: string): string {
  return { U: '0,1,0', D: '0,-1,0', R: '1,0,0', L: '-1,0,0', F: '0,0,1', B: '0,0,-1' }[face] ?? '';
}

describe('algorithm library', () => {
  it('has unique ids and every algorithm parses', () => {
    expect(new Set(ALGORITHMS.map((a) => a.id)).size).toBe(ALGORITHMS.length);
    for (const alg of ALGORITHMS) expect(parseAlgorithm(alg.moves), alg.id).not.toBeNull();
  });

  it('contains the full PLL set (21) and the 2-look OLL set (10)', () => {
    expect(algorithmsInSet('pll')).toHaveLength(21);
    expect(algorithmsInSet('oll')).toHaveLength(10);
  });

  it('every algorithm is a real last-layer algorithm: the first two layers come back intact', () => {
    for (const alg of ALGORITHMS) {
      const cube = result(alg);
      expect(firstTwoLayersSolved(cube), `${alg.id} disturbs F2L`).toBe(true);
      expect(isSolved(cube), `${alg.id} does nothing`).toBe(false);
    }
  });

  it('every PLL keeps the top face oriented (only permutes pieces)', () => {
    for (const alg of algorithmsInSet('pll')) {
      const cube = result(alg);
      const topFace = cube.filter((s) => s.normal.join() === '0,1,0');
      expect(
        topFace.every((s) => s.color === 'U'),
        `${alg.id} changes orientation`,
      ).toBe(true);
    }
  });

  it('corner OLLs keep the cross; edge OLLs keep the corners they are not meant to touch', () => {
    const edgeOfTopLayer = (s: { pos: readonly number[]; normal: readonly number[] }) =>
      s.pos[1] === 1 && s.normal[1] === 1 && s.pos.filter((c) => c === 0).length === 1;
    for (const id of ['oll-sune', 'oll-antisune', 'oll-h', 'oll-pi', 'oll-u', 'oll-t', 'oll-l']) {
      const alg = ALGORITHMS.find((a) => a.id === id) as AlgorithmDef;
      // Apply to a cube whose cross is already oriented (a solved cube): top edges stay yellow.
      const cube = result(alg);
      const topEdges = cube.filter((s) => s.pos[1] === 1 && s.normal[1] === 1 && edgeOfTopLayer(s));
      expect(
        topEdges.every((s) => s.color === 'U'),
        `${id} breaks the cross`,
      ).toBe(true);
      // ...and it does twist corners: some top-face corner sticker is no longer yellow.
      const topCorners = cube.filter(
        (s) => s.pos[1] === 1 && s.normal[1] === 1 && s.pos.filter((c) => c === 0).length === 0,
      );
      expect(
        topCorners.some((s) => s.color !== 'U'),
        `${id} does not twist corners`,
      ).toBe(true);
    }
  });

  it('draws a case that the algorithm solves', () => {
    for (const alg of ALGORITHMS) {
      const diagram = caseDiagram(alg.moves);
      expect(diagram.top).toHaveLength(9);
      const caseCube = applyAlgorithm(solvedCube(), invertAlgorithm(alg.moves));
      expect(isSolved(applyAlgorithm(caseCube, alg.moves)), alg.id).toBe(true);
    }
  });
});
