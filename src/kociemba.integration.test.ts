import { beforeAll, describe, expect, it } from 'vitest';
import { Cube, initSolver, solve } from 'rubik-solver';

describe('Kociemba 3×3 solver integration', () => {
  beforeAll(() => {
    initSolver();
  }, 30000);

  it('accepts and verifies the solved facelet state', () => {
    const solved = new Cube();
    expect(solved.verify()).toBe(true);
    expect(Cube.fromString(solved.asString()).isSolved()).toBe(true);
  });

  it.each([
    "R U R' U'",
    "F R U R' U' F'",
    "R U2 F' L D2 B R2 U' F2",
    "L2 U B' R2 D F U2 L' B2 D'"
  ])('solves and verifies scramble: %s', scramble => {
    const scrambled = new Cube().move(scramble);
    const facelets = scrambled.asString();
    const parsed = Cube.fromString(facelets);

    expect(parsed.verify()).toBe(true);

    const solution = solve(parsed, 22);
    expect(solution).not.toBeNull();

    const replay = Cube.fromString(facelets);
    if (solution) replay.move(solution);
    expect(replay.isSolved()).toBe(true);
  });
});
