import { describe, expect, it } from 'vitest';
import { applyMoves, equalsCube, invertMoves, MOVE_TABLES } from './moveTables.js';
import { BASIC_MOVES, SOLVED_STATE } from './types.js';

describe('3×3 cubie move tables', () => {
  it('defines all 18 face-turn moves', () => {
    expect(Object.keys(MOVE_TABLES).sort()).toEqual([...BASIC_MOVES].sort());
  });

  it.each(BASIC_MOVES)('%s followed by its inverse restores the solved state', move => {
    const result = applyMoves(SOLVED_STATE, [move, ...invertMoves([move])]);
    expect(equalsCube(result, SOLVED_STATE)).toBe(true);
  });

  it.each(['U', 'R', 'F', 'D', 'L', 'B'] as const)('%s repeated four times restores the solved state', face => {
    const result = applyMoves(SOLVED_STATE, [face, face, face, face]);
    expect(equalsCube(result, SOLVED_STATE)).toBe(true);
  });

  it('undoes a mixed scramble with the inverse sequence', () => {
    const scramble = ['R', 'U', "F'", 'L2', 'D', "B'", 'R2'];
    const scrambled = applyMoves(SOLVED_STATE, scramble);
    const restored = applyMoves(scrambled, invertMoves(scramble));
    expect(equalsCube(restored, SOLVED_STATE)).toBe(true);
  });
});
