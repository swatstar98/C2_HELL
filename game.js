/* C2 HELL — lite sim de mando y control antiaéreo.
 * Canvas 2D + HTML HUD. Sin dependencias. Táctil + ratón.
 * Todos los números de balance están en las tablas SAM / AIR / THREAT / makeLevel. */
'use strict';
(function () {
let WW = 1000, WH = 1400;           // mundo lógico: ancho fijo 1000, alto según la pantalla (vertical)
const DS = .625;                     // escala de distancias del balance original al mundo vertical
const $ = (s, e) => (e || document).querySelector(s);
const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const dst = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const pick = a => a[(Math.random() * a.length) | 0];
const sround = x => { const f = Math.floor(x); return f + (Math.random() < x - f ? 1 : 0); };
const mmss = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pkOf = (tab, kind) => tab[kind] !== undefined ? tab[kind] : (tab.drone || 0);

const C = { blue: '#3ea6ff', red: '#ff4d4d', cyan: '#4fe0e8', amber: '#ffb020', green: '#35d07f', dim: '#7390a3' };

/* ============================ DEFINICIONES ============================ */
const SAM = {
  gun:    { id: 'gun',    short: 'AAA',    name: 'Cañón AA / CIWS',  cost: 45,  range: 95,  reload: .45, ammo: 90, mspeed: 700, mcost: 1,  sensor: 70,  restock: 20,  unlock: 1,
            pk: { drone: .32, cruise: .12, ballistic: 0, arm: .08 }, desc: 'Barato y de corto alcance. Munición abundante, ideal contra drones.' },
  shorad: { id: 'shorad', short: 'SHORAD', name: 'SAM corto alcance', cost: 120, range: 185, reload: 1.8, ammo: 14, mspeed: 320, mcost: 12, sensor: 120, restock: 60,  unlock: 1,
            pk: { drone: .72, cruise: .55, ballistic: .08, arm: .5 }, desc: 'Equilibrado. Buen Pk contra drones y misiles de crucero.' },
  mrad:   { id: 'mrad',   short: 'SAM-M',  name: 'SAM medio alcance', cost: 240, range: 280, reload: 3.2, ammo: 8,  mspeed: 420, mcost: 40, sensor: 160, restock: 120, unlock: 3,
            pk: { drone: .62, cruise: .78, ballistic: .40, arm: .6 }, desc: 'Gran cobertura. Mejor contra crucero; capacidad limitada antibalística.' },
  bmd:    { id: 'bmd',    short: 'ABM',    name: 'Defensa antibalística', cost: 380, range: 400, reload: 5.5, ammo: 4, mspeed: 560, mcost: 90, sensor: 220, restock: 200, unlock: 6,
            pk: { drone: 0, cruise: .30, ballistic: .78, arm: .25 }, desc: 'Único con Pk alto contra misiles balísticos. Pocos interceptores.' },
  radar:  { id: 'radar',  short: 'RADAR',  name: 'Radar de vigilancia', cost: 70, range: 0, radar: 280, ammo: 0, sensor: 0, unlock: 2, pk: {},
            desc: 'Extiende la detección: los SAM pueden usar todo su alcance.' }
};
const AIR = {
  f16:  { id: 'f16',  short: 'F-16C', name: 'F-16C Viper', role: 'Caza multirol', cost: 130, speed: 200, fuel: 110, ammo: 6, reload: 1.2, mspeed: 480, mcost: 25, engage: 150, radar: 130, strike: .45, orbit: 34, turn: 14, unlock: 1,
          pk: { drone: .72, cruise: .62, ballistic: 0, arm: .55 }, mission: 'CAP / interceptación / ataque ligero' },
  f15e: { id: 'f15e', short: 'F-15E', name: 'F-15E Strike Eagle', role: 'Ataque', cost: 210, speed: 180, fuel: 130, ammo: 8, reload: 1.2, mspeed: 480, mcost: 25, engage: 150, radar: 150, strike: .72, orbit: 36, turn: 16, unlock: 4,
          pk: { drone: .75, cruise: .68, ballistic: 0, arm: .6 }, mission: 'Ataque a rampas / CAP' },
  e2:   { id: 'e2',   short: 'E-2D',  name: 'E-2D Hawkeye', role: 'Alerta temprana', cost: 160, speed: 110, fuel: 200, ammo: 0, radar: 360, strike: 0, orbit: 30, turn: 18, unlock: 2, pk: {}, mission: 'Estación AEW' },
  mq9:  { id: 'mq9',  short: 'MQ-9',  name: 'MQ-9 Reaper', role: 'UAV ISR/ataque', cost: 70, speed: 75, fuel: 230, ammo: 0, radar: 170, strike: .28, orbit: 26, turn: 10, unlock: 3, pk: {}, mission: 'Vigilancia / ataque ligero' }
};
const THREAT = {
  drone:     { name: 'UAS', tag: 'UAS', spd: 44, dmg: 8, val: 20, bounty: 5, col: C.red },
  decoy:     { name: 'UAS (señuelo)', tag: 'UAS', spd: 48, dmg: 0, val: 5, bounty: 2, col: C.red },
  cruise:    { name: 'Misil de crucero', tag: 'CM', spd: 92, dmg: 16, val: 90, bounty: 14, col: C.red },
  ballistic: { name: 'Misil balístico', tag: 'BM', spd: 230, dmg: 32, val: 300, bounty: 26, col: C.red },
  arm:       { name: 'Misil antirradar', tag: 'ARM', spd: 150, dmg: 0, val: 110, bounty: 16, col: C.red }
};
const KIND_LBL = { drone: 'UAS', cruise: 'CRU', ballistic: 'BAL', arm: 'ARM' };
const ASSET_TYPE = {   // peso en la integridad (w) y probabilidad de ser objetivo (tw)
  capital: { w: .34, tw: .28 }, airbase: { w: .10, tw: .13, radar: Math.round(240 * DS) },
  power: { w: .18, tw: .17 }, port: { w: .18, tw: .16 }
};
const SITE_AA = Math.round(115 * DS);   // radio de la defensa antiaérea de cada rampa
// Escala de todas las distancias/velocidades al mundo vertical (el balance se calibró en 1600×800)
for (const D of Object.values(SAM)) for (const p of ['range', 'sensor', 'radar', 'mspeed']) if (D[p]) D[p] = Math.round(D[p] * DS);
for (const D of Object.values(AIR)) for (const p of ['speed', 'engage', 'radar', 'orbit', 'mspeed']) if (D[p]) D[p] = Math.round(D[p] * DS);
for (const D of Object.values(THREAT)) D.spd = Math.round(D.spd * DS * 10) / 10;
const LEVEL_NAMES = ['Primera alerta', 'Cielos abiertos', 'Señuelos', 'Crucero a baja cota', 'Doble eje', 'Lluvia balística',
  'Saturación', 'Noche larga', 'Cuatro frentes', 'Tormenta de acero', 'Cúpula', 'Último bastión'];
const SPAWN_WIN = [8, 25, 45, 70, 95, 125, 155, 185, 215, 240, 265, 280];

/* ============================ GEOGRAFÍA ============================ */
// Teatros reales (Natural Earth) en window.C2_MAPS: anillos [lon,lat] que se proyectan al arrancar cada nivel.
const THEATERS = window.C2_MAPS || [];
let MAP = null;
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function loadTheater(idx, H) {
  const T = THEATERS[idx % THEATERS.length];
  WW = 1000; WH = H;
  const proj = (lat, lon) => [500 + (lon - T.lonC) * T.kx, H / 2 - (lat - T.latC) * T.ky];
  const cs = T.countries.map(c => ({ n: c.n, es: c.es, s: c.s, rings: c.r.map(r => r.map(p => proj(p[1], p[0]))), vis: 0, lab: null }));
  for (const c of cs) {
    let sx = 0, sy = 0, k = 0;
    for (const r of c.rings) for (const p of r) if (p[0] > 50 && p[0] < WW - 50 && p[1] > 50 && p[1] < WH - 50) { sx += p[0]; sy += p[1]; k++; }
    c.vis = k; if (k >= 5) c.lab = [sx / k, sy / k];
  }
  const hs = cs.filter(c => c.s === 'h').sort((a, b) => b.vis - a.vis); hs.forEach((c, i) => { c.es = i === 0 ? 'ZONA HOSTIL' : ''; });
  MAP = { T, proj, countries: cs, land: cs.filter(c => c.s === 'f') };
  return MAP;
}
const onLand = (x, y) => MAP.land.some(c => c.rings.some(r => inPoly(r, x, y)));
function computeH() { const w = $('#mapwrap'); const r = w && w.clientWidth ? w.clientHeight / w.clientWidth : 1.5; return clamp(Math.round(1000 * r), 1100, 1800); }

/* ============================ MEJORAS PERMANENTES ============================ */
const UPG = [
  { id: 'budget', name: 'Presupuesto de guerra', desc: '+10 % de créditos iniciales por nivel', cost: 20, max: 5 },
  { id: 'income', name: 'Economía de guerra', desc: '+10 % de ingresos pasivos por nivel', cost: 20, max: 5 },
  { id: 'pk', name: 'Guiado avanzado', desc: '+5 % de Pk en SAM y aviones por nivel', cost: 30, max: 5 },
  { id: 'reload', name: 'Cadencia de fuego', desc: '−6 % de recarga de baterías por nivel', cost: 25, max: 5 },
  { id: 'ammo', name: 'Santabárbara ampliada', desc: '+12 % de munición de baterías por nivel', cost: 25, max: 5 },
  { id: 'radar', name: 'Radares de largo alcance', desc: '+8 % de alcance de detección por nivel', cost: 25, max: 5 },
  { id: 'strike', name: 'Doctrina de ataque', desc: '+6 % de éxito en ataques a rampas por nivel', cost: 30, max: 5 },
  { id: 'armor', name: 'Infraestructura endurecida', desc: '−7 % de daño en impactos por nivel', cost: 35, max: 5 },
  { id: 'fleet', name: 'Escuadrón adicional', desc: '+1 F-16C inicial por nivel', cost: 40, max: 3 },
  { id: 'hangar', name: 'Hangares ampliados', desc: '+1 plaza de hangar en cada base aérea por nivel (base 4)', cost: 30, max: 4 }
];
const U = id => (G && G.up && G.up[id]) || 0;
const pkMod = p => p > 0 ? Math.min(.97, p * (1 + .05 * U('pk'))) : 0;
const radarMul = () => 1 + .08 * U('radar');
const baseCap = () => 4 + U('hangar');

/* ============================ NIVELES ============================ */
function makeLevel(n) {
  const L = n, idx = Math.min(n, 12) - 1;
  const win = SPAWN_WIN[idx];
  const nWaves = Math.max(2, Math.round(win / 14) + 1);
  const avail = [['drone', .55]];
  if (L >= 3) avail.push(['decoy', .10]);
  if (L >= 4) avail.push(['cruise', .25]);
  if (L >= 4) avail.push(['arm', .10]);
  if (L >= 6) avail.push(['ballistic', .20]);
  const sum = avail.reduce((a, b) => a + b[1], 0);
  const pts = { drone: 1, decoy: .5, cruise: 4, ballistic: 8, arm: 3 };
  const over = Math.max(0, n - 12);
  const waves = [];
  for (let k = 0; k < nWaves; k++) {
    const prog = nWaves > 1 ? k / (nWaves - 1) : 0;
    const P = (4 + 1.8 * L + over * 2) * (0.75 + 0.5 * prog);
    const items = [];
    for (const [kind, sh] of avail) {
      const cnt = sround(P * sh / sum / pts[kind]);
      if (cnt > 0) items.push({ kind, count: cnt });
    }
    if (!items.length) items.push({ kind: 'drone', count: 3 });
    waves.push({ t: 1 + (win - 1) * prog, items });
  }
  return {
    n, theater: (n - 1) % Math.max(1, THEATERS.length), name: n <= 12 ? LEVEL_NAMES[idx] : 'Defensa sin fin ' + (n - 12),
    waves, spawnWin: win, nSites: n < 3 ? 1 : n < 6 ? 2 : n < 9 ? 3 : n < 12 ? 4 : 5,
    credits: 330 + 55 * L, income: 4 + 0.7 * L, siteDef: clamp(.05 + .03 * L, 0, .5),
    fleet: { f16: L >= 3 ? 3 : 2, e2: L >= 2 ? 1 : 0, mq9: L >= 3 ? 1 : 0, f15e: L >= 4 ? (L >= 7 ? 2 : 1) : 0 }
  };
}
function briefCounts(lv) {
  const c = { drone: 0, decoy: 0, cruise: 0, ballistic: 0, arm: 0 };
  lv.waves.forEach(w => w.items.forEach(i => c[i.kind] += i.count));
  return c;
}

/* ============================ ESTADO ============================ */
let G = null;
const UI = { tab: 'def', mode: 'idle', spec: null, ghost: null, drag: null, ptr: null, hintShown: {} };
const view = { w: 1, h: 1, dpr: 1, s: 1, ox: 0, oy: 0, R: 12 };
const cv = $('#c'); let ctx = cv.getContext('2d');
const bg = document.createElement('canvas');

function saveGet() { try { return JSON.parse(localStorage.getItem('c2hell.save') || '{}'); } catch (e) { return {}; } }
function savePut(o) { try { localStorage.setItem('c2hell.save', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } }
const SET = Object.assign({ snd: true, vib: true, rings: true, scale: 1, tutDone: false }, saveGet().set || {});
function saveSet() { const o = saveGet(); o.set = SET; savePut(o); }
const FXS = { shake: 0, flash: 0 };
function floatTxt(x, y, txt, col) { if (!G) return; if (G.floats.length > 40) G.floats.shift(); G.floats.push({ x, y, txt, col, t: 0 }); }
function buzz(ms) { if (SET.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* sin vibración */ } } }

function newGame(n) {
  const lv = makeLevel(n);
  const up = progress().up || {};
  loadTheater(lv.theater, computeH()); resize();
  G = { up, n, lv, t: 0, speed: 0, phase: 'prep', over: false, endTimer: 0, credits: Math.round(lv.credits * (1 + .1 * (up.budget || 0))), id: 1, waveIdx: 0,
        assets: [], units: [], sites: [], threats: [], pending: [], missiles: [], fx: [], air: [], sel: null, buyBase: null,
        stats: { kills: 0, leaked: 0, fired: 0, spent: 0, value: 0, airLost: 0, strikes: 0, spentCredits: 0, evaded: 0 } };
  for (const a of MAP.T.assets) { const p = MAP.proj(a.lat, a.lon); G.assets.push(Object.assign({ hp: 100, maxhp: 100, emit: true, rdown: 0 }, ASSET_TYPE[a.type], { id: a.id, type: a.type, name: a.name, x: p[0], y: p[1] })); }
  const rs = mulberry(n * 7919 + 13), order = MAP.T.sites.map((_, i) => i).sort(() => rs() - .5);
  for (let i = 0; i < lv.nSites; i++) { const q = MAP.T.sites[order[i % order.length]], p = MAP.proj(q[0], q[1]); G.sites.push({ id: i + 1, x: p[0], y: p[1], alive: true, def: lv.siteDef, name: 'RAMPA-' + (i + 1) }); }
  lv.income *= 1 + .1 * (up.income || 0);
  const fl = Object.assign({}, lv.fleet); fl.f16 += up.fleet || 0;
  allocFleet(fl);
  UI.mode = 'idle'; UI.spec = null; UI.ghost = null; UI.hintShown = {}; UI.rosterSig = '';
  if (UI.tab !== 'def' && UI.tab !== 'air' && UI.tab !== 'rad') UI.tab = 'def';
  $('#log').innerHTML = ''; hidePanel(); setHint(null);
  G.demo = false; G.floats = []; G.stats.blind = 0; G.stats.dry = 0; G.stats.leakKind = {};
  FXS.shake = 0; FXS.flash = 0;
  buildDock(); setPhase('prep'); refreshTop();
  $('#overlay').classList.add('hidden');
  G.tut = (n === 1 && !SET.tutDone) ? { i: 0 } : null;
  if (G.tut) tutShow(); else setHint('<b>PREPARACIÓN</b> (en pausa): coloca defensas y reparte las aeronaves entre las bases. Pulsa <b>INICIAR OPERACIÓN</b> cuando estés listo.', 'plan');
  log('NIVEL ' + n + ' — ' + lv.name.toUpperCase() + ' · ' + MAP.T.name.toUpperCase());
}
function mkAir(type, k, home) {
  const D = AIR[type];
  return { id: k, type, def: D, label: D.short + '-' + k, x: home.x, y: home.y, home, hdg: 0, state: 'hangar', fuel: D.fuel, ammo: D.ammo, cool: 0, turn: 0, mission: null };
}
const airbases = () => G.assets.filter(a => a.type === 'airbase');
const baseCount = b => G.air.filter(a => a.home === b).length;
function allocFleet(fl) {
  const bs = airbases(), sd = b => Math.min(...G.sites.map(s => dst(b.x, b.y, s.x, s.y)));
  const fwd = bs.slice().sort((a, b) => sd(a) - sd(b)), cnt = new Map(bs.map(b => [b, 0]));
  G.buyBase = fwd[0];
  const place = order => { let best = order[0]; for (const b of order) if (cnt.get(b) < cnt.get(best)) best = b; cnt.set(best, cnt.get(best) + 1); return best; };
  let k = 1;
  for (const type of ['f16', 'f15e', 'mq9']) for (let i = 0; i < (fl[type] || 0); i++) G.air.push(mkAir(type, k++, place(fwd)));
  for (let i = 0; i < (fl.e2 || 0); i++) G.air.push(mkAir('e2', k++, place(fwd.slice().reverse())));
  G.id = Math.max(G.id, k);
}
function rtbBase(a) {
  if (a.home.hp > 0) return a.home;
  let best = null, bd = 1e9;
  for (const b of airbases()) if (b.hp > 0) { const d = dst(a.x, a.y, b.x, b.y); if (d < bd) { bd = d; best = b; } }
  return best;
}
const capital = () => G.assets.find(a => a.type === 'capital');
function integrity() {
  let s = 0, w = 0;
  for (const a of G.assets) { s += a.hp * a.w; w += 100 * a.w; }
  return s / w * 100;
}

/* ============================ AUDIO ============================ */
const SND = {
  on: true, ac: null, last: {},
  init() { if (this.ac) return; try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* sin audio */ } },
  gate(key) { const n = performance.now(); if (n - (this.last[key] || 0) < 70) return false; this.last[key] = n; return true; },
  tone(f, d, type, v, slide, key) {
    if (!this.on || !this.ac || !this.gate(key)) return;
    const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.ac.destination); o.start(); o.stop(t + d);
  },
  noise(d, v, key) {
    if (!this.on || !this.ac || !this.gate(key)) return;
    const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ac.createBufferSource(), g = this.ac.createGain(); g.gain.value = v; s.buffer = buf; s.connect(g); g.connect(this.ac.destination); s.start();
  },
  launch() { this.tone(520, .22, 'sawtooth', .025, -380, 'l'); },
  boom() { this.noise(.3, .09, 'b'); },
  impact() { this.noise(.7, .22, 'i'); },
  ping() { this.tone(880, .1, 'square', .03, 0, 'p'); }
};

/* ============================ LOG / HUD ============================ */
const TUT = [
  { t: 'Toca <b>SHORAD</b> en el panel inferior y luego un punto de tierra azul (o arrástralo). Verás su alcance.', done: () => G.units.length >= 1 },
  { t: 'Añade un <b>AAA</b> (cañón barato) cerca de la capital: aguanta mucho tiempo contra drones.', done: () => G.units.length >= 2 },
  { t: 'Abre la pestaña <b>AIRE</b>, toca una aeronave de la lista y cámbiala de <b>base</b>: la más cercana al frente llega antes, pero está más expuesta.', done: () => G.air.some(a => a.moved) },
  { t: 'Cuando estés listo, pulsa <b>INICIAR OPERACIÓN</b> arriba. Puedes seguir desplegando defensas (cuestan +50 %).', done: () => G.phase === 'ops' },
  { t: 'Toca <b>F-16</b> en AIRE y un punto del mapa: despega desde la base más cercana y fija una patrulla (CAP).', done: () => G.air.some(a => a.state !== 'hangar') },
  { t: 'Abre <b>RADARES</b>: aquí apagas y enciendes cada emisor. Los misiles antirradar (ARM) cazan los que están encendidos.', done: () => UI.tab === 'rad' },
  { t: 'Los contactos <span style="color:#ffd84a">amarillos</span> aún no están identificados. Toca uno para ver cómo interceptarlo y con qué % de éxito.', done: () => (G.sel && G.sel.kind === 'threat') || G.t > 25 }
];
function tutShow() {
  if (!G || !G.tut) return; const st = TUT[G.tut.i]; if (!st) { endTut(); return; }
  setHint('<b>Tutorial ' + (G.tut.i + 1) + '/' + TUT.length + '</b> — ' + st.t, 'tut');
}
function tutTick() {
  if (!G || !G.tut || G.demo) return; const st = TUT[G.tut.i];
  if (st && st.done()) { G.tut.i++; if (G.tut.i >= TUT.length) endTut(); else if (UI.mode === 'idle') tutShow(); }
}
function endTut() { if (G) G.tut = null; SET.tutDone = true; saveSet(); if ($('#hint').dataset.key === 'tut') setHint(null); }
function banner(html) {
  const b = $('#banner'); b.innerHTML = html; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.add('hidden'), 2750);
}
function restockCost() { let c = 0; for (const u of G.units) if (u.def.range && u.ammo < u.max) c += Math.round(u.def.restock * (1 - u.ammo / u.max)); return c; }
function restockAll() {
  if (!G || G.over) return;
  const us = G.units.filter(u => u.def.range && u.ammo < u.max).sort((a, b) => a.ammo / a.max - b.ammo / b.max); let n = 0;
  for (const u of us) { const c = Math.round(u.def.restock * (1 - u.ammo / u.max)); if (G.credits >= c) { G.credits -= c; G.stats.spentCredits += c; u.ammo = u.max; u.low = false; n++; } }
  log(n ? 'Reabastecidas ' + n + ' baterías' : 'Nada que reabastecer o sin créditos', n ? 'good' : 'warn'); refreshDock(); refreshTop();
}
function log(msg, cls) {
  const box = $('#log'), d = document.createElement('div');
  d.textContent = 'T+' + mmss(G ? G.t : 0) + ' ' + msg; if (cls) d.className = cls;
  box.appendChild(d);
  while (box.children.length > 6) box.removeChild(box.firstChild);
  setTimeout(() => d.remove(), 9200);
}
function setHint(html, key) {
  const h = $('#hint');
  if (!html) { h.classList.add('hidden'); return; }
  h.innerHTML = '<div>' + html + '</div><button class="x" aria-label="Cerrar">' + (key === 'tut' ? 'Saltar' : '✕') + '</button>';
  h.classList.remove('hidden');
  $('.x', h).onclick = () => { if (key === 'tut') { endTut(); return; } h.classList.add('hidden'); if (UI.mode !== 'idle') cancelMode(); };
  h.dataset.key = key || '';
}
function setPhase(p) {
  G.phase = p;
  $('#speeds').classList.toggle('hidden', p === 'prep'); $('#btn-start').classList.toggle('hidden', p !== 'prep');
  const ph = $('#phase'); ph.textContent = p === 'prep' ? 'PREPARACIÓN' : 'OPERACIÓN'; ph.className = p;
  $$('.spd').forEach(b => b.classList.toggle('on', +b.dataset.s === G.speed));
  refreshDock();
}
function startOps(sp) {
  if (!G || G.over || G.phase !== 'prep') return;
  setPhase('ops'); banner('OPERACIÓN<small>Gestiona radares y salidas</small>'); log('INICIO DE LA OPERACIÓN', 'warn');
  if ($('#hint').dataset.key === 'plan') setHint(null);
  SND.init(); setSpeed(sp || 1);
}
function setSpeed(s) {
  if (G && G.phase === 'prep' && s > 0) { startOps(s); return; }
  if (G) G.speed = s;
  $$('.spd').forEach(b => b.classList.toggle('on', +b.dataset.s === s));
  if (s > 0 && G && G.t === 0 && $('#hint').dataset.key === 'plan') setHint(null);
  if (s > 0) SND.init();
}
function refreshTop() {
  if (!G) return;
  $('#s-level').textContent = G.n;
  $('#s-wave').textContent = Math.min(G.waveIdx, G.lv.waves.length) + '/' + G.lv.waves.length;
  $('#s-time').textContent = mmss(G.t);
  const nw = G.lv.waves[G.waveIdx], sn = $('#s-next');
  sn.textContent = G.phase === 'prep' ? '—' : nw ? mmss(Math.max(0, nw.t - G.t)) : (G.threats.length || G.pending.length ? 'FIN' : '—');
  sn.classList.toggle('hot', G.phase === 'ops' && !!nw && nw.t - G.t < 6);
  $('#s-cred').textContent = Math.floor(G.credits);
  const ig = integrity(), b = $('#s-integ');
  b.style.width = ig + '%'; b.style.background = ig > 65 ? C.green : ig > 40 ? C.amber : C.red;
}

/* ============================ DOCK ============================ */
const cardRefs = {}, emRefs = [];
let baseCardEl = null, masterEl = null;
function readyCount(type) { return G.air.filter(a => a.type === type && a.state === 'hangar' && a.home.hp > 0).length; }
function totalCount(type) { return G.air.filter(a => a.type === type).length; }
const airSig = () => G.air.map(a => a.id).join(',') + '|' + (G.buyBase ? G.buyBase.id : '');
const radSig = () => emitters().map(e => e.id).join(',');
const curSig = () => UI.tab === 'air' ? airSig() : UI.tab === 'rad' ? radSig() : '';
function airStateTxt(a) {
  if (a.state === 'hangar') return G.phase === 'prep' ? 'EN HANGAR' : a.home.hp > 0 ? 'LISTO' : 'BASE CAÍDA';
  if (a.state === 'turn') return 'REARME ' + Math.ceil(a.turn) + 's';
  if (a.state === 'rtb') return 'RTB';
  return stationName(a);
}
function buildDock() {
  const box = $('#cards'), keep = box.scrollLeft; box.innerHTML = ''; for (const k in cardRefs) delete cardRefs[k]; emRefs.length = 0; baseCardEl = masterEl = null;
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === UI.tab));
  if (UI.tab === 'rad') {
    const em = emitters();
    if (!em.length) box.innerHTML = '<div class="empty">Sin emisores. Coloca un <b>RADAR</b> o baterías SAM en DEFENSA; aquí podrás encenderlos y apagarlos.</div>';
    else {
      masterEl = document.createElement('div'); masterEl.className = 'card em master'; masterEl.innerHTML = '<div class="n">TODOS</div><div class="r" data-r></div><div class="st" data-st></div>';
      masterEl.addEventListener('click', () => { const any = emitters().some(isEmitting); for (const e of emitters()) { if (e.rdown > 0) continue; e.emit = !any; } log(any ? 'SILENCIO RADIO: todos los emisores OFF' : 'Todos los emisores ON', any ? 'warn' : ''); SND.ping(); updateDetection(); refreshDock(); });
      box.appendChild(masterEl);
      for (const e of em) {
        const el = document.createElement('div'); el.className = 'card em';
        el.innerHTML = '<div class="n">' + e.name + '</div><div class="r">' + (e.def ? 'Detec. ' + (e.def.radar || e.def.sensor) : 'Radar base ' + e.radar) + '</div><div class="st" data-st></div>';
        el.addEventListener('click', () => toggleEmit(e));
        box.appendChild(el); emRefs.push({ el, e });
      }
    }
  } else {
    const isAir = UI.tab === 'air';
    if (isAir) {
      baseCardEl = document.createElement('div'); baseCardEl.className = 'card basesel';
      baseCardEl.innerHTML = '<div class="r">COMPRAR EN</div><div class="n" data-bn></div><div class="c" data-bc></div><div class="r">toca = cambiar</div>';
      baseCardEl.addEventListener('click', () => {
        const bs = airbases().filter(b => b.hp > 0); if (!bs.length) return;
        G.buyBase = bs[(bs.indexOf(G.buyBase) + 1) % bs.length]; refreshDock();
      });
      box.appendChild(baseCardEl);
    }
    const list = !isAir ? ['gun', 'shorad', 'mrad', 'bmd', 'radar'].map(i => SAM[i]) : ['f16', 'f15e', 'e2', 'mq9'].map(i => AIR[i]);
    let ki = 0;
    for (const D of list) {
      if (G.n < D.unlock) continue;
      const el = document.createElement('div');
      el.className = 'card';
      let inner = '<div class="n">' + D.short + '</div><div class="c" data-c>◈ ' + D.cost + '</div>';
      if (isAir) inner = '<button class="buy" aria-label="Comprar">+</button>' + inner + '<div class="r" data-r></div><div class="r">' + D.role + '</div>';
      else {
        const bars = ['drone', 'cruise', 'ballistic', 'arm'].map(k => '<i style="height:' + Math.max(2, (D.pk[k] || 0) * 14) + 'px" title="' + KIND_LBL[k] + '"></i>').join('');
        inner += '<div class="r">' + (D.radar ? 'Detec. ' + D.radar : 'Alc. ' + D.range + ' · ' + D.ammo + ' msl') + '</div>' + (D.radar ? '' : '<div class="pks">' + bars + '</div>');
      }
      el.innerHTML = inner + '<span class="kb">' + 'QWERT'[ki] + '</span>';
      el.title = D.name + ' — ' + (D.desc || D.mission) + ' [' + 'QWERT'[ki] + ']'; ki++;
      box.appendChild(el);
      const spec = { kind: isAir ? 'air' : 'sam', id: D.id };
      cardRefs[D.id] = { el, spec, D };
      bindCard(el, spec);
      if (isAir) {
        const buy = $('.buy', el);
        buy.addEventListener('pointerdown', e => e.stopPropagation());
        buy.addEventListener('click', e => { e.stopPropagation(); buyAir(D.id); });
      }
    }
    if (isAir) {
      const sep = document.createElement('div'); sep.className = 'sep'; sep.textContent = 'FLOTA'; box.appendChild(sep);
      for (const a of G.air) {
        const el = document.createElement('div'); el.className = 'chip'; el.dataset.id = a.id;
        el.innerHTML = '<b>' + a.label + '</b><span class="bs">' + a.home.name.slice(0, 9) + '</span><span class="s" data-s></span><i class="fb"><u data-f></u></i>';
        el.addEventListener('click', () => { if (UI.mode !== 'idle') cancelMode(); select({ kind: 'air', ref: a }); });
        box.appendChild(el);
      }
    }
  }
  UI.rosterSig = curSig(); refreshDock(); box.scrollLeft = keep;
}
function refreshDock() {
  if (!G) return;
  if (UI.tab !== 'def' && curSig() !== UI.rosterSig) { buildDock(); return; }
  { const rc = restockCost(), rb = $('#btn-restock'); rb.textContent = rc ? 'REABAST. ◈' + rc : 'REABAST.'; rb.disabled = !rc || G.credits < 1; }
  { const em = emitters(), on = em.filter(isEmitting).length, t = $('.tab[data-tab=rad]');
    t.textContent = em.length ? 'RADARES ' + on + '/' + em.length : 'RADARES'; t.classList.toggle('alert', G.threats.some(q => q.alive && q.kind === 'arm')); }
  for (const id in cardRefs) {
    const { el, spec, D } = cardRefs[id];
    const armed = UI.spec && UI.spec.id === id && UI.mode !== 'idle';
    el.classList.toggle('armed', !!armed);
    if (spec.kind === 'sam') { const c = placeCost(D), ce = $('[data-c]', el); ce.textContent = '◈ ' + c; ce.classList.toggle('prem', c > D.cost); el.classList.toggle('off', G.credits < c); }
    else {
      const r = readyCount(id), t = totalCount(id);
      $('[data-r]', el).textContent = G.phase === 'prep' ? t + ' en flota' : r + '/' + t + ' listos';
      el.classList.toggle('off', G.phase === 'ops' && r === 0);
      $('.buy', el).disabled = G.credits < D.cost || !G.buyBase || baseCount(G.buyBase) >= baseCap();
    }
  }
  if (baseCardEl && G.buyBase) { $('[data-bn]', baseCardEl).textContent = G.buyBase.name; $('[data-bc]', baseCardEl).textContent = baseCount(G.buyBase) + '/' + baseCap() + ' plazas'; }
  for (const el of $$('.chip', $('#cards'))) {
    const a = G.air.find(q => q.id === +el.dataset.id); if (!a) continue;
    el.className = 'chip ' + (a.state === 'hangar' ? (a.home.hp > 0 ? 'ready' : 'dead') : a.state) + (G.sel && G.sel.ref === a ? ' sel' : '');
    $('.bs', el).textContent = a.home.name.slice(0, 9); $('[data-s]', el).textContent = airStateTxt(a);
    $('[data-f]', el).style.width = (a.state === 'out' || a.state === 'rtb' ? a.fuel / a.def.fuel * 100 : 100) + '%';
  }
  for (const { el, e } of emRefs) {
    const on = isEmitting(e), tg = isTargeted(e), st = $('[data-st]', el);
    st.textContent = e.rdown > 0 ? 'AVERIADO ' + Math.ceil(e.rdown) + 's' : tg ? '⚠ APUNTADO' : on ? 'ON' : 'OFF';
    el.classList.toggle('on', on); el.classList.toggle('hot', tg); el.classList.toggle('down', e.rdown > 0);
  }
  if (masterEl) { const em = emitters(), any = em.some(isEmitting); $('[data-r]', masterEl).textContent = em.filter(isEmitting).length + '/' + em.length + ' ON'; $('[data-st]', masterEl).textContent = any ? 'SILENCIO RADIO' : 'ENCENDER TODO'; masterEl.classList.toggle('on', any); }
}
function buyAir(type) {
  const D = AIR[type];
  if (G.over) return;
  const b = G.buyBase;
  if (!b || b.hp <= 0) { log('Elige una base operativa', 'warn'); return; }
  if (baseCount(b) >= baseCap()) { log(b.name + ' llena (máx. ' + baseCap() + ' células)', 'warn'); return; }
  if (G.credits < D.cost) { log('Créditos insuficientes', 'warn'); return; }
  G.credits -= D.cost; G.stats.spentCredits += D.cost;
  G.air.push(mkAir(type, ++G.id, b)); log('Adquirido ' + D.short + ' en ' + b.name, 'good'); refreshDock(); refreshTop();
}

/* ======= interacción con tarjetas: tap = armar, arrastrar hacia el mapa = colocar ======= */
let cardDrag = null;
function bindCard(el, spec) {
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.buy')) return;
    cardDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false };
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
  });
  el.addEventListener('pointermove', e => {
    if (!cardDrag || cardDrag.id !== e.pointerId) return;
    const dx = e.clientX - cardDrag.x, dy = e.clientY - cardDrag.y;
    if (!cardDrag.drag) {
      const portrait = innerHeight > innerWidth;
      const toward = e.pointerType === 'mouse' ? Math.hypot(dx, dy) > 10
        : portrait ? (-dy > 14 && -dy > Math.abs(dx)) : (-dx > 14 && -dx > Math.abs(dy));
      if (toward) { if (!canArm(spec)) { cardDrag = null; return; } cardDrag.drag = true; armMode(spec); }
    }
    if (cardDrag && cardDrag.drag) setGhost(e.clientX, e.clientY, e.pointerType, true);
  });
  const end = e => {
    if (!cardDrag || cardDrag.id !== e.pointerId) return;
    const d = cardDrag; cardDrag = null;
    if (d.drag) { commitGhost(); cancelMode(); }
    else if (e.type === 'pointerup') {
      if (UI.spec && UI.spec.id === spec.id && UI.mode !== 'idle') cancelMode();
      else if (canArm(spec)) armMode(spec);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', e => { if (cardDrag && cardDrag.id === e.pointerId) { if (cardDrag.drag) cancelMode(); cardDrag = null; } });
}
function canArm(spec) {
  if (G.over) return false;
  if (spec.kind === 'sam') { if (G.credits < placeCost(SAM[spec.id])) { log('Créditos insuficientes', 'warn'); return false; } return true; }
  if (G.phase === 'prep') { log('PREPARACIÓN: toca una aeronave de la lista para cambiarla de base. Las salidas se ordenan al iniciar la operación.', 'warn'); return false; }
  if (!readyCount(spec.id)) { log(AIR[spec.id].short + ': sin células disponibles', 'warn'); return false; }
  return true;
}
function armMode(spec, af) {
  UI.spec = { kind: spec.kind, id: spec.id, af: af || null };
  UI.mode = spec.kind === 'sam' ? 'place' : 'mission';
  UI.ghost = null; UI.ptr = null;
  if (spec.kind === 'sam') {
    const D = SAM[spec.id];
    setHint('<b>' + D.name + '</b> — ' + D.desc + '<br><span style="color:' + C.dim + '">Pk por disparo: UAS ' + Math.round((D.pk.drone || 0) * 100) + '% · CRU ' + Math.round((D.pk.cruise || 0) * 100) + '% · BAL ' + Math.round((D.pk.ballistic || 0) * 100) + '% · ARM ' + Math.round((D.pk.arm || 0) * 100) + '%. Solo en tierra propia.' + (G.phase === 'ops' ? ' Despliegue urgente: +50 %.' : '') + '</span>', 'mode');
  } else {
    const D = AIR[spec.id];
    let t = '<b>' + D.name + '</b> — toca un punto del mapa para fijar la estación (CAP/patrulla).';
    if (D.pk.drone) t += ' Toca un <b>contacto</b> para interceptarlo (Pk ' + Math.round(D.pk.drone * 100) + '% UAS · ' + Math.round(D.pk.cruise * 100) + '% CRU).';
    if (D.strike) t += ' Toca una <b>rampa hostil</b> para atacarla (' + Math.round(D.strike * (1 - G.lv.siteDef) * 100) + '% éxito).';
    if (D.radar >= 180) t += ' Radio de detección ' + D.radar + '.';
    setHint(t + (af ? ' (' + af.label + ' · ' + af.home.name + ')' : ' Despega la célula más cercana al objetivo.'), 'mode');
  }
  refreshDock();
}
function cancelMode() {
  UI.mode = 'idle'; UI.spec = null; UI.ghost = null; UI.ptr = null;
  if ($('#hint').dataset.key === 'mode') setHint(null);
  tutShow();
  refreshDock();
}

/* ============================ ENTIDADES ============================ */
function validPlace(x, y) {
  if (!onLand(x, y)) return false;
  const sep = 20 / Math.max(.2, view.s);
  for (const a of G.assets) if (dst(x, y, a.x, a.y) < sep) return false;
  for (const u of G.units) if (dst(x, y, u.x, u.y) < sep * .8) return false;
  return true;
}
const placeCost = D => Math.round(D.cost * (G.phase === 'prep' ? 1 : 1.5));   // el despliegue urgente en operación cuesta +50 %
function placeUnit(D, x, y) {
  const cost = placeCost(D);
  if (G.credits < cost) { log('Créditos insuficientes', 'warn'); return false; }
  if (!validPlace(x, y)) { log('Posición no válida (tierra propia, libre)', 'warn'); return false; }
  G.credits -= cost; G.stats.spentCredits += cost;
  const n = G.units.filter(q => q.def === D).length + 1;
  const u = { id: ++G.id, def: D, x, y, ammo: Math.round(D.ammo * (1 + .12 * U('ammo'))), max: Math.round(D.ammo * (1 + .12 * U('ammo'))), cool: .8, roe: 'free', n, name: D.short + '-' + n, emit: true, paid: cost };
  G.units.push(u); log(u.name + ' en posición', 'good');
  if (G.n === 1 && !G.tut && !UI.hintShown.placed && G.phase === 'prep') {
    UI.hintShown.placed = 1;
    setTimeout(() => G && G.phase === 'prep' && setHint('Bien. Coloca algo más (un <b>AAA</b> cerca de la capital), revisa en <b>AIRE</b> dónde está cada aeronave y pulsa <b>INICIAR OPERACIÓN</b>.', 'plan'), 50);
  }
  refreshDock(); refreshTop(); return true;
}
function tracks() { return G.threats.filter(t => t.alive); }
function stationName(a) { return a.mission ? ({ cap: 'CAP', aew: 'AEW', isr: 'ISR', int: 'INTERCEPT.', strike: 'ATAQUE' })[a.mission.kind] : '—'; }

function launchMission(af, m) {
  const b = af.home;
  if (af.state === 'hangar') {
    if (G.phase === 'prep') { log('Las salidas se ordenan al iniciar la operación', 'warn'); return false; }
    if (b.hp <= 0) { log('Base ' + b.name + ' inoperativa: no se puede despegar', 'bad'); return false; }
    af.state = 'out'; af.x = b.x; af.y = b.y; af.cool = 1;
    SND.launch();
  } else if (af.state !== 'out') return false;
  af.mission = m;
  return true;
}
function missionStation(kind, x, y) { return { kind, x, y, ang: 0, phase: 'transit' }; }
function stationKind(D) { return D.id === 'e2' ? 'aew' : D.id === 'mq9' ? 'isr' : 'cap'; }
function bestReady(type, x, y) {      // la célula lista cuya base está más cerca del punto
  if (x === undefined) { const s0 = G.sites.find(q => q.alive) || G.sites[0]; if (s0) { x = s0.x; y = s0.y; } else { x = 500; y = 0; } }
  let best = null, bd = 1e9;
  for (const a of G.air) if (a.type === type && a.state === 'hangar' && a.home.hp > 0) { const d = dst(a.home.x, a.home.y, x, y); if (d < bd) { bd = d; best = a; } }
  return best;
}
const firstReady = bestReady;
function strikeP(D, site) { return clamp(D.strike * (1 + .06 * U('strike')) * (1 - site.def), 0, .95); }
function interceptPk(D, t) { return pkMod(pkOf(D.pk, t.kind)); }

/* ============================ SIMULACIÓN ============================ */
function spawnWave(w, idx) {
  const alive = G.sites.filter(s => s.alive);
  if (!alive.length) { log('Oleada ' + (idx + 1) + ' suprimida: sin rampas operativas', 'good'); return; }
  let n = 0;
  for (const it of w.items) for (let i = 0; i < it.count; i++) {
    const s = pick(alive);
    G.pending.push({ kind: it.kind, site: s, delay: rnd(0, Math.min(5, .3 * it.count + 1)) });
    n++;
  }
  log('OLEADA ' + (idx + 1) + '/' + G.lv.waves.length + ' — ' + n + ' lanzamientos', 'warn'); SND.ping();
  const cnt = { drone: 0, cruise: 0, ballistic: 0, arm: 0 }; for (const it of w.items) cnt[it.kind === 'decoy' ? 'drone' : it.kind] += it.count;
  banner('OLEADA ' + (idx + 1) + '/' + G.lv.waves.length + '<small>' + [cnt.drone && 'UAS ×' + cnt.drone, cnt.cruise && 'CRU ×' + cnt.cruise, cnt.ballistic && 'BAL ×' + cnt.ballistic, cnt.arm && 'ARM ×' + cnt.arm].filter(Boolean).join(' · ') + '</small>');
}
function emitters() { const L = []; for (const u of G.units) if (u.def.radar || u.def.sensor) L.push(u); for (const a of G.assets) if (a.radar && a.hp > 0) L.push(a); return L; }
const isEmitting = e => e.emit !== false && !(e.rdown > 0);
const isTargeted = e => G.threats.some(t => t.alive && t.kind === 'arm' && t.target === e);
const EM_W = { radar: 3, bmd: 2, mrad: 2, shorad: 1.5, gun: .5 };
function toggleEmit(e) {
  if (e.rdown > 0) { log(e.name + ': radar dañado (' + Math.ceil(e.rdown) + ' s)', 'warn'); return; }
  e.emit = !e.emit; log(e.name + ' emisor ' + (e.emit ? 'ON' : 'OFF'), e.emit ? '' : 'warn'); SND.ping();
  updateDetection(); refreshDock(); if (G.sel && G.sel.ref === e) renderPanel();
}
function spawnThreat(kind, s) {
  const D = THREAT[kind];
  let tgt = null;
  if (kind === 'arm') {
    const em = emitters().filter(isEmitting);
    if (!em.length) { log('ARM abortado: no hay emisores activos que atacar', 'good'); G.stats.evaded++; return; }
    const w = e => e.def ? (EM_W[e.def.id] || 1) : 2;
    let r = Math.random() * em.reduce((a, e) => a + w(e), 0); tgt = em[0];
    for (const e of em) { r -= w(e); if (r <= 0) { tgt = e; break; } }
  } else {
    const ws = G.assets.filter(a => a.hp > 0); if (!ws.length) return;
    let r = Math.random() * ws.reduce((a, b) => a + b.tw, 0); tgt = ws[0];
    for (const a of ws) { r -= a.tw; if (r <= 0) { tgt = a; break; } }
  }
  const sp = D.spd * rnd(.92, 1.08), x = s.x + rnd(-14, 14), y = s.y + rnd(-14, 14);
  const d = dst(x, y, tgt.x, tgt.y), vx = (tgt.x - x) / d * sp, vy = (tgt.y - y) / d * sp;
  G.threats.push({ id: ++G.id, kind, D, x, y, vx, vy, spd: sp, target: tgt, alive: true, tracked: kind === 'ballistic', site: s, _surv: 1 });
  if (kind === 'ballistic') { log('LANZAMIENTO BALÍSTICO detectado (' + s.name + ')', 'bad'); SND.ping(); }
  if (kind === 'arm') {
    log('LANZAMIENTO ARM (ESM) → ' + tgt.name + ': ¡apaga ese emisor!', 'bad'); SND.ping(); buzz(70);
    banner('ALERTA ARM<small>' + tgt.name + ' apuntado — apágalo en RADARES</small>');
    if (UI.tab !== 'rad' && UI.mode === 'idle') { UI.tab = 'rad'; buildDock(); }
  }
}
function fx(x, y, col, size, dur) { G.fx.push({ x, y, col, size, dur: dur || .6, t: 0 }); }
function killThreat(t, by) {
  t.alive = false; G.credits += t.D.bounty; G.stats.kills++; G.stats.value += t.D.val;
  fx(t.x, t.y, C.amber, t.kind === 'ballistic' ? 30 : t.kind === 'cruise' ? 22 : 14, .5); SND.boom();
  floatTxt(t.x, t.y - 6, '+' + t.D.bounty, C.amber);
  if (t.kind === 'cruise' || t.kind === 'ballistic') log(t.D.name + ' destruido (' + by + ')', 'good');
}
function baseLost(a) {
  const lost = G.air.filter(q => q.home === a && (q.state === 'hangar' || q.state === 'turn'));
  lost.forEach(q => loseAir(q, 'destruido en tierra en ' + a.name));
}
function impactARM(t) {
  t.alive = false;
  const e = t.target, isAsset = !!e.type, live = isAsset ? e.hp > 0 : G.units.includes(e);
  if (live && isEmitting(e)) {
    G.stats.leaked++; G.stats.leakKind.arm = (G.stats.leakKind.arm || 0) + 1;
    FXS.shake = Math.min(1, FXS.shake + .35); FXS.flash = Math.min(.5, FXS.flash + .18); buzz(60); SND.impact();
    if (isAsset) {
      e.hp = Math.max(0, e.hp - 10 * (1 - .07 * U('armor'))); e.rdown = 45; fx(e.x, e.y, C.red, 30, .9);
      log('ARM impacta: radar de ' + e.name + ' fuera de servicio 45 s', 'bad'); if (e.hp <= 0) { log(e.name + ' DESTRUIDA', 'bad'); baseLost(e); }
    } else {
      G.units.splice(G.units.indexOf(e), 1); fx(e.x, e.y, C.red, 36, 1); if (G.sel && G.sel.ref === e) hidePanel();
      log(e.name + ' DESTRUIDA por ARM', 'bad');
    }
  } else { G.stats.evaded++; fx(t.x, t.y, C.dim, 14, .5); floatTxt(t.x, t.y - 8, 'ARM perdido', C.green); log('ARM perdió el blanco (' + e.name + ' apagado)', 'good'); }
}
function impact(t) {
  if (t.kind === 'arm') { impactARM(t); return; }
  t.alive = false;
  const a = t.target;
  G.stats.leaked++; G.stats.leakKind[t.kind] = (G.stats.leakKind[t.kind] || 0) + 1; if (!t.tracked) G.stats.blind++;
  if (t.D.dmg > 0) {
    const dmg = t.D.dmg * (1 - .07 * U('armor')); a.hp = Math.max(0, a.hp - dmg);
    floatTxt(a.x, a.y - 26, '−' + Math.round(dmg) + '%', C.red); FXS.shake = Math.min(1, FXS.shake + (t.kind === 'ballistic' ? .9 : .3)); FXS.flash = Math.min(.5, FXS.flash + .22); buzz(t.kind === 'ballistic' ? 160 : 45);
    fx(a.x + rnd(-12, 12), a.y + rnd(-12, 12), C.red, t.kind === 'ballistic' ? 46 : 26, .9); SND.impact();
    log('IMPACTO ' + t.D.tag + ' en ' + a.name + ' (' + Math.round(a.hp) + '%)', 'bad');
    if (a.hp <= 0) { log(a.name + ' DESTRUIDA', 'bad'); if (a.type === 'airbase') baseLost(a); }
  } else fx(a.x, a.y, C.dim, 12, .4);
}
function updateDetection() {
  const rad = [];
  for (const a of G.assets) if (a.radar && a.hp > 0 && isEmitting(a)) rad.push([a.x, a.y, a.radar * radarMul()]);
  for (const u of G.units) { if (!isEmitting(u)) continue; if (u.def.radar) rad.push([u.x, u.y, u.def.radar * radarMul()]); else if (u.def.sensor) rad.push([u.x, u.y, u.def.sensor]); }
  for (const a of G.air) if (a.state === 'out' || a.state === 'rtb') rad.push([a.x, a.y, a.def.radar * radarMul()]);
  G.radars = rad;
  for (const t of G.threats) {
    if (!t.alive) continue;
    if (t.kind === 'ballistic') { t.tracked = true; continue; }
    t.tracked = false; t.lost = t.kind === 'arm' && !isEmitting(t.target);
    for (const r of rad) if (dst(t.x, t.y, r[0], r[1]) <= r[2]) { t.tracked = true; break; }
  }
}
function pickTarget(x, y, range, pkTab, roeSave) {
  let best = null, bs = 1e9;
  for (const t of G.threats) {
    if (!t.alive || !t.tracked || t._surv < .22) continue;
    const pk = pkOf(pkTab, t.kind); if (pk <= 0) continue;
    if (roeSave && (t.kind === 'drone' || t.kind === 'decoy')) continue;
    const d = dst(x, y, t.x, t.y); if (d > range) continue;
    const tti = dst(t.x, t.y, t.target.x, t.target.y) / t.spd;
    if (tti < bs) { bs = tti; best = t; }
  }
  return best;
}
function fire(x, y, t, pk, spd, life, by, cost) {
  G.missiles.push({ x, y, t, pk, spd, life, dx: 0, dy: -1, by });
  t._surv *= (1 - pk); G.stats.fired++; G.stats.spent += cost;
}
function updateUnits(dt) {
  for (const u of G.units) {
    const D = u.def; if (!D.range || u.ammo <= 0) continue;
    u.cool -= dt; if (u.cool > 0) continue;
    const t = pickTarget(u.x, u.y, D.range, D.pk, u.roe === 'save'); if (!t) continue;
    fire(u.x, u.y, t, pkMod(pkOf(D.pk, t.kind)), D.mspeed, D.range * 1.6 / D.mspeed + .5, D.short, D.mcost);
    u.ammo--; u.cool = D.reload * (1 - .06 * U('reload'));
    if (u.ammo === 0) { G.stats.dry++; log(D.short + '-' + u.n + ' SIN MUNICIÓN', 'bad'); }
    else if (!u.low && u.ammo <= u.max * .25) { u.low = true; log(D.short + '-' + u.n + ' munición baja', 'warn'); }
  }
}
function flyTo(a, x, y, dt) {
  const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy), st = a.def.speed * dt;
  a.hdg = Math.atan2(dy, dx);
  if (d <= st) { a.x = x; a.y = y; return true; }
  a.x += dx / d * st; a.y += dy / d * st; return false;
}
function loseAir(a, why) {
  G.air.splice(G.air.indexOf(a), 1); G.stats.airLost++;
  fx(a.x, a.y, C.red, 24, .8); SND.boom(); log(a.label + ' perdido (' + why + ')', 'bad');
  if (G.sel && G.sel.ref === a) hidePanel();
}
function startRTB(a) { a.state = 'rtb'; a.mission = null; }
function updateAir(a, dt) {
  const D = a.def;
  if (a.state === 'hangar') return;
  if (a.state === 'turn') {
    a.turn -= dt;
    if (a.turn <= 0) { a.state = 'hangar'; a.fuel = D.fuel; a.ammo = D.ammo; a.x = a.home.x; a.y = a.home.y; log(a.label + ' listo en ' + a.home.name); }
    return;
  }
  a.fuel -= dt; a.cool -= dt;
  if (a.fuel <= 0) { loseAir(a, 'sin combustible'); return; }
  // zona antiaérea alrededor de rampas activas
  for (const s of G.sites) if (s.alive && dst(a.x, a.y, s.x, s.y) < SITE_AA && !(a.mission && a.mission.kind === 'strike')) {
    if (Math.random() < .22 * dt) { loseAir(a, 'defensa antiaérea enemiga'); return; }
  }
  if (a.state === 'rtb') {
    const b = rtbBase(a);
    if (!b) { a.hdg += dt; return; }
    if (flyTo(a, b.x, b.y, dt)) { a.state = 'turn'; a.turn = D.turn; a.mission = null; if (a.home !== b) { a.home = b; log(a.label + ' aterriza en ' + b.name); } }
    return;
  }
  const m = a.mission;
  if (!m) { startRTB(a); return; }
  const rb = rtbBase(a) || a.home, need = dst(a.x, a.y, rb.x, rb.y) / D.speed + 8;
  if (a.fuel <= need || (D.ammo > 0 && a.ammo <= 0 && m.kind !== 'strike')) { log(a.label + ' RTB', ''); startRTB(a); return; }
  if (m.kind === 'strike') {
    if (!m.site.alive) { startRTB(a); return; }
    if (flyTo(a, m.site.x, m.site.y, dt)) {
      const p = strikeP(D, m.site); G.stats.strikes++;
      if (Math.random() < p) {
        m.site.alive = false; fx(m.site.x, m.site.y, C.amber, 40, 1.2); SND.impact(); G.credits += 60; floatTxt(m.site.x, m.site.y - 20, '+60', C.amber);
        log(m.site.name + ' DESTRUIDA por ' + a.label + ' (+60)', 'good');
        const dropped = G.pending.filter(q => q.site === m.site).length; G.pending = G.pending.filter(q => q.site !== m.site);
        if (dropped) log(dropped + ' lanzamientos cancelados', 'good');
        if (G.sel && G.sel.ref === m.site) hidePanel();
        startRTB(a);
      } else {
        log(a.label + ' ataque a ' + m.site.name + ' FALLIDO', 'warn');
        if (Math.random() < .35) { loseAir(a, 'derribado en el ataque'); return; }
        startRTB(a);
      }
    }
    return;
  }
  if (m.kind === 'int') {
    if (!m.target.alive) { a.mission = { kind: 'cap', x: a.x - D.orbit, y: a.y, ang: 0, phase: 'station' }; }
    else flyTo(a, m.target.x, m.target.y, dt);
  } else {
    if (m.phase === 'transit') { if (flyTo(a, m.x + D.orbit, m.y, dt)) { m.phase = 'station'; m.ang = 0; } }
    else { m.ang += 1.1 * dt; a.x = m.x + Math.cos(m.ang) * D.orbit; a.y = m.y + Math.sin(m.ang) * D.orbit; a.hdg = m.ang + Math.PI / 2; }
  }
  // armamento aire-aire
  if (D.ammo > 0 && a.ammo > 0 && a.cool <= 0) {
    let t = null;
    if (m.kind === 'int' && m.target.alive && m.target.tracked && m.target._surv > .22 && dst(a.x, a.y, m.target.x, m.target.y) <= D.engage) t = m.target;
    else t = pickTarget(a.x, a.y, D.engage, D.pk, false);
    if (t) { fire(a.x, a.y, t, pkMod(pkOf(D.pk, t.kind)), D.mspeed, 3, a.label, D.mcost); a.ammo--; a.cool = D.reload; }
  }
}
function updateMissiles(dt) {
  for (let i = G.missiles.length - 1; i >= 0; i--) {
    const m = G.missiles[i], t = m.t;
    if (!t.alive) { G.missiles.splice(i, 1); continue; }
    const d = dst(m.x, m.y, t.x, t.y), tt = d / m.spd;
    const ax = t.x + t.vx * tt, ay = t.y + t.vy * tt, ang = Math.atan2(ay - m.y, ax - m.x), st = m.spd * dt;
    m.dx = Math.cos(ang); m.dy = Math.sin(ang);
    if (d <= st + 4) {
      if (Math.random() < m.pk) killThreat(t, m.by);
      else { fx(t.x, t.y, C.dim, 8, .3); }
      G.missiles.splice(i, 1); continue;
    }
    m.x += m.dx * st; m.y += m.dy * st; m.life -= dt;
    if (m.life <= 0) G.missiles.splice(i, 1);
  }
}
function step(dt) {
  G.t += dt;
  G.credits += G.lv.income * dt;
  for (const a of G.assets) if (a.rdown > 0) { a.rdown = Math.max(0, a.rdown - dt); if (a.rdown === 0) log('Radar de ' + a.name + ' operativo', 'good'); }
  while (G.waveIdx < G.lv.waves.length && G.t >= G.lv.waves[G.waveIdx].t) { spawnWave(G.lv.waves[G.waveIdx], G.waveIdx); G.waveIdx++; }
  for (let i = G.pending.length - 1; i >= 0; i--) {
    const p = G.pending[i]; p.delay -= dt;
    if (p.delay <= 0) { if (p.site.alive) spawnThreat(p.kind, p.site); G.pending.splice(i, 1); }
  }
  for (const t of G.threats) {
    if (!t.alive) continue;
    const d = dst(t.x, t.y, t.target.x, t.target.y);
    if (d <= t.spd * dt + 3) impact(t); else { t.x += t.vx * dt; t.y += t.vy * dt; }
    t._surv = 1;
  }
  for (const m of G.missiles) if (m.t.alive) m.t._surv *= (1 - m.pk);
  updateDetection();
  for (const t of G.threats) {
    if (!t.alive) continue;
    if (t.tracked) { t.idT = (t.idT || 0) + dt; if (G.t - (t.ht || 0) >= 1) { t.ht = G.t; (t.hist = t.hist || []).push([t.x, t.y]); if (t.hist.length > 6) t.hist.shift(); } }
    else { t.idT = 0; t.hist = []; }
  }
  for (const a of G.air) if (a.state === 'out' || a.state === 'rtb') { if (G.t - (a.ht || 0) >= 1) { a.ht = G.t; (a.hist = a.hist || []).push([a.x, a.y]); if (a.hist.length > 7) a.hist.shift(); } } else a.hist = [];
  updateUnits(dt);
  for (const a of G.air.slice()) updateAir(a, dt);
  updateMissiles(dt);
  G.threats = G.threats.filter(t => t.alive);
  for (let i = G.fx.length - 1; i >= 0; i--) { G.fx[i].t += dt; if (G.fx[i].t > G.fx[i].dur) G.fx.splice(i, 1); }
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.1);
  // fin de nivel
  const ig = integrity();
  if (!G.over && (capital().hp <= 0 || ig < 25)) endLevel(false);
  else if (!G.over && G.waveIdx >= G.lv.waves.length && !G.pending.length && !G.threats.length) {
    G.endTimer += dt; if (G.endTimer > 1.5) endLevel(true);
  }
}

/* ============================ SELECCIÓN / PANEL ============================ */
function pickEntity(sx, sy) {
  let best = null, bd = 30;
  const tryc = (kind, ref, x, y, bias) => {
    const d = dst(sx, sy, x * view.s + view.ox, y * view.s + view.oy) - (bias || 0);
    if (d < bd) { bd = d; best = { kind, ref }; }
  };
  for (const t of G.threats) if (t.alive && t.tracked) tryc('threat', t, t.x, t.y, 6);
  for (const a of G.air) if (a.state === 'out' || a.state === 'rtb') tryc('air', a, a.x, a.y, 4);
  for (const s of G.sites) if (s.alive) tryc('site', s, s.x, s.y, 2);
  for (const u of G.units) tryc('unit', u, u.x, u.y);
  for (const a of G.assets) tryc('asset', a, a.x, a.y);
  return best;
}
function pickTargetFor(D, sx, sy) {
  let best = null, bd = 32;
  if (D.pk && D.pk.drone) for (const t of G.threats) if (t.alive && t.tracked && interceptPk(D, t) > 0) {
    const d = dst(sx, sy, t.x * view.s + view.ox, t.y * view.s + view.oy); if (d < bd) { bd = d; best = { kind: 'int', t }; }
  }
  if (D.strike) for (const s of G.sites) if (s.alive) {
    const d = dst(sx, sy, s.x * view.s + view.ox, s.y * view.s + view.oy); if (d < bd) { bd = d; best = { kind: 'strike', s }; }
  }
  return best;
}
function hidePanel() { G && (G.sel = null); $('#panel').classList.add('hidden'); }
function select(sel) { G.sel = sel; renderPanel(); }
const pb = (v, mx, col) => '<div class="pb"><i style="width:' + clamp(v / mx * 100, 0, 100) + '%' + (col ? ';background:' + col : '') + '"></i></div>';
const refund = u => G.phase === 'prep' ? (u.paid || u.def.cost) : Math.round(u.def.cost * .6);
const fwdDist = b => Math.round(Math.min(...G.sites.filter(q => q.alive).map(q => dst(b.x, b.y, q.x, q.y)), 9999));
function emitTxt(e) { return e.rdown > 0 ? 'AVERIADO ' + Math.ceil(e.rdown) + 's' : isEmitting(e) ? 'EMITIENDO' : 'APAGADO'; }
function renderPanel() {
  const p = $('#panel'), s = G && G.sel;
  if (!s || UI.mode !== 'idle') { p.classList.add('hidden'); return; }
  let h = '';
  const r = s.ref;
  if (s.kind === 'asset') {
    h = '<h3>' + r.name + '</h3><div class="sub">' + ({ capital: 'Capital · puesto de mando', airbase: 'Base aérea', power: 'Central eléctrica', port: 'Puerto' })[r.type] + '</div><div class="row"><span>Integridad</span><span>' + Math.round(r.hp) + '%</span></div>' + pb(r.hp, 100, r.hp > 50 ? C.green : C.red);
    if (r.type === 'airbase') {
      const here = G.air.filter(q => q.home === r);
      h += '<div class="row"><span>Hangar</span><span>' + here.length + '/' + baseCap() + '</span></div><div class="row"><span>Distancia al frente</span><span>' + fwdDist(r) + '</span></div>';
      h += here.map(q => '<div class="row sm"><span>' + q.label + '</span><span>' + airStateTxt(q) + '</span></div>').join('');
    }
    if (r.radar) {
      h += '<div class="row"><span>Radar (R ' + r.radar + ')</span><span>' + emitTxt(r) + '</span></div>';
      h += '<button class="pbtn" data-a="emit"' + (r.hp <= 0 ? ' disabled' : '') + '>Emisor: <b>' + (r.emit ? 'ON' : 'OFF') + '</b><span class="pct">' + (isTargeted(r) ? '⚠ ARM' : '') + '</span></button>';
    }
  } else if (s.kind === 'unit') {
    const D = r.def;
    h = '<h3>' + r.name + '</h3><div class="sub">' + D.name + '</div>';
    if (D.range) h += '<div class="row"><span>Munición</span><span>' + r.ammo + '/' + r.max + '</span></div>' + pb(r.ammo, r.max) + '<div class="row"><span>Alcance</span><span>' + D.range + '</span></div>';
    else h += '<div class="row"><span>Detección</span><span>' + D.radar + '</span></div>';
    h += '<div class="row"><span>Emisor</span><span>' + (isTargeted(r) ? '⚠ APUNTADO POR ARM' : emitTxt(r)) + '</span></div>';
    h += '<button class="pbtn' + (isTargeted(r) ? ' danger' : '') + '" data-a="emit">Emisor: <b>' + (r.emit ? 'ON → apagar' : 'OFF → encender') + '</b></button>';
    if (D.range) {
      h += '<button class="pbtn" data-a="roe">ROE: <b>' + (r.roe === 'free' ? 'LIBRE (todo)' : 'AHORRAR (no UAS)') + '</b></button>';
      const cost = Math.round(D.restock * (1 - r.ammo / r.max));
      h += '<button class="pbtn" data-a="restock"' + (r.ammo >= r.max || G.credits < cost ? ' disabled' : '') + '>Reabastecer <span class="pct">◈ ' + cost + '</span></button>';
    }
    h += '<button class="pbtn" data-a="sell">Retirar <span class="pct">+◈ ' + refund(r) + '</span></button>';
  } else if (s.kind === 'air') {
    const D = r.def;
    h = '<h3>' + r.label + '</h3><div class="sub">' + D.name + ' · base ' + r.home.name + ' · ' + airStateTxt(r) + '</div>';
    if (r.state === 'hangar') {
      if (G.phase === 'prep') {
        h += '<div class="sub">Reubicar en otra base (más cerca del frente = llega antes, pero más expuesta):</div>';
        for (const b of airbases()) if (b !== r.home) h += '<button class="pbtn" data-a="rebase" data-t="' + b.id + '"' + (b.hp <= 0 || baseCount(b) >= baseCap() ? ' disabled' : '') + '>→ ' + b.name + '<span class="pct">' + baseCount(b) + '/' + baseCap() + ' · frente ' + fwdDist(b) + '</span></button>';
      } else h += (r.home.hp > 0 ? '<button class="pbtn" data-a="sortie">Ordenar salida… <span class="pct">toca el mapa</span></button>' : '<div class="sub">Base inoperativa.</div>');
    } else if (r.state === 'turn') {
      h += '<div class="row"><span>Rearme y repostaje</span><span>' + Math.ceil(r.turn) + 's</span></div>';
    } else {
      h += '<div class="row"><span>Combustible</span><span>' + Math.round(r.fuel) + 's</span></div>' + pb(r.fuel, D.fuel, C.amber);
      if (D.ammo) h += '<div class="row"><span>Misiles</span><span>' + r.ammo + '/' + D.ammo + '</span></div>' + pb(r.ammo, D.ammo);
      h += '<button class="pbtn" data-a="rtb">Volver a base (RTB)</button>';
      if (r.state === 'out') h += '<button class="pbtn" data-a="retask">Reasignar misión…</button>';
    }
  } else if (s.kind === 'site') {
    h = '<h3>' + r.name + '</h3><div class="sub">Rampa de lanzamiento hostil · AA ' + Math.round(r.def * 100) + '%</div>';
    const enr = G.air.filter(a => a.mission && a.mission.kind === 'strike' && a.mission.site === r);
    let any = false;
    if (G.phase === 'prep') h += '<div class="sub">Los ataques se ordenan durante la operación. Destruir rampas cancela oleadas.</div>';
    else for (const type of ['f15e', 'f16', 'mq9']) {
      const D = AIR[type]; if (G.n < D.unlock) continue;
      const rc = readyCount(type), p = strikeP(D, r), bs = bestReady(type, r.x, r.y);
      let acc = p; for (const e of enr) acc = 1 - (1 - acc) * (1 - strikeP(e.def, r));
      any = true;
      h += '<button class="pbtn danger" data-a="strike" data-t="' + type + '"' + (rc ? '' : ' disabled') + '>' + D.short + ' ×' + rc + (bs ? ' <small>' + Math.ceil(dst(bs.home.x, bs.home.y, r.x, r.y) / D.speed) + 's</small>' : '') + '<span class="pct">' + Math.round(p * 100) + '%' + (enr.length ? ' → ' + Math.round(acc * 100) + '%' : '') + '</span></button>';
    }
    if (enr.length) h += '<div class="sub" style="margin-top:6px">En ruta: ' + enr.map(e => e.label).join(', ') + '</div>';
    if (!any && G.phase === 'ops') h += '<div class="sub">Sin plataformas de ataque.</div>';
  } else if (s.kind === 'threat') {
    const tgt = r.target, eta = dst(r.x, r.y, tgt.x, tgt.y) / r.spd;
    h = '<h3>H-' + String(r.id).padStart(3, '0') + ' ' + r.D.tag + '</h3><div class="sub">' + (r.kind === 'decoy' ? THREAT.drone.name : r.D.name) + ' · objetivo probable: ' + tgt.name + '</div>' +
      '<div class="row"><span>Impacto en</span><span>' + Math.ceil(eta) + 's</span></div>';
    if (r.kind === 'arm') h += '<div class="sub">Apaga <b>' + tgt.name + '</b> (RADARES) y perderá el blanco.</div><button class="pbtn danger" data-a="emit-t">' + tgt.name + ': ' + (isEmitting(tgt) ? 'APAGAR' : 'ENCENDER') + '</button>';
    for (const type of ['f16', 'f15e']) {
      const D = AIR[type]; if (G.n < D.unlock) continue;
      const pk = interceptPk(D, r), rc = readyCount(type), bs = bestReady(type, r.x, r.y);
      const t2 = bs ? dst(bs.home.x, bs.home.y, r.x, r.y) / D.speed : 0;
      h += '<button class="pbtn" data-a="int" data-t="' + type + '"' + (rc && pk > 0 && G.phase === 'ops' ? '' : ' disabled') + '>Interceptar con ' + D.short + ' ×' + rc + (bs ? ' <small style="color:' + (t2 > eta ? C.red : C.dim) + '">' + Math.ceil(t2) + 's' + (t2 > eta ? ' TARDE' : '') + '</small>' : '') + '<span class="pct">' + Math.round(pk * 100) + '%</span></button>';
    }
  }
  p.innerHTML = h; p.classList.remove('hidden');
  $$('.pbtn', p).forEach(b => b.addEventListener('click', () => panelAction(b.dataset.a, b.dataset.t)));
}
function panelAction(a, type) {
  const s = G.sel; if (!s || G.over) return;
  const r = s.ref;
  if (a === 'roe') r.roe = r.roe === 'free' ? 'save' : 'free';
  else if (a === 'emit') { toggleEmit(r); return; }
  else if (a === 'emit-t') { toggleEmit(r.target); renderPanel(); return; }
  else if (a === 'restock') { const c = Math.round(r.def.restock * (1 - r.ammo / r.max)); if (G.credits >= c) { G.credits -= c; G.stats.spentCredits += c; r.ammo = r.max; r.low = false; log(r.name + ' reabastecido'); } }
  else if (a === 'sell') { G.credits += refund(r); G.units.splice(G.units.indexOf(r), 1); hidePanel(); refreshTop(); refreshDock(); return; }
  else if (a === 'rtb') startRTB(r);
  else if (a === 'retask') armMode({ kind: 'air', id: r.type }, r);
  else if (a === 'sortie') armMode({ kind: 'air', id: r.type }, r);
  else if (a === 'rebase') { const b = G.assets.find(x => x.id === type); if (b && b.hp > 0 && baseCount(b) < baseCap()) { r.home = b; r.x = b.x; r.y = b.y; r.moved = true; log(r.label + ' → ' + b.name, 'good'); } }
  else if (a === 'strike') { const af = bestReady(type, r.x, r.y); if (af && launchMission(af, { kind: 'strike', site: r })) log(af.label + ' (' + af.home.name + ') → ' + r.name + ' (ATAQUE)'); }
  else if (a === 'int') { const af = bestReady(type, r.x, r.y); if (af && launchMission(af, { kind: 'int', target: r })) log(af.label + ' (' + af.home.name + ') → H-' + r.id + ' (INTERCEPT.)'); }
  renderPanel(); refreshDock(); refreshTop();
}

/* ============================ PUNTERO EN EL MAPA ============================ */
function toWorld(cx, cy) { const r = cv.getBoundingClientRect(); return [(cx - r.left - view.ox) / view.s, (cy - r.top - view.oy) / view.s, cx - r.left, cy - r.top, r]; }
function setGhost(cx, cy, ptype, dragging) {
  const [wx, wy, sx, sy, r] = toWorld(cx, cy);
  if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) { UI.ghost = null; return; }
  const off = ptype === 'mouse' ? 0 : 46;
  const g = { x: wx, y: wy - off / view.s, valid: true, raw: [sx, sy], target: null };
  if (UI.mode === 'place') g.valid = validPlace(g.x, g.y);
  else if (UI.mode === 'mission') {
    const D = AIR[UI.spec.id], tg = pickTargetFor(D, sx, sy);
    if (tg) { g.target = tg; g.x = wx; g.y = wy; }
  }
  UI.ghost = g;
}
function commitGhost() {
  const g = UI.ghost; if (!g || !G || G.over) return false;
  if (UI.mode === 'place') {
    const ok = placeUnit(SAM[UI.spec.id], g.x, g.y);
    if (!ok && !g.valid) log('Posición no válida (tierra propia, libre)', 'warn');
    return ok;
  }
  if (UI.mode === 'mission') {
    const D = AIR[UI.spec.id];
    let m;
    if (g.target && g.target.kind === 'int') m = { kind: 'int', target: g.target.t };
    else if (g.target && g.target.kind === 'strike') m = { kind: 'strike', site: g.target.s };
    else m = missionStation(stationKind(D), clamp(g.x, 20, WW - 20), clamp(g.y, 20, WH - 20));
    const tp = m.kind === 'int' ? m.target : m.kind === 'strike' ? m.site : m;
    const af = UI.spec.af || bestReady(D.id, tp.x, tp.y);
    if (!af) { log(D.short + ': sin células disponibles', 'warn'); return false; }
    if (launchMission(af, m)) {
      const lbl = m.kind === 'int' ? 'INTERCEPT. H-' + m.target.id : m.kind === 'strike' ? 'ATAQUE ' + m.site.name : m.kind.toUpperCase();
      log(af.label + ' (' + af.home.name + ') → ' + lbl);
      if (m.kind === 'strike') log('Prob. de éxito ' + Math.round(strikeP(D, m.site) * 100) + '%');
      refreshDock(); return true;
    }
  }
  return false;
}
function initPointer() {
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    if (!G) return;
    SND.init();
    UI.ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, type: e.pointerType };
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
    if (UI.mode !== 'idle') setGhost(e.clientX, e.clientY, e.pointerType);
  });
  cv.addEventListener('pointermove', e => {
    if (!G) return;
    if (UI.ptr && UI.ptr.id === e.pointerId && Math.hypot(e.clientX - UI.ptr.x, e.clientY - UI.ptr.y) > 8) UI.ptr.moved = true;
    if (UI.mode !== 'idle' && (e.pointerType === 'mouse' || UI.ptr)) setGhost(e.clientX, e.clientY, e.pointerType);
  });
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !UI.ptr) UI.ghost = null; });
  cv.addEventListener('pointercancel', () => { UI.ptr = null; if (UI.mode !== 'idle') UI.ghost = null; });
  cv.addEventListener('pointerup', e => {
    if (!G || !UI.ptr || UI.ptr.id !== e.pointerId) return;
    const was = UI.ptr; UI.ptr = null;
    const [, , sx, sy] = toWorld(e.clientX, e.clientY);
    if (UI.mode === 'idle') {
      if (!was.moved) { const p = pickEntity(sx, sy); if (p) select(p); else hidePanel(); }
      return;
    }
    setGhost(e.clientX, e.clientY, e.pointerType);
    const persistent = UI.mode === 'place';
    const ok = commitGhost();
    if (e.pointerType !== 'mouse') UI.ghost = null;
    if (ok) {
      if (persistent) { if (G.credits < placeCost(SAM[UI.spec.id])) cancelMode(); }
      else cancelMode();
    }
    refreshDock(); refreshTop();
  });
  addEventListener('keydown', e => {
    if (!G || !$('#overlay').classList.contains('hidden')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, ids = Object.keys(cardRefs);
    if ('qwert'.includes(k) && k.length === 1 && ids['qwert'.indexOf(k)]) { const id = ids['qwert'.indexOf(k)], sp = cardRefs[id].spec; if (UI.spec && UI.spec.id === id && UI.mode !== 'idle') cancelMode(); else if (canArm(sp)) armMode(sp); return; }
    if (k === 'Tab') { e.preventDefault(); UI.tab = ({ def: 'air', air: 'rad', rad: 'def' })[UI.tab]; cancelMode(); buildDock(); return; }
    if (k === 'f') { restockAll(); return; }
    if (k === 'm') { showPause(); return; }
    if (e.code === 'Space') { e.preventDefault(); setSpeed(G.speed ? 0 : 1); }
    else if (e.key === '1') setSpeed(1); else if (e.key === '2') setSpeed(2); else if (e.key === '3') setSpeed(4);
    else if (e.key === 'Escape') { if (UI.mode !== 'idle' || G.sel) { cancelMode(); hidePanel(); } else showPause(); }
  });
}

/* ============================ RENDER ============================ */
function resize() {
  const wrap = $('#mapwrap'), w = wrap.clientWidth, h = wrap.clientHeight;
  if (!w || !h) return;
  view.dpr = Math.min(devicePixelRatio || 1, 2); view.w = w; view.h = h;
  cv.width = Math.round(w * view.dpr); cv.height = Math.round(h * view.dpr);
  view.s = Math.min(w / WW, h / WH) * .995; view.ox = (w - WW * view.s) / 2; view.oy = (h - WH * view.s) / 2;
  view.R = clamp(5.5 + Math.min(w, h) / 100, 8, 12) * SET.scale;
  if (window.__rot) window.__rot();
  renderBG();
}
function polyPath(c, poly) { c.beginPath(); poly.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
function renderBG() {
  bg.width = cv.width; bg.height = cv.height;
  const c = bg.getContext('2d');
  c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  c.fillStyle = '#04070a'; c.fillRect(0, 0, view.w, view.h);
  c.save(); c.translate(view.ox, view.oy); c.scale(view.s, view.s);
  const g = c.createLinearGradient(0, 0, 0, WH); g.addColorStop(0, '#0b1a27'); g.addColorStop(1, '#09141d');
  c.fillStyle = g; c.fillRect(0, 0, WW, WH);
  c.save(); c.beginPath(); c.rect(0, 0, WW, WH); c.clip();
  if (MAP) {
    const T = MAP.T, fnt = (9 / view.s) + 'px ui-monospace,Consolas,monospace';
    c.lineWidth = 1 / view.s; c.strokeStyle = 'rgba(79,224,232,.08)'; c.fillStyle = 'rgba(140,180,205,.5)'; c.font = fnt; c.textAlign = 'left';
    const latLo = T.latC - WH / 2 / T.ky, latHi = T.latC + WH / 2 / T.ky;
    for (let la = Math.ceil(latLo / 2) * 2; la <= latHi; la += 2) { const y = MAP.proj(la, 0)[1]; c.beginPath(); c.moveTo(0, y); c.lineTo(WW, y); c.stroke(); c.fillText(Math.abs(la) + '°' + (la < 0 ? 'S' : 'N'), 4 / view.s, y - 3 / view.s); }
    for (let lo = Math.ceil((T.lonC - T.lonSpan / 2) / 2) * 2; lo <= T.lonC + T.lonSpan / 2; lo += 2) { const x = MAP.proj(0, lo)[0]; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WH); c.stroke(); c.fillText(Math.abs(lo) + '°' + (lo < 0 ? 'W' : 'E'), x + 3 / view.s, 12 / view.s); }
    const SIDE = { f: ['#142630', 'rgba(62,166,255,.65)'], h: ['#271a1d', 'rgba(255,90,90,.5)'], n: ['#161e24', 'rgba(140,160,175,.3)'] };
    for (const co of MAP.countries) {
      const [fill, stroke] = SIDE[co.s]; c.fillStyle = fill; c.strokeStyle = stroke; c.lineWidth = 1.4 / view.s; c.lineJoin = 'round';
      for (const r of co.rings) { polyPath(c, r); c.fill(); c.stroke(); }
    }
    c.textAlign = 'center'; c.font = '600 ' + (11 / view.s) + 'px ui-monospace,Consolas,monospace';
    for (const co of MAP.countries) if (co.lab && co.es) { c.fillStyle = co.s === 'f' ? 'rgba(120,190,255,.38)' : co.s === 'h' ? 'rgba(255,120,120,.42)' : 'rgba(150,170,185,.3)'; c.fillText(co.es, co.lab[0], co.lab[1]); }
  }
  c.restore();
  c.strokeStyle = 'rgba(120,160,190,.35)'; c.lineWidth = 1.5 / view.s; c.strokeRect(0, 0, WW, WH);
  c.restore();
}
function sym(x, y, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(1 / view.s, 1 / view.s); fn(); ctx.restore(); }
function label(txt, x, y, col, size) {
  ctx.font = (size || 10) + 'px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(4,8,12,.85)'; ctx.strokeText(txt, x, y); ctx.fillStyle = col || '#cfe3f1'; ctx.fillText(txt, x, y);
}
function ring(x, y, r, col, dash, alpha, lw) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = (lw || 1) / view.s;
  ctx.setLineDash(dash.map(d => d / view.s)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore();
}
/* ---- Simbología: pistas aéreas estilo NTDS (el bando por la forma, el dominio por el recorte: aire = mitad superior)
   e instalaciones/baterías en tierra estilo APP-6 / MIL-STD-2525 (marco por bando + pestaña de instalación). ---- */
const Y = '#ffd84a';
/* Glifos NTDS (fuente «NTDS Icons» de peterellisjones, OFL/MIT). Si la fuente no ha cargado se usa el dibujo vectorial de respaldo. */
let fontReady = false;
const NT = { airF: '\uE000', airE: '\uE001', airU: '\uE002', landF: '\uE014', landE: '\uE015', cmdF: '\uE010', misF: '\uE018', misE: '\uE019' };
const hdgChar = rad => String.fromCharCode(0xE022 + (Math.round((((rad * 180 / Math.PI + 90) % 360) + 360) % 360 / 5) % 72));
function ntdsGlyph(chars, col, size) {   // centrado en (0,0) del espacio sym(); el punto del glifo cae en el origen
  ctx.font = size + 'px "NTDS Icons"'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const y = size * .396;
  ctx.lineJoin = 'round'; ctx.lineWidth = size * .14; ctx.strokeStyle = 'rgba(4,8,12,.85)'; ctx.strokeText(chars, 0, y);
  ctx.fillStyle = col; ctx.fillText(chars, 0, y);
  ctx.lineWidth = size * .018; ctx.strokeStyle = col; ctx.strokeText(chars, 0, y);
}
function loadNTDS() {
  try { document.fonts.load('32px "NTDS Icons"').then(() => { fontReady = document.fonts.check('32px "NTDS Icons"'); }).catch(() => {}); } catch (e) { /* respaldo vectorial */ }
}
function symPoly(half, col, fill) { // half: puntos del lado derecho (de arriba abajo), se espeja
  ctx.beginPath(); half.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  for (let i = half.length - 1; i >= 0; i--) ctx.lineTo(-half[i][0], half[i][1]);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
}
function frameFriendAir(r, col) {      // semicírculo azul
  col = col || C.blue; ctx.beginPath(); ctx.moveTo(-r, r * .5); ctx.arc(0, r * .5, r, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = 'rgba(62,166,255,.20)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
}
function frameHostileAir(r) {          // media rombo rojo
  ctx.beginPath(); ctx.moveTo(-r * 1.25, r * .5); ctx.lineTo(0, -r * .85); ctx.lineTo(r * 1.25, r * .5); ctx.closePath();
  ctx.fillStyle = 'rgba(255,77,77,.25)'; ctx.fill(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.stroke();
}
function frameUnknownAir(r) {          // media trébol amarillo
  ctx.fillStyle = 'rgba(255,216,74,.22)'; ctx.strokeStyle = Y; ctx.lineWidth = 1.8;
  for (const [cx, cy, rr] of [[-r * .62, r * .02, r * .55], [r * .62, r * .02, r * .55], [0, -r * .38, r * .62]]) {
    ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-r * 1.17, r * .5); ctx.lineTo(r * 1.17, r * .5); ctx.stroke();
}
function glyphFighter(r, col) {        // silueta de ala fija (morro arriba)
  symPoly([[0, -r * .66], [r * .1, -r * .3], [r * .68, r * .2], [r * .68, r * .32], [r * .12, r * .16], [r * .1, r * .42], [r * .32, r * .6], [r * .3, r * .68], [0, r * .6]], col);
}
function glyphPlane(r, col) { glyphFighter(r, col); }
function glyphUAV(r, col) {            // ala recta larga + cola en V
  symPoly([[0, -r * .5], [r * .07, -r * .3], [r * .8, -r * .12], [r * .8, r * .02], [r * .07, r * .06], [r * .3, r * .52], [r * .2, r * .58], [0, r * .36]], col);
}
function glyphMissile(r, col) {
  symPoly([[0, -r * .72], [r * .15, -r * .42], [r * .15, r * .28], [r * .42, r * .62], [r * .15, r * .5], [0, r * .56]], col);
}
function glyphAEW(r, col) {            // ala fija + rotodomo
  glyphFighter(r, col); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, -r * .02, r * .34, r * .16, 0, 0, 7); ctx.stroke();
}
function airSymbol(type, r, col, hdg) {     // pista aérea amiga completa
  if (fontReady) { ntdsGlyph(NT.airF + (hdg !== undefined ? hdgChar(hdg) : ''), col, r * 2.5); return; }
  frameFriendAir(r);
  ctx.save(); ctx.translate(0, r * .12);
  if (type === 'mq9') glyphUAV(r * .9, col); else if (type === 'e2') glyphAEW(r * .9, col); else glyphFighter(r * .9, col);
  ctx.restore();
}
function frameGround(r, col, w, tab) { // APP-6: rectángulo azul (+ pestaña si es instalación)
  const hw = r * (w || 1.15), hh = r * .8;
  ctx.fillStyle = 'rgba(62,166,255,.2)'; ctx.fillRect(-hw, -hh, hw * 2, hh * 2); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  if (tab) { ctx.strokeRect(-hw * .3, -hh - r * .3, hw * .6, r * .3); }
}
function glyphAD(r, col, mod) {        // defensa aérea: arco (media elipse) en la base + modificador
  ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, r * .62, r * .78, r * .62, 0, Math.PI, 0); ctx.stroke();
  if (mod) { ctx.fillStyle = col; ctx.font = '700 ' + Math.round(r * .75) + 'px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.fillText(mod, 0, -r * .05); }
}
function glyphRadar(r, col) { ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, r * .2, r * .5, Math.PI * 1.1, Math.PI * 1.9); ctx.moveTo(0, r * .2); ctx.lineTo(r * .35, -r * .4); ctx.moveTo(-r * .4, r * .55); ctx.lineTo(r * .4, r * .55); ctx.stroke(); }
const AD_MOD = { gun: 'G', shorad: 'S', mrad: 'M', bmd: 'H' };
function armPulse(e, r) {
  if (!isTargeted(e)) return;
  ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.globalAlpha = .45 + .45 * Math.sin(performance.now() / 110); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke(); ctx.restore();
}
function drawAsset(a) {
  const R = view.R * 1.1;
  sym(a.x, a.y, () => {
    const dead = a.hp <= 0, col = dead ? '#55606a' : C.blue;
    if (fontReady) ntdsGlyph(a.type === 'capital' ? NT.cmdF : NT.landF, col, R * 2.2);
    else {
    frameGround(R, col, .9 / .8 * .8 * 1.25, true);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
    if (a.type === 'capital') { for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * 4 * Math.PI / 5; ctx.lineTo(Math.cos(an) * R * .6, Math.sin(an) * R * .6 + 1); } ctx.closePath(); ctx.stroke(); }
    else if (a.type === 'airbase') { glyphFighter(R * 1.05, col); }
    else if (a.type === 'power') { ctx.moveTo(R * .15, -R * .55); ctx.lineTo(-R * .3, R * .05); ctx.lineTo(R * .08, R * .05); ctx.lineTo(-R * .15, R * .55); ctx.stroke(); }
    else { ctx.moveTo(0, -R * .5); ctx.lineTo(0, R * .4); ctx.moveTo(-R * .35, -R * .15); ctx.lineTo(R * .35, -R * .15); ctx.stroke(); ctx.beginPath(); ctx.arc(0, R * .02, R * .42, .2, Math.PI - .2); ctx.stroke(); }
    }
    const hh = fontReady ? R * 1.0 : R * .8; ctx.fillStyle = '#0a1219'; ctx.fillRect(-R * 1.15, hh + 2, R * 2.3, 4);
    ctx.fillStyle = a.hp > 50 ? C.green : a.hp > 25 ? C.amber : C.red; ctx.fillRect(-R * 1.15, hh + 2, R * 2.3 * a.hp / 100, 4);
    const off = a.radar && !isEmitting(a);
    label(a.name + (a.type === 'airbase' ? ' ·' + G.air.filter(q => q.home === a).length : '') + (off ? ' OFF' : ''), 0, hh + 15, dead ? '#667' : '#8fc3ee', 8);
    if (a.type === 'airbase') armPulse(a, R * 1.7);
  });
}
function drawUnit(u) {
  const R = view.R, D = u.def, off = !isEmitting(u) && (D.radar || D.sensor);
  sym(u.x, u.y, () => {
    const bo = fontReady ? R * .85 : R * .8;
    if (off) ctx.globalAlpha = .45;
    if (fontReady) ntdsGlyph(NT.landF, C.blue, R * 2.0);
    else { frameGround(R, C.blue); if (D.radar) glyphRadar(R, C.blue); else glyphAD(R, C.blue, AD_MOD[D.id]); }
    ctx.globalAlpha = 1;
    if (D.range) {
      const f = u.ammo / u.max; ctx.fillStyle = '#0a1219'; ctx.fillRect(-R * 1.1, bo + 2, R * 2.2, 3);
      ctx.fillStyle = f > .3 ? C.cyan : C.red; ctx.fillRect(-R * 1.1, bo + 2, R * 2.2 * f, 3);
    }
    label(u.name + (u.roe === 'save' ? ' ◦' : '') + (off ? ' OFF' : ''), 0, bo + 13, off ? '#7f95a6' : '#8fc3ee', 8);
    armPulse(u, R * 1.6);
  });
}
function drawSite(s) {
  const R = view.R;
  sym(s.x, s.y, () => {
    if (fontReady) ntdsGlyph(NT.landE, C.red, R * 2.1);
    else {
    ctx.beginPath(); ctx.moveTo(0, -R * 1.15); ctx.lineTo(R * 1.15, 0); ctx.lineTo(0, R * 1.15); ctx.lineTo(-R * 1.15, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(255,77,77,.22)'; ctx.fill(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeRect(-R * .3, -R * 1.15 - R * .3, R * .6, R * .3);   // pestaña de instalación
    glyphMissile(R * .85, C.red);
    }
    label(s.name, 0, (fontReady ? R * 1.0 : R) + 13, '#ff9a9a', 8);
  });
}
function trail(o, col) {
  if (!o.hist || !o.hist.length) return;
  ctx.save(); ctx.fillStyle = col;
  o.hist.forEach((p, i) => { ctx.globalAlpha = .15 + .6 * (i + 1) / o.hist.length; ctx.beginPath(); ctx.arc(p[0], p[1], 1.9 / view.s, 0, 7); ctx.fill(); });
  ctx.restore();
}
function threatClassified(t) { return t.kind === 'ballistic' || (t.idT || 0) >= 2.5; }
function drawThreat(t) {
  const known = threatClassified(t), sel = G.sel && G.sel.ref === t;
  const R = view.R * (t.kind === 'ballistic' ? .8 : t.kind === 'cruise' || t.kind === 'arm' ? .7 : .58);
  const ang = Math.atan2(t.vy, t.vx);
  trail(t, known ? (t.lost ? C.dim : C.red) : Y);
  sym(t.x, t.y, () => {
    if (fontReady) {
      const ch = !known ? NT.airU : (t.kind === 'drone' || t.kind === 'decoy') ? NT.airE : NT.misE;
      ntdsGlyph(ch + hdgChar(ang), known ? (t.lost ? '#8a9aa6' : C.red) : Y, view.R * (t.kind === 'ballistic' ? 2.3 : t.kind === 'cruise' || t.kind === 'arm' ? 2.0 : 1.7));
    } else {
    ctx.strokeStyle = known ? 'rgba(255,255,255,.55)' : 'rgba(255,216,74,.6)'; ctx.lineWidth = 1.2; ctx.beginPath();   // vector de velocidad
    const tl = t.kind === 'ballistic' ? 34 : t.kind === 'cruise' ? 24 : 15;
    ctx.moveTo(Math.cos(ang) * R * 1.2, Math.sin(ang) * R * 1.2); ctx.lineTo(Math.cos(ang) * (R * 1.2 + tl), Math.sin(ang) * (R * 1.2 + tl)); ctx.stroke();
    if (known) {
      frameHostileAir(R); ctx.save(); ctx.translate(0, R * .12);
      if (t.kind === 'drone' || t.kind === 'decoy') glyphUAV(R * .85, '#ffd0d0'); else glyphMissile(R * .85, '#ffd0d0');
      ctx.restore();
    } else frameUnknownAir(R);
    }
    const tag = known ? t.D.tag : 'UNK';
    if (known && (t.kind === 'cruise' || t.kind === 'ballistic' || t.kind === 'arm') || sel || !known) label(tag + (t.lost ? ' (SIN BLANCO)' : '') + (sel ? ' H-' + t.id : ''), 0, R * .5 + 12, known ? '#ff9a9a' : Y, 8);
    if (sel) bracket(R * 2);
  });
  if (sel) { ctx.save(); ctx.strokeStyle = 'rgba(255,176,32,.5)'; ctx.setLineDash([4 / view.s, 4 / view.s]); ctx.lineWidth = 1 / view.s; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.target.x, t.target.y); ctx.stroke(); ctx.restore(); }
}
function bracket(r) {
  ctx.strokeStyle = C.amber; ctx.lineWidth = 2; const k = r * .45; ctx.beginPath();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(sx * r, sy * (r - k)); ctx.lineTo(sx * r, sy * r); ctx.lineTo(sx * (r - k), sy * r); }
  ctx.stroke();
}
function drawAir(a) {
  const R = view.R * .95, sel = G.sel && G.sel.ref === a;
  // ruta
  const m = a.mission;
  if (m) {
    let tx = m.x, ty = m.y;
    if (m.kind === 'int') { tx = m.target.x; ty = m.target.y; } else if (m.kind === 'strike') { tx = m.site.x; ty = m.site.y; }
    if (tx !== undefined && !(m.phase === 'station')) {
      ctx.save(); ctx.strokeStyle = 'rgba(62,166,255,.45)'; ctx.setLineDash([6 / view.s, 5 / view.s]); ctx.lineWidth = 1.2 / view.s;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.restore();
    }
    if (m.phase === 'station' || m.kind === 'cap' || m.kind === 'aew' || m.kind === 'isr') {
      ring(m.x, m.y, a.def.engage || a.def.radar * .5, C.blue, [3, 5], .22, 1);
      if (a.def.radar >= 180) ring(a.x, a.y, a.def.radar, C.cyan, [2, 5], .28, 1);
    }
  }
  const rb = a.state === 'rtb' ? rtbBase(a) : null;
  if (rb) { const b = rb; ctx.save(); ctx.strokeStyle = 'rgba(160,190,210,.35)'; ctx.setLineDash([3 / view.s, 5 / view.s]); ctx.lineWidth = 1 / view.s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); }
  trail(a, C.blue);
  sym(a.x, a.y, () => {
    if (!fontReady) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Math.cos(a.hdg) * R * 1.1, Math.sin(a.hdg) * R * 1.1); ctx.lineTo(Math.cos(a.hdg) * R * 2.3, Math.sin(a.hdg) * R * 2.3); ctx.stroke(); }
    airSymbol(a.type, R, a.state === 'rtb' ? '#9fb7c8' : C.blue, a.hdg);
    label(a.label, 0, R * .5 + 12, '#8fc3ee', 8);
    if (sel) bracket(R * 1.6);
  });
}
function ghostBase(D, g) {
  const af = UI.spec.af; if (af) return af.home;
  const p = g.target ? (g.target.kind === 'int' ? g.target.t : g.target.s) : g, a = bestReady(D.id, p.x, p.y);
  return a ? a.home : (G.buyBase || G.assets[0]);
}
function drawGhost() {
  const g = UI.ghost; if (!g || UI.mode === 'idle') return;
  if (UI.mode === 'place') {
    const D = SAM[UI.spec.id], col = g.valid ? C.cyan : C.red;
    if (D.range) ring(g.x, g.y, D.range, col, [6, 4], .8, 1.4);
    if (D.radar) ring(g.x, g.y, D.radar, col, [2, 4], .8, 1.4);
    sym(g.x, g.y, () => { ctx.globalAlpha = .85; if (fontReady) ntdsGlyph(NT.landF, col, view.R * 2.0); else { frameGround(view.R, col); if (D.radar) glyphRadar(view.R, col); else glyphAD(view.R, col, AD_MOD[D.id]); } });
    if (g.raw && UI.ptr && UI.ptr.type !== 'mouse') { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1 / view.s; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo((g.raw[0] - view.ox) / view.s, (g.raw[1] - view.oy) / view.s); ctx.stroke(); ctx.restore(); }
  } else {
    const D = AIR[UI.spec.id], b = ghostBase(D, g);
    if (g.target) {
      const p = g.target.kind === 'int' ? g.target.t : g.target.s;
      sym(p.x, p.y, () => bracket(view.R * 2.2));
      ctx.save(); ctx.strokeStyle = C.amber; ctx.setLineDash([6 / view.s, 4 / view.s]); ctx.lineWidth = 1.4 / view.s; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.restore();
      const pc = g.target.kind === 'int' ? interceptPk(D, p) : strikeP(D, p);
      sym(p.x, p.y, () => label(Math.round(pc * 100) + '%', 0, -view.R * 2.6, C.amber, 13));
    } else {
      ctx.save(); ctx.strokeStyle = C.blue; ctx.setLineDash([6 / view.s, 4 / view.s]); ctx.globalAlpha = .6; ctx.lineWidth = 1.3 / view.s; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(g.x, g.y); ctx.stroke(); ctx.restore();
      ring(g.x, g.y, D.engage || D.radar * .5, C.blue, [3, 4], .8, 1.4);
      if (D.radar >= 180) ring(g.x, g.y, D.radar, C.cyan, [2, 4], .6, 1.2);
      sym(g.x, g.y, () => { ctx.globalAlpha = .9; airSymbol(D.id, view.R, C.blue); });
    }
  }
}
function draw() {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.clearRect(0, 0, view.w, view.h);
  if (FXS.shake > 0) ctx.translate((Math.random() - .5) * FXS.shake * 7, (Math.random() - .5) * FXS.shake * 7);
  ctx.drawImage(bg, 0, 0, view.w, view.h);
  if (!G) return;
  ctx.save(); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s);
  const selU = G.sel && G.sel.kind === 'unit' ? G.sel.ref : null;
  // coberturas
  for (const u of G.units) {
    if (u.def.range && (SET.rings || u === selU)) ring(u.x, u.y, u.def.range, C.blue, [5, 5], u === selU ? .85 : .26, u === selU ? 1.6 : 1);
    if (u.def.radar && isEmitting(u)) ring(u.x, u.y, u.def.radar * radarMul(), C.cyan, [2, 5], u === selU ? .8 : .22, 1);
  }
  for (const b of G.assets) if (b.radar && b.hp > 0 && isEmitting(b)) ring(b.x, b.y, b.radar * radarMul(), C.cyan, [2, 5], .18, 1);
  for (const s of G.sites) if (s.alive) ring(s.x, s.y, SITE_AA, C.red, [2, 5], .25, 1);
  if (G.phase === 'prep') {   // ejes de amenaza (inteligencia previa)
    ctx.save(); ctx.setLineDash([4 / view.s, 7 / view.s]); ctx.lineWidth = 1 / view.s; ctx.strokeStyle = C.red;
    for (const st of G.sites) for (const a of G.assets) { ctx.globalAlpha = .05 + .45 * a.tw; ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(a.x, a.y); ctx.stroke(); }
    ctx.restore();
  }
  for (const s of G.sites) if (s.alive) drawSite(s);
  for (const a of G.assets) drawAsset(a);
  for (const u of G.units) drawUnit(u);
  for (const t of G.threats) if (t.alive && t.tracked) drawThreat(t);
  // misiles
  ctx.lineCap = 'round';
  for (const m of G.missiles) {
    sym(m.x, m.y, () => { ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-m.dx * 14, -m.dy * 14); ctx.lineTo(0, 0); ctx.stroke(); });
  }
  for (const a of G.air) if (a.state === 'out' || a.state === 'rtb') drawAir(a);
  for (const e of G.fx) {
    const k = e.t / e.dur;
    sym(e.x, e.y, () => { ctx.globalAlpha = 1 - k; ctx.strokeStyle = e.col; ctx.lineWidth = 2.5 * (1 - k) + .5; ctx.beginPath(); ctx.arc(0, 0, e.size * (.25 + k * .85), 0, 7); ctx.stroke(); if (k < .35) { ctx.fillStyle = e.col; ctx.globalAlpha = .5 * (1 - k * 2.5); ctx.fill(); } });
  }
  if (G.sel && G.sel.kind !== 'threat' && G.sel.kind !== 'air') {
    const r = G.sel.ref; sym(r.x, r.y, () => bracket(view.R * 1.9));
  }
  for (const f of G.floats) sym(f.x, f.y, () => { ctx.globalAlpha = Math.max(0, 1 - f.t / 1.1); label(f.txt, 0, -f.t * 24, f.col, 13); });
  drawGhost();
  ctx.restore();
  if (FXS.flash > 0) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const gr = ctx.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * .3, view.w / 2, view.h / 2, Math.max(view.w, view.h) * .7);
    gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(1, 'rgba(255,40,40,' + FXS.flash + ')');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, view.w, view.h);
  }
  // oleada en curso
  if (G.phase === 'prep') { /* la píldora PREPARACIÓN del HUD ya lo indica */ } else if (G.speed === 0 && !G.over) {
    ctx.font = '600 12px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,176,32,.9)';
    ctx.fillText('PAUSA', view.w / 2, view.h - 10);
  }
}

/* ============================ PANTALLAS ============================ */
function showOverlay(html) { const o = $('#overlay'); o.innerHTML = '<div class="screen"><div class="box">' + html + '</div></div>'; o.classList.remove('hidden'); return o; }
function progress() { const s = saveGet(); s.stars = s.stars || {}; s.up = s.up || {}; s.cp = s.cp || 0; return s; }
function unlocked(n) { return n === 1 || (progress().stars[n - 1] > 0) || /[?&]unlock/.test(location.search); }
function showMenu() {
  if (G) { G.speed = 0; }
  const o = showOverlay('<h1 class="title">C2<em>HELL</em></h1><div class="tag">AIR DEFENSE COMMAND &amp; CONTROL — LITE SIM</div>' +
    '<button class="big go" data-a="camp">▶ CAMPAÑA</button><button class="big" data-a="help">? CÓMO JUGAR</button><button class="big" data-a="set">⚙ AJUSTES</button>' + (G && !G.over && !G.demo ? '<button class="big" data-a="resume">↩ VOLVER A LA MISIÓN</button>' : ''));
  $('[data-a=camp]', o).onclick = showLevels; $('[data-a=help]', o).onclick = () => showHelp(showMenu); $('[data-a=set]', o).onclick = () => showSettings(showMenu);
  const r = $('[data-a=resume]', o); if (r) r.onclick = () => o.classList.add('hidden');
}
function showLevels() {
  const p = progress(); let h = '<h2>SELECCIÓN DE MISIÓN</h2><div class="kv"><span>Puntos de mando</span><span class="amber">' + p.cp + ' PM</span></div><button class="big" data-a="upg">⚙ MEJORAS PERMANENTES</button><div class="lvls">';
  for (let n = 1; n <= 12; n++) {
    const st = p.stars[n] || 0;
    h += '<button class="lv" data-n="' + n + '"' + (unlocked(n) ? '' : ' disabled') + '>' + n + '<small>' + '★'.repeat(st) + '☆'.repeat(3 - st) + '</small><span class="th">' + (THEATERS[(n - 1) % THEATERS.length] ? THEATERS[(n - 1) % THEATERS.length].id.slice(0, 3).toUpperCase() : '') + '</span></button>';
  }
  const o = showOverlay(h + '</div><button class="big" data-a="back">← MENÚ</button>');
  $$('.lv', o).forEach(b => b.onclick = () => showBrief(+b.dataset.n));
  $('[data-a=back]', o).onclick = showMenu;
  $('[data-a=upg]', o).onclick = () => showUpgrades(showLevels);
}
function showUpgrades(back) {
  const p = progress();
  let h = '<h2>MEJORAS PERMANENTES</h2><div class="kv"><span>Puntos de mando</span><span class="amber">' + p.cp + ' PM</span></div>';
  for (const u of UPG) {
    const lv = p.up[u.id] || 0, cost = u.cost * (lv + 1), maxed = lv >= u.max;
    h += '<div class="up"><div><b>' + u.name + '</b> <span class="amber">' + '■'.repeat(lv) + '<span style="opacity:.25">' + '■'.repeat(u.max - lv) + '</span></span><div class="sub">' + u.desc + '</div></div>' +
      '<button class="pbtn" style="width:auto;min-width:82px;margin:0" data-u="' + u.id + '"' + (maxed || p.cp < cost ? ' disabled' : '') + '>' + (maxed ? 'MÁX' : cost + ' PM') + '</button></div>';
  }
  const o = showOverlay(h + '<button class="big" data-a="back">← VOLVER</button>');
  $$('[data-u]', o).forEach(b => b.onclick = () => {
    const q = progress(), u = UPG.find(x => x.id === b.dataset.u), lv = q.up[u.id] || 0, cost = u.cost * (lv + 1);
    if (lv >= u.max || q.cp < cost) return;
    q.cp -= cost; q.up[u.id] = lv + 1; savePut(q); showUpgrades(back);
  });
  $('[data-a=back]', o).onclick = back || showMenu;
}
function showBrief(n) {
  const lv = makeLevel(n), c = briefCounts(lv);
  const est = lv.spawnWin + 28;
  const rows = [['UAS / señuelos', c.drone + c.decoy], ['Misiles de crucero', c.cruise], ['Misiles balísticos', c.ballistic], ['Misiles antirradar (ARM)', c.arm]].filter(r => r[1] > 0)
    .map(r => '<span>' + r[0] + '</span><span>' + r[1] + '</span>').join('');
  const o = showOverlay('<h2>NIVEL ' + n + ' — ' + lv.name.toUpperCase() + '</h2><p>Defiende el país de la salva de una facción hostil sin identificar. Protege la capital y la infraestructura; si la integridad cae por debajo del 25 % o la capital es destruida, pierdes.</p>' +
    '<div class="kv"><span>Teatro</span><span>' + (THEATERS[lv.theater] ? THEATERS[lv.theater].name : '') + '</span><span>Duración estimada</span><span>' + mmss(est) + '</span><span>Oleadas</span><span>' + lv.waves.length + '</span><span>Rampas hostiles</span><span>' + lv.nSites + '</span><span>Créditos iniciales</span><span>' + lv.credits + '</span>' + rows + '</div>' +
    '<p class="sub">Fase 1 — <b>PREPARACIÓN</b>: despliega defensas y reparte tus aeronaves entre las tres bases aéreas. Fase 2 — <b>OPERACIÓN</b>: enciende y apaga radares y ordena las salidas.</p>' +
    '<button class="big go" data-a="go">▶ COMENZAR</button><button class="big" data-a="back">← MISIONES</button>');
  $('[data-a=go]', o).onclick = () => newGame(n); $('[data-a=back]', o).onclick = showLevels;
}
function showHelp(back) {
  const o = showOverlay('<h2>CÓMO JUGAR</h2><ul>' +
    '<li><b>Objetivo:</b> sobrevive a las oleadas de drones y misiles de una facción hostil sin que caiga la integridad de tus activos. Cada nivel se juega en un país real distinto.</li>' +
    '<li><b>Fase 1 — PREPARACIÓN</b> (en pausa): coloca defensas (pestaña DEFENSA: toca una tarjeta y el mapa, o arrástrala; solo en tierra azul) y reparte las aeronaves entre las <b>tres bases aéreas</b> (pestaña AIRE: toca una aeronave y elige base). Pulsa <b>INICIAR OPERACIÓN</b>.</li>' +
    '<li><b>Fase 2 — OPERACIÓN</b>: ordena salidas (toca F-16/F-15E/E-2D/MQ-9 y un punto, un contacto o una rampa: despega la célula de la base más cercana, con % de éxito y tiempo de llegada). Desplegar defensas ahora cuesta +50 %.</li>' +
    '<li><b>Radares (pestaña RADARES):</b> cada radar y batería es un emisor que puedes encender o apagar. Los <b>misiles antirradar (ARM)</b> cazan los emisores encendidos: al sonar la alerta apaga el apuntado y el misil se pierde. Apagar todo te deja ciego: úsalo con cabeza.</li>' +
    '<li><b>Bases:</b> si una base aérea cae, pierdes las aeronaves que había en tierra. No lo pongas todo en la misma.</li>' +
    '<li><b>Selección:</b> toca cualquier unidad, contacto, base o rampa para ver su panel.</li>' +
    '<li><b>Economía:</b> los créditos crecen con el tiempo y al derribar. Los interceptores son finitos: reabastece o usa ROE «Ahorrar».</li>' +
    '<li><b>Símbolos:</b> simbología <b>NTDS</b>: <span style="color:'+C.blue+'">azul</span> = propio, <span style="color:'+C.red+'">rojo</span> = hostil, <span style="color:'+Y+'">amarillo</span> = desconocido.</li></ul>' +
    '<div class="legend" id="lg"></div><button class="big" data-a="back">← MENÚ</button>');
  buildLegend($('#lg', o));
  $('[data-a=back]', o).onclick = back || showMenu;
}
function buildLegend(box) {
  const g = (ch, col, k) => () => ntdsGlyph(ch, col, 24 * (k || 1));
  const items = fontReady ? [
    ['Aeronave propia (caza, AEW, UAV): arco abierto por abajo = aire', g(NT.airF, C.blue)],
    ['Con vector de rumbo (punto + trazo)', g(NT.airF + hdgChar(0.6), C.blue)],
    ['Contacto aéreo hostil identificado (UAS)', g(NT.airE, C.red)],
    ['Misil hostil (crucero / balístico)', g(NT.misE, C.red)],
    ['Contacto desconocido (aún sin identificar)', g(NT.airU, Y)],
    ['Batería SAM / radar (símbolo de tierra)', g(NT.landF, C.blue)],
    ['Capital (puesto de mando)', g(NT.cmdF, C.blue, 1.15)],
    ['Activo / instalación propia', g(NT.landF, C.blue, 1.15)],
    ['Rampa de lanzamiento hostil', g(NT.landE, C.red)]
  ] : [
    ['Caza amigo (F-16/F-15E)', () => airSymbol('f16', 10, '#e4f3ff')], ['Alerta temprana AEW', () => airSymbol('e2', 10, '#e4f3ff')], ['UAV amigo (MQ-9)', () => airSymbol('mq9', 10, '#e4f3ff')],
    ['UAS hostil identificado', () => { frameHostileAir(10); ctx.save(); ctx.translate(0, 1); glyphUAV(8.5, '#ffd0d0'); ctx.restore(); }],
    ['Misil hostil', () => { frameHostileAir(10); ctx.save(); ctx.translate(0, 1); glyphMissile(8.5, '#ffd0d0'); ctx.restore(); }],
    ['Contacto desconocido', () => frameUnknownAir(10)],
    ['Batería SAM (letra = clase)', () => { frameGround(10, C.blue); glyphAD(10, C.blue, 'S'); }],
    ['Radar', () => { frameGround(10, C.blue); glyphRadar(10, C.blue); }],
    ['Activo / instalación', () => { frameGround(10, C.blue, 1.15, true); glyphFighter(10, C.blue); }],
    ['Rampa hostil', () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(11, 0); ctx.lineTo(0, 11); ctx.lineTo(-11, 0); ctx.closePath(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.stroke(); glyphMissile(8, C.red); }]
  ];
  for (const [txt, fn] of items) {
    const c = document.createElement('canvas'); c.width = 72; c.height = 56; const old = ctx; ctx = c.getContext('2d'); ctx.scale(2, 2); ctx.translate(18, 15); fn(); ctx = old;
    c.style.width = '36px'; c.style.height = '28px'; box.appendChild(c); const sp = document.createElement('span'); sp.textContent = txt; box.appendChild(sp);
  }
}
function confirmBtn(btn, fn, txt) {
  let armed = false, old = btn.innerHTML;
  btn.onclick = () => {
    if (armed) { fn(); return; }
    armed = true; btn.innerHTML = txt || '¿SEGURO? PULSA DE NUEVO'; btn.style.borderColor = C.red;
    setTimeout(() => { armed = false; btn.innerHTML = old; btn.style.borderColor = ''; }, 3000);
  };
}
function showPause() {
  if (!G || G.demo || G.over) { showMenu(); return; }
  const was = G.speed; if (was > 0) resumeSpeed = was; setSpeed(0);
  const o = showOverlay('<h2>PAUSA</h2><div class="kv"><span>Nivel</span><span>' + G.n + ' — ' + G.lv.name + '</span><span>Tiempo</span><span>' + mmss(G.t) + '</span><span>Integridad</span><span>' + Math.round(integrity()) + '%</span><span>Créditos</span><span>' + Math.floor(G.credits) + '</span></div>' +
    '<button class="big go" data-a="res">▶ CONTINUAR</button><button class="big" data-a="restart">↻ REINICIAR MISIÓN</button><button class="big" data-a="set">⚙ AJUSTES</button><button class="big" data-a="help">? CÓMO JUGAR</button><button class="big" data-a="quit">☰ ABANDONAR A MISIONES</button>');
  const back = () => showPause();
  $('[data-a=res]', o).onclick = () => { o.classList.add('hidden'); if (was > 0) setSpeed(resumeSpeed); };
  $('[data-a=set]', o).onclick = () => { G.speed = 0; showSettings(() => { o.classList.add('hidden'); showPauseKeep(was); }); };
  $('[data-a=help]', o).onclick = () => showHelp(() => showPauseKeep(was));
  confirmBtn($('[data-a=restart]', o), () => newGame(G.n));
  confirmBtn($('[data-a=quit]', o), () => { G.demo = false; showLevels(); });
}
let resumeSpeed = 1;
function showPauseKeep(was) { if (was > 0) resumeSpeed = was; G.speed = was; showPause(); }
function showSettings(back) {
  const onoff = (k, name) => '<div class="opt"><span>' + name + '</span><button class="pbtn" data-k="' + k + '">' + (SET[k] ? 'ACTIVADO' : 'DESACTIVADO') + '</button></div>';
  const seg = [[.85, 'S'], [1, 'M'], [1.25, 'L']].map(([v, l]) => '<button class="pbtn' + (SET.scale === v ? ' sel' : '') + '" data-sc="' + v + '">' + l + '</button>').join('');
  const o = showOverlay('<h2>AJUSTES</h2>' + onoff('snd', 'Sonido') + onoff('vib', 'Vibración (móvil)') + onoff('rings', 'Mostrar coberturas de las baterías') +
    '<div class="opt"><span>Tamaño de símbolos</span><div class="seg">' + seg + '</div></div>' +
    '<button class="big" data-a="fs">⛶ PANTALLA COMPLETA</button><button class="big" data-a="tut">↺ REPETIR TUTORIAL</button><button class="big" data-a="reset">⚠ BORRAR PROGRESO</button><button class="big" data-a="back">← VOLVER</button>');
  $$('[data-k]', o).forEach(b => b.onclick = () => { const k = b.dataset.k; SET[k] = !SET[k]; if (k === 'snd') { SND.on = SET.snd; SND.init(); } saveSet(); showSettings(back); });
  $$('[data-sc]', o).forEach(b => b.onclick = () => { SET.scale = +b.dataset.sc; saveSet(); resize(); showSettings(back); });
  $('[data-a=fs]', o).onclick = toggleFS;
  $('[data-a=tut]', o).onclick = () => { SET.tutDone = false; saveSet(); const t = $('[data-a=tut]', o); t.textContent = '✓ SE MOSTRARÁ EN EL NIVEL 1'; };
  confirmBtn($('[data-a=reset]', o), () => { const keep = { set: SET }; savePut(keep); SET.tutDone = false; saveSet(); showSettings(back); }, '¿BORRAR TODO? PULSA DE NUEVO');
  $('[data-a=back]', o).onclick = back || showMenu;
}
function toggleFS() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('portrait'); } catch (e) { /* sin bloqueo */ } }).catch(() => {});
  } catch (e) { /* no soportado */ }
}
function endTips(win, st) {
  const s = G.stats, t = [], lk = s.leakKind || {};
  if (s.blind >= 3) t.push('Varios impactos llegaron <b>sin detectar</b>: coloca un <b>radar</b> o lanza un <b>E-2D</b> para ver más lejos.');
  if ((lk.ballistic || 0) > 0 && !G.units.some(u => u.def.id === 'bmd' || u.def.id === 'mrad')) t.push('Los misiles balísticos solo se frenan con <b>SAM medio</b> o <b>ABM</b>.');
  if ((lk.arm || 0) > 0) t.push('Los <b>ARM</b> destruyen emisores encendidos: al sonar la alerta, apaga el apuntado desde <b>RADARES</b> y vuélvelo a encender cuando pase.');
  if (s.dry > 0) t.push(s.dry + ' batería(s) se quedaron <b>sin munición</b>: reabastece (tecla F o botón REABAST.) o usa ROE «Ahorrar» contra UAS.');
  if (!s.strikes && G.n >= 3) t.push('Destruir <b>rampas</b> con F-16/F-15E cancela oleadas enteras: toca una rampa para ver el % de éxito.');
  if (s.airLost > 1) t.push('Perdiste ' + s.airLost + ' aeronaves: evita patrullas cerca de las rampas hostiles (su AA las derriba).');
  if (!win && !t.length) t.push('Refuerza la defensa alrededor de la <b>capital</b> y compra mejoras en «Mejoras permanentes».');
  if (win && st < 3 && !t.length) t.push('Para 3 estrellas necesitas ≥ 90 % de integridad: más cobertura sobre los activos más débiles.');
  return t.slice(0, 2);
}
function endLevel(win) {
  G.over = true; setSpeed(0);
  const ig = Math.round(integrity()), st = win ? (ig >= 90 ? 3 : ig >= 65 ? 2 : 1) : 0;
  const s = G.stats;
  const pm = (win ? 15 + 10 * st + (progress().stars[G.n] ? 0 : 15) : 0) + Math.floor(s.kills / 8);
  { const p = progress(); if (win) p.stars[G.n] = Math.max(p.stars[G.n] || 0, st); p.cp += pm; savePut(p); }
  const ratio = s.value > 0 ? (s.spent / s.value) : 0;
  const tips = endTips(win, st), tipsHtml = tips.length ? '<div class="tips"><b>CONSEJOS</b><ul>' + tips.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' : '';
  if (G.tut) endTut();
  setTimeout(() => {
    const o = showOverlay('<h2>' + (win ? 'MISIÓN CUMPLIDA' : 'MISIÓN FALLIDA') + '</h2><div class="stars">' + '★'.repeat(st) + '<span style="opacity:.25">' + '★'.repeat(3 - st) + '</span></div>' +
      '<div class="kv"><span>Puntos de mando ganados</span><span class="amber">+' + pm + ' PM</span><span>Integridad final</span><span>' + ig + '%</span><span>Amenazas destruidas</span><span>' + s.kills + '</span><span>Impactos</span><span>' + s.leaked + '</span>' +
      '<span>Interceptores lanzados</span><span>' + s.fired + '</span><span>Ratio coste defensa/ataque</span><span>' + ratio.toFixed(2) + '</span><span>Aeronaves perdidas</span><span>' + s.airLost + '</span><span>Tiempo</span><span>' + mmss(G.t) + '</span></div>' + tipsHtml +
      (win && G.n < 12 ? '<button class="big go" data-a="next">▶ SIGUIENTE NIVEL</button>' : '') + '<button class="big" data-a="upg">⚙ MEJORAS (' + progress().cp + ' PM)</button><button class="big" data-a="retry">↻ REINTENTAR</button><button class="big" data-a="menu">☰ MISIONES</button>');
    const q = a => $('[data-a=' + a + ']', o);
    if (q('next')) q('next').onclick = () => showBrief(G.n + 1);
    if (q('upg')) q('upg').onclick = () => showUpgrades(() => showLevels());
    q('retry').onclick = () => newGame(G.n); q('menu').onclick = showLevels;
  }, 900);
}

/* ============================ ARRANQUE ============================ */
let last = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (G && !G.over && G.speed > 0) {
    let rem = dt * G.speed;
    while (rem > 0 && !G.over) { const h = Math.min(rem, 1 / 30); step(h); rem -= h; }
  } else if (G && G.over) { for (const e of G.fx) e.t += dt; G.fx = G.fx.filter(e => e.t < e.dur); G.floats.forEach(f => f.t += dt); G.floats = G.floats.filter(f => f.t < 1.1); }
  FXS.shake = Math.max(0, FXS.shake - dt * 1.8); FXS.flash = Math.max(0, FXS.flash - dt * .9);
  draw();
  requestAnimationFrame(frame);
}
let slow = 0;
setInterval(() => {
  if (!G) return;
  refreshTop(); refreshDock(); tutTick();
  if (G.sel) { if (G.sel.kind === 'threat' && !G.sel.ref.alive) hidePanel(); else if (G.sel.kind === 'air' && !G.air.includes(G.sel.ref)) hidePanel(); else renderPanel(); }
}, 250);

function init() {
  new ResizeObserver(resize).observe($('#mapwrap'));
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
  initPointer();
  $$('.spd').forEach(b => b.addEventListener('click', () => G && !G.over && setSpeed(+b.dataset.s)));
  $$('.tab').forEach(b => b.addEventListener('click', () => { UI.tab = b.dataset.tab; cancelMode(); if (G) buildDock(); }));
  $('#btn-menu').addEventListener('click', showPause);
  const bs = $('#btn-snd'); SND.on = SET.snd; bs.style.opacity = SND.on ? 1 : .4;
  bs.addEventListener('click', () => { SET.snd = SND.on = !SND.on; SND.init(); bs.style.opacity = SND.on ? 1 : .4; saveSet(); });
  $('#btn-restock').addEventListener('click', restockAll);
  $('#btn-start').addEventListener('click', () => startOps(1));
  
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.demo && G.speed > 0) { resumeSpeed = G.speed; setSpeed(0); log('Pausa automática', 'warn'); } });
  const rot = document.createElement('div'); rot.id = 'rotate'; rot.className = 'hidden'; rot.innerHTML = '<span>↻ Gira el dispositivo: el juego es vertical</span><button aria-label="Cerrar">✕</button>';
  $('#mapwrap').appendChild(rot); $('button', rot).onclick = () => { rot.dataset.off = 1; rot.classList.add('hidden'); };
  window.__rot = () => { const show = innerWidth > innerHeight * 1.15 && ('ontouchstart' in window) && !rot.dataset.off; rot.classList.toggle('hidden', !show); };
  document.addEventListener('gesturestart', e => e.preventDefault());
  loadNTDS();
  newGame(1); G.demo = true; G.tut = null; setHint(null); setSpeed(0);
  resize(); showMenu();
  requestAnimationFrame(t => { last = t; frame(t); });
  const m = /[?&]level=(\d+)/.exec(location.search); if (m) { $('#overlay').classList.add('hidden'); newGame(+m[1]); }
}
window.__C2 = { SET, restockAll, showPause, showSettings, tutTick, TUT, get G() { return G; }, get MAP() { return MAP; }, newGame, step, setSpeed, startOps, SAM, AIR, THREAT, makeLevel, placeUnit, launchMission, missionStation, firstReady, bestReady, inPoly, onLand, toggleEmit, emitters, isEmitting, airbases, validPlace, resize, view, UI, select, buildDock, refreshDock };
init();
})();
