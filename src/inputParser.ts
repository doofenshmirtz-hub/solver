// ============================================================================
// INPUT PARSER - Convert 54 sticker colors to Cubie Representation
// ============================================================================

import {
  CubeState, StickerInput, ColorInput, Face,
  CORNER_FACES, EDGE_FACES, FACE_INDEX, OPPOSITE_COLOR, SOLVED_STATE
} from './types.js';
import { equalsCube } from './moveTables.js';

/** Standard color scheme mapping */
export const STANDARD_SCHEME: Record<ColorInput, Face> = {
  'W': Face.U,  // White -> Up
  'Y': Face.D,  // Yellow -> Down
  'R': Face.R,  // Red -> Right
  'O': Face.L,  // Orange -> Left
  'G': Face.F,  // Green -> Front
  'B': Face.B,  // Blue -> Back
};

/** Center colors detected from input (index 4 of each face's 9 stickers) */
export interface CenterColors {
  [Face.U]: ColorInput;
  [Face.R]: ColorInput;
  [Face.F]: ColorInput;
  [Face.D]: ColorInput;
  [Face.L]: ColorInput;
  [Face.B]: ColorInput;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  centers?: CenterColors;
  colorToFace?: Record<ColorInput, Face>;
}

/**
 * Validate the 6 center colors form a valid cube color scheme
 * - All 6 colors must be distinct
 * - Opposite pairs must be correct (W-Y, R-O, G-B)
 */
export function validateCenters(stickers: StickerInput): ValidationResult {
  const centers: CenterColors = {
    [Face.U]: stickers[Face.U][4],
    [Face.R]: stickers[Face.R][4],
    [Face.F]: stickers[Face.F][4],
    [Face.D]: stickers[Face.D][4],
    [Face.L]: stickers[Face.L][4],
    [Face.B]: stickers[Face.B][4],
  };

  // Check all 6 colors are distinct
  const centerValues = Object.values(centers);
  const uniqueColors = new Set(centerValues);
  if (uniqueColors.size !== 6) {
    return { valid: false, error: 'Center colors must be 6 distinct colors' };
  }

  // Check opposite pairs
  const oppositePairs: [Face, Face][] = [
    [Face.U, Face.D], [Face.R, Face.L], [Face.F, Face.B]
  ];

  for (const [f1, f2] of oppositePairs) {
    const c1 = centers[f1];
    const c2 = centers[f2];
    if (OPPOSITE_COLOR[c1] !== c2) {
      return {
        valid: false,
        error: `Invalid opposite centers: ${c1} (${f1}) opposite ${c2} (${f2}). Expected ${OPPOSITE_COLOR[c1]} opposite ${c1}.`
      };
    }
  }

  // Build color-to-face mapping
  const colorToFace: Record<ColorInput, Face> = {} as Record<ColorInput, Face>;
  for (const [face, color] of Object.entries(centers)) {
    colorToFace[color as ColorInput] = face as Face;
  }

  return { valid: true, centers, colorToFace };
}

/**
 * Convert 54 stickers to cubie representation
 * Sticker indices per face (3x3 grid):
 *  0 1 2
 *  3 4 5
 *  6 7 8
 */
export function stickersToCubie(stickers: StickerInput, colorToFace: Record<ColorInput, Face>): CubeState {
  const state: CubeState = {
    cornerPos: new Uint8Array(8),
    cornerOri: new Uint8Array(8),
    edgePos: new Uint8Array(12),
    edgeOri: new Uint8Array(12),
  };

  // Map from cubie signature (sorted face colors) to cubie index
  const cornerMap = new Map<string, number>();
  const edgeMap = new Map<string, number>();

  // Build corner signatures for solved state
  for (let i = 0; i < 8; i++) {
    const [f1, f2, f3] = CORNER_FACES[i];
    // Standard solved colors for each face
    const standardColors = [STANDARD_SCHEME['W' as ColorInput], STANDARD_SCHEME['R' as ColorInput], STANDARD_SCHEME['G' as ColorInput],
                           STANDARD_SCHEME['Y' as ColorInput], STANDARD_SCHEME['O' as ColorInput], STANDARD_SCHEME['B' as ColorInput]];
    const colors = [standardColors[FACE_INDEX[f1]], standardColors[FACE_INDEX[f2]], standardColors[FACE_INDEX[f3]]].sort().join(',');
    cornerMap.set(colors, i);
  }

  // Build edge signatures for solved state
  for (let i = 0; i < 12; i++) {
    const [f1, f2] = EDGE_FACES[i];
    const standardColors = [STANDARD_SCHEME['W' as ColorInput], STANDARD_SCHEME['R' as ColorInput], STANDARD_SCHEME['G' as ColorInput],
                           STANDARD_SCHEME['Y' as ColorInput], STANDARD_SCHEME['O' as ColorInput], STANDARD_SCHEME['B' as ColorInput]];
    const colors = [standardColors[FACE_INDEX[f1]], standardColors[FACE_INDEX[f2]]].sort().join(',');
    edgeMap.set(colors, i);
  }

  // Sticker positions on each face for corners and edges
  // Corner sticker indices on each face (clockwise from top-left)
  const CORNER_STICKERS = {
    [Face.U]: [0, 2, 8, 6], // URF, UFL, ULB, UBR
    [Face.R]: [2, 8, 6, 0], // URF, DFR, DRB, UBR
    [Face.F]: [2, 8, 6, 0], // UFL, DFR, DFL, URF
    [Face.D]: [0, 2, 8, 6], // DFR, DRB, DBL, DFL
    [Face.L]: [2, 8, 6, 0], // ULB, DBL, DFL, UFL
    [Face.B]: [0, 6, 8, 2], // UBR, DRB, DBL, ULB
  };

  // Edge sticker indices on each face
  const EDGE_STICKERS = {
    [Face.U]: [1, 5, 7, 3], // UR, UF, UL, UB
    [Face.R]: [5, 7, 3, 1], // UF, DF, DR, UR
    [Face.F]: [1, 5, 7, 3], // UR, DF, DL, UF
    [Face.D]: [3, 1, 5, 7], // FR, FL, BL, BR (wait, need to check)
    [Face.L]: [5, 7, 3, 1], // UL, DL, FL, BL
    [Face.B]: [3, 1, 5, 7], // UB, BR, DB, BL
  };

  // Actually let's use a more systematic approach
  // For each corner position, we know which 3 faces and which sticker on each face
  const CORNER_STICKER_MAP: { face: Face; sticker: number }[][] = [
    // URF (0) - U[2], R[0], F[2]
    [{ face: Face.U, sticker: 2 }, { face: Face.R, sticker: 0 }, { face: Face.F, sticker: 2 }],
    // UFL (1) - U[0], F[0], L[2]
    [{ face: Face.U, sticker: 0 }, { face: Face.F, sticker: 0 }, { face: Face.L, sticker: 2 }],
    // ULB (2) - U[6], L[0], B[2]
    [{ face: Face.U, sticker: 6 }, { face: Face.L, sticker: 0 }, { face: Face.B, sticker: 2 }],
    // UBR (3) - U[8], B[0], R[2]
    [{ face: Face.U, sticker: 8 }, { face: Face.B, sticker: 0 }, { face: Face.R, sticker: 2 }],
    // DFR (4) - D[0], F[2], R[6]
    [{ face: Face.D, sticker: 0 }, { face: Face.F, sticker: 2 }, { face: Face.R, sticker: 6 }],
    // DRB (5) - D[2], R[8], B[6]
    [{ face: Face.D, sticker: 2 }, { face: Face.R, sticker: 8 }, { face: Face.B, sticker: 6 }],
    // DBL (6) - D[8], B[8], L[6]
    [{ face: Face.D, sticker: 8 }, { face: Face.B, sticker: 8 }, { face: Face.L, sticker: 6 }],
    // DFL (7) - D[6], L[8], F[6]
    [{ face: Face.D, sticker: 6 }, { face: Face.L, sticker: 8 }, { face: Face.F, sticker: 6 }],
  ];

  const EDGE_STICKER_MAP: { face: Face; sticker: number }[][] = [
    // UR (0) - U[1], R[1]
    [{ face: Face.U, sticker: 1 }, { face: Face.R, sticker: 1 }],
    // UF (1) - U[3], F[1]
    [{ face: Face.U, sticker: 3 }, { face: Face.F, sticker: 1 }],
    // UL (2) - U[7], L[1]
    [{ face: Face.U, sticker: 7 }, { face: Face.L, sticker: 1 }],
    // UB (3) - U[5], B[1]
    [{ face: Face.U, sticker: 5 }, { face: Face.B, sticker: 1 }],
    // DR (4) - D[1], R[7]
    [{ face: Face.D, sticker: 1 }, { face: Face.R, sticker: 7 }],
    // DF (5) - D[3], F[7]
    [{ face: Face.D, sticker: 3 }, { face: Face.F, sticker: 7 }],
    // DL (6) - D[7], L[7]
    [{ face: Face.D, sticker: 7 }, { face: Face.L, sticker: 7 }],
    // DB (7) - D[5], B[7]
    [{ face: Face.D, sticker: 5 }, { face: Face.B, sticker: 7 }],
    // FR (8) - F[5], R[3]
    [{ face: Face.F, sticker: 5 }, { face: Face.R, sticker: 3 }],
    // FL (9) - F[3], L[5]
    [{ face: Face.F, sticker: 3 }, { face: Face.L, sticker: 5 }],
    // BR (10) - B[5], R[5]
    [{ face: Face.B, sticker: 5 }, { face: Face.R, sticker: 5 }],
    // BL (11) - B[3], L[3]
    [{ face: Face.B, sticker: 3 }, { face: Face.L, sticker: 3 }],
  ];

  // Parse corners
  for (let i = 0; i < 8; i++) {
    const stickersAtCorner = CORNER_STICKER_MAP[i].map(({ face, sticker }) =>
      stickers[face][sticker]
    );
    const facesAtCorner = CORNER_STICKER_MAP[i].map(({ face }) => face);

    // Convert colors to standard faces
    const standardFaces = stickersAtCorner.map(c => colorToFace[c as ColorInput]);

    // Find which solved corner this matches (by the set of faces)
    const sortedFaces = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const cornerIndex = cornerMap.get(sortedFaces);
    if (cornerIndex === undefined) {
      throw new Error(`Invalid corner at position ${i}: colors ${stickersAtCorner.join(',')}`);
    }
    state.cornerPos[i] = cornerIndex;

    // Determine orientation: which face of the cubie is on the U/D face?
    // In solved state, corners have U or D face on U or D position
    const uFaceIndex = standardFaces.findIndex(f => f === Face.U || f === Face.D);
    // Orientation: 0 = U/D face is on U/D, 1 = clockwise twist, 2 = counter-clockwise
    // The corner faces are ordered [U/D, R/L, F/B] in CORNER_FACES
    // We need to find where the U/D color ended up
    const uOrDFaceInCubie = CORNER_FACES[cornerIndex].findIndex(f => f === Face.U || f === Face.D);
    const uOrDFaceInPosition = CORNER_FACES[i].findIndex(f => f === Face.U || f === Face.D);
    // If the U/D face of the cubie is at the U/D position of the slot -> orientation 0
    // Otherwise compute twist
    state.cornerOri[i] = (uOrDFaceInCubie - uOrDFaceInPosition + 3) % 3;
  }

  // Parse edges
  for (let i = 0; i < 12; i++) {
    const stickersAtEdge = EDGE_STICKER_MAP[i].map(({ face, sticker }) =>
      stickers[face][sticker]
    );
    const standardFaces = stickersAtEdge.map(c => colorToFace[c as ColorInput]);

    // Find which solved edge this matches
    const sortedFaces = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const edgeIndex = edgeMap.get(sortedFaces);
    if (edgeIndex === undefined) {
      throw new Error(`Invalid edge at position ${i}: colors ${stickersAtEdge.join(',')}`);
    }
    state.edgePos[i] = edgeIndex;

    // Determine orientation: 0 = unflipped, 1 = flipped
    // An edge is flipped if its F/B color is on U/D position or vice versa
    // More precisely: check if the edge's primary face (first in EDGE_FACES) matches position's primary face
    const edgePrimaryFace = EDGE_FACES[edgeIndex][0];
    const positionPrimaryFace = EDGE_FACES[i][0];
    // If the sticker that belongs on the primary face is actually on the secondary face position, it's flipped
    const stickerOnPrimaryPosition = standardFaces[0]; // First sticker in our map is on primary face of position
    state.edgeOri[i] = (stickerOnPrimaryPosition === edgePrimaryFace) ? 0 : 1;
  }

  return state;
}

/** Validate the cube state is physically possible */
export function validateCubeState(state: CubeState): { valid: boolean; error?: string } {
  // Check permutation parity
  const cornerPerm = Array.from(state.cornerPos);
  const edgePerm = Array.from(state.edgePos);

  // Check all pieces present exactly once
  const cornerSet = new Set(cornerPerm);
  const edgeSet = new Set(edgePerm);
  if (cornerSet.size !== 8 || edgeSet.size !== 12) {
    return { valid: false, error: 'Duplicate or missing pieces' };
  }

  // Check orientation sums
  const cornerOriSum = state.cornerOri.reduce((a, b) => a + b, 0) % 3;
  const edgeOriSum = state.edgeOri.reduce((a, b) => a + b, 0) % 2;
  if (cornerOriSum !== 0) {
    return { valid: false, error: 'Invalid corner orientation sum' };
  }
  if (edgeOriSum !== 0) {
    return { valid: false, error: 'Invalid edge orientation sum' };
  }

  // Check permutation parity (corners + edges must be even)
  const cornerParity = permutationParity(cornerPerm);
  const edgeParity = permutationParity(edgePerm);
  if (cornerParity !== edgeParity) {
    return { valid: false, error: 'Invalid permutation parity' };
  }

  return { valid: true };
}

function permutationParity(perm: number[]): number {
  let visited = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (!visited[i]) {
      cycles++;
      let j = i;
      while (!visited[j]) {
        visited[j] = true;
        j = perm[j];
      }
    }
  }
  return (perm.length - cycles) % 2;
}

/** Convert cubie state back to sticker representation (for display) */
export function cubieToStickers(state: CubeState, colorToFace: Record<ColorInput, Face>): StickerInput {
  // Reverse mapping: face -> color
  const faceToColor: Record<Face, ColorInput> = {} as Record<Face, ColorInput>;
  for (const [color, face] of Object.entries(colorToFace)) {
    faceToColor[face] = color as ColorInput;
  }

  const stickers: StickerInput = {
    [Face.U]: new Array(9).fill('W'),
    [Face.R]: new Array(9).fill('R'),
    [Face.F]: new Array(9).fill('G'),
    [Face.D]: new Array(9).fill('Y'),
    [Face.L]: new Array(9).fill('O'),
    [Face.B]: new Array(9).fill('B'),
  };

  // Fill centers
  for (const face of [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B]) {
    stickers[face][4] = faceToColor[face];
  }

  const CORNER_STICKER_MAP: { face: Face; sticker: number }[][] = [
    [{ face: Face.U, sticker: 2 }, { face: Face.R, sticker: 0 }, { face: Face.F, sticker: 2 }],
    [{ face: Face.U, sticker: 0 }, { face: Face.F, sticker: 0 }, { face: Face.L, sticker: 2 }],
    [{ face: Face.U, sticker: 6 }, { face: Face.L, sticker: 0 }, { face: Face.B, sticker: 2 }],
    [{ face: Face.U, sticker: 8 }, { face: Face.B, sticker: 0 }, { face: Face.R, sticker: 2 }],
    [{ face: Face.D, sticker: 0 }, { face: Face.F, sticker: 2 }, { face: Face.R, sticker: 6 }],
    [{ face: Face.D, sticker: 2 }, { face: Face.R, sticker: 8 }, { face: Face.B, sticker: 6 }],
    [{ face: Face.D, sticker: 8 }, { face: Face.B, sticker: 8 }, { face: Face.L, sticker: 6 }],
    [{ face: Face.D, sticker: 6 }, { face: Face.L, sticker: 8 }, { face: Face.F, sticker: 6 }],
  ];

  const EDGE_STICKER_MAP: { face: Face; sticker: number }[][] = [
    [{ face: Face.U, sticker: 1 }, { face: Face.R, sticker: 1 }],
    [{ face: Face.U, sticker: 3 }, { face: Face.F, sticker: 1 }],
    [{ face: Face.U, sticker: 7 }, { face: Face.L, sticker: 1 }],
    [{ face: Face.U, sticker: 5 }, { face: Face.B, sticker: 1 }],
    [{ face: Face.D, sticker: 1 }, { face: Face.R, sticker: 7 }],
    [{ face: Face.D, sticker: 3 }, { face: Face.F, sticker: 7 }],
    [{ face: Face.D, sticker: 7 }, { face: Face.L, sticker: 7 }],
    [{ face: Face.D, sticker: 5 }, { face: Face.B, sticker: 7 }],
    [{ face: Face.F, sticker: 5 }, { face: Face.R, sticker: 3 }],
    [{ face: Face.F, sticker: 3 }, { face: Face.L, sticker: 5 }],
    [{ face: Face.B, sticker: 5 }, { face: Face.R, sticker: 5 }],
    [{ face: Face.B, sticker: 3 }, { face: Face.L, sticker: 3 }],
  ];

  // Fill corners
  for (let i = 0; i < 8; i++) {
    const cornerIdx = state.cornerPos[i];
    const cornerOri = state.cornerOri[i];
    const cornerFaces = CORNER_FACES[cornerIdx];

    // The cubie's faces are rotated by cornerOri
    const rotatedFaces = [
      cornerFaces[(0 - cornerOri + 3) % 3],
      cornerFaces[(1 - cornerOri + 3) % 3],
      cornerFaces[(2 - cornerOri + 3) % 3],
    ];

    for (let j = 0; j < 3; j++) {
      const { face, sticker } = CORNER_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rotatedFaces[j]];
    }
  }

  // Fill edges
  for (let i = 0; i < 12; i++) {
    const edgeIdx = state.edgePos[i];
    const edgeOri = state.edgeOri[i];
    const edgeFaces = EDGE_FACES[edgeIdx];

    // The cubie's faces are swapped if flipped
    const rotatedFaces = edgeOri === 0 ? edgeFaces : [edgeFaces[1], edgeFaces[0]];

    for (let j = 0; j < 2; j++) {
      const { face, sticker } = EDGE_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rotatedFaces[j]];
    }
  }

  return stickers;
}