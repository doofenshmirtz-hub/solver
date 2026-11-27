// ============================================================================
// Rubik's Cube Solver - Web App
// Browser-compatible implementation of cubie representation + Kociemba solver
// ============================================================================

// -----------------------------------------------------------------------------
// TYPES & CONSTANTS
// -----------------------------------------------------------------------------

const Face = { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
const FACE_ORDER = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
const FACE_INDEX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const COLORS = ['W', 'Y', 'R', 'O', 'G', 'B'];
const OPPOSITE = { W: 'Y', Y: 'W', R: 'O', O: 'R', G: 'B', B: 'G' };

// Corner faces (clockwise order)
const CORNER_FACES = [
  [Face.U, Face.R, Face.F], // URF - 0
  [Face.U, Face.F, Face.L], // UFL - 1
  [Face.U, Face.L, Face.B], // ULB - 2
  [Face.U, Face.B, Face.R], // UBR - 3
  [Face.D, Face.F, Face.R], // DFR - 4
  [Face.D, Face.R, Face.B], // DRB - 5
  [Face.D, Face.B, Face.L], // DBL - 6
  [Face.D, Face.L, Face.F], // DFL - 7
];

// Edge faces
const EDGE_FACES = [
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

// Sticker indices for corners on each face
const CORNER_STICKER_MAP = [
  [{ face: Face.U, sticker: 2 }, { face: Face.R, sticker: 0 }, { face: Face.F, sticker: 2 }], // URF
  [{ face: Face.U, sticker: 0 }, { face: Face.F, sticker: 0 }, { face: Face.L, sticker: 2 }], // UFL
  [{ face: Face.U, sticker: 6 }, { face: Face.L, sticker: 0 }, { face: Face.B, sticker: 2 }], // ULB
  [{ face: Face.U, sticker: 8 }, { face: Face.B, sticker: 0 }, { face: Face.R, sticker: 2 }], // UBR
  [{ face: Face.D, sticker: 0 }, { face: Face.F, sticker: 2 }, { face: Face.R, sticker: 6 }], // DFR
  [{ face: Face.D, sticker: 2 }, { face: Face.R, sticker: 8 }, { face: Face.B, sticker: 6 }], // DRB
  [{ face: Face.D, sticker: 8 }, { face: Face.B, sticker: 8 }, { face: Face.L, sticker: 6 }], // DBL
  [{ face: Face.D, sticker: 6 }, { face: Face.L, sticker: 8 }, { face: Face.F, sticker: 6 }], // DFL
];

const EDGE_STICKER_MAP = [
  [{ face: Face.U, sticker: 1 }, { face: Face.R, sticker: 1 }], // UR
  [{ face: Face.U, sticker: 3 }, { face: Face.F, sticker: 1 }], // UF
  [{ face: Face.U, sticker: 7 }, { face: Face.L, sticker: 1 }], // UL
  [{ face: Face.U, sticker: 5 }, { face: Face.B, sticker: 1 }], // UB
  [{ face: Face.D, sticker: 1 }, { face: Face.R, sticker: 7 }], // DR
  [{ face: Face.D, sticker: 3 }, { face: Face.F, sticker: 7 }], // DF
  [{ face: Face.D, sticker: 7 }, { face: Face.L, sticker: 7 }], // DL
  [{ face: Face.D, sticker: 5 }, { face: Face.B, sticker: 7 }], // DB
  [{ face: Face.F, sticker: 5 }, { face: Face.R, sticker: 3 }], // FR
  [{ face: Face.F, sticker: 3 }, { face: Face.L, sticker: 5 }], // FL
  [{ face: Face.B, sticker: 5 }, { face: Face.R, sticker: 5 }], // BR
  [{ face: Face.B, sticker: 3 }, { face: Face.L, sticker: 3 }], // BL
];

const BASIC_MOVES = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'B', "B'", 'B2'];

const SOLVED_STATE = {
  cornerPos: [0, 1, 2, 3, 4, 5, 6, 7],
  cornerOri: [0, 0, 0, 0, 0, 0, 0, 0],
  edgePos: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  edgeOri: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const STANDARD_COLOR_TO_FACE = { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B };

// -----------------------------------------------------------------------------
// MOVE TABLES
// -----------------------------------------------------------------------------

function generateMoveTables() {
  const tables = {};
  const moveDefs = {
    U: {
      cornerPerm: [3, 0, 1, 2, 4, 5, 6, 7],
      cornerOriDelta: [0, 0, 0, 0, 0, 0, 0, 0],
      edgePerm: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    R: {
      cornerPerm: [4, 1, 2, 0, 7, 5, 6, 3],
      cornerOriDelta: [2, 0, 0, 1, 1, 0, 0, 2],
      edgePerm: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    F: {
      cornerPerm: [1, 5, 2, 3, 0, 4, 6, 7],
      cornerOriDelta: [1, 2, 0, 0, 2, 1, 0, 0],
      edgePerm: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
      edgeOriDelta: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
    },
    D: {
      cornerPerm: [0, 1, 2, 3, 5, 6, 7, 4],
      cornerOriDelta: [0, 0, 0, 0, 0, 0, 0, 0],
      edgePerm: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    L: {
      cornerPerm: [0, 2, 6, 3, 4, 1, 5, 7],
      cornerOriDelta: [0, 1, 2, 0, 0, 2, 1, 0],
      edgePerm: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 11, 6],
      edgeOriDelta: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    B: {
      cornerPerm: [0, 1, 3, 7, 4, 5, 2, 6],
      cornerOriDelta: [0, 0, 1, 2, 0, 0, 2, 1],
      edgePerm: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
      edgeOriDelta: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
    },
  };

  for (const [baseMove, def] of Object.entries(moveDefs)) {
    tables[baseMove] = { ...def, cornerPerm: [...def.cornerPerm], cornerOriDelta: [...def.cornerOriDelta], edgePerm: [...def.edgePerm], edgeOriDelta: [...def.edgeOriDelta] };

    // Prime (3x)
    const cp1 = applyPerm(def.cornerPerm, def.cornerPerm);
    const cp2 = applyPerm(cp1, def.cornerPerm);
    const co1 = addOri(applyOri(def.cornerPerm, def.cornerOriDelta), def.cornerOriDelta, 3);
    const co2 = addOri(co1, def.cornerOriDelta, 3);
    const ep1 = applyPerm(def.edgePerm, def.edgePerm);
    const ep2 = applyPerm(ep1, def.edgePerm);
    const eo1 = addOri(applyOri(def.edgePerm, def.edgeOriDelta), def.edgeOriDelta, 2);
    const eo2 = addOri(eo1, def.edgeOriDelta, 2);

    tables[baseMove + "'"] = { cornerPerm: cp2, cornerOriDelta: co2, edgePerm: ep2, edgeOriDelta: eo2 };
    tables[baseMove + '2'] = { cornerPerm: cp1, cornerOriDelta: co1, edgePerm: ep1, edgeOriDelta: eo1 };
  }
  return tables;
}

function applyPerm(p1, p2) { return p1.map(i => p2[i]); }
function applyOri(perm, oriDelta) { return perm.map(i => oriDelta[i]); }
function addOri(ori1, ori2, mod) { return ori1.map((v, i) => (v + ori2[i]) % mod); }

const MOVE_TABLES = generateMoveTables();

function applyMove(state, moveTable) {
  const newState = {
    cornerPos: new Array(8), cornerOri: new Array(8),
    edgePos: new Array(12), edgeOri: new Array(12),
  };
  for (let i = 0; i < 8; i++) {
    newState.cornerPos[i] = state.cornerPos[moveTable.cornerPerm[i]];
    newState.cornerOri[i] = (state.cornerOri[moveTable.cornerPerm[i]] + moveTable.cornerOriDelta[i]) % 3;
  }
  for (let i = 0; i < 12; i++) {
    newState.edgePos[i] = state.edgePos[moveTable.edgePerm[i]];
    newState.edgeOri[i] = (state.edgeOri[moveTable.edgePerm[i]] + moveTable.edgeOriDelta[i]) % 2;
  }
  return newState;
}

function applyMoves(state, moves) {
  let current = state;
  for (const m of moves) current = applyMove(current, MOVE_TABLES[m]);
  return current;
}

function equalsCube(a, b) {
  return a.cornerPos.every((v, i) => v === b.cornerPos[i]) &&
         a.cornerOri.every((v, i) => v === b.cornerOri[i]) &&
         a.edgePos.every((v, i) => v === b.edgePos[i]) &&
         a.edgeOri.every((v, i) => v === b.edgeOri[i]);
}

// -----------------------------------------------------------------------------
// INPUT PARSING (54 stickers -> cubie)
// -----------------------------------------------------------------------------

function validateCenters(stickers) {
  const centers = {};
  for (const f of FACE_ORDER) centers[f] = stickers[f][4];
  const vals = Object.values(centers);
  if (new Set(vals).size !== 6) return { valid: false, error: 'Centers must be 6 distinct colors' };
  for (const [f1, f2] of [[Face.U, Face.D], [Face.R, Face.L], [Face.F, Face.B]]) {
    if (OPPOSITE[centers[f1]] !== centers[f2]) {
      return { valid: false, error: `Invalid opposites: ${centers[f1]} (${f1}) vs ${centers[f2]} (${f2})` };
    }
  }
  const colorToFace = {};
  for (const [f, c] of Object.entries(centers)) colorToFace[c] = f;
  return { valid: true, centers, colorToFace };
}

function stickersToCubie(stickers, colorToFace) {
  const state = { cornerPos: new Array(8), cornerOri: new Array(8), edgePos: new Array(12), edgeOri: new Array(12) };

  // Build signature maps
  const cornerMap = new Map(), edgeMap = new Map();
  for (let i = 0; i < 8; i++) {
    const faces = CORNER_FACES[i];
    const sig = faces.map(f => STANDARD_COLOR_TO_FACE[Object.keys(STANDARD_COLOR_TO_FACE).find(k => STANDARD_COLOR_TO_FACE[k] === f)]).sort().join(',');
    cornerMap.set(sig, i);
  }
  for (let i = 0; i < 12; i++) {
    const faces = EDGE_FACES[i];
    const sig = faces.map(f => STANDARD_COLOR_TO_FACE[Object.keys(STANDARD_COLOR_TO_FACE).find(k => STANDARD_COLOR_TO_FACE[k] === f)]).sort().join(',');
    edgeMap.set(sig, i);
  }

  // Corners
  for (let i = 0; i < 8; i++) {
    const stickerColors = CORNER_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const standardFaces = stickerColors.map(c => colorToFace[c]);
    const sig = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const idx = cornerMap.get(sig);
    if (idx === undefined) throw new Error(`Invalid corner at ${i}`);
    state.cornerPos[i] = idx;

    // Orientation
    const uOrDFaceInCubie = CORNER_FACES[idx].findIndex(f => f === Face.U || f === Face.D);
    const uOrDFaceInSlot = CORNER_FACES[i].findIndex(f => f === Face.U || f === Face.D);
    state.cornerOri[i] = (uOrDFaceInCubie - uOrDFaceInSlot + 3) % 3;
  }

  // Edges
  for (let i = 0; i < 12; i++) {
    const stickerColors = EDGE_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const standardFaces = stickerColors.map(c => colorToFace[c]);
    const sig = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const idx = edgeMap.get(sig);
    if (idx === undefined) throw new Error(`Invalid edge at ${i}`);
    state.edgePos[i] = idx;

    // Orientation
    const edgePrimaryFace = EDGE_FACES[idx][0];
    const stickerOnPrimary = standardFaces[0];
    state.edgeOri[i] = (stickerOnPrimary === edgePrimaryFace) ? 0 : 1;
  }
  return state;
}

function validateCubeState(state) {
  const cp = state.cornerPos, ep = state.edgePos;
  if (new Set(cp).size !== 8 || new Set(ep).size !== 12) return { valid: false, error: 'Duplicate/missing pieces' };
  if (state.cornerOri.reduce((a, b) => a + b, 0) % 3 !== 0) return { valid: false, error: 'Bad corner ori sum' };
  if (state.edgeOri.reduce((a, b) => a + b, 0) % 2 !== 0) return { valid: false, error: 'Bad edge ori sum' };
  if (permutationParity(cp) !== permutationParity(ep)) return { valid: false, error: 'Bad parity' };
  return { valid: true };
}

function permutationParity(perm) {
  const visited = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (!visited[i]) { cycles++; let j = i; while (!visited[j]) { visited[j] = true; j = perm[j]; } }
  }
  return (perm.length - cycles) % 2;
}

// -----------------------------------------------------------------------------
// PHASE 1 SOLVER (G1 subgroup)
// -----------------------------------------------------------------------------

const CORNER_ORI_MAX = 2187, EDGE_ORI_MAX = 2048, UD_SLICE_MAX = 495;

function getCornerOriCoord(state) {
  let c = 0; for (let i = 0; i < 7; i++) c = c * 3 + state.cornerOri[i]; return c;
}
function getEdgeOriCoord(state) {
  let c = 0; for (let i = 0; i < 11; i++) c = c * 2 + state.edgeOri[i]; return c;
}
function getUDSliceCoord(state) {
  const slice = [8, 9, 10, 11];
  const perm = [...state.edgePos];
  let c = 0, n = 12;
  for (const e of slice) {
    const pos = perm.indexOf(e);
    c = c * n + pos;
    perm.splice(pos, 1); n--;
  }
  return c;
}

// Generate pruning table
let phase1Pruning = null;

function generatePhase1Pruning() {
  const size = CORNER_ORI_MAX * EDGE_ORI_MAX * UD_SLICE_MAX;
  const table = new Uint8Array(size); table.fill(255);
  const queue = [[0, 0, 0]]; table[0] = 0;

  // Precompute transitions
  const coTrans = [], eoTrans = [], udTrans = [];
  for (const m of BASIC_MOVES) {
    const mt = MOVE_TABLES[m];
    const co = new Array(CORNER_ORI_MAX);
    for (let i = 0; i < CORNER_ORI_MAX; i++) {
      let v = i, ori = new Array(7);
      for (let j = 6; j >= 0; j--) { ori[j] = v % 3; v = Math.floor(v / 3); }
      const s = { cornerPos: [0,1,2,3,4,5,6,7], cornerOri: [...ori, 0], edgePos: [0,1,2,3,4,5,6,7,8,9,10,11], edgeOri: new Array(12).fill(0) };
      let sum = 0; for (let j = 0; j < 7; j++) sum += s.cornerOri[j]; s.cornerOri[7] = (3 - sum % 3) % 3;
      co[i] = getCornerOriCoord(applyMove(s, mt));
    }
    coTrans.push(co);

    const eo = new Array(EDGE_ORI_MAX);
    for (let i = 0; i < EDGE_ORI_MAX; i++) {
      let v = i, ori = new Array(11);
      for (let j = 10; j >= 0; j--) { ori[j] = v % 2; v = Math.floor(v / 2); }
      const s = { cornerPos: [0,1,2,3,4,5,6,7], cornerOri: new Array(8).fill(0), edgePos: [0,1,2,3,4,5,6,7,8,9,10,11], edgeOri: [...ori, 0] };
      let sum = 0; for (let j = 0; j < 11; j++) sum += s.edgeOri[j]; s.edgeOri[11] = sum % 2;
      eo[i] = getEdgeOriCoord(applyMove(s, mt));
    }
    eoTrans.push(eo);

    const ud = new Array(UD_SLICE_MAX);
    for (let i = 0; i < UD_SLICE_MAX; i++) {
      const slice = [8, 9, 10, 11];
      const perm = new Array(12).fill(-1);
      let v = i;
      for (let j = 3; j >= 0; j--) {
        const pos = v % (12 - (3 - j));
        v = Math.floor(v / (12 - (3 - j)));
        let idx = 0;
        for (let k = 0; k < 12; k++) if (perm[k] === -1) { if (idx === pos) { perm[k] = slice[j]; break; } idx++; }
      }
      const other = [0,1,2,3,4,5,6,7]; let oi = 0;
      for (let k = 0; k < 12; k++) if (perm[k] === -1) perm[k] = other[oi++];
      const s = { cornerPos: [0,1,2,3,4,5,6,7], cornerOri: new Array(8).fill(0), edgePos: perm, edgeOri: new Array(12).fill(0) };
      ud[i] = getUDSliceCoord(applyMove(s, mt));
    }
    udTrans.push(ud);
  }

  let head = 0;
  while (head < queue.length) {
    const [co, eo, ud] = queue[head++];
    const dist = table[co * EDGE_ORI_MAX * UD_SLICE_MAX + eo * UD_SLICE_MAX + ud];
    if (dist >= 12) continue;
    for (let mi = 0; mi < BASIC_MOVES.length; mi++) {
      const nco = coTrans[mi][co], neo = eoTrans[mi][eo], nud = udTrans[mi][ud];
      const idx = nco * EDGE_ORI_MAX * UD_SLICE_MAX + neo * UD_SLICE_MAX + nud;
      if (table[idx] === 255) { table[idx] = dist + 1; queue.push([nco, neo, nud]); }
    }
  }
  return { table, coTrans, eoTrans, udTrans };
}

function getPhase1Pruning() {
  if (!phase1Pruning) {
    console.log('Generating Phase 1 pruning table...');
    phase1Pruning = generatePhase1Pruning();
    console.log('Phase 1 pruning table ready');
  }
  return phase1Pruning;
}

function phase1Search(state, maxDepth) {
  const { table, coTrans, eoTrans, udTrans } = getPhase1Pruning();
  const co = getCornerOriCoord(state), eo = getEdgeOriCoord(state), ud = getUDSliceCoord(state);
  const idx = co * EDGE_ORI_MAX * UD_SLICE_MAX + eo * UD_SLICE_MAX + ud;
  if (table[idx] === 255 || table[idx] > maxDepth) return null;

  const path = []; let found = null;
  function dfs(cState, cCo, cEo, cUd, depth, lastMove) {
    const cidx = cCo * EDGE_ORI_MAX * UD_SLICE_MAX + cEo * UD_SLICE_MAX + cUd;
    const h = table[cidx];
    if (h === 255 || depth + h > maxDepth) return false;
    if (h === 0 && cCo === 0 && cEo === 0 && cUd === 0) { found = [...path]; return true; }
    for (let mi = 0; mi < BASIC_MOVES.length; mi++) {
      if (lastMove >= 0 && Math.floor(lastMove / 3) === Math.floor(mi / 3)) continue;
      const m = BASIC_MOVES[mi];
      const nState = applyMove(cState, MOVE_TABLES[m]);
      const nCo = coTrans[mi][cCo], nEo = eoTrans[mi][cEo], nUd = udTrans[mi][cUd];
      path.push(m);
      if (dfs(nState, nCo, nEo, nUd, depth + 1, mi)) return true;
      path.pop();
    }
    return false;
  }
  dfs(state, co, eo, ud, 0, -1);
  return found;
}

function solveCube(state) {
  for (let depth = 0; depth <= 12; depth++) {
    const moves = phase1Search(state, depth);
    if (moves) return moves;
  }
  return null;
}

// -----------------------------------------------------------------------------
// WEB APP UI
// -----------------------------------------------------------------------------

let currentStickers = {};
let selectedColor = 'W';
let solutionMoves = [];
let animState = null;

// Initialize cube net
function initCubeNet() {
  const net = document.getElementById('cube-net');
  net.innerHTML = '';
  for (const f of FACE_ORDER) {
    const faceDiv = document.createElement('div');
    faceDiv.className = 'face ' + f;
    faceDiv.dataset.face = f;
    faceDiv.innerHTML = `<div class="face-label">${f}</div>`;
    for (let i = 0; i < 9; i++) {
      const sticker = document.createElement('button');
      sticker.className = 'sticker' + (i === 4 ? ' center' : '');
      sticker.dataset.face = f;
      sticker.dataset.index = i;
      sticker.setAttribute('aria-label', `${f} sticker ${i}`);
      sticker.addEventListener('click', () => setSticker(f, i));
      faceDiv.appendChild(sticker);
    }
    net.appendChild(faceDiv);
  }
  resetCube();
}

function initColorPalette() {
  const palette = document.getElementById('color-palette');
  palette.innerHTML = '';
  for (const c of COLORS) {
    const btn = document.createElement('button');
    btn.className = 'color-btn ' + c;
    btn.dataset.color = c;
    btn.setAttribute('aria-label', c);
    btn.addEventListener('click', () => selectColor(c));
    palette.appendChild(btn);
  }
  selectColor('W');
}

function selectColor(c) {
  selectedColor = c;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.toggle('active', b.dataset.color === c));
}

function setSticker(face, index) {
  currentStickers[face][index] = selectedColor;
  renderStickers();
  checkSolveReady();
}

function resetCube() {
  currentStickers = {};
  for (const f of FACE_ORDER) currentStickers[f] = new Array(9).fill(f === Face.U ? 'W' : f === Face.R ? 'R' : f === Face.F ? 'G' : f === Face.D ? 'Y' : f === Face.L ? 'O' : 'B');
  renderStickers();
  selectColor('W');
  hideOutput();
  hideVisualizer();
}

function randomScramble() {
  // Apply random moves to solved state
  let state = { ...SOLVED_STATE, cornerPos: [...SOLVED_STATE.cornerPos], cornerOri: [...SOLVED_STATE.cornerOri], edgePos: [...SOLVED_STATE.edgePos], edgeOri: [...SOLVED_STATE.edgeOri] };
  const moves = [];
  for (let i = 0; i < 25; i++) {
    const m = BASIC_MOVES[Math.floor(Math.random() * BASIC_MOVES.length)];
    moves.push(m);
    state = applyMove(state, MOVE_TABLES[m]);
  }
  // Convert back to stickers
  const faceToColor = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
  currentStickers = cubieToStickers(state, faceToColor);
  renderStickers();
  checkSolveReady();
}

function renderStickers() {
  for (const f of FACE_ORDER) {
    const faceDiv = document.querySelector(`.face.${f}`);
    if (!faceDiv) continue;
    const stickers = faceDiv.querySelectorAll('.sticker');
    stickers.forEach((s, i) => {
      const color = currentStickers[f][i];
      s.className = 'sticker' + (i === 4 ? ' center' : '') + ' ' + color + ' filled';
    });
  }
}

function checkSolveReady() {
  const btn = document.getElementById('solve-btn');
  btn.disabled = !isValidInput();
}

function isValidInput() {
  try {
    validateCenters(currentStickers);
    return true;
  } catch { return false; }
}

async function solve() {
  const btn = document.getElementById('solve-btn');
  btn.disabled = true;
  btn.textContent = 'Solving...';
  hideOutput();
  hideVisualizer();

  try {
    const validation = validateCenters(currentStickers);
    if (!validation.valid) throw new Error(validation.error);

    const cubeState = stickersToCubie(currentStickers, validation.colorToFace);
    const stateValidation = validateCubeState(cubeState);
    if (!stateValidation.valid) throw new Error(stateValidation.error);

    const start = performance.now();
    solutionMoves = solveCube(cubeState);
    const elapsed = (performance.now() - start).toFixed(1);

    if (!solutionMoves) throw new Error('No solution found within depth 12');

    // Verify
    const finalState = applyMoves(cubeState, solutionMoves);
    const solved = equalsCube(finalState, SOLVED_STATE);

    showOutput(solutionMoves, elapsed, solved);
    setupVisualizer(cubeState, solutionMoves);
  } catch (e) {
    showError(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Solve';
  }
}

function showOutput(moves, time, solved) {
  const section = document.getElementById('output-section');
  section.hidden = false;
  document.getElementById('move-count').textContent = `${moves.length} moves`;
  document.getElementById('solve-time').textContent = `${time}ms`;
  document.getElementById('error-display').hidden = true;

  const display = document.getElementById('moves-display');
  display.innerHTML = moves.map(m => `<span class="move">${m}</span>`).join(' ');

  document.getElementById('copy-btn').hidden = false;
  document.getElementById('copy-btn').onclick = () => {
    navigator.clipboard.writeText(moves.join(' '));
    alert('Copied!');
  };
}

function showError(msg) {
  const err = document.getElementById('error-display');
  err.textContent = msg;
  err.hidden = false;
}

function hideOutput() { document.getElementById('output-section').hidden = true; }

function setupVisualizer(initialState, moves) {
  const section = document.getElementById('visualizer-section');
  section.hidden = false;
  animState = { initialState, moves, currentStep: 0, playing: false, timer: null };
  drawCube(initialState);
  document.getElementById('play-btn').onclick = playAnimation;
  document.getElementById('pause-btn').onclick = pauseAnimation;
  document.getElementById('step-btn').onclick = stepAnimation;
  document.getElementById('speed-slider').oninput = (e) => {
    document.getElementById('speed-label').textContent = e.target.value + 'ms';
    if (animState.playing) { pauseAnimation(); playAnimation(); }
  };
}

function hideVisualizer() { document.getElementById('visualizer-section').hidden = true; }

function drawCube(state) {
  const canvas = document.getElementById('cube-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Simple 2D net drawing
  const faceSize = 80, stickerSize = faceSize / 3;
  const facePositions = {
    U: { x: faceSize * 1.2, y: 0 },
    L: { x: 0, y: faceSize * 1.2 },
    F: { x: faceSize * 1.2, y: faceSize * 1.2 },
    R: { x: faceSize * 2.4, y: faceSize * 1.2 },
    B: { x: faceSize * 3.6, y: faceSize * 1.2 },
    D: { x: faceSize * 1.2, y: faceSize * 2.4 },
  };

  const faceToColor = { U: '#ffffff', D: '#ffd500', R: '#ff0000', L: '#ff8000', F: '#00ff00', B: '#0066ff' };

  for (const f of FACE_ORDER) {
    const pos = facePositions[f];
    const stickers = cubieToStickers(state, { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B });
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const color = faceToColor[stickers[f][i]] || '#333';
      ctx.fillStyle = color;
      ctx.fillRect(pos.x + col * stickerSize, pos.y + row * stickerSize, stickerSize - 2, stickerSize - 2);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(pos.x + col * stickerSize, pos.y + row * stickerSize, stickerSize - 2, stickerSize - 2);
    }
  }
}

function playAnimation() {
  if (animState.playing) return;
  animState.playing = true;
  document.getElementById('play-btn').hidden = true;
  document.getElementById('pause-btn').hidden = false;
  const speed = parseInt(document.getElementById('speed-slider').value);
  animState.timer = setInterval(() => {
    if (animState.currentStep >= animState.moves.length) { pauseAnimation(); return; }
    stepAnimation();
  }, speed);
}

function pauseAnimation() {
  if (animState.timer) clearInterval(animState.timer);
  animState.playing = false;
  document.getElementById('play-btn').hidden = false;
  document.getElementById('pause-btn').hidden = true;
}

function stepAnimation() {
  if (animState.currentStep >= animState.moves.length) return;
  const move = animState.moves[animState.currentStep];
  animState.initialState = applyMove(animState.initialState, MOVE_TABLES[move]);
  drawCube(animState.initialState);
  animState.currentStep++;
  if (animState.currentStep >= animState.moves.length) pauseAnimation();
}

function cubieToStickers(state, colorToFace) {
  const faceToColor = {};
  for (const [c, f] of Object.entries(colorToFace)) faceToColor[f] = c;

  const stickers = {};
  for (const f of FACE_ORDER) stickers[f] = new Array(9).fill(faceToColor[f]);

  // Centers
  for (const f of FACE_ORDER) stickers[f][4] = faceToColor[f];

  // Corners
  for (let i = 0; i < 8; i++) {
    const idx = state.cornerPos[i], ori = state.cornerOri[i];
    const faces = CORNER_FACES[idx];
    const rotated = [faces[(0 - ori + 3) % 3], faces[(1 - ori + 3) % 3], faces[(2 - ori + 3) % 3]];
    for (let j = 0; j < 3; j++) {
      const { face, sticker } = CORNER_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rotated[j]];
    }
  }

  // Edges
  for (let i = 0; i < 12; i++) {
    const idx = state.edgePos[i], ori = state.edgeOri[i];
    const faces = EDGE_FACES[idx];
    const rotated = ori === 0 ? faces : [faces[1], faces[0]];
    for (let j = 0; j < 2; j++) {
      const { face, sticker } = EDGE_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rotated[j]];
    }
  }
  return stickers;
}

// -----------------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initCubeNet();
  initColorPalette();
  document.getElementById('solve-btn').addEventListener('click', solve);
  document.getElementById('reset-btn').addEventListener('click', resetCube);
  document.getElementById('random-btn').addEventListener('click', randomScramble);
});