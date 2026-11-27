# Puzzle Solver Hub — rebuild plan

## Product decisions

- Preserve the existing dark purple visual identity.
- Keep GitHub Pages as the deployment target.
- Support manual entry first and camera-assisted entry with manual correction.
- Prioritise the Rubik's Cube family.
- Keep solver engines independent from page rendering and input widgets.

## Architecture boundaries

Each puzzle engine should expose a small, testable contract:

1. Parse user input into a canonical puzzle state.
2. Validate structural and mathematical legality.
3. Solve without touching the DOM.
4. Apply the returned moves to a copy of the input state.
5. Verify the final state before presenting a solution.
6. Return structured errors for invalid, unsupported, or timed-out states.

The browser UI is responsible for input, rendering, accessibility, animation, and progress. Expensive searches should run in Web Workers so the interface remains responsive. GitHub Pages can host all static assets; a Python server is not required for the initial release.

## Cube rollout

| Puzzle | Planned method | Status |
|---|---|---|
| 2×2 | Corner-state search / IDA* | Planned |
| 3×3 | Kociemba two-phase solver (`rubik-solver` MIT package) in a module Web Worker | Implemented in browser worker; regression tests exercise valid scrambles and replay verification |
| 4×4 | Reduction with parity handling | Planned |
| 5×5+ | Reduction-based engines | Planned |
| Pyraminx | Dedicated orientation/permutation solver | Planned |
| Megaminx | Dedicated solver | Planned |
| Skewb | Dedicated state-space solver | Planned |
| Square-1 | Shape and permutation solver | Planned |

Do not advertise a puzzle as solvable until its engine passes known-state, random-scramble, inverse-sequence, legality, and final-state verification tests.

## Input strategy

- Manual: provide a puzzle-specific editor with a clear face orientation guide.
- Camera: use browser camera permission and guided face capture; show detected stickers for manual correction before validation.
- Camera recognition is an input assistant, not a solver. Never send an unconfirmed scan directly to the solving engine.

## Current foundation changes

- Fix invalid optional-chaining assignment syntax in the existing browser application. JavaScript does not allow assignment through an optional chain.
- Add a browser-script syntax check to the test command.
- Add move-table regression tests.
- Make the TypeScript 3×3 solver fail closed: Phase 1 alone is not a complete solve, so it must not return an unverified sequence.

## Release gates

- npm test
- npm run build
- Browser smoke test for home, cube, Sudoku, and Tic-Tac-Toe pages.
- Solved-state and scrambled-state cube tests with final-state verification.
- Mobile viewport and camera-permission checks.

## Important limitation

This foundation PR is not the completed multi-puzzle rebuild. It deliberately establishes correctness gates and documents the staged cube implementation. The next cube milestone is camera calibration and mobile testing, then a dedicated 2×2 solver followed by 4×4 reduction and parity handling. The legacy TypeScript Phase 1 code remains incomplete and is not used by the browser solver.
