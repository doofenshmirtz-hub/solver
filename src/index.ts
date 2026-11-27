// ============================================================================
// MAIN ENTRY POINT - Rubik's Cube Solver CLI
// ============================================================================

import { readFileSync, writeFileSync } from 'fs';
import { CubeState, StickerInput, ColorInput, Face, SOLVED_STATE, BASIC_MOVES } from './types.js';
import { validateCenters, stickersToCubie, validateCubeState, cubieToStickers } from './inputParser.js';
import { MOVE_TABLES, applyMove, applyMoves, equalsCube, invertMoves } from './moveTables.js';
import { solveCube } from './solver.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Parse a face input string like "W W W W W W W W W" */
function parseFace(input: string): ColorInput[] {
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 9) throw new Error(`Expected 9 colors, got ${parts.length}`);
  return parts.map(p => {
    const c = p.toUpperCase();
    if (!['W', 'R', 'G', 'Y', 'O', 'B'].includes(c)) {
      throw new Error(`Invalid color: ${c}. Use W, R, G, Y, O, B`);
    }
    return c as ColorInput;
  });
}

/** Read 54 colors from user input */
async function readStickerInput(): Promise<StickerInput> {
  const faces: Face[] = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
  const faceNames: Record<Face, string> = {
    [Face.U]: 'Up (White center)',
    [Face.R]: 'Right (Red center)',
    [Face.F]: 'Front (Green center)',
    [Face.D]: 'Down (Yellow center)',
    [Face.L]: 'Left (Orange center)',
    [Face.B]: 'Back (Blue center)',
  };

  const stickers: StickerInput = {} as StickerInput;

  console.log('\n=== RUBIK\'S CUBE SOLVER ===');
  console.log('Enter 9 colors for each face (space-separated).');
  console.log('Colors: W=White, R=Red, G=Green, Y=Yellow, O=Orange, B=Blue');
  console.log('Sticker positions on each face (3x3 grid):');
  console.log('  0 1 2');
  console.log('  3 4 5   <- 4 is center');
  console.log('  6 7 8');
  console.log('');

  for (const face of faces) {
    while (true) {
      try {
        const input = await prompt(`Face ${face} (${faceNames[face]}): `);
        stickers[face] = parseFace(input);
        break;
      } catch (e) {
        console.error(`Error: ${(e as Error).message}`);
      }
    }
  }

  return stickers;
}

/** Simple prompt function */
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

/** Display cube state */
function displayCube(stickers: StickerInput): void {
  const faces: Face[] = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
  for (const face of faces) {
    const s = stickers[face];
    console.log(`${face}: ${s[0]} ${s[1]} ${s[2]} | ${s[3]} ${s[4]} ${s[5]} | ${s[6]} ${s[7]} ${s[8]}`);
  }
}

/** Format moves for display */
function formatMoves(moves: string[]): string {
  return moves.join(' ').replace(/'/g, "'").replace(/2/g, '2');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Read input
    const stickers = await readStickerInput();
    console.log('\nInput cube:');
    displayCube(stickers);

    // Validate centers
    const validation = validateCenters(stickers);
    if (!validation.valid) {
      console.error(`\nInvalid cube: ${validation.error}`);
      process.exit(1);
    }
    console.log('\nCenters validated:', validation.centers);

    // Convert to cubie representation
    console.log('\nConverting to cubie representation...');
    const cubeState = stickersToCubie(stickers, validation.colorToFace!);

    // Validate cube state
    const stateValidation = validateCubeState(cubeState);
    if (!stateValidation.valid) {
      console.error(`\nInvalid cube state: ${stateValidation.error}`);
      process.exit(1);
    }
    console.log('Cube state is valid!');

    // Display cubie state
    console.log('\nCubie representation (40 numbers):');
    console.log('Corner positions:', Array.from(cubeState.cornerPos).join(' '));
    console.log('Corner orientations:', Array.from(cubeState.cornerOri).join(' '));
    console.log('Edge positions:', Array.from(cubeState.edgePos).join(' '));
    console.log('Edge orientations:', Array.from(cubeState.edgeOri).join(' '));

    // Solve
    console.log('\nSolving...');
    const solution = solveCube(cubeState);

    // Verify
    const finalState = applyMoves(cubeState, solution);
    const solved = equalsCube(finalState, SOLVED_STATE);

    console.log('\n=== SOLUTION ===');
    console.log(`Moves (${solution.length}): ${formatMoves(solution)}`);
    console.log(`Verified: ${solved ? 'YES ✓' : 'NO ✗'}`);

    if (!solved) {
      console.log('\nNote: Full Phase 2 solver not yet implemented.');
      console.log('Phase 1 brings cube to G1 subgroup (oriented edges/corners, E-slice placed).');
    }

  } catch (error) {
    console.error(`\nError: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, readStickerInput, validateCenters, stickersToCubie, validateCubeState, solveCube };