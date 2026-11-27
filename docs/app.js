// ============================================================================
// Rubik's Cube Solver - Complete Web App (No Dependencies)
// Canvas 2D renderer + Cubie solver + Method guides + Sudoku + TicTacToe
// ============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const Face = { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
const FACE_ORDER = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B];
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

const COLOR_CSS = { W: '#fefefe', Y: '#fde047', R: '#f87171', O: '#fb923c', G: '#4ade80', B: '#60a5fa' };

const MOVE_TABLES = {};
const moveDefs = {
  U: { cp: [3,0,1,2,4,5,6,7], co: [0,0,0,0,0,0,0,0], ep: [3,0,1,2,4,5,6,7,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  R: { cp: [4,1,2,0,7,5,6,3], co: [2,0,0,1,1,0,0,2], ep: [8,1,2,3,11,5,6,7,4,9,10,0], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  F: { cp: [1,5,2,3,0,4,6,7], co: [1,2,0,0,2,1,0,0], ep: [0,9,2,3,4,8,6,7,1,5,10,11], eo: [0,1,0,0,0,1,0,0,1,1,0,0] },
  D: { cp: [0,1,2,3,5,6,7,4], co: [0,0,0,0,0,0,0,0], ep: [0,1,2,3,5,6,7,4,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
  L: { cp: [0,2,6,3,4,1,5,7], co: [0,1,2,0,0,2,1,0], ep: [0,1,10,3,4,5,9,7,8,2,11,6], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
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
// SOLVER (Kociemba Phase 1)
// -----------------------------------------------------------------------------

function solveCube(state) {
  // Simple iterative deepening for Phase 1
  for (let d = 0; d <= 12; d++) {
    const result = idsSearch(state, d, -1, []);
    if (result) return result;
  }
  return null;
}

function idsSearch(state, depth, lastMove, path) {
  if (depth === 0) {
    // Check if solved
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
// INPUT PARSING (Cubie Representation)
// -----------------------------------------------------------------------------

function validateCenters(stickers) {
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

  // Build signature maps
  const cornerMap = new Map(), edgeMap = new Map();
  for (let i = 0; i < 8; i++) {
    const sig = CORNER_FACES[i].map(f => Object.keys(colorToFace).find(k => colorToFace[k] === f)).sort().join(',');
    cornerMap.set(sig, i);
  }
  for (let i = 0; i < 12; i++) {
    const sig = EDGE_FACES[i].map(f => Object.keys(colorToFace).find(k => colorToFace[k] === f)).sort().join(',');
    edgeMap.set(sig, i);
  }

  // Corners
  for (let i = 0; i < 8; i++) {
    const sc = CORNER_STICKER_MAP[i].map(({ face, sticker }) => stickers[face][sticker]);
    const sf = sc.map(c => colorToFace[c]);
    const sig = [...sf].sort((a, b) => Object.keys(colorToFace)[Object.values(colorToFace).indexOf(a)] - Object.keys(colorToFace)[Object.values(colorToFace).indexOf(b)]).join(',');
    const idx = cornerMap.get(sig);
    if (idx === undefined) throw new Error('Invalid corner at ' + i);
    state.cornerPos[i] = idx;
    const uInCubie = CORNER_FACES[idx].findIndex(f => f === Face.U || f === Face.D);
    const uInSlot = CORNER_FACES[i].findIndex(f => f === Face.U || f === Face.D);
    state.cornerOri[i] = (uInCubie - uInSlot + 3) % 3;
  }

  // Edges
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
<<<<<<< HEAD
    this.stickerColors={}; // face:index -> color
    this.hovered=null; this.dragging=false; this.last={x:0,y:0};
    this.angle={x:0.5,y:0.5}; this.dist=5;
    this.dpr=Math.min(window.devicePixelRatio||1,2);
    this.ready=false;
    this.resizeObserver = null;
    this.init();
  }
  init(){
    // Build geometry and events after the container exists in the document.
    this.buildGeometry();
    this.canvas.style.width='100%';
    this.canvas.style.height='100%';
    this.canvas.style.touchAction='none';
    this.canvas.addEventListener('mousemove',e=>this.onMove(e));
    this.canvas.addEventListener('click',e=>this.onClick(e));
    this.canvas.addEventListener('pointerdown',e=>this.onDown(e));
    this.canvas.addEventListener('pointerup',e=>this.onUp(e));
    this.canvas.addEventListener('pointercancel',e=>this.onUp(e));
    this.canvas.addEventListener('pointermove',e=>this.onPointerMove(e));
    this.canvas.addEventListener('wheel',e=>this.onWheel(e),{passive:false});
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());

    const resize = () => this.resize();
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(this.el);
    } else {
      window.addEventListener('resize', resize);
    }
    requestAnimationFrame(() => { this.resize(); this.ready=true; this.draw(); });
  }
  resize(){
    const rect=this.el.getBoundingClientRect();
    const w=Math.max(1,rect.width);
    const h=Math.max(1,rect.height);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const pixelWidth=Math.round(w*dpr);
    const pixelHeight=Math.round(h*dpr);
    if(this.canvas.width!==pixelWidth||this.canvas.height!==pixelHeight||this.dpr!==dpr){
      this.dpr=dpr;
      this.canvas.width=pixelWidth;
      this.canvas.height=pixelHeight;
      this.draw();
    }
    return {w,h,dpr};
=======
    this.stickerColors = {};
    this.hovered = null;
    this.dragging = false;
    this.last = { x: 0, y: 0 };
    this.angle = { x: 0.5, y: 0.5 };
    this.dist = 5;
    this.init();
    this.draw();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.buildGeometry();
    this.canvas.addEventListener('mousemove', e => this.onMove(e));
    this.canvas.addEventListener('click', e => this.onClick(e));
    this.canvas.addEventListener('pointerdown', e => this.onDown(e));
    this.canvas.addEventListener('pointerup', e => this.onUp(e));
    this.canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  resize() {
    const rect = this.el.getBoundingClientRect();
    const w = rect.width || 400;
    const h = rect.height || 400;
    this.canvas.width = w * devicePixelRatio;
    this.canvas.height = h * devicePixelRatio;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.draw();
>>>>>>> e3c1719 (Complete solver app with Canvas 2D renderer)
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
<<<<<<< HEAD
  getColor(f,i){ return this.stickerColors[f+':'+i] || this.defaultColor(f); }
  defaultColor(f){ return {U:'W',R:'R',F:'G',D:'Y',L:'O',B:'B'}[f]; }
  setColor(f,i,c){ this.stickerColors[f+':'+i]=c; this.draw(); }
  setAll(colors){ for(const f of FACE_ORDER)for(let i=0;i<9;i++) this.stickerColors[f+':'+i]=colors[f]; this.draw(); }
  setState(s,ct){ const st=cubieToStickers(s,ct); for(const f of FACE_ORDER)for(let i=0;i<9;i++) this.stickerColors[f+':'+i]=st[f][i]; this.draw(); }
=======
>>>>>>> e3c1719 (Complete solver app with Canvas 2D renderer)

  getColor(f, i) { return this.stickerColors[f + ':' + i] || this.defaultColor(f); }
  defaultColor(f) { return { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' }[f]; }
  setColor(f, i, c) { this.stickerColors[f + ':' + i] = c; this.draw(); }
  setAll(colors) { for (const f of FACE_ORDER) for (let i = 0; i < 9; i++) this.setColor(f, i, colors[f]); }
  setState(state, colorToFace) {
    const stickers = cubieToStickers(state, colorToFace);
    for (const f of FACE_ORDER) for (let i = 0; i < 9; i++) this.setColor(f, i, stickers[f][i]);
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

<<<<<<< HEAD
  draw(){
    if(!this.ctx || !this.canvas.width || !this.canvas.height) return;
    const ctx=this.ctx, w=this.canvas.width, h=this.canvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    const cx=w/2, cy=h/2, sc=Math.min(w,h)/2/this.dist;
=======
  draw() {
    const rect = this.el.getBoundingClientRect();
    const ctx = this.ctx;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const sc = Math.min(w, h) / 2 / this.dist;
>>>>>>> e3c1719 (Complete solver app with Canvas 2D renderer)

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
// MAIN APP STATE & EVENTS
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

function solve() {
  const b = document.getElementById('solve-btn');
  const bt = b.querySelector('.btn-text');
  const ot = bt.textContent;
  b.disabled = true;
  bt.textContent = 'Solving...';
  hideOutput();
  hideVisualizer();

  try {
    const v = validateCenters(currentStickers);
    if (!v.valid) throw new Error(v.error);

    const cs = stickersToCubie(currentStickers, v.colorToFace);
    const t0 = performance.now();
    solutionMoves = solveCube(cs);
    const dt = (performance.now() - t0).toFixed(1);

    if (!solutionMoves) throw new Error('No solution found within depth 12');

    const fs = applyMoves(cs, solutionMoves);
    const solved = equalsCube(fs, SOLVED_STATE);

    showOutput(solutionMoves, dt, solved);
    setupVisualizer(cs, solutionMoves);
    showToast('Solved in ' + solutionMoves.length + ' moves (' + dt + 'ms)', 'success');
  } catch (e) {
    showErr(e.message);
    showToast(e.message, 'error');
  } finally {
    b.disabled = false;
    bt.textContent = ot;
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

function setupVisualizer(initialState, moves) {
  document.getElementById('visualizer-section').hidden = false;
  if (visualizerCube) visualizerCube.setState(initialState, { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B });

  animState = { state: initialState, moves, currentStep: 0, playing: false, timer: null };

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
  const mv = animState.moves[animState.currentStep];
  animState.state = applyMove(animState.state, MOVE_TABLES[mv]);
  if (visualizerCube) visualizerCube.setState(animState.state, { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B });
  animState.currentStep++;
  if (animState.currentStep >= animState.moves.length) pauseAnimation();
}

// -----------------------------------------------------------------------------
// SUDOKU SOLVER
// -----------------------------------------------------------------------------

function solveSudoku(board) {
  const findEmpty = (b) => {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (b[i][j] === 0) return { i, j };
    return null;
  };

  const isValid = (b, row, col, num) => {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num || b[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (b[boxRow + i][boxCol + j] === num) return false;
    return true;
  };

  const backtrack = (b) => {
    const empty = findEmpty(b);
    if (!empty) return true;
    for (let num = 1; num <= 9; num++) {
      if (isValid(b, empty.i, empty.j, num)) {
        b[empty.i][empty.j] = num;
        if (backtrack(b)) return true;
        b[empty.i][empty.j] = 0;
      }
    }
    return false;
  };

  const solution = board.map(row => [...row]);
  backtrack(solution);
  return solution;
}

window.app = { onStickerChange, solveSudoku };