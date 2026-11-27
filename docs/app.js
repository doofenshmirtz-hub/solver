// ============================================================================
// Solver Suite - Complete Web App (No Dependencies)
// Canvas 2D renderer + Cubie Representation + Kociemba + Sudoku Backtracking + Minimax
// ============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS - Cube
// -----------------------------------------------------------------------------

const Face = { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
const FACE_ORDER = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
const COLORS = ['W', 'Y', 'R', 'O', 'G', 'B'];
const OPPOSITE = { W: 'Y', Y: 'W', R: 'O', O: 'R', G: 'B', B: 'G' };

// Corner cubies: [U/D, R/L, F/B] in clockwise order
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

// Edge cubies: [face1, face2]
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

// Sticker indices on each face (3x3 grid, row-major: 0 1 2 / 3 4 5 / 6 7 8)
// For each corner/edge, which sticker index on each face it occupies
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

const COLOR_CSS = { W: '#fefefe', Y: '#fde047', R: '#f87171', O: '#fb923c', G: '#4ade80', B: '#60a5fa' };

// -----------------------------------------------------------------------------
// MOVE TABLES - How each move affects the cube state
// -----------------------------------------------------------------------------

const MOVE_TABLES = {};
const moveDefs = {
  U: { cp: [3,0,1,2,4,5,6,7], co: [0,0,0,0,0,0,0,0], ep: [3,0,1,2,4,5,6,7,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  R: { cp: [4,1,2,0,7,5,6,3], co: [2,0,0,1,1,0,0,2], ep: [8,1,2,3,11,5,6,7,4,9,10,0], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  F: { cp: [1,5,2,3,0,4,6,7], co: [1,2,0,0,2,1,0,0], ep: [0,9,2,3,4,8,6,7,1,5,10,11], eo: [0,1,0,0,0,1,0,0,1,1,0,0] },
  D: { cp: [0,1,2,3,5,6,7,4], co: [0,0,0,0,0,0,0,0], ep: [0,1,2,3,5,6,7,4,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  L: { cp: [0,2,6,3,4,1,5,7], co: [0,1,2,0,0,2,1,0], ep: [0,1,11,3,4,5,9,7,8,2,10,6], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  B: { cp: [0,1,3,7,4,5,2,6], co: [0,0,1,2,0,0,2,1], ep: [0,1,2,11,4,5,6,10,8,9,3,7], eo: [0,0,0,1,0,0,0,1,0,0,1,1] },
};

function applyPerm(p1, p2) { return p1.map(i => p2[i]); }
function applyOri(perm, d) { return perm.map(i => d[i]); }
function addOri(a, b, m) { return a.map((v, i) => (v + b[i]) % m); }

for (const [m, d] of Object.entries(moveDefs)) {
  MOVE_TABLES[m] = { cp: [...d.cp], co: [...d.co], ep: [...d.ep], eo: [...d.eo] };
  const cp1 = applyPerm(d.cp, d.cp), cp2 = applyPerm(cp1, d.cp);
  const co1 = addOri(applyOri(d.cp, d.co), d.co, 3), co2 = addOri(co1, d.co, 3);
  const ep1 = applyPerm(d.ep, d.ep), ep2 = applyPerm(ep1, d.ep);
  const eo1 = addOri(applyOri(d.ep, d.eo), d.eo, 2), eo2 = addOri(eo1, d.eo, 2);
  MOVE_TABLES[m + "'"] = { cp: cp2, co: co2, ep: ep2, eo: eo2 };
  MOVE_TABLES[m + '2'] = { cp: cp1, co: co1, ep: ep1, eo: eo1 };
}

function applyMove(s, mt) {
  return {
    cornerPos: mt.cp.map((_, i) => s.cornerPos[mt.cp[i]]),
    cornerOri: mt.cp.map((_, i) => (s.cornerOri[mt.cp[i]] + mt.co[i]) % 3),
    edgePos: mt.ep.map((_, i) => s.edgePos[mt.ep[i]]),
    edgeOri: mt.ep.map((_, i) => (s.edgeOri[mt.ep[i]] + mt.eo[i]) % 2),
  };
}
function equalsCube(a, b) {
  return a.cornerPos.every((v, i) => v === b.cornerPos[i]) &&
         a.cornerOri.every((v, i) => v === b.cornerOri[i]) &&
         a.edgePos.every((v, i) => v === b.edgePos[i]) &&
         a.edgeOri.every((v, i) => v === b.edgeOri[i]);
}
function cloneState(s) {
  return { cornerPos: [...s.cornerPos], cornerOri: [...s.cornerOri], edgePos: [...s.edgePos], edgeOri: [...s.edgeOri] };
}

// -----------------------------------------------------------------------------
// SOLVER - Kociemba Two-Phase Algorithm (Phase 1 implemented)
// -----------------------------------------------------------------------------

// Phase 1: Solve to G1 subgroup (edges oriented, corners oriented, E-slice in place)
// Coordinates: corner orientation (3^7=2187), edge orientation (2^11=2048), E-slice (495)

function solveCube(facelets) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('This browser does not support background cube solving.'));
      return;
    }

    const worker = new Worker('cube-solver-worker.js', { type: 'module' });
    worker.onmessage = (event) => {
      worker.terminate();
      if (event.data && event.data.ok && event.data.verified) resolve(event.data);
      else reject(new Error(event.data?.error || 'The cube solver failed to verify its result.'));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error('Could not load the cube-solving engine. Check your internet connection and reload the page.'));
    };
    worker.postMessage({ facelets });
  });
}

function idsSearch(state, depth, lastMove, path) {
  if (depth === 0) {
    if (equalsCube(state, SOLVED_STATE)) return path;
    return null;
  }
  for (let mi = 0; mi < BASIC_MOVES.length; mi++) {
    if (lastMove >= 0 && Math.floor(lastMove / 3) === Math.floor(mi / 3)) continue;
    const m = BASIC_MOVES[mi];
    const nextState = applyMove(state, MOVE_TABLES[m]);
    const newPath = path.concat([m]);
    const result = idsSearch(nextState, depth - 1, mi, newPath);
    if (result) return result;
  }
  return null;
}

// -----------------------------------------------------------------------------
// CUBE INPUT PARSING - 54 Stickers → Cubie Representation (40 numbers)
// -----------------------------------------------------------------------------

function validateCenters(stickers) {
  const counts = Object.fromEntries(COLORS.map(color => [color, 0]));
  for (const face of FACE_ORDER) {
    if (!Array.isArray(stickers[face]) || stickers[face].length !== 9) {
      return { valid: false, error: 'Each cube face must contain exactly 9 stickers.' };
    }
    for (const color of stickers[face]) {
      if (!(color in counts)) return { valid: false, error: 'Unknown sticker color detected.' };
      counts[color]++;
    }
  }
  const incorrectCount = Object.entries(counts).find(([, count]) => count !== 9);
  if (incorrectCount) {
    return { valid: false, error: 'A valid 3×3 cube must have exactly 9 stickers of each color. ' + incorrectCount[0] + ' currently has ' + incorrectCount[1] + '.' };
  }

  const centers = {};
  for (const f of FACE_ORDER) centers[f] = stickers[f][4];
  if (new Set(Object.values(centers)).size !== 6) return { valid: false, error: 'Center colors must be 6 distinct colors' };

  const oppositePairs = [[Face.U, Face.D], [Face.R, Face.L], [Face.F, Face.B]];
  for (const [f1, f2] of oppositePairs) {
    if (OPPOSITE[centers[f1]] !== centers[f2]) return { valid: false, error: `Invalid opposites: ${centers[f1]} vs ${centers[f2]}` };
  }

  const colorToFace = {};
  for (const [f, c] of Object.entries(centers)) colorToFace[c] = f;
  return { valid: true, centers, colorToFace };
}

function stickersToCubie(stickers, colorToFace) {
  const state = { cornerPos: new Array(8), cornerOri: new Array(8), edgePos: new Array(12), edgeOri: new Array(12) };
  const faceToColor = {};
  for (const [c, f] of Object.entries(colorToFace)) faceToColor[f] = c;

  // Build signature maps for solved cube
  const cornerMap = new Map(), edgeMap = new Map();
  for (let i = 0; i < 8; i++) {
    const faces = CORNER_FACES[i];
    const sig = faces.map(f => Object.keys(colorToFace).find(k => colorToFace[k] === f)).sort().join(',');
    cornerMap.set(sig, i);
  }
  for (let i = 0; i < 12; i++) {
    const faces = EDGE_FACES[i];
    const sig = faces.map(f => Object.keys(colorToFace).find(k => colorToFace[k] === f)).sort().join(',');
    edgeMap.set(sig, i);
  }

  // Parse corners from sticker colors
  for (let i = 0; i < 8; i++) {
    const sc = CORNER_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const sf = sc.map(c => colorToFace[c]);
    const sig = [...sf].sort((a, b) => Object.keys(colorToFace).indexOf(a) - Object.keys(colorToFace).indexOf(b)).join(',');
    const idx = cornerMap.get(sig);
    if (idx === undefined) throw new Error('Invalid corner at ' + i);
    state.cornerPos[i] = idx;
    const uInCubie = CORNER_FACES[idx].findIndex(f => f === Face.U || f === Face.D);
    const uInSlot = CORNER_FACES[i].findIndex(f => f === Face.U || f === Face.D);
    state.cornerOri[i] = (uInCubie - uInSlot + 3) % 3;
  }

  // Parse edges from sticker colors
  for (let i = 0; i < 12; i++) {
    const sc = EDGE_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const sf = sc.map(c => colorToFace[c]);
    const sig = [...sf].sort().join(',');
    const idx = edgeMap.get(sig);
    if (idx === undefined) throw new Error('Invalid edge at ' + i);
    state.edgePos[i] = idx;
    const primaryFace = EDGE_FACES[idx][0];
    state.edgeOri[i] = (sf[0] === primaryFace) ? 0 : 1;
  }

  return state;
}

function cubieToStickers(state, colorToFace) {
  const faceToColor = {};
  for (const [c, f] of Object.entries(colorToFace)) faceToColor[f] = c;
  const stickers = {};
  for (const f of FACE_ORDER) stickers[f] = new Array(9).fill(faceToColor[f]);
  for (const f of FACE_ORDER) stickers[f][4] = faceToColor[f];

  // Corners
  for (let i = 0; i < 8; i++) {
    const id = state.cornerPos[i], o = state.cornerOri[i];
    const fs = CORNER_FACES[id];
    const rs = [fs[(0 - o + 3) % 3], fs[(1 - o + 3) % 3], fs[(2 - o + 3) % 3]];
    for (let j = 0; j < 3; j++) {
      const { face, sticker } = CORNER_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rs[j]];
    }
  }

  // Edges
  for (let i = 0; i < 12; i++) {
    const id = state.edgePos[i], o = state.edgeOri[i];
    const fs = EDGE_FACES[id];
    const rs = o === 0 ? fs : [fs[1], fs[0]];
    for (let j = 0; j < 2; j++) {
      const { face, sticker } = EDGE_STICKER_MAP[i][j];
      stickers[face][sticker] = faceToColor[rs[j]];
    }
  }

  return stickers;
}

// -----------------------------------------------------------------------------
// CANVAS 2D RENDERER
// -----------------------------------------------------------------------------

class CubeRenderer {
  constructor(el, pickerColor = 'W') {
    this.el = el;
    this.pickerColor = pickerColor;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.el.appendChild(this.canvas);
    this.stickerColors = {};
    this.hovered = null;
    this.dragging = false;
    this.last = { x: 0, y: 0 };
    this.angle = { x: 0.5, y: 0.5 };
    this.dist = 5;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ready = false;
    this.resizeObserver = null;
    this.init();
  }

  init() {
    this.buildGeometry();
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.touchAction = 'none';
    this.canvas.addEventListener('mousemove', e => this.onMove(e));
    this.canvas.addEventListener('click', e => this.onClick(e));
    this.canvas.addEventListener('pointerdown', e => this.onDown(e));
    this.canvas.addEventListener('pointerup', e => this.onUp(e));
    this.canvas.addEventListener('pointercancel', e => this.onUp(e));
    this.canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());

    const resize = () => this.resize();
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(this.el);
    } else {
      window.addEventListener('resize', resize);
    }
    requestAnimationFrame(() => { this.resize(); this.ready = true; this.draw(); });
  }

  resize() {
    const rect = this.el.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(w * dpr);
    const pixelHeight = Math.round(h * dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight || this.dpr !== dpr) {
      this.dpr = dpr;
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.draw();
    }
    return { w, h, dpr };
  }

  buildGeometry() {
    this.geom = {};
    const sz = 0.58, gap = 0.03, off = 1.01;
    const config = {
      U: { normal: [0, 1, 0], rot: [0, 0, 0], pos: [0, 1.05, 0] },
      D: { normal: [0, -1, 0], rot: [Math.PI, 0, 0], pos: [0, -1.05, 0] },
      F: { normal: [0, 0, 1], rot: [-Math.PI / 2, 0, 0], pos: [0, 0, 1.05] },
      B: { normal: [0, 0, -1], rot: [Math.PI / 2, 0, 0], pos: [0, 0, -1.05] },
      R: { normal: [1, 0, 0], rot: [0, 0, -Math.PI / 2], pos: [1.05, 0, 0] },
      L: { normal: [-1, 0, 0], rot: [0, 0, Math.PI / 2], pos: [-1.05, 0, 0] },
    };

    for (const f of FACE_ORDER) {
      const cfg = config[f];
      this.geom[f] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const i = r * 3 + c;
          const st = -sz - gap;
          let x = c * (sz + gap) + st, y = -r * (sz + gap) - st, z = off / 2;
          const [rx, ry, rz] = cfg.rot;
          if (rz) { const cs = Math.cos(rz), sn = Math.sin(rz); [x, y] = [x * cs - y * sn, x * sn + y * cs]; }
          if (ry) { const cs = Math.cos(ry), sn = Math.sin(ry); [x, z] = [x * cs + z * sn, -x * sn + z * cs]; }
          if (rx) { const cs = Math.cos(rx), sn = Math.sin(rx); [y, z] = [y * cs - z * sn, y * sn + z * cs]; }
          x += cfg.pos[0]; y += cfg.pos[1]; z += cfg.pos[2];
          this.geom[f].push({ i, r, c, face: f, world: { x, y, z }, normal: cfg.normal, sz, center: r === 1 && c === 1 });
        }
      }
    }
  }

  getColor(f, i) { return this.stickerColors[f + ':' + i] || this.defaultColor(f); }
  defaultColor(f) { return { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' }[f]; }
  setColor(f, i, c) { this.stickerColors[f + ':' + i] = c; this.draw(); }
  setAll(colors) { for (const f of FACE_ORDER) for (let i = 0; i < 9; i++) this.setColor(f, i, colors[f]); }
  setState(s, ct) { const st = cubieToStickers(s, ct); for (const f of FACE_ORDER) for (let i = 0; i < 9; i++) this.setColor(f, i, st[f][i]); }
  setFacelets(facelets, faceToColor) {
    if (typeof facelets !== 'string' || facelets.length !== 54) throw new Error('Invalid facelet snapshot');
    for (let f = 0; f < FACE_ORDER.length; f++) {
      const face = FACE_ORDER[f];
      for (let i = 0; i < 9; i++) this.stickerColors[face + ':' + i] = faceToColor[facelets[f * 9 + i]];
    }
    this.draw();
  }

  onMove(e) {
    const r = this.el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    this.hovered = this.hitTest(x, y);
    this.canvas.style.cursor = this.hovered ? 'pointer' : 'grab';
    this.draw();
  }

  onClick(e) {
    if (this.dragging) return;
    const r = this.el.getBoundingClientRect();
    const hit = this.hitTest(e.clientX - r.left, e.clientY - r.top);
    if (hit && window.app) window.app.onStickerChange(hit.face, hit.i, this.pickerColor);
  }

  onDown(e) { this.dragging = true; this.last = { x: e.clientX, y: e.clientY }; this.canvas.style.cursor = 'grabbing'; }
  onUp(e) { this.dragging = false; this.canvas.style.cursor = 'grab'; }
  onPointerMove(e) {
    if (!this.dragging) return;
    const dx = e.clientX - this.last.x, dy = e.clientY - this.last.y;
    this.last = { x: e.clientX, y: e.clientY };
    this.angle.y -= dx * 0.01;
    this.angle.x += dy * 0.01;
    this.angle.x = Math.max(-1.47, Math.min(1.47, this.angle.x));
    this.draw();
  }
  onWheel(e) { e.preventDefault(); this.dist += e.deltaY * 0.01; this.dist = Math.max(3, Math.min(10, this.dist)); this.draw(); }

  hitTest(x, y) {
    const r = this.el.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const sc = Math.min(r.width, r.height) / 2 / this.dist;
    const camX = this.dist * Math.sin(this.angle.y) * Math.cos(this.angle.x);
    const camY = this.dist * Math.sin(this.angle.x);
    const camZ = this.dist * Math.cos(this.angle.y) * Math.cos(this.angle.x);
    const rdx = (x - cx) / sc - camX, rdy = (cy - y) / sc - camY, rdz = -camZ;
    const rl = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
    const rdxn = rdx / rl, rdyn = rdy / rl, rdzn = rdz / rl;
    let best = null, bd = Infinity;
    for (const f of FACE_ORDER) for (const s of this.geom[f]) {
      const n = s.normal; const denom = rdxn * n[0] + rdyn * n[1] + rdzn * n[2];
      if (Math.abs(denom) < 0.001) continue;
      const t = -(rdxn * s.world.x + rdyn * s.world.y + rdzn * s.world.z) / denom;
      if (t < 0) continue;
      const ix = rdxn * t, iy = rdyn * t, iz = rdzn * t;
      const lx = ix - s.world.x, ly = iy - s.world.y;
      const hs = s.sz / 2 + 0.01;
      if (Math.abs(lx) <= hs && Math.abs(ly) <= hs && t < bd) { bd = t; best = s; }
    }
    return best;
  }

  draw() {
    if (!this.ctx || !this.canvas.width || !this.canvas.height) return;
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 2 / this.dist;

    const vx = -this.dist * Math.sin(this.angle.y) * Math.cos(this.angle.x);
    const vy = -this.dist * Math.sin(this.angle.x);
    const vz = -this.dist * Math.cos(this.angle.y) * Math.cos(this.angle.x);

    const list = [];
    for (const f of FACE_ORDER) for (const s of this.geom[f]) {
      const dot = s.normal[0] * vx + s.normal[1] * vy + s.normal[2] * vz;
      if (dot <= 0) continue;
      const depth = s.world.x * vx + s.world.y * vy + s.world.z * vz;
      list.push({ s, depth, dot });
    }
    list.sort((a, b) => b.depth - a.depth);

    for (const { s, dot } of list) {
      const x = s.world.x * sc + cx, y = -s.world.y * sc + cy, sz = s.sz * sc;
      const col = this.getColor(s.face, s.i);
      const l = 0.5 + 0.5 * dot;
      const rgb = hexToRgb(COLOR_CSS[col]);
      ctx.fillStyle = `rgb(${Math.floor(rgb.r * l)},${Math.floor(rgb.g * l)},${Math.floor(rgb.b * l)})`;
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = Math.max(1, sz * 0.03);
      roundRect(ctx, x - sz / 2, y - sz / 2, sz, sz, Math.max(2, sz * 0.08));
      ctx.fill();
      ctx.stroke();
      if (this.hovered === s) { ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = Math.max(2, sz * 0.05); ctx.stroke(); }
      if (s.center) { ctx.strokeStyle = '#8b5cf6'; ctx.lineWidth = 2; ctx.strokeRect(x - sz / 2 - 2, y - sz / 2 - 2, sz + 4, sz + 4); }
    }
  }
}

// -----------------------------------------------------------------------------
// MAIN APP STATE & EVENTS - Cube Solver
// -----------------------------------------------------------------------------

let currentStickers = {};
let selectedColor = 'W';
let solutionMoves = [];
let animState = null;
let inputCube = null;
let visualizerCube = null;
let appReady = false;

function initApp() {
  // Initialize color palette
  const palette = document.getElementById('color-palette');
  if (!palette) return;
  palette.innerHTML = '';
  for (const c of COLORS) {
    const btn = document.createElement('button');
    btn.className = 'color-btn ' + c;
    btn.dataset.color = c;
    btn.addEventListener('click', () => selectColor(c));
    palette.appendChild(btn);
  }
  selectColor('W');

  // Initialize cubes after DOM ready
  setTimeout(() => {
    const inputEl = document.getElementById('cube-3d-input');
    const visEl = document.getElementById('cube-3d-container');
    if (inputEl) inputCube = new CubeRenderer(inputEl, 'W');
    if (visEl) visualizerCube = new CubeRenderer(visEl, 'W');
    resetAll();
    appReady = true;
  }, 100);

  initCameraInput();

  // Event listeners
  const solveBtn = document.getElementById('solve-btn');
  const resetBtn = document.getElementById('reset-btn');
  const randomBtn = document.getElementById('random-btn');

  if (solveBtn) solveBtn.addEventListener('click', solve);
  if (resetBtn) resetBtn.addEventListener('click', resetAll);
  if (randomBtn) randomBtn.addEventListener('click', randomScramble);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    if (e.key === 's' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('solve-btn').click(); }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); document.getElementById('reset-btn').click(); }
    if (e.key === ' ' && !e.target.closest('.color-btn')) { e.preventDefault(); if (animState && !animState.playing) playAnimation(); else if (animState) pauseAnimation(); }
    const ck = ['W', 'Y', 'R', 'O', 'G', 'B'];
    const n = parseInt(e.key);
    if (n >= 1 && n <= 6) { selectColor(ck[n - 1]); }
  });
}

function selectColor(c) {
  selectedColor = c;
  if (inputCube) inputCube.pickerColor = c;
  if (visualizerCube) visualizerCube.pickerColor = c;
  document.querySelectorAll('.color-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.color === c);
  });
}

function onStickerChange(face, index, color) {
  currentStickers[face][index] = color;
  checkReady();
}

function resetAll() {
  currentStickers = {};
  const def = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };
  for (const f of FACE_ORDER) currentStickers[f] = new Array(9).fill(def[f]);
  if (inputCube) inputCube.setAll(def);
  if (visualizerCube) visualizerCube.setAll(def);
  selectColor('W');
  hideOutput();
  hideVisualizer();
  showToast('Cube reset to solved state');
}

function randomScramble() {
  let lastFace = -1;
  const moves = [];
  for (let i = 0; i < 20; i++) {
    let mi;
    do { mi = Math.floor(Math.random() * BASIC_MOVES.length); } while (Math.floor(mi / 3) === lastFace);
    lastFace = Math.floor(mi / 3);
    moves.push(BASIC_MOVES[mi]);
  }

  let state = cloneState(SOLVED_STATE);
  for (const m of moves) state = applyMove(state, MOVE_TABLES[m]);

  const faceToColor = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
  currentStickers = cubieToStickers(state, faceToColor);
  if (inputCube) inputCube.setState(state, faceToColor);
  if (visualizerCube) visualizerCube.setState(state, faceToColor);
  checkReady();
  showToast('Scramble: ' + moves.join(' '));
}

function checkReady() {
  const valid = validateCenters(currentStickers).valid;
  const btn = document.getElementById('solve-btn');
  if (btn) btn.disabled = !valid;
  const hint = document.getElementById('solve-hint');
  if (hint) {
    hint.textContent = valid ? 'Ready to solve!' : 'Complete all 6 faces with valid centers';
    hint.style.color = valid ? 'var(--success)' : 'var(--text-dim)';
  }
}

async function solve() {
  const b = document.getElementById('solve-btn');
  const bt = b.querySelector('.btn-text');
  const originalText = bt.textContent;
  b.disabled = true;
  bt.textContent = 'Preparing solver...';
  hideOutput();
  hideVisualizer();

  try {
    const validation = validateCenters(currentStickers);
    if (!validation.valid) throw new Error(validation.error);

    const facelets = FACE_ORDER.map(face =>
      currentStickers[face].map(color => validation.colorToFace[color]).join('')
    ).join('');

    const startedAt = performance.now();
    bt.textContent = 'Solving in background...';
    const result = await solveCube(facelets);
    const elapsed = (performance.now() - startedAt).toFixed(1);
    solutionMoves = result.moves;

    showOutput(solutionMoves, elapsed, result.verified);
    const faceToColor = Object.fromEntries(Object.entries(validation.colorToFace).map(([color, face]) => [face, color]));
    setupVisualizer(result.snapshots[0], solutionMoves, result.snapshots.slice(1), faceToColor);
    showToast('Verified solution: ' + solutionMoves.length + ' moves (' + elapsed + 'ms)', 'success');
  } catch (error) {
    showErr(error.message);
    showToast(error.message, 'error');
  } finally {
    b.disabled = false;
    bt.textContent = originalText;
    checkReady();
  }
}

function showOutput(moves, dt, solved) {
  const section = document.getElementById('output-section');
  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth' });
  document.getElementById('move-count').textContent = moves.length;
  document.getElementById('solve-time').textContent = dt + 'ms';
  document.getElementById('phase-info').textContent = solved ? 'Solved ✓' : 'G1 Subgroup';
  document.getElementById('error-display').hidden = true;

  const display = document.getElementById('moves-display');
  display.innerHTML = moves.map((mv, i) => {
    let cls = 'move';
    if (mv.endsWith("'")) cls += ' prime';
    else if (mv.endsWith('2')) cls += ' double';
    return `<span class="${cls}" style="--i: ${i}">${mv}</span>`;
  }).join(' ');

  const copyBtn = document.getElementById('copy-btn');
  copyBtn.hidden = false;
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(moves.join(' '));
    showToast('Solution copied!');
  };
}

function showErr(msg) {
  document.getElementById('error-message').textContent = msg;
  document.getElementById('error-display').hidden = false;
}

function hideOutput() { document.getElementById('output-section').hidden = true; }
function hideVisualizer() { document.getElementById('visualizer-section').hidden = true; }

function setupVisualizer(initialFacelets, moves, verifiedStates = [], faceToColor = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' }) {
  document.getElementById('visualizer-section').hidden = false;
  if (visualizerCube) visualizerCube.setFacelets(initialFacelets, faceToColor);

  animState = { faceToColor, states: verifiedStates, moves, currentStep: 0, playing: false, timer: null };

  document.getElementById('play-btn').onclick = playAnimation;
  document.getElementById('pause-btn').onclick = pauseAnimation;
  document.getElementById('step-btn').onclick = stepAnimation;
  document.getElementById('speed-slider').oninput = (e) => {
    document.getElementById('speed-label').textContent = e.target.value + 'ms';
    if (animState.playing) { pauseAnimation(); playAnimation(); }
  };
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
  const facelets = animState.states[animState.currentStep];
  if (visualizerCube) visualizerCube.setFacelets(facelets, animState.faceToColor);
  animState.currentStep++;
  if (animState.currentStep >= animState.moves.length) pauseAnimation();
}

// -----------------------------------------------------------------------------
// SUDOKU SOLVER - Recursive Backtracking
// -----------------------------------------------------------------------------

function solveSudoku(board) {
  // board: 81-element array (0 = empty)
  const findEmpty = (b) => {
    for (let i = 0; i < 81; i++) if (b[i] === 0) return i;
    return -1;
  };

  const isValid = (b, idx, num) => {
    const row = Math.floor(idx / 9), col = idx % 9;
    // Check row
    for (let c = 0; c < 9; c++) if (b[row * 9 + c] === num) return false;
    // Check column
    for (let r = 0; r < 9; r++) if (b[r * 9 + col] === num) return false;
    // Check 3x3 box
    const br = Math.floor(row / 3) * 3, bc = Math.floor((idx % 9) / 3) * 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (b[(br + r) * 9 + (bc + c)] === num) return false;
    return true;
  };

  function backtrack(b) {
    const empty = findEmpty(b);
    if (empty === -1) return true; // Solved
    for (let num = 1; num <= 9; num++) {
      if (isValid(b, empty, num)) {
        b[empty] = num;
        if (backtrack(b)) return true;
        b[empty] = 0;
      }
    }
    return false;
  }

  const solution = [...board];
  backtrack(solution);
  return solution;
}

// -----------------------------------------------------------------------------
// TIC-TAC-TOE AI - Minimax
// -----------------------------------------------------------------------------

function tttCheckWin(board, player) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return lines.some(([a,b,c]) => board[a] === player && board[b] === player && board[c] === player);
}

function tttGetEmpty(board) { return board.map((v,i) => v === '' ? i : null).filter(v => v !== null); }

function tttMinimax(board, depth, isMax, player, opponent) {
  if (tttCheckWin(board, player)) return 10 - depth;
  if (tttCheckWin(board, opponent)) return depth - 10;
  if (tttGetEmpty(board).length === 0) return 0;

  if (isMax) {
    let best = -Infinity;
    for (const m of tttGetEmpty(board)) { board[m] = player; best = Math.max(best, tttMinimax(board, depth+1, false, player, opponent)); board[m] = ''; }
    return best;
  } else {
    let best = Infinity;
    for (const m of tttGetEmpty(board)) { board[m] = opponent; best = Math.min(best, tttMinimax(board, depth+1, true, player, opponent)); board[m] = ''; }
    return best;
  }
}

function tttBestMove(board, difficulty, player, opponent) {
  const empty = tttGetEmpty(board);
  if (empty.length === 0) return null;
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  if (difficulty === 'medium') return Math.random() < 0.7 ? tttBestMove(board, 'hard', player, opponent) : empty[Math.floor(Math.random() * empty.length)];
  // Hard - perfect minimax
  let bestScore = -Infinity, bestMove = null;
  for (const m of empty) { board[m] = player; const s = tttMinimax(board, 0, false, player, opponent); board[m] = ''; if (s > bestScore) { bestScore = s; bestMove = m; } }
  return bestMove;
}

let tttState = { board: Array(9).fill(''), currentPlayer: 'X', playerSymbol: 'X', aiSymbol: 'O', difficulty: 'hard', scores: { x: 0, o: 0, draw: 0 }, gameOver: false };

function tttInit() {
  const cells = document.querySelectorAll('.ttt-cell');
  cells.forEach(c => { c.textContent = ''; c.disabled = false; c.classList.remove('x', 'o', 'winning'); c.onclick = () => tttHandleClick(parseInt(c.dataset.pos)); });
  tttState.board = Array(9).fill(''); tttState.currentPlayer = 'X'; tttState.gameOver = false; tttUpdateStatus('Your turn (X)');
  const newGameButton = document.getElementById('ttt-new');
  if (newGameButton) newGameButton.onclick = tttInit;
  const swapButton = document.getElementById('ttt-swap');
  if (swapButton) swapButton.onclick = tttSwapSides;
  const difficultySelect = document.getElementById('ttt-difficulty');
  if (difficultySelect) difficultySelect.onchange = e => { tttState.difficulty = e.target.value; tttInit(); };
}

function tttSwapSides() { [tttState.playerSymbol, tttState.aiSymbol] = [tttState.aiSymbol, tttState.playerSymbol]; tttInit(); }

function tttHandleClick(pos) {
  if (tttState.gameOver || tttState.board[pos] !== '' || tttState.currentPlayer !== tttState.playerSymbol) return;
  tttMakeMove(pos, tttState.playerSymbol);
  if (tttCheckGameEnd()) return;
  tttState.currentPlayer = tttState.aiSymbol; tttUpdateStatus('AI thinking...');
  setTimeout(() => { if (!tttState.gameOver) { const m = tttBestMove(tttState.board, tttState.difficulty, tttState.aiSymbol, tttState.playerSymbol); if (m !== null) tttMakeMove(m, tttState.aiSymbol); tttCheckGameEnd(); } tttState.currentPlayer = tttState.playerSymbol; if (!tttState.gameOver) tttUpdateStatus('Your turn (X)'); }, 300);
}

function tttMakeMove(pos, player) { tttState.board[pos] = player; const c = document.querySelector(`.ttt-cell[data-pos="${pos}"]`); if (c) { c.textContent = player; c.classList.add(player.toLowerCase()); c.disabled = true; } }

function tttCheckGameEnd() {
  if (tttCheckWin(tttState.board, 'X')) { tttState.gameOver = true; tttState.scores.x++; tttUpdateScore(); tttHighlightWin('X'); tttUpdateStatus('You win! 🎉'); return true; }
  if (tttCheckWin(tttState.board, 'O')) { tttState.gameOver = true; tttState.scores.o++; tttUpdateScore(); tttHighlightWin('O'); tttUpdateStatus('AI wins! 🤖'); return true; }
  if (tttGetEmpty(tttState.board).length === 0) { tttState.gameOver = true; tttState.scores.draw++; tttUpdateScore(); tttUpdateStatus('Draw! 🤝'); return true; }
  return false;
}

function tttHighlightWin(p) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) if (tttState.board[a]===p && tttState.board[b]===p && tttState.board[c]===p) { document.querySelector(`.ttt-cell[data-pos="${a}"]`)?.classList.add('winning'); document.querySelector(`.ttt-cell[data-pos="${b}"]`)?.classList.add('winning'); document.querySelector(`.ttt-cell[data-pos="${c}"]`)?.classList.add('winning'); break; }
}

function tttUpdateScore() { document.getElementById('ttt-score-x').textContent = tttState.scores.x; document.getElementById('ttt-score-o').textContent = tttState.scores.o; document.getElementById('ttt-score-draw').textContent = tttState.scores.draw; }
function tttUpdateStatus(m) { const el = document.getElementById('ttt-status'); if (el) el.textContent = m; }

// -----------------------------------------------------------------------------
// SUDOKU UI - 9x9 Grid with Backtracking
// -----------------------------------------------------------------------------

let sudokuState = { board: Array(81).fill(0), given: Array(81).fill(false), selected: -1 };

function sudokuInit() {
  const grid = document.getElementById('sudoku-grid'); if (!grid) return; grid.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div'); cell.className = 'sudoku-cell'; cell.dataset.index = i; cell.textContent = sudokuState.board[i] || '';
    if (sudokuState.given[i]) cell.classList.add('given'); cell.onclick = () => sudokuSelectCell(i); grid.appendChild(cell);
  }
  const solveButton = document.getElementById('sudoku-solve');
  if (solveButton) solveButton.onclick = sudokuSolve;
  const clearButton = document.getElementById('sudoku-clear');
  if (clearButton) clearButton.onclick = sudokuClear;
  const newButton = document.getElementById('sudoku-new');
  if (newButton) newButton.onclick = sudokuNew;
  const validateButton = document.getElementById('sudoku-validate');
  if (validateButton) validateButton.onclick = sudokuValidate;
  document.onkeydown = sudokuHandleKeydown;
}

function sudokuSelectCell(i) { if (sudokuState.given[i]) return; document.querySelectorAll('.sudoku-cell').forEach(c => c.classList.remove('selected')); document.querySelector(`.sudoku-cell[data-index="${i}"]`)?.classList.add('selected'); sudokuState.selected = i; }

function sudokuHandleKeydown(e) {
  if (sudokuState.selected === -1) return;
  const n = parseInt(e.key); if (n >= 1 && n <= 9) { sudokuState.board[sudokuState.selected] = n; document.querySelector(`.sudoku-cell[data-index="${sudokuState.selected}"]`).textContent = n; sudokuValidateCell(sudokuState.selected); }
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { sudokuState.board[sudokuState.selected] = 0; document.querySelector(`.sudoku-cell[data-index="${sudokuState.selected}"]`).textContent = ''; document.querySelector(`.sudoku-cell[data-index="${sudokuState.selected}"]`)?.classList.remove('error'); }
  else if (e.key === 'ArrowUp' && sudokuState.selected >= 9) sudokuSelectCell(sudokuState.selected - 9);
  else if (e.key === 'ArrowDown' && sudokuState.selected < 72) sudokuSelectCell(sudokuState.selected + 9);
  else if (e.key === 'ArrowLeft' && sudokuState.selected % 9 !== 0) sudokuSelectCell(sudokuState.selected - 1);
  else if (e.key === 'ArrowRight' && sudokuState.selected % 9 !== 8) sudokuSelectCell(sudokuState.selected + 1);
}

function sudokuValidateCell(i) {
  const n = sudokuState.board[i]; if (n === 0) return true;
  const r = Math.floor(i / 9), c = i % 9; let ok = true;
  for (let j = 0; j < 9; j++) { if (j !== c && sudokuState.board[r * 9 + j] === n) ok = false; if (j !== r && sudokuState.board[j * 9 + c] === n) ok = false; }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const idx = (br + r) * 9 + (bc + c); if (idx !== i && sudokuState.board[idx] === n) ok = false; }
  const cell = document.querySelector(`.sudoku-cell[data-index="${i}"]`); if (cell) cell.classList.toggle('error', !ok); return ok;
}

function sudokuValidate() { let ok = true; for (let i = 0; i < 81; i++) if (sudokuState.board[i] !== 0 && !sudokuValidateCell(i)) ok = false; document.getElementById('sudoku-status').textContent = ok ? '✓ Valid so far' : '✗ Conflicts found'; document.getElementById('sudoku-status').style.color = ok ? 'var(--success)' : 'var(--danger)'; }

function sudokuSolve() { const sol = solveSudoku(sudokuState.board); sudokuState.board = sol; sudokuState.given = Array(81).fill(false); sudokuRender(); document.getElementById('sudoku-status').textContent = '✓ Solved!'; document.getElementById('sudoku-status').style.color = 'var(--success)'; }
function sudokuClear() { sudokuState.board = Array(81).fill(0); sudokuState.given = Array(81).fill(false); sudokuRender(); document.getElementById('sudoku-status').textContent = ''; }
function sudokuNew() { const base = [5,3,4,6,7,8,9,1,2,6,7,2,1,9,5,3,4,8,1,9,8,3,4,2,5,6,7,8,5,9,7,6,1,4,2,3,4,2,6,8,5,3,7,9,1,7,1,3,9,2,4,8,5,6,9,6,1,5,3,7,2,8,4,2,8,7,4,1,9,6,3,5,3,4,5,2,8,6,1,7,9]; sudokuState.board = base.map((v,i) => Math.random() < 0.6 ? 0 : v); sudokuState.given = base.map((v,i) => v !== sudokuState.board[i]); sudokuRender(); document.getElementById('sudoku-status').textContent = 'New puzzle generated'; }
function sudokuRender() { const g = document.getElementById('sudoku-grid'); if (!g) return; g.innerHTML = ''; for (let i = 0; i < 81; i++) { const c = document.createElement('div'); c.className = 'sudoku-cell'; c.dataset.index = i; c.textContent = sudokuState.board[i] || ''; if (sudokuState.given[i]) c.classList.add('given'); c.onclick = () => sudokuSelectCell(i); g.appendChild(c); } }

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

function hexToRgb(hex) {
  // COLOR_CSS stores CSS hex strings (for example, "#fefefe"), not integers.
  // Parse the string before extracting channels; bitwise-coercing a string
  // produces zero and makes every rendered sticker black.
  const value = Number.parseInt(String(hex).replace(/^#/, ''), 16);
  if (!Number.isFinite(value)) return { r: 0, g: 0, b: 0 };
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
function showToast(m, t) { const c = document.getElementById('toast-container'); const t2 = document.createElement('div'); t2.className = 'toast ' + (t || ''); t2.textContent = m; c.appendChild(t2); setTimeout(() => t2.remove(), 3000); }

// -----------------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // initApp owns cube creation and reset. Do not construct a second pair of
  // renderers here: duplicate canvases make pointer handling ambiguous.
  const path = window.location.pathname;
  if (path.includes('sudoku.html')) {
    setTimeout(sudokuInit, 100);
  } else if (path.includes('tictactoe.html')) {
    setTimeout(tttInit, 100);
  }
});

window.app = { onStickerChange, solveSudoku };

window.app = { onStickerChange, solveSudoku };

// -----------------------------------------------------------------------------
// CAMERA INPUT - Guided 3x3 face capture with manual correction
// -----------------------------------------------------------------------------
let cameraStream = null;

function initCameraInput() {
  const openButton = document.getElementById('camera-open');
  const closeButton = document.getElementById('camera-close');
  const captureButton = document.getElementById('camera-capture');
  const panel = document.getElementById('camera-panel');
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  const faceSelect = document.getElementById('camera-face');
  const status = document.getElementById('camera-status');

  if (!openButton || !video || !canvas || !captureButton || !panel) return;

  openButton.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('Camera access is unavailable in this browser.', 'error');
      return;
    }
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = cameraStream;
      await video.play();
      panel.hidden = false;
      status.textContent = 'Camera ready. Select the face shown and capture it.';
      openButton.hidden = true;
    } catch (error) {
      status.textContent = 'Camera permission was denied or no camera is available.';
      showToast(status.textContent, 'error');
    }
  });

  const closeCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    video.srcObject = null;
    panel.hidden = true;
    openButton.hidden = false;
    status.textContent = 'Camera is off.';
  };

  closeButton?.addEventListener('click', closeCamera);
  captureButton.addEventListener('click', () => {
    if (!video.videoWidth || !video.videoHeight) {
      status.textContent = 'Wait until the camera preview is ready.';
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, width, height);

    const palette = {
      W: [254, 254, 254],
      Y: [253, 224, 71],
      R: [248, 113, 113],
      O: [251, 146, 60],
      G: [74, 222, 128],
      B: [96, 165, 250]
    };
    const sampleColor = (x, y) => {
      const radius = Math.max(2, Math.floor(Math.min(width, height) * 0.008));
      const data = context.getImageData(
        Math.max(0, Math.floor(x) - radius),
        Math.max(0, Math.floor(y) - radius),
        Math.min(radius * 2 + 1, width - Math.max(0, Math.floor(x) - radius)),
        Math.min(radius * 2 + 1, height - Math.max(0, Math.floor(y) - radius))
      ).data;
      let red = 0, green = 0, blue = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        red += data[i]; green += data[i + 1]; blue += data[i + 2]; count++;
      }
      red /= count; green /= count; blue /= count;
      let best = 'W', bestDistance = Infinity;
      for (const [color, rgb] of Object.entries(palette)) {
        const distance = (red-rgb[0])**2 + (green-rgb[1])**2 + (blue-rgb[2])**2;
        if (distance < bestDistance) { bestDistance = distance; best = color; }
      }
      return best;
    };

    const captured = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        captured.push(sampleColor((col + 0.5) * width / 3, (row + 0.5) * height / 3));
      }
    }

    const face = faceSelect.value;
    currentStickers[face] = captured;
    if (inputCube) for (let i = 0; i < 9; i++) inputCube.setColor(face, i, captured[i]);
    checkReady();
    status.textContent = face + ' face captured. Select another face or correct stickers manually.';
    showToast(face + ' face captured — please review the detected colors.');
  });

  window.addEventListener('pagehide', () => {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  });
}
