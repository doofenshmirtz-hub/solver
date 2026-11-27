// ============================================================================
// TYPES - Rubik's Cube Cubie Representation
// ============================================================================

/** Face colors in standard cube notation */
export enum Face {
  U = 'U',  // Up (White)
  R = 'R',  // Right (Red)
  F = 'F',  // Front (Green)
  D = 'D',  // Down (Yellow)
  L = 'L',  // Left (Orange)
  B = 'B',  // Back (Blue)
}

/** Color mapping for input */
export type ColorInput = 'W' | 'R' | 'G' | 'Y' | 'O' | 'B';

/** Standard color scheme: White opposite Yellow, Red opposite Orange, Green opposite Blue */
export const OPPOSITE_COLOR: Record<ColorInput, ColorInput> = {
  'W': 'Y', 'Y': 'W',
  'R': 'O', 'O': 'R',
  'G': 'B', 'B': 'G',
};

/** Face index for array access: U=0, R=1, F=2, D=3, L=4, B=5 */
export const FACE_INDEX: Record<Face, number> = {
  [Face.U]: 0, [Face.R]: 1, [Face.F]: 2, [Face.D]: 3, [Face.L]: 4, [Face.B]: 5,
};

/** Corner indices (0-7) with their three faces in clockwise order */
export const CORNER_FACES: readonly [Face, Face, Face][] = [
  [Face.U, Face.R, Face.F], // URF - 0
  [Face.U, Face.F, Face.L], // UFL - 1
  [Face.U, Face.L, Face.B], // ULB - 2
  [Face.U, Face.B, Face.R], // UBR - 3
  [Face.D, Face.F, Face.R], // DFR - 4
  [Face.D, Face.R, Face.B], // DRB - 5
  [Face.D, Face.B, Face.L], // DBL - 6
  [Face.D, Face.L, Face.F], // DFL - 7
];

/** Edge indices (0-11) with their two faces */
export const EDGE_FACES: readonly [Face, Face][] = [
  [Face.U, Face.R], // UR - 0
  [Face.U, Face.F], // UF - 1
  [Face.U, Face.L], // UL - 2
  [Face.U, Face.B], // UB - 3
  [Face.D, Face.R], // DR - 4
  [Face.D, Face.F], // DF - 5
  [Face.D, Face.L], // DL - 6
  [Face.D, Face.B], // DB - 7
  [Face.F, Face.R], // FR - 8
  [Face.F, Face.L], // FL - 9
  [Face.B, Face.R], // BR - 10
  [Face.B, Face.L], // BL - 11
];

/** Move notation */
export type Move =
  | 'U' | "U'" | 'U2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'B' | "B'" | 'B2';

/** Cube state in cubie representation */
export interface CubeState {
  // Corners: position (which corner is in each slot) + orientation (0,1,2)
  cornerPos: Uint8Array; // length 8, values 0-7
  cornerOri: Uint8Array; // length 8, values 0-2
  // Edges: position (which edge is in each slot) + orientation (0,1)
  edgePos: Uint8Array;   // length 12, values 0-11
  edgeOri: Uint8Array;   // length 12, values 0-1
}

/** Input state: 54 stickers (9 per face) */
export interface StickerInput {
  [Face.U]: ColorInput[]; // 9 colors
  [Face.R]: ColorInput[];
  [Face.F]: ColorInput[];
  [Face.D]: ColorInput[];
  [Face.L]: ColorInput[];
  [Face.B]: ColorInput[];
}

/** Solved cube state */
export const SOLVED_STATE: CubeState = {
  cornerPos: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]),
  cornerOri: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
  edgePos: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
  edgeOri: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
};

/** Move tables for corner and edge permutations */
export interface MoveTable {
  cornerPos: Uint8Array; // 8 elements
  cornerOri: Uint8Array; // 8 elements (delta)
  edgePos: Uint8Array;   // 12 elements
  edgeOri: Uint8Array;   // 12 elements (delta)
}

/** All 18 basic moves */
export const BASIC_MOVES: readonly Move[] = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];