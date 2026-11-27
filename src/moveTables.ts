// ============================================================================
// MOVE TABLES - How each basic move transforms the cube state
// ============================================================================

import { CubeState, MoveTable, CORNER_FACES, EDGE_FACES, Face } from './types.js';

// Pre-computed move tables for all 18 basic moves
// Each move table tells us how the move affects the cube state

/** Create move tables by analyzing the effect of each move on the solved cube */
function generateMoveTables(): Record<string, MoveTable> {
  const tables: Record<string, MoveTable> = {};

  // Define the effect of each basic move on corner/edge positions and orientations
  // Format: moveName -> { cornerPerm, cornerOriDelta, edgePerm, edgeOriDelta }

  const moveDefs = {
    // U move (Up face clockwise)
    U: {
      cornerPerm: [3, 0, 1, 2, 4, 5, 6, 7],
      cornerOriDelta: [0, 0, 0, 0, 0, 0, 0, 0],
      edgePerm: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    // R move (Right face clockwise)
    R: {
      cornerPerm: [4, 1, 2, 0, 7, 5, 6, 3],
      cornerOriDelta: [2, 0, 0, 1, 1, 0, 0, 2],
      edgePerm: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    // F move (Front face clockwise)
    F: {
      cornerPerm: [1, 5, 2, 3, 0, 4, 6, 7],
      cornerOriDelta: [1, 2, 0, 0, 2, 1, 0, 0],
      edgePerm: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
      edgeOriDelta: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
    },
    // D move (Down face clockwise)
    D: {
      cornerPerm: [0, 1, 2, 3, 5, 6, 7, 4],
      cornerOriDelta: [0, 0, 0, 0, 0, 0, 0, 0],
      edgePerm: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    // L move (Left face clockwise)
    L: {
      cornerPerm: [0, 2, 6, 3, 4, 1, 5, 7],
      cornerOriDelta: [0, 1, 2, 0, 0, 2, 1, 0],
      edgePerm: [0, 1, 11, 3, 4, 5, 9, 7, 8, 2, 10, 6],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    // B move (Back face clockwise)
    B: {
      cornerPerm: [0, 1, 3, 7, 4, 5, 2, 6],
      cornerOriDelta: [0, 0, 1, 2, 0, 0, 2, 1],
      edgePerm: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
      edgeOriDelta: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
    },
  };

  // Generate tables for each move including prime (') and double (2) variants
  for (const [baseMove, def] of Object.entries(moveDefs)) {
    // Base move
    tables[baseMove] = {
      cornerPos: new Uint8Array(def.cornerPerm),
      cornerOri: new Uint8Array(def.cornerOriDelta),
      edgePos: new Uint8Array(def.edgePerm),
      edgeOri: new Uint8Array(def.edgeOriDelta),
    };

    // Prime move: construct the exact inverse permutation and orientation delta.
    // For state'[i] = state[p[i]] and ori'[i] = ori[p[i]] + d[i],
    // the inverse uses q = p^-1 and deltaInverse[i] = -d[q[i]].
    const primeCornerPos = invertPermutation(def.cornerPerm);
    const primeCornerOri = inverseOrientation(primeCornerPos, def.cornerOriDelta, 3);
    const primeEdgePos = invertPermutation(def.edgePerm);
    const primeEdgeOri = inverseOrientation(primeEdgePos, def.edgeOriDelta, 2);

    tables[baseMove + "'"] = {
      cornerPos: new Uint8Array(primeCornerPos),
      cornerOri: new Uint8Array(primeCornerOri),
      edgePos: new Uint8Array(primeEdgePos),
      edgeOri: new Uint8Array(primeEdgeOri),
    };

    // Double move: apply the base move twice.
    const doubleCornerPos = applyPermutation(def.cornerPerm, def.cornerPerm);
    const doubleCornerOri = addOri(applyOri(def.cornerPerm, def.cornerOriDelta), def.cornerOriDelta, 3);
    const doubleEdgePos = applyPermutation(def.edgePerm, def.edgePerm);
    const doubleEdgeOri = addOri(applyOri(def.edgePerm, def.edgeOriDelta), def.edgeOriDelta, 2);

    tables[baseMove + '2'] = {
      cornerPos: new Uint8Array(doubleCornerPos),
      cornerOri: new Uint8Array(doubleCornerOri),
      edgePos: new Uint8Array(doubleEdgePos),
      edgeOri: new Uint8Array(doubleEdgeOri),
    };
  }

  return tables;
}

/** Return the inverse of a destination-to-source permutation. */
function invertPermutation(permutation: number[]): number[] {
  const inverse = new Array<number>(permutation.length);
  for (let i = 0; i < permutation.length; i++) inverse[permutation[i]] = i;
  return inverse;
}

/** Orientation delta for the inverse of a move (mod 3 for corners, mod 2 for edges). */
function inverseOrientation(inversePermutation: number[], delta: number[], mod: number): number[] {
  return inversePermutation.map(sourcePosition => (mod - delta[sourcePosition]) % mod);
}

/** Apply permutation p1 then p2 */
function applyPermutation(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length);
  for (let i = 0; i < p1.length; i++) {
    result[i] = p2[p1[i]];
  }
  return result;
}

/** Apply permutation to orientation deltas */
function applyOri(perm: number[], oriDelta: number[]): number[] {
  const result = new Array(perm.length);
  for (let i = 0; i < perm.length; i++) {
    result[i] = oriDelta[perm[i]];
  }
  return result;
}

/** Add two orientation arrays (mod 3 for corners, mod 2 for edges) */
function addOri(ori1: number[], ori2: number[], mod = 3): number[] {
  return ori1.map((v, i) => (v + ori2[i]) % mod);
}

// Pre-computed move tables
export const MOVE_TABLES: Record<string, MoveTable> = generateMoveTables();

/** Apply a move table to a cube state */
export function applyMove(state: CubeState, moveTable: MoveTable): CubeState {
  const newState: CubeState = {
    cornerPos: new Uint8Array(8),
    cornerOri: new Uint8Array(8),
    edgePos: new Uint8Array(12),
    edgeOri: new Uint8Array(12),
  };

  // Apply corner permutation
  for (let i = 0; i < 8; i++) {
    newState.cornerPos[i] = state.cornerPos[moveTable.cornerPos[i]];
    newState.cornerOri[i] = (state.cornerOri[moveTable.cornerPos[i]] + moveTable.cornerOri[i]) % 3;
  }

  // Apply edge permutation
  for (let i = 0; i < 12; i++) {
    newState.edgePos[i] = state.edgePos[moveTable.edgePos[i]];
    newState.edgeOri[i] = (state.edgeOri[moveTable.edgePos[i]] + moveTable.edgeOri[i]) % 2;
  }

  return newState;
}

/** Apply a sequence of moves */
export function applyMoves(state: CubeState, moves: string[]): CubeState {
  let current = state;
  for (const move of moves) {
    const table = MOVE_TABLES[move];
    if (!table) throw new Error(`Unknown move: ${move}`);
    current = applyMove(current, table);
  }
  return current;
}

/** Invert a move sequence */
export function invertMoves(moves: string[]): string[] {
  return moves.slice().reverse().map(m => {
    if (m.endsWith("'")) return m.slice(0, -1);
    if (m.endsWith('2')) return m;
    return m + "'";
  });
}

/** Check if two cube states are equal */
export function equalsCube(a: CubeState, b: CubeState): boolean {
  return (
    arraysEqual(a.cornerPos, b.cornerPos) &&
    arraysEqual(a.cornerOri, b.cornerOri) &&
    arraysEqual(a.edgePos, b.edgePos) &&
    arraysEqual(a.edgeOri, b.edgeOri)
  );
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}