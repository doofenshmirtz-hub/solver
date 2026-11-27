# Rubik's Cube Solver

A Rubik's Cube solver using **Cubie Representation** (compressing 54 stickers into 40 numbers) and **Kociemba's Two-Phase Algorithm**.

## Cubie Representation

Instead of tracking 54 stickers, the cube is modeled as 20 movable pieces (cubies):

| Piece Type | Count | Arrays | Values |
|------------|-------|--------|--------|
| **Corners** | 8 | `cornerPos[8]` | 0-7 (position) |
| | | `cornerOri[8]` | 0,1,2 (twist) |
| **Edges** | 12 | `edgePos[12]` | 0-11 (position) |
| | | `edgeOri[12]` | 0,1 (flip) |
| **Total** | **20** | **4 arrays** | **40 numbers** |

### Solved State
```
cornerPos = [0, 1, 2, 3, 4, 5, 6, 7]
cornerOri = [0, 0, 0, 0, 0, 0, 0, 0]
edgePos   = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
edgeOri   = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

## Input Format

The solver takes 54 colors (9 per face) as input:

```
Face U (Up/White):    W W W W W W W W W
Face R (Right/Red):   R R R R R R R R R
Face F (Front/Green): G G G G G G G G G
Face D (Down/Yellow): Y Y Y Y Y Y Y Y Y
Face L (Left/Orange): O O O O O O O O O
Face B (Back/Blue):   B B B B B B B B B
```

Sticker positions per face (3×3 grid, index 4 = center):
```
  0 1 2
  3 4 5
  6 7 8
```

The 6 center colors define the cube's color scheme and must be valid opposites:
- White ↔ Yellow
- Red ↔ Orange
- Green ↔ Blue

## Algorithm: Kociemba's Two-Phase

### Phase 1: Solve to G1 Subgroup
**Goal:** Orient all edges & corners, place E-slice edges
**Allowed moves:** All 18 basic moves (U, U', U2, R, R', R2, F, F', F2, D, D', D2, L, L', L2, B, B', B2)
**Coordinates:**
- Corner orientation: 3⁷ = 2,187 states
- Edge orientation: 2¹¹ = 2,048 states
- UD-slice permutation: C(12,4) = 495 states
- **Total Phase 1 space:** ~2.2 billion (pruned with BFS table)

### Phase 2: Solve within G1
**Goal:** Permute pieces using only G1 moves
**Allowed moves:** U, U', U2, D, D', D2, F2, B2, R2, L2 (10 moves)
**Coordinates:**
- Corner permutation: 8! = 40,320
- Edge permutation (8 non-slice): 8! = 40,320
- UD-slice permutation: 4! = 24

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
# Interactive mode (prompts for 54 colors)
npm start

# Or run directly with tsx
npm run dev
```

## Example: Solved Cube

Input all faces with their center colors:
```
U: W W W W W W W W W
R: R R R R R R R R R
F: G G G G G G G G G
D: Y Y Y Y Y Y Y Y Y
L: O O O O O O O O O
B: B B B B B B B B B
```
Output: (empty - already solved)

## Example: Superflip

The superflip pattern (all edges flipped, corners solved):
```
U: Y Y Y Y W Y Y Y Y
R: O O O O R O O O O
F: B B B B G B B B B
D: W W W W Y W W W W
L: R R R R O R R R R
B: G G G G B G G G G
```

## Project Structure

```
src/
├── types.ts         # Type definitions (CubeState, Move, Face, etc.)
├── moveTables.ts    # Move tables for all 18 basic moves
├── inputParser.ts   # 54 stickers → cubie representation
├── solver.ts        # Kociemba two-phase solver
└── index.ts         # CLI entry point
```

## Development

```bash
# Run tests
npm test

# Type check
npx tsc --noEmit
```

## License

MIT