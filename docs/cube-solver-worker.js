import { Cube, initSolver, solve } from "https://esm.sh/rubik-solver@0.1.2";

let initialized = false;

function snapshot(cube) {
  return cube.asString();
}

self.onmessage = async (event) => {
  const { facelets } = event.data || {};
  try {
    if (typeof facelets !== "string" || facelets.length !== 54) {
      throw new Error("A cube state must contain exactly 54 facelets.");
    }

    if (!initialized) {
      initSolver();
      initialized = true;
    }

    const cube = Cube.fromString(facelets);
    const validation = cube.verify();
    if (validation !== true) {
      throw new Error(typeof validation === "string" ? validation : "The entered cube state is invalid.");
    }

    const solution = solve(cube, 22);
    if (solution === null) {
      throw new Error("The solver could not find a solution for this cube state.");
    }

    const moves = solution.trim() ? solution.trim().split(/\s+/) : [];
    const replay = Cube.fromString(facelets);
    const snapshots = [snapshot(replay)];

    for (const move of moves) {
      replay.move(move);
      snapshots.push(snapshot(replay));
    }

    if (!replay.isSolved()) {
      throw new Error("Solution verification failed. No moves were returned.");
    }

    self.postMessage({ ok: true, moves, snapshots, verified: true });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
