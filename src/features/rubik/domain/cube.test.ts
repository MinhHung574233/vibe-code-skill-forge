import { describe, expect, it } from 'vitest';
import {
  applyAlgorithm,
  faceColors,
  invertAlgorithm,
  isSolved,
  normalizeOrientation,
  parseAlgorithm,
  solvedCube,
} from './cube';

describe('cube model', () => {
  it('starts solved with 54 stickers, 9 per face', () => {
    const cube = solvedCube();
    expect(cube).toHaveLength(54);
    expect(isSolved(cube)).toBe(true);
    expect(faceColors(cube, 'U')).toEqual(Array(9).fill('U'));
  });

  it('every turn has order 4 and its inverse undoes it', () => {
    for (const m of ['U', 'D', 'L', 'R', 'F', 'B', 'M', 'E', 'S', 'r', 'u', 'f', 'x', 'y', 'z']) {
      expect(isSolved(applyAlgorithm(solvedCube(), `${m} ${m} ${m} ${m}`))).toBe(true);
      expect(isSolved(applyAlgorithm(solvedCube(), `${m} ${m}'`))).toBe(true);
      expect(isSolved(applyAlgorithm(solvedCube(), `${m}2 ${m}2`))).toBe(true);
    }
  });

  it('matches known cube facts', () => {
    // The "sexy move" has order 6.
    expect(isSolved(applyAlgorithm(solvedCube(), "R U R' U' ".repeat(6)))).toBe(true);
    expect(isSolved(applyAlgorithm(solvedCube(), "R U R' U' ".repeat(5)))).toBe(false);
    // R carries the front face's right column up onto the U face.
    const afterR = applyAlgorithm(solvedCube(), 'R');
    expect(faceColors(afterR, 'U')).toEqual(['U', 'U', 'F', 'U', 'U', 'F', 'U', 'U', 'F']);
    // U carries the right face's top row to the front face.
    const afterU = applyAlgorithm(solvedCube(), 'U');
    expect(faceColors(afterU, 'F').slice(0, 3)).toEqual(['R', 'R', 'R']);
    // Wide r = R + M'; x = R + M' + L'.
    const a = applyAlgorithm(solvedCube(), 'r');
    const b = applyAlgorithm(solvedCube(), "R M'");
    expect(faceColors(a, 'F')).toEqual(faceColors(b, 'F'));
    const c = applyAlgorithm(solvedCube(), 'x');
    expect(faceColors(c, 'U')).toEqual(Array(9).fill('F'));
    expect(faceColors(applyAlgorithm(solvedCube(), "R M' L'"), 'U')).toEqual(faceColors(c, 'U'));
  });

  it('inverts algorithms', () => {
    const alg = "R U R' U' F2 D' L2 B M x'";
    expect(invertAlgorithm(alg)).toBe("x M' B' L2 D F2 U R U' R'");
    expect(isSolved(applyAlgorithm(solvedCube(), `${alg} ${invertAlgorithm(alg)}`))).toBe(true);
  });

  it('parses notation and rejects nonsense', () => {
    expect(parseAlgorithm("R U2 F'")).toEqual([
      { name: 'R', amount: 1 },
      { name: 'U', amount: 2 },
      { name: 'F', amount: -1 },
    ]);
    expect(parseAlgorithm('R Q')).toBeNull();
  });

  it('normalises the orientation after whole-cube rotations', () => {
    const rotated = applyAlgorithm(solvedCube(), "x y2 z'");
    expect(isSolved(rotated)).toBe(true);
    const fixed = normalizeOrientation(rotated);
    expect(fixed).not.toBeNull();
    expect(faceColors(fixed ?? [], 'U')).toEqual(Array(9).fill('U'));
  });
});
