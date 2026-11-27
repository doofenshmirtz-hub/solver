// ============================================================================
// Rubik's Cube Solver - SIMPLE & WORKING (Canvas 2D only, no dependencies)
// ============================================================================

// -----------------------------------------------------------------------------
// CONSTANTS
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
  cornerPos: [0,1,2,3,4,5,6,7], cornerOri: [0,0,0,0,0,0,0,0],
  edgePos: [0,1,2,3,4,5,6,7,8,9,10,11], edgeOri: [0,0,0,0,0,0,0,0,0,0,0,0],
};

const STANDARD_COLOR_TO_FACE = { W: Face.U, Y: Face.D, R: Face.R, O: Face.L, G: Face.F, B: Face.B };

const FACE_CONFIG = {
  U: { normal: [0,1,0], rot: [0,0,0], pos: [0,1.05,0] },
  D: { normal: [0,-1,0], rot: [Math.PI,0,0], pos: [0,-1.05,0] },
  F: { normal: [0,0,1], rot: [-Math.PI/2,0,0], pos: [0,0,1.05] },
  B: { normal: [0,0,-1], rot: [Math.PI/2,0,0], pos: [0,0,-1.05] },
  R: { normal: [1,0,0], rot: [0,0,-Math.PI/2], pos: [1.05,0,0] },
  L: { normal: [-1,0,0], rot: [0,0,Math.PI/2], pos: [-1.05,0,0] },
};

const COLOR_HEX = { W: 0xfefefe, Y: 0xfde047, R: 0xf87171, O: 0xfb923c, G: 0x4ade80, B: 0x60a5fa };
const COLOR_CSS = { W: '#fefefe', Y: '#fde047', R: '#f87171', O: '#fb923c', G: '#4ade80', B: '#60a5fa' };

// -----------------------------------------------------------------------------
// MOVE TABLES
// -----------------------------------------------------------------------------

function generateMoveTables() {
  const tables = {};
  const moveDefs = {
    U: { cp: [3,0,1,2,4,5,6,7], co: [0,0,0,0,0,0,0,0], ep: [3,0,1,2,4,5,6,7,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
    R: { cp: [4,1,2,0,7,5,6,3], co: [2,0,0,1,1,0,0,2], ep: [8,1,2,3,11,5,6,7,4,9,10,0], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
    F: { cp: [1,5,2,3,0,4,6,7], co: [1,2,0,0,2,1,0,0], ep: [0,9,2,3,4,8,6,7,1,5,10,11], eo: [0,1,0,0,0,1,0,0,1,1,0,0] },
    D: { cp: [0,1,2,3,5,6,7,4], co: [0,0,0,0,0,0,0,0], ep: [0,1,2,3,5,6,7,4,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
    L: { cp: [0,2,6,3,4,1,5,7], co: [0,1,2,0,0,2,1,0], ep: [0,1,10,3,4,5,9,7,8,2,11,6], eo: [0,0,0,0,0,0,0,0,0,0,0,0] },
    B: { cp: [0,1,3,7,4,5,2,6], co: [0,0,1,2,0,0,2,1], ep: [0,1,2,11,4,5,6,10,8,9,3,7], eo: [0,0,0,1,0,0,0,1,0,0,1,1] },
  };
  const applyPerm = (p1, p2) => p1.map(i => p2[i]);
  const applyOri = (perm, d) => perm.map(i => d[i]);
  const addOri = (a, b, m) => a.map((v,i) => (v + b[i]) % m);
  for (const [m, d] of Object.entries(moveDefs)) {
    tables[m] = { cp: [...d.cp], co: [...d.co], ep: [...d.ep], eo: [...d.eo] };
    const cp1 = applyPerm(d.cp, d.cp), cp2 = applyPerm(cp1, d.cp);
    const co1 = addOri(applyOri(d.cp, d.co), d.co, 3), co2 = addOri(co1, d.co, 3);
    const ep1 = applyPerm(d.ep, d.ep), ep2 = applyPerm(ep1, d.ep);
    const eo1 = addOri(applyOri(d.ep, d.eo), d.eo, 2), eo2 = addOri(eo1, d.eo, 2);
    tables[m+"'"] = { cp: cp2, co: co2, ep: ep2, eo: eo2 };
    tables[m+'2'] = { cp: cp1, co: co1, ep: ep1, eo: eo1 };
  }
  return tables;
}
const MOVE_TABLES = generateMoveTables();

function applyMove(s, mt) {
  return {
    cornerPos: mt.cp.map((_,i) => s.cornerPos[mt.cp[i]]),
    cornerOri: mt.cp.map((_,i) => (s.cornerOri[mt.cp[i]] + mt.co[i]) % 3),
    edgePos: mt.ep.map((_,i) => s.edgePos[mt.ep[i]]),
    edgeOri: mt.ep.map((_,i) => (s.edgeOri[mt.ep[i]] + mt.eo[i]) % 2),
  };
}
function applyMoves(s, ms) { for (const m of ms) s = applyMove(s, MOVE_TABLES[m]); return s; }
function equalsCube(a,b) { return a.cornerPos.every((v,i)=>v===b.cornerPos[i]) && a.cornerOri.every((v,i)=>v===b.cornerOri[i]) && a.edgePos.every((v,i)=>v===b.edgePos[i]) && a.edgeOri.every((v,i)=>v===b.edgeOri[i]); }
function cloneState(s) { return { cornerPos:[...s.cornerPos], cornerOri:[...s.cornerOri], edgePos:[...s.edgePos], edgeOri:[...s.edgeOri] }; }

// -----------------------------------------------------------------------------
// INPUT PARSING
// -----------------------------------------------------------------------------

function validateCenters(st) {
  const c={}; for(const f of FACE_ORDER) c[f]=st[f][4];
  if(new Set(Object.values(c)).size!==6) return {valid:false,error:'Centers must be 6 distinct colors'};
  for(const [f1,f2] of [[Face.U,Face.D],[Face.R,Face.L],[Face.F,Face.B]]) if(OPPOSITE[c[f1]]!==c[f2]) return {valid:false,error:`Invalid opposites: ${c[f1]} vs ${c[f2]}`};
  const ct={}; for(const [f,col] of Object.entries(c)) ct[col]=f;
  return {valid:true, centers:c, colorToFace:ct};
}

function stickersToCubie(st, ct) {
  const s={cornerPos:new Array(8),cornerOri:new Array(8),edgePos:new Array(12),edgeOri:new Array(12)};
  const cm=new Map(), em=new Map();
  for(let i=0;i<8;i++){ const sig=CORNER_FACES[i].map(f=>STANDARD_COLOR_TO_FACE[Object.keys(STANDARD_COLOR_TO_FACE).find(k=>STANDARD_COLOR_TO_FACE[k]===f)]).sort().join(','); cm.set(sig,i); }
  for(let i=0;i<12;i++){ const sig=EDGE_FACES[i].map(f=>STANDARD_COLOR_TO_FACE[Object.keys(STANDARD_COLOR_TO_FACE).find(k=>STANDARD_COLOR_TO_FACE[k]===f)]).sort().join(','); em.set(sig,i); }
  for(let i=0;i<8;i++){
    const sc=CORNER_STICKER_MAP[i].map(({face,sticker})=>st[face][sticker]);
    const sf=sc.map(c=>ct[c]);
    const sig=[...sf].sort((a,b)=>FACE_INDEX[a]-FACE_INDEX[b]).join(',');
    const idx=cm.get(sig); if(idx===undefined) throw new Error(`Bad corner ${i}`);
    s.cornerPos[i]=idx;
    const u1=CORNER_FACES[idx].findIndex(f=>f===Face.U||f===Face.D);
    const u2=CORNER_FACES[i].findIndex(f=>f===Face.U||f===Face.D);
    s.cornerOri[i]=(u1-u2+3)%3;
  }
  for(let i=0;i<12;i++){
    const sc=EDGE_STICKER_MAP[i].map(({face,sticker})=>st[face][sticker]);
    const sf=sc.map(c=>ct[c]);
    const sig=[...sf].sort((a,b)=>FACE_INDEX[a]-FACE_INDEX[b]).join(',');
    const idx=em.get(sig); if(idx===undefined) throw new Error(`Bad edge ${i}`);
    s.edgePos[i]=idx;
    s.edgeOri[i]=(sf[0]===EDGE_FACES[idx][0])?0:1;
  }
  return s;
}

function validateCubeState(s) {
  if(new Set(s.cornerPos).size!==8 || new Set(s.edgePos).size!==12) return {valid:false,error:'Duplicate/missing pieces'};
  if(s.cornerOri.reduce((a,b)=>a+b,0)%3!==0) return {valid:false,error:'Bad corner ori'};
  if(s.edgeOri.reduce((a,b)=>a+b,0)%2!==0) return {valid:false,error:'Bad edge ori'};
  function parity(p){ const v=new Array(p.length).fill(false); let c=0; for(let i=0;i<p.length;i++) if(!v[i]){c++;let j=i;while(!v[j]){v[j]=true;j=p[j];}} return (p.length-c)%2; }
  if(parity(s.cornerPos)!==parity(s.edgePos)) return {valid:false,error:'Bad parity'};
  return {valid:true};
}

// -----------------------------------------------------------------------------
// PHASE 1 SOLVER
// -----------------------------------------------------------------------------

const CO_MAX=2187, EO_MAX=2048, UD_MAX=495;
function coCoord(s){ let c=0; for(let i=0;i<7;i++) c=c*3+s.cornerOri[i]; return c; }
function eoCoord(s){ let c=0; for(let i=0;i<11;i++) c=c*2+s.edgeOri[i]; return c; }
function udCoord(s){ const sl=[8,9,10,11]; const p=[...s.edgePos]; let c=0,n=12; for(const e of sl){ const pos=p.indexOf(e); c=c*n+pos; p.splice(pos,1); n--; } return c; }

let P1=null;
function genP1(){
  const T=new Uint8Array(CO_MAX*EO_MAX*UD_MAX); T.fill(255);
  const q=[[0,0,0]]; T[0]=0;
  const coT=[], eoT=[], udT=[];
  for(const m of BASIC_MOVES){
    const mt=MOVE_TABLES[m];
    const co=new Array(CO_MAX); for(let i=0;i<CO_MAX;i++){let v=i,o=new Array(7);for(let j=6;j>=0;j--){o[j]=v%3;v=Math.floor(v/3);} const st={cp:[0,1,2,3,4,5,6,7],co:[...o,0],ep:[0,1,2,3,4,5,6,7,8,9,10,11],eo:new Array(12).fill(0)}; let sm=0;for(let j=0;j<7;j++)sm+=st.co[j];st.co[7]=(3-sm%3)%3; co[i]=coCoord(applyMove(st,mt));} coT.push(co);
    const eo=new Array(EO_MAX); for(let i=0;i<EO_MAX;i++){let v=i,o=new Array(11);for(let j=10;j>=0;j--){o[j]=v%2;v=Math.floor(v/2);} const st={cp:[0,1,2,3,4,5,6,7],co:new Array(8).fill(0),ep:[0,1,2,3,4,5,6,7,8,9,10,11],eo:[...o,0]}; let sm=0;for(let j=0;j<11;j++)sm+=st.eo[j];st.eo[11]=sm%2; eo[i]=eoCoord(applyMove(st,mt));} eoT.push(eo);
    const ud=new Array(UD_MAX); for(let i=0;i<UD_MAX;i++){const sl=[8,9,10,11]; const p=new Array(12).fill(-1); let v=i; for(let j=3;j>=0;j--){const pos=v%(12-(3-j));v=Math.floor(v/(12-(3-j)));let idx=0;for(let k=0;k<12;k++)if(p[k]===-1){if(idx===pos){p[k]=sl[j];break;}idx++;}} const oth=[0,1,2,3,4,5,6,7]; let oi=0; for(let k=0;k<12;k++) if(p[k]===-1)p[k]=oth[oi++]; const st={cp:[0,1,2,3,4,5,6,7],co:new Array(8).fill(0),ep:p,eo:new Array(12).fill(0)}; ud[i]=udCoord(applyMove(st,mt));} udT.push(ud);
  }
  let h=0; while(h<q.length){ const [c,e,u]=q[h++]; const d=T[c*EO_MAX*UD_MAX+e*UD_MAX+u]; if(d>=12)continue; for(let mi=0;mi<BASIC_MOVES.length;mi++){ const nc=coT[mi][c], ne=eoT[mi][e], nu=udT[mi][u]; const id=nc*EO_MAX*UD_MAX+ne*UD_MAX+nu; if(T[id]===255){T[id]=d+1;q.push([nc,ne,nu]);}}} return {T,coT,eoT,udT};
}
function getP1(){ if(!P1){console.log('Building pruning table...');P1=genP1();console.log('Pruning table ready');} return P1; }
function p1Search(s,maxD){
  const {T,coT,eoT,udT}=getP1(); const c=coCoord(s),e=eoCoord(s),u=udCoord(s); const id=c*EO_MAX*UD_MAX+e*UD_MAX+u; if(T[id]===255||T[id]>maxD)return null;
  const path=[]; let found=null;
  function dfs(cs,cc,ee,uu,dep,lm){ const cid=cc*EO_MAX*UD_MAX+ee*UD_MAX+uu; const h=T[cid]; if(h===255||dep+h>maxD)return false; if(h===0&&cc===0&&ee===0&&uu===0){found=[...path];return true;} for(let mi=0;mi<BASIC_MOVES.length;mi++){ if(lm>=0&&Math.floor(lm/3)===Math.floor(mi/3))continue; const m=BASIC_MOVES[mi]; const ns=applyMove(cs,MOVE_TABLES[m]); const nc=coT[mi][cc], ne=eoT[mi][ee], nu=udT[mi][uu]; path.push(m); if(dfs(ns,nc,ne,nu,dep+1,mi))return true; path.pop(); } return false; }
  dfs(s,c,e,u,0,-1); return found;
}
function solveCube(s){ for(let d=0;d<=12;d++){const m=p1Search(s,d); if(m)return m;} return null; }

// -----------------------------------------------------------------------------
// CUBE TO STICKERS
// -----------------------------------------------------------------------------

function cubieToStickers(s,ct){
  const ft={}; for(const [c,f] of Object.entries(ct)) ft[f]=c;
  const st={}; for(const f of FACE_ORDER) st[f]=new Array(9).fill(ft[f]); for(const f of FACE_ORDER) st[f][4]=ft[f];
  for(let i=0;i<8;i++){const id=s.cornerPos[i],o=s.cornerOri[i]; const fs=CORNER_FACES[id]; const rs=[fs[(0-o+3)%3],fs[(1-o+3)%3],fs[(2-o+3)%3]]; for(let j=0;j<3;j++){const {face,sticker}=CORNER_STICKER_MAP[i][j]; st[face][sticker]=ft[rs[j]];}}
  for(let i=0;i<12;i++){const id=s.edgePos[i],o=s.edgeOri[i]; const fs=EDGE_FACES[id]; const rs=o===0?fs:[fs[1],fs[0]]; for(let j=0;j<2;j++){const {face,sticker}=EDGE_STICKER_MAP[i][j]; st[face][sticker]=ft[rs[j]];}}
  return st;
}

// -----------------------------------------------------------------------------
// UI HELPERS
// -----------------------------------------------------------------------------

function showToast(msg,type='info'){const c=document.getElementById('toast-container');const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;c.appendChild(t);setTimeout(()=>t.remove(),3000);}
function $(id){return document.getElementById(id);}

// -----------------------------------------------------------------------------
// CANVAS 3D CUBE (No dependencies!)
// -----------------------------------------------------------------------------

class CubeRenderer {
  constructor(el){
    this.el=el; this.canvas=document.createElement('canvas'); this.ctx=this.canvas.getContext('2d');
    this.el.appendChild(this.canvas);
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
    this.buildGeometry();
    this.canvas.addEventListener('mousemove',e=>this.onMove(e));
    this.canvas.addEventListener('click',e=>this.onClick(e));
    this.canvas.addEventListener('pointerdown',e=>this.onDown(e));
    this.canvas.addEventListener('pointerup',e=>this.onUp(e));
    this.canvas.addEventListener('pointermove',e=>this.onPointerMove(e));
    this.canvas.addEventListener('wheel',e=>this.onWheel(e),{passive:false});
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
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
  }
  buildGeometry(){
    this.geom={}; const sz=0.58, gap=0.03, off=1.01;
    for(const f of FACE_ORDER){
      const cfg=FACE_CONFIG[f]; this.geom[f]=[];
      for(let r=0;r<3;r++)for(let c=0;c<3;c++){
        const i=r*3+c, st=-sz-gap, lx=c*(sz+gap)+st, ly=-r*(sz+gap)-st, lz=off/2;
        let x=lx, y=ly, z=lz; const [rx,ry,rz]=cfg.rot;
        if(rz){const cs=Math.cos(rz),sn=Math.sin(rz); [x,y]=[x*cs-y*sn,x*sn+y*cs];}
        if(ry){const cs=Math.cos(ry),sn=Math.sin(ry); [x,z]=[x*cs+z*sn,-x*sn+z*cs];}
        if(rx){const cs=Math.cos(rx),sn=Math.sin(rx); [y,z]=[y*cs-z*sn,y*sn+z*cs];}
        x+=cfg.pos[0]; y+=cfg.pos[1]; z+=cfg.pos[2];
        this.geom[f].push({i,r,c,face:f,world:{x,y,z},normal:cfg.normal,sz,center:r===1&&c===1});
      }
    }
  }
  getColor(f,i){ return this.stickerColors[f+':'+i] || this.defaultColor(f); }
  defaultColor(f){ return {U:'W',R:'R',F:'G',D:'Y',L:'O',B:'B'}[f]; }
  setColor(f,i,c){ this.stickerColors[f+':'+i]=c; this.draw(); }
  setAll(colors){ for(const f of FACE_ORDER)for(let i=0;i<9;i++) this.stickerColors[f+':'+i]=colors[f]; this.draw(); }
  setState(s,ct){ const st=cubieToStickers(s,ct); for(const f of FACE_ORDER)for(let i=0;i<9;i++) this.stickerColors[f+':'+i]=st[f][i]; this.draw(); }

  onMove(e){ const r=this.el.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top; this.hovered=this.hitTest(x,y); this.canvas.style.cursor=this.hovered?'pointer':'grab'; this.draw(); }
  onClick(e){ if(this.dragging)return; const r=this.el.getBoundingClientRect(); const hit=this.hitTest(e.clientX-r.left,e.clientY-r.top); if(hit&&window.app) window.app.onStickerChange(hit.face,hit.i,this.pickerColor); }
  onDown(e){ this.dragging=true; this.last={x:e.clientX,y:e.clientY}; this.canvas.style.cursor='grabbing'; }
  onUp(e){ this.dragging=false; this.canvas.style.cursor='grab'; }
  onPointerMove(e){ if(!this.dragging)return; const dx=e.clientX-this.last.x, dy=e.clientY-this.last.y; this.last={x:e.clientX,y:e.clientY}; this.angle.y-=dx*0.01; this.angle.x+=dy*0.01; this.angle.x=Math.max(-1.47,Math.min(1.47,this.angle.x)); this.draw(); }
  onWheel(e){ e.preventDefault(); this.dist+=e.deltaY*0.01; this.dist=Math.max(3,Math.min(10,this.dist)); this.draw(); }

  hitTest(x,y){
    const r=this.el.getBoundingClientRect(); const cx=r.width/2, cy=r.height/2; const sc=Math.min(r.width,r.height)/2/this.dist;
    const camX=this.dist*Math.sin(this.angle.y)*Math.cos(this.angle.x);
    const camY=this.dist*Math.sin(this.angle.x);
    const camZ=this.dist*Math.cos(this.angle.y)*Math.cos(this.angle.x);
    const rx=(x-cx)/sc, ry=(cy-y)/sc;
    const rdx=rx-camX, rdy=ry-camY, rdz=-camZ;
    const rl=Math.sqrt(rdx*rdx+rdy*rdy+rdz*rdz); const rdxn=rdx/rl, rdyn=rdy/rl, rdzn=rdz/rl;
    let best=null, bd=Infinity;
    for(const f of FACE_ORDER)for(const s of this.geom[f]){
      const n=s.normal; const denom=rdxn*n[0]+rdyn*n[1]+rdzn*n[2]; if(Math.abs(denom)<0.001) continue;
      const t=-(rdxn*s.world.x+rdyn*s.world.y+rdzn*s.world.z)/denom; if(t<0) continue;
      const ix=rdxn*t, iy=rdyn*t, iz=rdzn*t;
      const lx=ix-s.world.x, ly=iy-s.world.y; const hs=s.sz/2+0.01;
      if(Math.abs(lx)<=hs && Math.abs(ly)<=hs && t<bd){bd=t; best=s;}
    }
    return best;
  }

  draw(){
    if(!this.ctx || !this.canvas.width || !this.canvas.height) return;
    const ctx=this.ctx, w=this.canvas.width, h=this.canvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    const cx=w/2, cy=h/2, sc=Math.min(w,h)/2/this.dist;

    // View vector
    const vx=-this.dist*Math.sin(this.angle.y)*Math.cos(this.angle.x);
    const vy=-this.dist*Math.sin(this.angle.x);
    const vz=-this.dist*Math.cos(this.angle.y)*Math.cos(this.angle.x);

    // Collect visible stickers
    const list=[];
    for(const f of FACE_ORDER)for(const s of this.geom[f]){
      const dot=s.normal[0]*vx+s.normal[1]*vy+s.normal[2]*vz; if(dot<=0) continue;
      const depth=s.world.x*vx+s.world.y*vy+s.world.z*vz;
      list.push({s,depth,dot});
    }
    list.sort((a,b)=>b.depth-a.depth);

    for(const {s,dot} of list){
      const x=s.world.x*sc+cx, y=-s.world.y*sc+cy, sz=s.sz*sc;
      const col=this.getColor(s.face,s.i); const hex=COLOR_CSS[col];
      // Lighting
      const l=0.5+0.5*dot;
      const rgb=hexToRgb(hex); const rc=Math.floor(rgb.r*l), gc=Math.floor(rgb.g*l), bc=Math.floor(rgb.b*l);
      ctx.fillStyle=`rgb(${rc},${gc},${bc})`; ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=Math.max(1,sz*0.03);
      roundRect(ctx,x-sz/2,y-sz/2,sz,sz,Math.max(2,sz*0.08)); ctx.fill(); ctx.stroke();
      if(this.hovered===s){ctx.strokeStyle='#8b5cf6';ctx.lineWidth=Math.max(2,sz*0.05);ctx.stroke();}
      if(s.center){ctx.strokeStyle='#8b5cf6';ctx.lineWidth=2;ctx.strokeRect(x-sz/2-2,y-sz/2-2,sz+4,sz+4);}
    }
  }
}

function hexToRgb(h){return{r:(h>>16)&255,g:(h>>8)&255,b:h&255};}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

// -----------------------------------------------------------------------------
// MAIN APP
// -----------------------------------------------------------------------------

let currentStickers={}, selectedColor='W', solutionMoves=[], animState=null;
const inputCube=new CubeRenderer($('cube-3d-input'));
const visualizerCube=new CubeRenderer($('cube-3d-container'));
inputCube.pickerColor='W';
window.app={onStickerChange:(f,i,c)=>{currentStickers[f][i]=c; checkReady();}};

function initPalette(){
  const p=$('color-palette'); p.innerHTML='';
  for(const c of COLORS){const b=document.createElement('button');b.className='color-btn '+c;b.dataset.color=c;b.onclick=()=>pickColor(c);p.appendChild(b);}
  pickColor('W');
}
function pickColor(c){selectedColor=c; inputCube.pickerColor=c; document.querySelectorAll('.color-btn').forEach(b=>b.classList.toggle('active',b.dataset.color===c));}

function resetAll(){
  currentStickers={}; const def={U:'W',R:'R',F:'G',D:'Y',L:'O',B:'B'};
  for(const f of FACE_ORDER) currentStickers[f]=new Array(9).fill(def[f]);
  inputCube.setAll(def); pickColor('W'); hideOut(); hideVis(); showToast('Reset');
}
function randomScramble(){
  let s=cloneState(SOLVED_STATE); let lf=-1;
  for(let i=0;i<25;i++){let mi;do{mi=Math.floor(Math.random()*BASIC_MOVES.length)}while(Math.floor(mi/3)===lf);lf=Math.floor(mi/3);s=applyMove(s,MOVE_TABLES[BASIC_MOVES[mi]]);}
  const fc={U:'W',D:'Y',R:'R',L:'O',F:'G',B:'B'}; currentStickers=cubieToStickers(s,fc); inputCube.setState(s,fc); checkReady(); showToast('Scrambled');
}
function checkReady(){
  const v=validateCenters(currentStickers); const ok=v.valid; $('solve-btn').disabled=!ok;
  $('solve-hint').textContent=ok?'Ready to solve!':'Complete all 6 faces with valid centers';
  $('solve-hint').style.color=ok?'var(--success)':'var(--text-dim)';
}
function isReady(){return validateCenters(currentStickers).valid;}

async function solve(){
  const b=$('solve-btn'), bt=b.querySelector('.btn-text'); const ot=bt.textContent; b.disabled=true; bt.textContent='Solving...'; hideOut(); hideVis();
  try{
    const v=validateCenters(currentStickers); if(!v.valid) throw new Error(v.error);
    const cs=stickersToCubie(currentStickers,v.colorToFace);
    const sv=validateCubeState(cs); if(!sv.valid) throw new Error(sv.error);
    const t0=performance.now(); solutionMoves=solveCube(cs); const dt=(performance.now()-t0).toFixed(1);
    if(!solutionMoves) throw new Error('No solution (depth 12 limit)');
    const fs=applyMoves(cs,solutionMoves); const solved=equalsCube(fs,SOLVED_STATE);
    showOut(solutionMoves,dt,solved); setupVis(cs,solutionMoves); showToast(`Solved in ${solutionMoves.length} moves (${dt}ms)`,'success');
  }catch(e){showErr(e.message); showToast(e.message,'error');}
  finally{b.disabled=false; bt.textContent=ot;}
}
function showOut(m,dt,sol){
  $('output-section').hidden=false; $('output-section').scrollIntoView({behavior:'smooth'});
  $('move-count').textContent=m.length; $('solve-time').textContent=dt+'ms'; $('phase-info').textContent=sol?'Solved ✓':'G1 Subgroup'; $('error-display').hidden=true;
  $('moves-display').innerHTML=m.map((mv,i)=>{let cl='move'; if(mv.endsWith("'"))cl+=' prime'; else if(mv.endsWith('2'))cl+=' double'; return `<span class="${cl}" style="--i:${i}">${mv.replace("'","'").replace('2','2')}</span>`;}).join(' ');
  $('copy-btn').hidden=false; $('copy-btn').onclick=()=>{navigator.clipboard.writeText(m.join(' ')); showToast('Copied!');};
}
function showErr(m){$('error-message').textContent=m; $('error-display').hidden=false;}
function hideOut(){$('output-section').hidden=true;}
function setupVis(s,m){
  $('visualizer-section').hidden=false;
  animState={s:cloneState(s),moves:m,i:0,playing:false,timer:null};
  visualizerCube.setState(s,{W:Face.U,Y:Face.D,R:Face.R,O:Face.L,G:Face.F,B:Face.B});
  $('play-btn').onclick=play; $('pause-btn').onclick=pause; $('step-btn').onclick=step;
  $('speed-slider').oninput=e=>{$('speed-label').textContent=e.target.value+'ms'; if(animState.playing){pause();play();}};
}
function hideVis(){$('visualizer-section').hidden=true;}
function play(){if(animState.playing)return; animState.playing=true; $('play-btn').hidden=true; $('pause-btn').hidden=false; const sp=parseInt($('speed-slider').value); animState.timer=setInterval(()=>{if(animState.i>=animState.moves.length){pause();return;} step();},sp);}
function pause(){if(animState.timer)clearInterval(animState.timer); animState.playing=false; $('play-btn').hidden=false; $('pause-btn').hidden=true;}
function step(){if(animState.i>=animState.moves.length)return; const mv=animState.moves[animState.i]; animState.s=applyMove(animState.s,MOVE_TABLES[mv]); visualizerCube.setState(animState.s,{W:Face.U,Y:Face.D,R:Face.R,O:Face.L,G:Face.F,B:Face.B}); animState.i++; if(animState.i>=animState.moves.length) pause();}

document.addEventListener('DOMContentLoaded',()=>{
  initPalette(); resetAll();
  $('solve-btn').onclick=solve; $('reset-btn').onclick=resetAll; $('random-btn').onclick=randomScramble;
  $('about-link').onclick=e=>{e.preventDefault(); showToast('Rubik\'s Cube Solver • Cubie Rep • Kociemba P1');};
  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='BUTTON')return;
    if(e.key==='s'){e.preventDefault();$('solve-btn').click();}
    if(e.key==='r'){e.preventDefault();$('reset-btn').click();}
    if(e.key===' '&&!e.target.closest('.color-btn')){e.preventDefault(); if(animState&&!animState.playing)play(); else if(animState)pause();}
    const ck=['W','Y','R','O','G','B']; const n=parseInt(e.key); if(n>=1&&n<=6)pickColor(ck[n-1]);
  });
});