// ============================================================================
// SOLVER - Kociemba's Two-Phase Algorithm
// Phase 1: Solve to G1 subgroup (edges oriented, corners oriented, E-slice placed)
// Phase 2: Solve within G1 (using only U, D, F2, B2, R2, L2 moves)
// ============================================================================

import { CubeState, Move, SOLVED_STATE, BASIC_MOVES } from './types.js';
import { MOVE_TABLES, applyMove, applyMoves, equalsCube } from './moveTables.js';

// ============================================================================
// PHASE 1: Coordinate Systems
// ============================================================================

/** Corner orientation coordinate (0-2186 = 3^7) */
function getCornerOriCoord(state: CubeState): number {
  let coord = 0;
  for (let i = 0; i < 7; i++) {
    coord = coord * 3 + state.cornerOri[i];
  }
  return coord;
}

/** Edge orientation coordinate (0-2047 = 2^11) */
function getEdgeOriCoord(state: CubeState): number {
  let coord = 0;
  for (let i = 0; i < 11; i++) {
    coord = coord * 2 + state.edgeOri[i];
  }
  return coord;
}

/** UD-slice edge permutation coordinate (12 choose 4 = 495) */
function getUDSliceCoord(state: CubeState): number {
  // Which 4 edges are in the UD-slice (positions 4,5,6,7 = FR, FL, BL, BR)
  // Actually UD-slice edges are the 4 edges that belong in the middle layer: FR, FL, BL, BR (indices 8,9,10,11)
  const sliceEdges = [8, 9, 10, 11];
  let idx = 0;
  for (let i = 0; i < 12; i++) {
    if (sliceEdges.includes(state.edgePos[i])) {
      // This position contains a slice edge
      const remaining = sliceEdges.filter(e => !Array.from(state.edgePos).slice(0, i).includes(e)).length;
      // Compute combination index
      idx = idx * (12 - i) + remaining;
    }
  }
  // More accurate: use combinatorial index
  const perm = Array.from(state.edgePos);
  let coord = 0;
  let n = 12;
  for (const e of sliceEdges) {
    const pos = perm.indexOf(e);
    coord = coord * n + pos;
    // Remove this position from consideration
    for (let i = pos; i < n - 1; i++) perm[i] = perm[i + 1];
    n--;
  }
  return coord;
}

/** Corner permutation coordinate (0-40319 = 8!) - not used in Phase 1 */
/** Edge permutation coordinate (0-479001599 = 12!) - not used in Phase 1 */

// ============================================================================
// PHASE 1: Pruning Tables (computed on first run)
// ============================================================================

/** Pruning table for Phase 1: [cornerOri][edgeOri][UDSlice] -> min moves to solved */
let phase1Pruning: Uint8Array | null = null;
const CORNER_ORI_MAX = 2187;  // 3^7
const EDGE_ORI_MAX = 2048;    // 2^11
const UD_SLICE_MAX = 495;     // C(12,4)

/** Generate Phase 1 pruning table using BFS from solved state */
function generatePhase1Pruning(): Uint8Array {
  const size = CORNER_ORI_MAX * EDGE_ORI_MAX * UD_SLICE_MAX;
  const table = new Uint8Array(size);
  table.fill(255); // 255 = unknown

  // BFS queue: [cornerOri, edgeOri, udSlice]
  const queue: [number, number, number][] = [[0, 0, 0]];
  table[0] = 0;

  // Phase 1 allowed moves: U, U', U2, R, R', R2, F, F', F2, D, D', D2, L, L', L2, B, B', B2
  // But in Phase 1 we only care about reaching G1, so all moves are allowed
  const phase1Moves: Move[] = BASIC_MOVES;

  // Pre-compute coordinate transitions for each move
  const cornerOriTransitions: number[][] = [];
  const edgeOriTransitions: number[][] = [];
  const udSliceTransitions: number[][] = [];

  for (const move of phase1Moves) {
    const moveTable = MOVE_TABLES[move];

    // Compute corner orientation transition
    const coTrans = new Array(CORNER_ORI_MAX);
    for (let i = 0; i < CORNER_ORI_MAX; i++) {
      // Decode
      let v = i;
      const ori = new Uint8Array(7);
      for (let j = 6; j >= 0; j--) {
        ori[j] = v % 3;
        v = Math.floor(v / 3);
      }
      // Apply move
      const state: CubeState = {
        cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]),
        cornerOri: new Uint8Array([...ori, 0]), // 8th corner determined by sum
        edgePos: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11]),
        edgeOri: new Uint8Array(12),
      };
      // Fix 8th corner orientation
      let sum = 0;
      for (let j = 0; j < 7; j++) sum += state.cornerOri[j];
      state.cornerOri[7] = (3 - (sum % 3)) % 3;

      const newState = applyMove(state, moveTable);
      coTrans[i] = getCornerOriCoord(newState);
    }
    cornerOriTransitions.push(coTrans);

    // Edge orientation transition
    const eoTrans = new Array(EDGE_ORI_MAX);
    for (let i = 0; i < EDGE_ORI_MAX; i++) {
      let v = i;
      const ori = new Uint8Array(11);
      for (let j = 10; j >= 0; j--) {
        ori[j] = v % 2;
        v = Math.floor(v / 2);
      }
      const state: CubeState = {
        cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]),
        cornerOri: new Uint8Array(8),
        edgePos: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11]),
        edgeOri: new Uint8Array([...ori, 0]),
      };
      let sum = 0;
      for (let j = 0; j < 11; j++) sum += state.edgeOri[j];
      state.edgeOri[11] = sum % 2;

      const newState = applyMove(state, moveTable);
      eoTrans[i] = getEdgeOriCoord(newState);
    }
    edgeOriTransitions.push(eoTrans);

    // UD-slice transition
    const udTrans = new Array(UD_SLICE_MAX);
    for (let i = 0; i < UD_SLICE_MAX; i++) {
      // Decode combination to permutation
      const sliceEdges = [8, 9, 10, 11];
      const perm = new Array(12).fill(-1);
      let v = i;
      for (let j = 3; j >= 0; j--) {
        const pos = v % (12 - (3 - j));
        v = Math.floor(v / (12 - (3 - j)));
        let idx = 0;
        for (let k = 0; k < 12; k++) {
          if (perm[k] === -1) {
            if (idx === pos) {
              perm[k] = sliceEdges[j];
              break;
            }
            idx++;
          }
        }
      }
      // Fill remaining
      const otherEdges = [0,1,2,3,4,5,6,7];
      let oi = 0;
      for (let k = 0; k < 12; k++) {
        if (perm[k] === -1) perm[k] = otherEdges[oi++];
      }

      const state: CubeState = {
        cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]),
        cornerOri: new Uint8Array(8),
        edgePos: new Uint8Array(perm),
        edgeOri: new Uint8Array(12),
      };

      const newState = applyMove(state, moveTable);
      udTrans[i] = getUDSliceCoord(newState);
    }
    udSliceTransitions.push(udTrans);
  }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const [co, eo, ud] = queue[head++];
    const dist = table[co * EDGE_ORI_MAX * UD_SLICE_MAX + eo * UD_SLICE_MAX + ud];

    if (dist >= 12) continue; // Phase 1 max depth is ~12

    for (let mi = 0; mi < phase1Moves.length; mi++) {
      const nco = cornerOriTransitions[mi][co];
      const neo = edgeOriTransitions[mi][eo];
      const nud = udSliceTransitions[mi][ud];
      const idx = nco * EDGE_ORI_MAX * UD_SLICE_MAX + neo * UD_SLICE_MAX + nud;
      if (table[idx] === 255) {
        table[idx] = dist + 1;
        queue.push([nco, neo, nud]);
      }
    }
  }

  return table;
}

function getPhase1Pruning(): Uint8Array {
  if (!phase1Pruning) {
    console.log('Generating Phase 1 pruning table...');
    phase1Pruning = generatePhase1Pruning();
    console.log('Phase 1 pruning table generated.');
  }
  return phase1Pruning;
}

// ============================================================================
// PHASE 2: Pruning Tables
// ============================================================================

/** Phase 2 uses only U, D, F2, B2, R2, L2 moves (G1 subgroup) */
const PHASE2_MOVES: Move[] = ['U', "U'", 'U2', 'D', "D'", 'D2', 'F2', 'B2', 'R2', 'L2'];

/** Corner permutation coordinate (8! = 40320) */
function getCornerPermCoord(state: CubeState): number {
  const perm = Array.from(state.cornerPos);
  let coord = 0;
  let mult = 1;
  for (let i = 7; i >= 0; i--) {
    let cnt = 0;
    for (let j = i + 1; j < 8; j++) if (perm[j] < perm[i]) cnt++;
    coord += cnt * mult;
    mult *= (8 - i);
  }
  return coord;
}

/** Edge permutation coordinate for 8 non-slice edges (8! = 40320) */
function getEdgePermCoord(state: CubeState): number {
  const sliceEdges = [8, 9, 10, 11];
  const nonSlice = state.edgePos.filter(e => !sliceEdges.includes(e));
  const perm = Array.from(nonSlice);
  let coord = 0;
  let mult = 1;
  for (let i = 7; i >= 0; i--) {
    let cnt = 0;
    for (let j = i + 1; j < 8; j++) if (perm[j] < perm[i]) cnt++;
    coord += cnt * mult;
    mult *= (8 - i);
  }
  return coord;
}

/** UD-slice permutation (4! = 24) */
function getUDSlicePermCoord(state: CubeState): number {
  const sliceEdges = [8, 9, 10, 11];
  const slicePerm = state.edgePos.filter(e => sliceEdges.includes(e));
  const perm = Array.from(slicePerm).map(e => sliceEdges.indexOf(e));
  let coord = 0;
  let mult = 1;
  for (let i = 3; i >= 0; i--) {
    let cnt = 0;
    for (let j = i + 1; j < 4; j++) if (perm[j] < perm[i]) cnt++;
    coord += cnt * mult;
    mult *= (4 - i);
  }
  return coord;
}

let phase2Pruning: Uint8Array | null = null;
const CORNER_PERM_MAX = 40320;
const EDGE_PERM_MAX = 40320;
const UD_PERM_MAX = 24;

function generatePhase2Pruning(): Uint8Array {
  const size = CORNER_PERM_MAX * EDGE_PERM_MAX * UD_PERM_MAX;
  // This is huge (40320 * 40320 * 24 = 39 billion), so we use a smaller table
  // In practice, Kociemba uses separate tables and combines them
  // For simplicity, we'll use a more memory-efficient approach
  return new Uint8Array(0); // Placeholder
}

function getPhase2Pruning(): Uint8Array {
  if (!phase2Pruning) {
    phase2Pruning = generatePhase2Pruning();
  }
  return phase2Pruning;
}

// ============================================================================
// IDA* Search for Phase 1
// ============================================================================

interface SearchNode {
  state: CubeState;
  moves: Move[];
  co: number;
  eo: number;
  ud: number;
  depth: number;
}

function phase1Search(state: CubeState, maxDepth: number): Move[] | null {
  const pruning = getPhase1Pruning();
  const co = getCornerOriCoord(state);
  const eo = getEdgeOriCoord(state);
  const ud = getUDSliceCoord(state);

  const idx = co * EDGE_ORI_MAX * UD_SLICE_MAX + eo * UD_SLICE_MAX + ud;
  const minDist = pruning[idx];
  if (minDist === 255 || minDist > maxDepth) return null;

  // IDA* search
  const path: Move[] = [];
  let found: Move[] | null = null;

  function dfs(currentState: CubeState, currentCo: number, currentEo: number, currentUd: number, depth: number, lastMove: number): boolean {
    const cidx = currentCo * EDGE_ORI_MAX * UD_SLICE_MAX + currentEo * UD_SLICE_MAX + currentUd;
    const h = pruning[cidx];
    if (h === 255) return false;
    if (depth + h > maxDepth) return false;
    if (h === 0) {
      // Check if fully solved in Phase 1
      if (currentCo === 0 && currentEo === 0 && currentUd === 0) {
        found = [...path];
        return true;
      }
    }

    // Try moves
    for (let mi = 0; mi < BASIC_MOVES.length; mi++) {
      // Skip redundant moves (same face as last move)
      if (lastMove >= 0 && Math.floor(lastMove / 3) === Math.floor(mi / 3)) continue;
      // Skip moves that don't reduce distance enough (optional optimization)

      const move = BASIC_MOVES[mi];
      const moveTable = MOVE_TABLES[move];
      const nextState = applyMove(currentState, moveTable);

      const nextCo = cornerOriTransitions[mi][currentCo];
      const nextEo = edgeOriTransitions[mi][currentEo];
      const nextUd = udSliceTransitions[mi][currentUd];

      path.push(move);
      if (dfs(nextState, nextCo, nextEo, nextUd, depth + 1, mi)) return true;
      path.pop();
    }
    return false;
  }

  // We need the transition tables
  const phase1Moves = BASIC_MOVES;
  const cornerOriTransitions: number[][] = [];
  const edgeOriTransitions: number[][] = [];
  const udSliceTransitions: number[][] = [];

  for (const move of phase1Moves) {
    const moveTable = MOVE_TABLES[move];
    // Corner orientation
    const coTrans = new Array(CORNER_ORI_MAX);
    for (let i = 0; i < CORNER_ORI_MAX; i++) {
      let v = i;
      const ori = new Uint8Array(7);
      for (let j = 6; j >= 0; j--) { ori[j] = v % 3; v = Math.floor(v / 3); }
      const s: CubeState = { cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]), cornerOri: new Uint8Array([...ori, 0]), edgePos: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11]), edgeOri: new Uint8Array(12) };
      let sum = 0; for (let j = 0; j < 7; j++) sum += s.cornerOri[j]; s.cornerOri[7] = (3 - (sum % 3)) % 3;
      const ns = applyMove(s, moveTable);
      coTrans[i] = getCornerOriCoord(ns);
    }
    cornerOriTransitions.push(coTrans);

    // Edge orientation
    const eoTrans = new Array(EDGE_ORI_MAX);
    for (let i = 0; i < EDGE_ORI_MAX; i++) {
      let v = i;
      const ori = new Uint8Array(11);
      for (let j = 10; j >= 0; j--) { ori[j] = v % 2; v = Math.floor(v / 2); }
      const s: CubeState = { cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]), cornerOri: new Uint8Array(8), edgePos: new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11]), edgeOri: new Uint8Array([...ori, 0]) };
      let sum = 0; for (let j = 0; j < 11; j++) sum += s.edgeOri[j]; s.edgeOri[11] = sum % 2;
      const ns = applyMove(s, moveTable);
      eoTrans[i] = getEdgeOriCoord(ns);
    }
    edgeOriTransitions.push(eoTrans);

    // UD slice
    const udTrans = new Array(UD_SLICE_MAX);
    for (let i = 0; i < UD_SLICE_MAX; i++) {
      const sliceEdges = [8, 9, 10, 11];
      const perm = new Array(12).fill(-1);
      let v = i;
      for (let j = 3; j >= 0; j--) {
        const pos = v % (12 - (3 - j));
        v = Math.floor(v / (12 - (3 - j)));
        let idx = 0;
        for (let k = 0; k < 12; k++) {
          if (perm[k] === -1) { if (idx === pos) { perm[k] = sliceEdges[j]; break; } idx++; }
        }
      }
      const otherEdges = [0,1,2,3,4,5,6,7];
      let oi = 0;
      for (let k = 0; k < 12; k++) if (perm[k] === -1) perm[k] = otherEdges[oi++];
      const s: CubeState = { cornerPos: new Uint8Array([0,1,2,3,4,5,6,7]), cornerOri: new Uint8Array(8), edgePos: new Uint8Array(perm), edgeOri: new Uint8Array(12) };
      const ns = applyMove(s, moveTable);
      udTrans[i] = getUDSliceCoord(ns);
    }
    udSliceTransitions.push(udTrans);
  }

  dfs(state, co, eo, ud, 0, -1);
  return found;
}

// ============================================================================
// MAIN SOLVE FUNCTION
// ============================================================================

/** Solve a cube state, returns move sequence */
export function solveCube(state: CubeState): Move[] {
  // Phase 1: Solve to G1
  console.log('Phase 1: Solving to G1 subgroup...');
  let phase1Moves: Move[] | null = null;
  for (let depth = 0; depth <= 12; depth++) {
    phase1Moves = phase1Search(state, depth);
    if (phase1Moves) {
      console.log(`Phase 1 solved in ${phase1Moves.length} moves: ${phase1Moves.join(' ')}`);
      break;
    }
  }
  if (!phase1Moves) throw new Error('Phase 1 failed');

  // Apply Phase 1 moves to get to G1 state
  let g1State = applyMoves(state, phase1Moves);

  // Phase 2: Solve within G1 (simplified - just use a basic solver for now)
  // For a full implementation, we'd use the Phase 2 pruning tables
  console.log('Phase 2: Solving within G1...');
  // For now, just return Phase 1 moves (which may not fully solve)
  // A complete Phase 2 would be quite involved

  return phase1Moves;
}

/** Verify a solution */
export function verifySolution(state: CubeState, moves: Move[]): boolean {
  const finalState = applyMoves(state, moves);
  return equalsCube(finalState, SOLVED_STATE);
}