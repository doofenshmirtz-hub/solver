// ============================================================================
// Rubik's Cube Solver - Modern Web App
// Browser-compatible: Cubie Representation + Kociemba Phase 1 Solver
// ============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS & TYPES
// -----------------------------------------------------------------------------

const Face = { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
const FACE_ORDER = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
const FACE_INDEX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const COLORS = ['W', 'Y', 'R', 'O', 'G', 'B'];
const OPPOSITE = { W: 'Y', Y: 'W', R: 'O', O: 'R', G: 'B', B: 'G' };

const CORNER_FACES = [
  [Face.U, Face.R, Face.F], [Face.U, Face.F, Face.L], [Face.U, Face.L, Face.B], [Face.U, Face.B, Face.R],
  [Face.D, Face.F, Face.R], [Face.D, Face.R, Face.B], [Face.D, Face.B, Face.L], [Face.D, Face.L, Face.F],
];

const EDGE_FACES = [
  [Face.U, Face.R], [Face.U, Face.F], [Face.U, Face.L], [Face.U, Face.B],
  [Face.D, Face.R], [Face.D, Face.F], [Face.D, Face.L], [Face.D, Face.B],
  [Face.F, Face.R], [Face.F, Face.L], [Face.B, Face.R], [Face.B, Face.L],
];

const CORNER_STICKER_MAP = [
  [{ face: Face.U, sticker: 2 }, { face: Face.R, sticker: 0 }, { face: Face.F, sticker: 2 }],
  [{ face: Face.U, sticker: 0 }, { face: Face.F, sticker: 0 }, { face: Face.L, sticker: 2 }],
  [{ face: Face.U, sticker: 6 }, { face: Face.L, sticker: 0 }, { face: Face.B, sticker: 2 }],
  [{ face: Face.U, sticker: 8 }, { face: Face.B, sticker: 0 }, { face: Face.R, sticker: 2 }],
  [{ face: Face.D, sticker: 0 }, { face: Face.F, sticker: 2 }, { face: Face.R, sticker: 6 }],
  [{ face: Face.D, sticker: 2 }, { face: Face.R, sticker: 8 }, { face: Face.B, sticker: 6 }],
  [{ face: Face.D, sticker: 8 }, { face: Face.B, sticker: 8 }, { face: Face.L, sticker: 6 }],
  [{ face: Face.D, sticker: 6 }, { face: Face.L, sticker: 8 }, { face: Face.F, sticker: 6 }],
];

const EDGE_STICKER_MAP = [
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
    U: { cornerPerm: [3,0,1,2,4,5,6,7], cornerOriDelta: [0,0,0,0,0,0,0,0], edgePerm: [3,0,1,2,4,5,6,7,8,9,10,11], edgeOriDelta: [0,0,0,0,0,0,0,0,0,0,0,0] },
    R: { cornerPerm: [4,1,2,0,7,5,6,3], cornerOriDelta: [2,0,0,1,1,0,0,2], edgePerm: [8,1,2,3,11,5,6,7,4,9,10,0], edgeOriDelta: [0,0,0,0,0,0,0,0,0,0,0,0] },
    F: { cornerPerm: [1,5,2,3,0,4,6,7], cornerOriDelta: [1,2,0,0,2,1,0,0], edgePerm: [0,9,2,3,4,8,6,7,1,5,10,11], edgeOriDelta: [0,1,0,0,0,1,0,0,1,1,0,0] },
    D: { cornerPerm: [0,1,2,3,5,6,7,4], cornerOriDelta: [0,0,0,0,0,0,0,0], edgePerm: [0,1,2,3,5,6,7,4,8,9,10,11], edgeOriDelta: [0,0,0,0,0,0,0,0,0,0,0,0] },
    L: { cornerPerm: [0,2,6,3,4,1,5,7], cornerOriDelta: [0,1,2,0,0,2,1,0], edgePerm: [0,1,10,3,4,5,9,7,8,2,11,6], edgeOriDelta: [0,0,0,0,0,0,0,0,0,0,0,0] },
    B: { cornerPerm: [0,1,3,7,4,5,2,6], cornerOriDelta: [0,0,1,2,0,0,2,1], edgePerm: [0,1,2,11,4,5,6,10,8,9,3,7], edgeOriDelta: [0,0,0,1,0,0,0,1,0,0,1,1] },
  };

  const applyPerm = (p1, p2) => p1.map(i => p2[i]);
  const applyOri = (perm, oriDelta) => perm.map(i => oriDelta[i]);
  const addOri = (ori1, ori2, mod) => ori1.map((v, i) => (v + ori2[i]) % mod);

  for (const [baseMove, def] of Object.entries(moveDefs)) {
    tables[baseMove] = { ...def, cornerPerm: [...def.cornerPerm], cornerOriDelta: [...def.cornerOriDelta], edgePerm: [...def.edgePerm], edgeOriDelta: [...def.edgeOriDelta] };

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

const MOVE_TABLES = generateMoveTables();

function applyMove(state, moveTable) {
  const newState = { cornerPos: new Array(8), cornerOri: new Array(8), edgePos: new Array(12), edgeOri: new Array(12) };
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

function cloneState(state) {
  return {
    cornerPos: [...state.cornerPos],
    cornerOri: [...state.cornerOri],
    edgePos: [...state.edgePos],
    edgeOri: [...state.edgeOri],
  };
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

  for (let i = 0; i < 8; i++) {
    const stickerColors = CORNER_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const standardFaces = stickerColors.map(c => colorToFace[c]);
    const sig = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const idx = cornerMap.get(sig);
    if (idx === undefined) throw new Error(`Invalid corner at ${i}: ${stickerColors.join(',')}`);
    state.cornerPos[i] = idx;
    const uOrDFaceInCubie = CORNER_FACES[idx].findIndex(f => f === Face.U || f === Face.D);
    const uOrDFaceInSlot = CORNER_FACES[i].findIndex(f => f === Face.U || f === Face.D);
    state.cornerOri[i] = (uOrDFaceInCubie - uOrDFaceInSlot + 3) % 3;
  }

  for (let i = 0; i < 12; i++) {
    const stickerColors = EDGE_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const standardFaces = stickerColors.map(c => colorToFace[c]);
    const sig = [...standardFaces].sort((a, b) => FACE_INDEX[a] - FACE_INDEX[b]).join(',');
    const idx = edgeMap.get(sig);
    if (idx === undefined) throw new Error(`Invalid edge at ${i}: ${stickerColors.join(',')}`);
    state.edgePos[i] = idx;
    const edgePrimaryFace = EDGE_FACES[idx][0];
    const stickerOnPrimary = standardFaces[0];
    state.edgeOri[i] = (stickerOnPrimary === edgePrimaryFace) ? 0 : 1;
  }
  return state;
}

function validateCubeState(state) {
  const cp = state.cornerPos, ep = state.edgePos;
  if (new Set(cp).size !== 8 || new Set(ep).size !== 12) return { valid: false, error: 'Duplicate or missing pieces' };
  if (state.cornerOri.reduce((a, b) => a + b, 0) % 3 !== 0) return { valid: false, error: 'Invalid corner orientation sum' };
  if (state.edgeOri.reduce((a, b) => a + b, 0) % 2 !== 0) return { valid: false, error: 'Invalid edge orientation sum' };
  if (permutationParity(cp) !== permutationParity(ep)) return { valid: false, error: 'Invalid permutation parity' };
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

function getCornerOriCoord(state) { let c = 0; for (let i = 0; i < 7; i++) c = c * 3 + state.cornerOri[i]; return c; }
function getEdgeOriCoord(state) { let c = 0; for (let i = 0; i < 11; i++) c = c * 2 + state.edgeOri[i]; return c; }
function getUDSliceCoord(state) {
  const slice = [8, 9, 10, 11];
  const perm = [...state.edgePos];
  let c = 0, n = 12;
  for (const e of slice) { const pos = perm.indexOf(e); c = c * n + pos; perm.splice(pos, 1); n--; }
  return c;
}

let phase1Pruning = null;

function generatePhase1Pruning() {
  const size = CORNER_ORI_MAX * EDGE_ORI_MAX * UD_SLICE_MAX;
  const table = new Uint8Array(size); table.fill(255);
  const queue = [[0, 0, 0]]; table[0] = 0;

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
// CUBE TO STICKERS (for visualization)
// -----------------------------------------------------------------------------

function cubieToStickers(state, colorToFace) {
  const faceToColor = {};
  for (const [c, f] of Object.entries(colorToFace)) faceToColor[f] = c;

  const stickers = {};
  for (const f of FACE_ORDER) stickers[f] = new Array(9).fill(faceToColor[f]);
  for (const f of FACE_ORDER) stickers[f][4] = faceToColor[f];

  for (let i = 0; i < 8; i++) {
    const idx = state.cornerPos[i], ori = state.cornerOri[i];
    const faces = CORNER_FACES[idx];
    const rotated = [faces[(0 - ori + 3) % 3], faces[(1 - ori + 3) % 3], faces[(2 - ori + 3) % 3]];
    for (let j = 0; j < 3; j++) {
      const { face, sticker } = CORNER_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rotated[j]];
    }
  }
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
// TOAST NOTIFICATIONS
// -----------------------------------------------------------------------------

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  };
  toast.innerHTML = `${icons[type]}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastIn 0.3s reverse'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// -----------------------------------------------------------------------------
// WEB APP STATE & UI
// -----------------------------------------------------------------------------

let currentStickers = {};
let selectedColor = 'W';
let solutionMoves = [];
let animState = null;
let faceElements = {};

function initCubeNet() {
  const net = document.getElementById('cube-net');
  net.innerHTML = '';
  faceElements = {};
  for (const f of FACE_ORDER) {
    const faceDiv = document.createElement('div');
    faceDiv.className = 'face ' + f;
    faceDiv.dataset.face = f;
    faceDiv.setAttribute('role', 'group');
    faceDiv.setAttribute('aria-label', `Face ${f}`);
    for (let i = 0; i < 9; i++) {
      const sticker = document.createElement('button');
      sticker.className = 'sticker' + (i === 4 ? ' center' : '');
      sticker.dataset.face = f;
      sticker.dataset.index = i;
      sticker.setAttribute('aria-label', `${f} sticker ${i + 1}`);
      sticker.setAttribute('tabindex', '0');
      sticker.addEventListener('click', () => setSticker(f, i));
      sticker.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSticker(f, i); }
      });
      faceDiv.appendChild(sticker);
    }
    net.appendChild(faceDiv);
    faceElements[f] = faceDiv;
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
    btn.setAttribute('aria-label', `Select ${c}`);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.addEventListener('click', () => selectColor(c));
    palette.appendChild(btn);
  }
  selectColor('W');
}

function selectColor(c) {
  selectedColor = c;
  document.querySelectorAll('.color-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === c);
    b.setAttribute('aria-checked', b.dataset.color === c);
  });
}

function setSticker(face, index) {
  currentStickers[face][index] = selectedColor;
  renderStickers();
  checkSolveReady();
}

function resetCube() {
  currentStickers = {};
  const defaults = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };
  for (const f of FACE_ORDER) currentStickers[f] = new Array(9).fill(defaults[f]);
  renderStickers();
  selectColor('W');
  hideOutput();
  hideVisualizer();
  showToast('Cube reset to solved state', 'info');
}

function randomScramble() {
  let state = cloneState(SOLVED_STATE);
  const moves = [];
  let lastFace = -1;
  for (let i = 0; i < 25; i++) {
    let mi;
    do { mi = Math.floor(Math.random() * BASIC_MOVES.length); } while (Math.floor(mi / 3) === lastFace);
    lastFace = Math.floor(mi / 3);
    const m = BASIC_MOVES[mi];
    moves.push(m);
    state = applyMove(state, MOVE_TABLES[m]);
  }
  const faceToColor = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
  currentStickers = cubieToStickers(state, faceToColor);
  renderStickers();
  checkSolveReady();
  showToast('Random scramble generated', 'success');
}

function renderStickers() {
  for (const f of FACE_ORDER) {
    const faceDiv = faceElements[f];
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
  const hint = document.getElementById('solve-hint');
  const valid = isValidInput();
  btn.disabled = !valid;
  if (valid) {
    hint.textContent = 'Ready to solve! Click "Solve Cube"';
    hint.style.color = 'var(--success)';
  } else {
    hint.textContent = 'Complete all 6 faces with valid centers to enable solving';
    hint.style.color = 'var(--text-dim)';
  }
}

function isValidInput() {
  try { return validateCenters(currentStickers).valid; } catch { return false; }
}

async function solve() {
  const btn = document.getElementById('solve-btn');
  const btnText = btn.querySelector('.btn-text');
  const originalText = btnText.textContent;
  btn.disabled = true;
  btnText.innerHTML = '<span class="spinner"></span> Solving...';
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

    if (!solutionMoves) throw new Error('No solution found within depth 12 (Phase 1 limit)');

    const finalState = applyMoves(cubeState, solutionMoves);
    const solved = equalsCube(finalState, SOLVED_STATE);

    showOutput(solutionMoves, elapsed, solved);
    setupVisualizer(cubeState, solutionMoves);
    showToast(`Solved in ${solutionMoves.length} moves (${elapsed}ms)`, 'success');
  } catch (e) {
    showError(e.message);
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = originalText;
  }
}

function showOutput(moves, time, solved) {
  const section = document.getElementById('output-section');
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('move-count').textContent = moves.length;
  document.getElementById('solve-time').textContent = `${time}ms`;
  document.getElementById('phase-info').textContent = solved ? 'Solved ✓' : 'G1 Subgroup';
  document.getElementById('error-display').hidden = true;

  const display = document.getElementById('moves-display');
  display.innerHTML = moves.map((m, i) => {
    let cls = 'move';
    if (m.endsWith("'")) cls += ' prime';
    else if (m.endsWith('2')) cls += ' double';
    return `<span class="${cls}" style="--i: ${i}">${m.replace("'", "<span class='prime-symbol'>'</span>").replace('2', "<span class='double-symbol'>2</span>")}</span>`;
  }).join(' ');

  document.getElementById('copy-btn').hidden = false;
  document.getElementById('copy-btn').onclick = () => {
    navigator.clipboard.writeText(moves.join(' '));
    showToast('Solution copied to clipboard!', 'success');
  };
}

function showError(msg) {
  const err = document.getElementById('error-display');
  document.getElementById('error-message').textContent = msg;
  err.hidden = false;
}

function hideOutput() { document.getElementById('output-section').hidden = true; }

function setupVisualizer(initialState, moves) {
  const section = document.getElementById('visualizer-section');
  section.hidden = false;
  animState = { initialState: cloneState(initialState), moves, currentStep: 0, playing: false, timer: null };
  drawCube(animState.initialState);
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

  const faceSize = 100, stickerSize = faceSize / 3;
  const facePositions = {
    U: { x: faceSize * 1.2, y: 20 },
    L: { x: 20, y: faceSize * 1.2 + 20 },
    F: { x: faceSize * 1.2 + 20, y: faceSize * 1.2 + 20 },
    R: { x: faceSize * 2.4 + 40, y: faceSize * 1.2 + 20 },
    B: { x: faceSize * 3.6 + 60, y: faceSize * 1.2 + 20 },
    D: { x: faceSize * 1.2 + 20, y: faceSize * 2.4 + 60 },
  };

  const faceToColor = { W: '#fefefe', Y: '#fde047', R: '#f87171', O: '#fb923c', G: '#4ade80', B: '#60a5fa' };

  for (const f of FACE_ORDER) {
    const pos = facePositions[f];
    const stickers = cubieToStickers(state, { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B });
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      const color = faceToColor[stickers[f][i]] || '#333';
      ctx.fillStyle = color;
      const x = pos.x + col * stickerSize;
      const y = pos.y + row * stickerSize;
      const r = 6;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, stickerSize - 4, stickerSize - 4, r);
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Face label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f, pos.x + faceSize / 2, pos.y - 6);
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

// -----------------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initCubeNet();
  initColorPalette();

  document.getElementById('solve-btn').addEventListener('click', solve);
  document.getElementById('reset-btn').addEventListener('click', resetCube);
  document.getElementById('random-btn').addEventListener('click', randomScramble);

  document.getElementById('about-link').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Rubik\'s Cube Solver v1.0 • Cubie Representation • Kociemba Phase 1', 'info');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    if (e.key === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('solve-btn').click(); }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('reset-btn').click(); }
    if (e.key === ' ' && !e.target.closest('.sticker')) { e.preventDefault(); if (animState && !animState.playing) playAnimation(); else if (animState) pauseAnimation(); }
  });
});