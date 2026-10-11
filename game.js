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
let LRND = Math.random;   // aleatoriedad de la generación de niveles (sembrable para el reto diario)
const sround = x => { const f = Math.floor(x); return f + (LRND() < x - f ? 1 : 0); };
const mmss = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pkOf = (tab, kind) => tab[kind] !== undefined ? tab[kind] : (tab.drone || 0);

const tr = (k, p, d) => I18N.t(k, p, d);
const C = { blue: '#3ea6ff', red: '#ff4d4d', cyan: '#4fe0e8', amber: '#ffb020', green: '#35d07f', dim: '#7390a3' };

/* ============================ DEFINICIONES ============================ */
const SAM = {
  gun:    { id: 'gun',    short: 'AAA',    cost: 45,  range: 95,  reload: .45, ammo: 90, mspeed: 700, mcost: 1,  sensor: 70,  restock: 20,  unlock: 1,
            pk: { drone: .32, cruise: .12, ballistic: 0, arm: .08 } },
  shorad: { id: 'shorad', short: 'SHORAD', cost: 120, range: 185, reload: 1.8, ammo: 14, mspeed: 320, mcost: 12, sensor: 120, restock: 60,  unlock: 1,
            pk: { drone: .72, cruise: .55, ballistic: .08, arm: .5 } },
  mrad:   { id: 'mrad',   short: 'SAM-M',  cost: 240, range: 280, reload: 3.2, ammo: 8,  mspeed: 420, mcost: 40, sensor: 160, restock: 120, unlock: 3,
            pk: { drone: .62, cruise: .78, ballistic: .40, arm: .6 } },
  bmd:    { id: 'bmd',    short: 'ABM',    cost: 380, range: 400, reload: 5.5, ammo: 4, mspeed: 560, mcost: 90, sensor: 220, restock: 200, unlock: 6,
            pk: { drone: 0, cruise: .30, ballistic: .78, arm: .25 } },
  laser:  { id: 'laser',  short: 'LAS',    cost: 200, range: 110, reload: .22, ammo: 140, mspeed: 2400, mcost: 0, sensor: 90, restock: 40, unlock: 5,
            pk: { drone: .85, cruise: .35, ballistic: 0, arm: .4 } },
  ship:   { id: 'ship',   short: 'DDG',    cost: 340, range: 330, reload: 2.4, ammo: 12, mspeed: 450, mcost: 30, radar: 240, restock: 100, unlock: 7, naval: true,
            pk: { drone: .6, cruise: .72, ballistic: .35, arm: .55 } },
  radar:  { id: 'radar',  short: 'RADAR',  cost: 70, range: 0, radar: 280, ammo: 0, sensor: 0, unlock: 2, pk: {} }
};
const AIR = {
  f16:  { id: 'f16',  short: 'F-16C', name: 'F-16C Viper', cost: 130, speed: 200, fuel: 110, ammo: 6, reload: 1.2, mspeed: 480, mcost: 25, engage: 150, radar: 130, strike: .45, orbit: 34, turn: 14, unlock: 1,
          pk: { drone: .72, cruise: .62, ballistic: 0, arm: .55 } },
  f15e: { id: 'f15e', short: 'F-15E', name: 'F-15E Strike Eagle', cost: 210, speed: 180, fuel: 130, ammo: 8, reload: 1.2, mspeed: 480, mcost: 25, engage: 150, radar: 150, strike: .72, orbit: 36, turn: 16, unlock: 4,
          pk: { drone: .75, cruise: .68, ballistic: 0, arm: .6 } },
  e2:   { id: 'e2',   short: 'E-2D',  name: 'E-2D Hawkeye', cost: 160, speed: 110, fuel: 200, ammo: 0, radar: 360, strike: 0, orbit: 30, turn: 18, unlock: 2, pk: {} },
  ah64: { id: 'ah64', short: 'AH-64', name: 'AH-64 Apache', cost: 150, speed: 90, fuel: 100, ammo: 12, reload: .55, mspeed: 420, mcost: 6, engage: 100, radar: 100, strike: .22, orbit: 24, turn: 12, unlock: 5,
          pk: { drone: .82, cruise: .35, ballistic: 0, arm: .2 } },
  tanker: { id: 'tanker', short: 'KC-46', name: 'KC-46 Pegasus', cost: 140, speed: 100, fuel: 240, ammo: 0, radar: 0, refuel: 110, strike: 0, orbit: 30, turn: 18, unlock: 6, pk: {} },
  mq9:  { id: 'mq9',  short: 'MQ-9',  name: 'MQ-9 Reaper', cost: 70, speed: 75, fuel: 230, ammo: 0, radar: 170, strike: .28, orbit: 26, turn: 10, unlock: 3, pk: {} }
};
const THREAT = {
  drone:     { tag: 'UAS', spd: 44, dmg: 8, val: 20, bounty: 5, col: C.red },
  decoy:     { tag: 'UAS', spd: 48, dmg: 0, val: 5, bounty: 2, col: C.red },
  cruise:    { tag: 'CM', spd: 92, dmg: 16, val: 90, bounty: 14, col: C.red },
  ballistic: { tag: 'BM', spd: 230, dmg: 32, val: 300, bounty: 26, col: C.red },
  arm:       { tag: 'ARM', spd: 150, dmg: 0, val: 110, bounty: 16, col: C.red }
};
const KIND_LBL = new Proxy({}, { get: (_, k) => tr('kind.' + k) });
const ASSET_TYPE = {   // peso en la integridad (w) y probabilidad de ser objetivo (tw)
  capital: { w: .34, tw: .28 }, airbase: { w: .10, tw: .13, radar: Math.round(240 * DS) },
  power: { w: .18, tw: .17 }, port: { w: .18, tw: .16 }
};
const SITE_AA = Math.round(115 * DS);   // radio de la defensa antiaérea de cada rampa
// Escala de todas las distancias/velocidades al mundo vertical (el balance se calibró en 1600×800)
for (const D of Object.values(SAM)) for (const p of ['range', 'sensor', 'radar', 'mspeed']) if (D[p]) D[p] = Math.round(D[p] * DS);
for (const D of Object.values(AIR)) for (const p of ['speed', 'engage', 'radar', 'orbit', 'mspeed', 'refuel']) if (D[p]) D[p] = Math.round(D[p] * DS);
for (const D of Object.values(THREAT)) D.spd = Math.round(D.spd * DS * 10) / 10;
const tget = (o, key, props) => props.forEach(p => Object.defineProperty(o, p, { get: () => tr(key + '.' + p), enumerable: true, configurable: true }));
for (const D of Object.values(SAM)) tget(D, 'sam.' + D.id, ['name', 'desc']);
for (const D of Object.values(AIR)) tget(D, 'air.' + D.id, ['role', 'mission']);
for (const [k, D] of Object.entries(THREAT)) Object.defineProperty(D, 'name', { get: () => tr('thr.' + k), enumerable: true });
const DIFF = { normal: { thr: 1, cred: 1, pm: 1 }, veteran: { thr: 1.25, cred: .9, pm: 1.25 }, expert: { thr: 1.5, cred: .8, pm: 1.5 } };
const WEATHER = ['clear', 'clear', 'night', 'fog', 'clear', 'storm', 'night', 'fog', 'storm', 'night', 'fog', 'storm'];
const PORT_R = 170;                     // radio alrededor de un puerto donde puede fondear un buque
const SPAWN_WIN = [8, 25, 45, 70, 95, 125, 155, 185, 215, 240, 265, 280];

/* ============================ GEOGRAFÍA ============================ */
// Teatros reales (Natural Earth) en window.C2_MAPS: anillos [lon,lat] que se proyectan al arrancar cada nivel.
const THEATERS = window.C2_MAPS || [];
const BASE_T = 3;   // los 3 primeros teatros se reparten los niveles 1-12 (entrelazados); cada teatro extra añade 4 niveles seguidos
const CAMP_N = () => 12 + 4 * Math.max(0, THEATERS.length - BASE_T);
const theaterOf = n => n <= 12 ? (n - 1) % Math.max(1, Math.min(BASE_T, THEATERS.length)) : Math.min(THEATERS.length - 1, BASE_T + Math.floor((n - 13) / 4));
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
  const cs = T.countries.map(c => ({ n: c.n, es: c.es, noLab: !c.es, hostile: false, s: c.s, rings: c.r.map(r => r.map(p => proj(p[1], p[0]))), vis: 0, lab: null }));
  for (const c of cs) {
    let sx = 0, sy = 0, k = 0;
    for (const r of c.rings) for (const p of r) if (p[0] > 50 && p[0] < WW - 50 && p[1] > 50 && p[1] < WH - 50) { sx += p[0]; sy += p[1]; k++; }
    c.vis = k; if (k >= 5) c.lab = [sx / k, sy / k];
  }
  const hs = cs.filter(c => c.s === 'h').sort((a, b) => b.vis - a.vis); hs.forEach((c, i) => { c.hostile = i === 0; if (i) c.noLab = true; });
  MAP = { T, proj, countries: cs, land: cs.filter(c => c.s === 'f') };
  return MAP;
}
const cname = co => co.hostile ? tr('map.hostile') : I18N.lang === 'es' ? co.es : co.n.toUpperCase();
const onLand = (x, y) => MAP.land.some(c => c.rings.some(r => inPoly(r, x, y)));
function computeH() { const w = $('#mapwrap'); const r = w && w.clientWidth ? w.clientHeight / w.clientWidth : 1.5; return clamp(Math.round(1000 * r), 1100, 1800); }

/* ============================ MEJORAS PERMANENTES ============================ */
const UPG = [
  { id: 'budget', cost: 20, max: 5 },
  { id: 'income', cost: 20, max: 5 },
  { id: 'pk', cost: 30, max: 5 },
  { id: 'reload', cost: 25, max: 5 },
  { id: 'ammo', cost: 25, max: 5 },
  { id: 'radar', cost: 25, max: 5 },
  { id: 'strike', cost: 30, max: 5 },
  { id: 'armor', cost: 35, max: 5 },
  { id: 'fleet', cost: 40, max: 3 },
  { id: 'hangar', cost: 30, max: 4 }
];
UPG.forEach(u => tget(u, 'upg.' + u.id, ['name', 'desc']));
const U = id => (G && G.up && G.up[id]) || 0;
const pkMod = p => p > 0 ? Math.min(.97, p * (1 + .05 * U('pk'))) : 0;
const radarMul = () => 1 + .08 * U('radar');
const baseCap = () => 4 + U('hangar');

/* ============================ NIVELES ============================ */
function makeLevel(n, opts) {
  opts = opts || {};
  if (opts.seed == null) return makeLevelCore(n, opts);
  const old = LRND; LRND = mulberry(opts.seed);
  try { return makeLevelCore(n, opts); } finally { LRND = old; }
}
function waveItems(L, P, rule) {
  let avail = [['drone', .55]];
  if (L >= 3) avail.push(['decoy', .10]);
  if (L >= 4) avail.push(['cruise', .25]);
  if (L >= 4) avail.push(['arm', .10]);
  if (L >= 6) avail.push(['ballistic', .20]);
  if (rule === 'swarm') avail = [['drone', .8], ['decoy', .2]];
  if (rule === 'rain') avail = [['cruise', .45], ['ballistic', .4], ['arm', .15]];
  const sum = avail.reduce((a, b) => a + b[1], 0), pts = { drone: 1, decoy: .5, cruise: 4, ballistic: 8, arm: 3 };
  const items = [];
  for (const [kind, sh] of avail) { const cnt = sround(P * sh / sum / pts[kind]); if (cnt > 0) items.push({ kind, count: cnt }); }
  if (!items.length) items.push({ kind: 'drone', count: 3 });
  return items;
}
function endlessWave(k, lv) {   // oleada k (0 = primera) del modo Sin fin: la presión crece sin techo
  const L = Math.min(12, 5 + Math.floor(k / 2)), P = (6 + 1.8 * L + k * 1.7) * (DIFF[lv.diff] || DIFF.normal).thr;
  const prev = lv.waves.length ? lv.waves[lv.waves.length - 1].t : 0, gap = Math.max(9, 24 - k * .6);
  return { t: k === 0 ? 1 : prev + gap, items: waveItems(L, P, null), focus: L >= 5 && k % 2 === 1 };
}
function makeLevelCore(n, opts) {
  const DF = DIFF[opts.diff || SET.diff] || DIFF.normal, L = n, idx = Math.min(n, 12) - 1;
  const win = SPAWN_WIN[idx];
  const nWaves = opts.endless ? 0 : Math.max(2, Math.round(win / 14) + 1);
  const over = Math.max(0, n - 12), rule = opts.rule || null;
  const waves = [];
  for (let k = 0; k < nWaves; k++) {
    const prog = nWaves > 1 ? k / (nWaves - 1) : 0;
    const P = (4 + 1.8 * L + over * 2) * (0.75 + 0.5 * prog) * DF.thr * (rule === 'swarm' ? 2.5 : 1);
    const items = waveItems(L, P, rule);
    waves.push({ t: 1 + (win - 1) * prog, items, focus: L >= 5 && k % 2 === 1 });
  }
  const events = [];
  if (L >= 2) events.push({ t: win * .4, kind: 'reinforce' });
  if (L >= 3) { events.push({ t: win * .5, kind: 'surprise', n: 3 + Math.floor(L / 2) }); events.push({ t: win * .22, kind: 'order' }); }
  if (L >= 4) { const nj = 1 + Math.floor(L / 6) + (rule === 'storm' ? 2 : 0); for (let i = 0; i < nj; i++) events.push({ t: win * (.3 + .4 * i / nj), kind: 'jam' }); }
  events.sort((a, b) => a.t - b.t);
  return {
    diff: opts.diff || SET.diff, weather: opts.weather || WEATHER[(n - 1) % 12], evasive: rule === 'storm' ? .6 : L >= 7 ? .3 : 0, events, rule, endless: !!opts.endless, pmMul: rule === 'austerity' ? 1.5 : 1,
    n, theater: opts.theater != null ? Math.min(opts.theater, THEATERS.length - 1) : theaterOf(n), get name() { return opts.name ? opts.name() : n <= CAMP_N() ? tr('lvl.' + n) : tr('lvl.endless', { n: n - 12 }); },
    waves, spawnWin: win, nSites: n < 3 ? 1 : n < 6 ? 2 : n < 9 ? 3 : n < 12 ? 4 : 5,
    credits: Math.round((330 + 55 * Math.min(L, 12) + 25 * over) * DF.cred * (rule === 'austerity' ? .5 : rule === 'swarm' ? 1.3 : 1)), income: (4 + 0.7 * Math.min(L, 12)) * (rule === 'austerity' ? .5 : 1), siteDef: clamp(.05 + .03 * L, 0, .5),
    fleet: rule === 'airOnly' ? { f16: 5, f15e: 3, e2: 1, mq9: 2, ah64: 2 } : { f16: L >= 3 ? 3 : 2, e2: L >= 2 ? 1 : 0, mq9: L >= 3 ? 1 : 0, f15e: L >= 4 ? (L >= 7 ? 2 : 1) : 0 }
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
const SET = Object.assign({ snd: true, vib: true, rings: true, scale: 1, tutDone: false, cos: {}, diff: 'normal', music: true, voice: true, cb: false, ui: 1, ap: false }, saveGet().set || {});
function saveSet() { const o = saveGet(); o.set = SET; savePut(o); }
const CB = { red: '#ff8a1f', green: '#56d4ff', amber: '#f0e442' }, CN = { red: C.red, green: C.green, amber: C.amber };   // modo daltónico: naranja / celeste / amarillo en lugar de rojo / verde / ámbar
function applyA11y() {
  Object.assign(C, SET.cb ? CB : CN); const r = document.documentElement;
  if (SET.cb) r.setAttribute('data-cb', '1'); else r.removeAttribute('data-cb');
  r.setAttribute('data-ui', String(SET.ui || 1)); SND.musicOn = SET.music !== false;
}
const FXS = { shake: 0, flash: 0, hold: 0, pulse: 0, lt: 0, slow: 0 };
function floatTxt(x, y, txt, col) { if (!G) return; if (G.floats.length > 40) G.floats.shift(); G.floats.push({ x, y, txt, col, t: 0 }); }
function buzz(ms) { if (SET.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* sin vibración */ } } }

function newGame(n, cfg) {
  cfg = cfg || null;
  const lv = cfg ? buildModeLevel(cfg) : makeLevel(n); n = lv.n;
  const up = progress().up || {};
  loadTheater(lv.theater, computeH()); resize();
  G = { up, n, lv, mode: cfg ? cfg.mode : 'camp', cfg, t: 0, speed: 0, phase: 'prep', over: false, endTimer: 0, credits: Math.round(lv.credits * (1 + .1 * (up.budget || 0))), id: 1, waveIdx: 0,
        assets: [], units: [], sites: [], threats: [], pending: [], missiles: [], fx: [], air: [], sel: null, buyBase: null,
        stats: { kills: 0, leaked: 0, fired: 0, spent: 0, value: 0, airLost: 0, strikes: 0, spentCredits: 0, evaded: 0,
          killKind: {}, armLost: 0, streak: 0, bestStreak: 0, cleanWaves: 0, detSum: 0, detN: 0, earlySite: false, sitesKilled: 0, sorties: 0, jams: 0, ordersOk: 0 } };
  for (const a of MAP.T.assets) {
    const p = MAP.proj(a.lat, a.lon), o = Object.assign({ hp: 100, maxhp: 100, emit: true, rdown: 0 }, ASSET_TYPE[a.type], { id: a.id, type: a.type, x: p[0], y: p[1] });
    Object.defineProperty(o, 'name', { get: () => tr('pl.' + a.name, null, a.name), enumerable: true }); G.assets.push(o);
  }
  const rs = mulberry((cfg && cfg.seed != null ? cfg.seed : n) * 7919 + 13), order = MAP.T.sites.map((_, i) => i).sort(() => rs() - .5);
  for (let i = 0; i < lv.nSites; i++) { const q = MAP.T.sites[order[i % order.length]], p = MAP.proj(q[0], q[1]); const s = { id: i + 1, x: p[0], y: p[1], alive: true, def: lv.siteDef }; Object.defineProperty(s, 'name', { get: () => tr('site.name', { n: i + 1 }), enumerable: true }); G.sites.push(s); }
  lv.income *= 1 + .1 * (up.income || 0);
  const fl = Object.assign({}, lv.fleet); fl.f16 += up.fleet || 0;
  allocFleet(fl);
  UI.mode = 'idle'; UI.spec = null; UI.ghost = null; UI.hintShown = {}; UI.rosterSig = '';
  if (UI.tab !== 'def' && UI.tab !== 'air' && UI.tab !== 'rad') UI.tab = 'def';
  $('#log').innerHTML = ''; hidePanel(); setHint(null);
  G.demo = false; G.floats = []; G.craters = []; G.evIdx = 0; G.order = null; G.waveStat = []; G.victory = null; G.zoom = 1; G.hl = null; $('#toasts').innerHTML = ''; G.stats.blind = 0; G.stats.dry = 0; G.stats.leakKind = {};
  FXS.shake = 0; FXS.flash = 0; FXS.hold = 0; FXS.pulse = 0; FXS.slow = 0; RP.buf = []; RP.acc = 0;
  buildDock(); setPhase('prep'); refreshTop();
  $('#overlay').classList.add('hidden');
  G.tut = (!cfg && n === 1 && !SET.tutDone) ? { i: 0 } : null;
  if (G.tut) tutShow(); else setHint(tr('hint.plan'), 'plan');
  log(tr('log.level', { n, name: lv.name.toUpperCase(), th: tr('th.' + MAP.T.id + '.name').toUpperCase() }));
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
  for (const type of ['f16', 'f15e', 'ah64', 'mq9']) for (let i = 0; i < (fl[type] || 0); i++) G.air.push(mkAir(type, k++, place(fwd)));
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
  init() {
    if (!this.ac) {
      try {
        this.ac = new (window.AudioContext || window.webkitAudioContext)();
        this.sbus = this.ac.createGain(); this.sbus.connect(this.ac.destination);
        this.mbus = this.ac.createGain(); this.mbus.gain.value = .55; this.mbus.connect(this.ac.destination);
      } catch (e) { this.ac = null; return; }
    }
    if (this.ac.state === 'suspended') { try { this.ac.resume(); } catch (e) { /* iOS: se reintenta con el siguiente gesto */ } }
    this.musicStart();
  },
  gate(key) { const n = performance.now(); if (n - (this.last[key] || 0) < 70) return false; this.last[key] = n; return true; },
  tone(f, d, type, v, slide, key) {
    if (!this.on || !this.ac || !this.gate(key)) return;
    const t = this.ac.currentTime, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sbus); o.start(); o.stop(t + d);
  },
  noise(d, v, key) {
    if (!this.on || !this.ac || !this.gate(key)) return;
    const n = Math.floor(this.ac.sampleRate * d), buf = this.ac.createBuffer(1, n, this.ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = this.ac.createBufferSource(), g = this.ac.createGain(); g.gain.value = v; s.buffer = buf; s.connect(g); g.connect(this.sbus); s.start();
  },
  launch() { this.tone(520, .22, 'sawtooth', .025, -380, 'l'); },
  boom() { this.noise(.3, .09, 'b'); },
  impact() { this.noise(.7, .22, 'i'); },
  ping() { this.tone(880, .1, 'square', .03, 0, 'p'); },
  thud() { this.tone(110, .35, 'sawtooth', .08, -70, 'th'); this.noise(.45, .16, 'thn'); },
  chime() { this.tone(660, .18, 'triangle', .05, 0, 'c1'); setTimeout(() => this.tone(990, .28, 'triangle', .05, 0, 'c2'), 110); },
  tick() { this.tone(1500, .03, 'square', .018, 0, 'tk'); },
  star(i) { this.tone(520 * Math.pow(1.26, i), .35, 'triangle', .07, 0, 'st' + i); },
  ach() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, .22, 'triangle', .06, 0, 'ach' + i), i * 90)); },
  fanfare() { [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => { this.tone(f, .5, 'triangle', .07, 0, 'fa' + i); this.tone(f / 2, .5, 'sawtooth', .02, 0, 'fb' + i); }, i * 140)); },
  /* música adaptativa y procedural: pad en La menor (Am-F-C-G); la intensidad añade bajo, arpegio, charles y bombo */
  mus: null, musicOn: true,
  musicStart() {
    if (!this.ac || this.mus) return;
    this.mus = { step: 0, next: this.ac.currentTime + .2, lvl: 0, timer: setInterval(() => this.musicSched(), 100) };
  },
  musicSched() {
    const m = this.mus, ac = this.ac; if (!m || !ac) return;
    if (!this.on || !this.musicOn || ac.state !== 'running') { m.next = ac.currentTime + .2; return; }
    const bpm = [72, 84, 96, 112][m.lvl], d = 60 / bpm / 4;
    while (m.next < ac.currentTime + .3) { this.musicStep(m.step++, m.next, d, m.lvl); m.next += d; }
  },
  mtone(f, t, len, type, vol, atk, lp) {
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + atk); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    let n = o; if (lp) { const q = ac.createBiquadFilter(); q.type = 'lowpass'; q.frequency.value = lp; o.connect(q); n = q; }
    n.connect(g); g.connect(this.mbus); o.start(t); o.stop(t + len + .05);
  },
  musicStep(i, t, d, lvl) {
    const bar = Math.floor(i / 16), s = i % 16, ch = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]][Math.floor(bar / 2) % 4], f = n => 440 * Math.pow(2, (n - 69) / 12);
    if (s === 0 && bar % 2 === 0) { for (const n of ch) { this.mtone(f(n), t, d * 32, 'triangle', .05, .7, 900); this.mtone(f(n) * 1.004, t, d * 32, 'sawtooth', .012, .9, 700); } }
    if (lvl === 0 && s === 8 && bar % 2 === 1) this.mtone(f(ch[2] + 24), t, d * 8, 'sine', .03, .01, 0);
    if (lvl >= 1 && s % 4 === 0) this.mtone(f(ch[0] - 24), t, d * 3.2, 'triangle', .13, .02, 400);
    if (lvl >= 2 && s % 2 === 0) this.mtone(f(ch[(s / 2) % 3] + 12), t, d * 1.6, 'square', .02, .005, 1800);
    if (lvl >= 2 && s % 4 === 2) this.mnoise(t, .03, .02);
    if (lvl >= 3 && s % 4 === 0) { const ac = this.ac, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + .14); g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.0001, t + .16); o.connect(g); g.connect(this.mbus); o.start(t); o.stop(t + .2); }
    if (lvl >= 3 && s % 2 === 1) this.mnoise(t, .02, .012);
  },
  mnoise(t, len, vol) {
    const ac = this.ac, n = Math.floor(ac.sampleRate * len), buf = ac.createBuffer(1, n, ac.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const sr = ac.createBufferSource(), g = ac.createGain(), q = ac.createBiquadFilter(); q.type = 'highpass'; q.frequency.value = 6000; g.gain.value = vol; sr.buffer = buf; sr.connect(q); q.connect(g); g.connect(this.mbus); sr.start(t);
  },
  setMusic(l) { if (this.mus) this.mus.lvl = l; },
  lose() { [330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, .5, 'sawtooth', .05, -20, 'lo' + i), i * 260)); }
};

/* ============================ VOCES DEL MANDO (síntesis de voz del sistema) ============================ */
const VLANG = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT' };
const VO = {
  last: {}, v: {},
  voice(lang) {
    if (this.v[lang] !== undefined) return this.v[lang];
    let best = null; try { const vs = speechSynthesis.getVoices(); if (!vs.length) return null; const p = lang.slice(0, 2); best = vs.find(x => x.lang === lang) || vs.find(x => x.lang.slice(0, 2) === p) || null; } catch (e) { return null; }
    return (this.v[lang] = best);
  },
  say(key, p, prio, gap) {
    if (!SET.voice || !SND.on || !window.speechSynthesis || !window.SpeechSynthesisUtterance || (G && G.demo)) return;
    const now = performance.now(); if (now - (this.last[key] || 0) < (gap || 6000)) return; this.last[key] = now;
    try {
      const u = new SpeechSynthesisUtterance(tr('vo.' + key, p)); u.lang = VLANG[I18N.lang] || 'en-US'; u.rate = 1.1; u.pitch = .85; u.volume = .9;
      const v = this.voice(u.lang); if (v) u.voice = v;
      if (prio) speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* sin síntesis de voz */ }
  }
};

/* ============================ LOG / HUD ============================ */
const TUT = [
  { k: 'tut.1', done: () => G.units.length >= 1 },
  { k: 'tut.2', done: () => G.units.length >= 2 },
  { k: 'tut.3', done: () => G.air.some(a => a.moved) },
  { k: 'tut.4', done: () => G.phase === 'ops' },
  { k: 'tut.5', done: () => G.air.some(a => a.state !== 'hangar') },
  { k: 'tut.6', done: () => UI.tab === 'rad' },
  { k: 'tut.7', done: () => (G.sel && G.sel.kind === 'threat') || G.t > 25 }
];
function tutShow() {
  if (!G || !G.tut) return; const st = TUT[G.tut.i]; if (!st) { endTut(); return; }
  setHint(tr('tut.head', { i: G.tut.i + 1, n: TUT.length }) + tr(st.k), 'tut');
}
function tutTick() {
  if (!G || !G.tut || G.demo) return; const st = TUT[G.tut.i];
  if (st && st.done()) { G.tut.i++; if (G.tut.i >= TUT.length) endTut(); else if (UI.mode === 'idle') tutShow(); }
}
function endTut() { if (G) G.tut = null; SET.tutDone = true; saveSet(); if ($('#hint').dataset.key === 'tut') setHint(null); }
function toast(html, cls) {
  const box = $('#toasts'); if (!box) return;
  const d = document.createElement('div'); d.className = cls || ''; d.innerHTML = html; box.appendChild(d);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => d.remove(), 3800);
}
function banner(html) {
  const b = $('#banner'); b.innerHTML = html; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.add('hidden'), 2750);
}
function restockCost() { let c = 0; for (const u of G.units) if (u.def.range && u.ammo < u.max) c += Math.round(u.def.restock * (1 - u.ammo / u.max)); return c; }
function restockAll() {
  if (!G || G.over) return;
  const us = G.units.filter(u => u.def.range && u.ammo < u.max).sort((a, b) => a.ammo / a.max - b.ammo / b.max); let n = 0;
  for (const u of us) { const c = Math.round(u.def.restock * (1 - u.ammo / u.max)); if (G.credits >= c) { G.credits -= c; G.stats.spentCredits += c; u.ammo = u.max; u.low = false; n++; } }
  log(n ? tr('log.restocked', { n }) : tr('log.nothingRestock'), n ? 'good' : 'warn'); refreshDock(); refreshTop();
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
  h.innerHTML = '<div>' + html + '</div><button class="x" aria-label="' + tr('a.close') + '">' + (key === 'tut' ? tr('skip') : '✕') + '</button>';
  h.classList.remove('hidden');
  $('.x', h).onclick = () => { if (key === 'tut') { endTut(); return; } h.classList.add('hidden'); if (UI.mode !== 'idle') cancelMode(); };
  h.dataset.key = key || '';
}
function setPhase(p) {
  G.phase = p;
  $('#speeds').classList.toggle('hidden', p === 'prep'); $('#btn-start').classList.toggle('hidden', p !== 'prep');
  const ph = $('#phase'); ph.textContent = p === 'prep' ? tr('phase.prep') : tr('phase.ops'); ph.className = p;
  $$('.spd').forEach(b => b.classList.toggle('on', +b.dataset.s === G.speed));
  refreshDock();
}
function startOps(sp) {
  if (!G || G.over || G.phase !== 'prep') return;
  setPhase('ops'); banner(tr('phase.ops') + '<small>' + tr('banner.ops') + '</small>'); log(tr('log.opsStart'), 'warn');
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
  $('#s-wave').textContent = G.lv.endless ? String(G.waveIdx) : Math.min(G.waveIdx, G.lv.waves.length) + '/' + G.lv.waves.length;
  $('#s-time').textContent = mmss(G.t);
  const nw = G.lv.waves[G.waveIdx], sn = $('#s-next');
  sn.textContent = G.phase === 'prep' ? '—' : nw ? mmss(Math.max(0, nw.t - G.t)) : (G.threats.length || G.pending.length ? tr('hud.end') : '—');
  sn.classList.toggle('hot', G.phase === 'ops' && !!nw && nw.t - G.t < 6);
  $('#s-cred').textContent = Math.floor(G.credits);
  { const wx = $('#wx'); if (G.lv.weather !== 'clear') { wx.classList.remove('hidden'); wx.textContent = tr('wx.' + G.lv.weather); } else wx.classList.add('hidden');
    const od = $('#ord'); if (G.order) { od.classList.remove('hidden'); od.textContent = tr('ev.orderChip', { n: G.order.asset.name, t: mmss(Math.max(0, G.order.until - G.t)) }); } else od.classList.add('hidden'); }
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
  if (a.state === 'hangar') return G.phase === 'prep' ? tr('st.hangar') : a.home.hp > 0 ? tr('st.ready') : tr('st.baseDown');
  if (a.state === 'turn') return tr('st.turn', { s: Math.ceil(a.turn) });
  if (a.state === 'rtb') return tr('st.rtb');
  return stationName(a);
}
function buildDock() {
  const box = $('#cards'), keep = box.scrollLeft; box.innerHTML = ''; for (const k in cardRefs) delete cardRefs[k]; emRefs.length = 0; baseCardEl = masterEl = null;
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === UI.tab));
  if (UI.tab === 'rad') {
    const em = emitters();
    if (!em.length) box.innerHTML = '<div class="empty">' + tr('dock.noEmit') + '</div>';
    else {
      masterEl = document.createElement('div'); masterEl.className = 'card em master'; masterEl.innerHTML = '<div class="n">' + tr('em.all') + '</div><div class="r" data-r></div><div class="st" data-st></div>';
      masterEl.addEventListener('click', () => { const any = emitters().some(isEmitting); for (const e of emitters()) { if (e.rdown > 0) continue; e.emit = !any; } log(any ? tr('log.silence') : tr('log.allOn'), any ? 'warn' : ''); SND.ping(); updateDetection(); refreshDock(); });
      box.appendChild(masterEl);
      for (const e of em) {
        const el = document.createElement('div'); el.className = 'card em';
        el.innerHTML = '<div class="n">' + e.name + '</div><div class="r">' + (e.def ? tr('em.det', { r: e.def.radar || e.def.sensor }) : tr('em.baseRadar', { r: e.radar })) + '</div><div class="st" data-st></div>';
        el.addEventListener('click', () => toggleEmit(e));
        box.appendChild(el); emRefs.push({ el, e });
      }
    }
  } else {
    const isAir = UI.tab === 'air';
    if (isAir) {
      baseCardEl = document.createElement('div'); baseCardEl.className = 'card basesel';
      baseCardEl.innerHTML = '<div class="r">' + tr('buy.at') + '</div><div class="n" data-bn></div><div class="c" data-bc></div><div class="r">' + tr('buy.tap') + '</div>';
      baseCardEl.addEventListener('click', () => {
        const bs = airbases().filter(b => b.hp > 0); if (!bs.length) return;
        G.buyBase = bs[(bs.indexOf(G.buyBase) + 1) % bs.length]; refreshDock();
      });
      box.appendChild(baseCardEl);
    }
    const list = !isAir ? ['gun', 'shorad', 'mrad', 'bmd', 'laser', 'ship', 'radar'].map(i => SAM[i]) : ['f16', 'f15e', 'ah64', 'e2', 'tanker', 'mq9'].map(i => AIR[i]);
    let ki = 0;
    for (const D of list) {
      if (G.n < D.unlock) continue;
      const el = document.createElement('div');
      el.className = 'card';
      let inner = '<div class="n">' + D.short + '</div><div class="c" data-c>◈ ' + D.cost + '</div>';
      if (isAir) inner = '<button class="buy" aria-label="' + tr('a.buy') + '">+</button>' + inner + '<div class="r" data-r></div><div class="r">' + D.role + '</div>';
      else {
        const bars = ['drone', 'cruise', 'ballistic', 'arm'].map(k => '<i style="height:' + Math.max(2, (D.pk[k] || 0) * 14) + 'px" title="' + KIND_LBL[k] + '"></i>').join('');
        inner += '<div class="r">' + (D.radar ? tr('card.det', { r: D.radar }) : tr('card.rng', { r: D.range, a: D.ammo })) + '</div>' + (D.radar ? '' : '<div class="pks">' + bars + '</div>');
      }
      el.innerHTML = inner + '<span class="kb">' + 'QWERTYUI'[ki] + '</span>';
      el.title = D.name + ' — ' + (D.desc || D.mission) + ' [' + 'QWERTYUI'[ki] + ']'; ki++;
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
      const sep = document.createElement('div'); sep.className = 'sep'; sep.textContent = tr('fleet'); box.appendChild(sep);
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
  { const rc = restockCost(), rb = $('#btn-restock'); rb.textContent = rc ? tr('restock') + ' ◈' + rc : tr('restock'); rb.disabled = !rc || G.credits < 1; }
  { const em = emitters(), on = em.filter(isEmitting).length, t = $('.tab[data-tab=rad]');
    t.textContent = em.length ? tr('tab.rad') + ' ' + on + '/' + em.length : tr('tab.rad'); t.classList.toggle('alert', G.threats.some(q => q.alive && q.kind === 'arm')); }
  for (const id in cardRefs) {
    const { el, spec, D } = cardRefs[id];
    const armed = UI.spec && UI.spec.id === id && UI.mode !== 'idle';
    el.classList.toggle('armed', !!armed);
    if (spec.kind === 'sam') { const c = placeCost(D), ce = $('[data-c]', el); ce.textContent = '◈ ' + c; ce.classList.toggle('prem', c > D.cost); el.classList.toggle('off', G.credits < c || G.lv.rule === 'airOnly'); }
    else {
      const r = readyCount(id), t = totalCount(id);
      $('[data-r]', el).textContent = G.phase === 'prep' ? tr('dock.inFleet', { n: t }) : tr('dock.ready', { r, n: t });
      el.classList.toggle('off', G.phase === 'ops' && r === 0);
      $('.buy', el).disabled = G.credits < D.cost || !G.buyBase || baseCount(G.buyBase) >= baseCap();
    }
  }
  if (baseCardEl && G.buyBase) { $('[data-bn]', baseCardEl).textContent = G.buyBase.name; $('[data-bc]', baseCardEl).textContent = tr('buy.slots', { a: baseCount(G.buyBase), b: baseCap() }); }
  for (const el of $$('.chip', $('#cards'))) {
    const a = G.air.find(q => q.id === +el.dataset.id); if (!a) continue;
    el.className = 'chip ' + (a.state === 'hangar' ? (a.home.hp > 0 ? 'ready' : 'dead') : a.state) + (G.sel && G.sel.ref === a ? ' sel' : '');
    $('.bs', el).textContent = a.home.name.slice(0, 9); $('[data-s]', el).textContent = airStateTxt(a);
    $('[data-f]', el).style.width = (a.state === 'out' || a.state === 'rtb' ? a.fuel / a.def.fuel * 100 : 100) + '%';
  }
  for (const { el, e } of emRefs) {
    const on = isEmitting(e), tg = isTargeted(e), st = $('[data-st]', el);
    st.textContent = e.rdown > 0 ? tr('st.damaged', { s: Math.ceil(e.rdown) }) : e.jam > 0 ? tr('st.jammed', { s: Math.ceil(e.jam) }) : tg ? tr('st.targeted') : on ? 'ON' : 'OFF';
    el.classList.toggle('on', on); el.classList.toggle('hot', tg); el.classList.toggle('down', e.rdown > 0); el.classList.toggle('jam', e.jam > 0);
  }
  if (masterEl) { const em = emitters(), any = em.some(isEmitting); $('[data-r]', masterEl).textContent = em.filter(isEmitting).length + '/' + em.length + ' ON'; $('[data-st]', masterEl).textContent = any ? tr('em.silence') : tr('em.allOnBtn'); masterEl.classList.toggle('on', any); }
}
function buyAir(type) {
  const D = AIR[type];
  if (G.over) return;
  const b = G.buyBase;
  if (!b || b.hp <= 0) { log(tr('log.pickBase'), 'warn'); return; }
  if (baseCount(b) >= baseCap()) { log(tr('log.baseFull', { b: b.name, n: baseCap() }), 'warn'); return; }
  if (G.credits < D.cost) { log(tr('log.noCredits'), 'warn'); return; }
  G.credits -= D.cost; G.stats.spentCredits += D.cost;
  G.air.push(mkAir(type, ++G.id, b)); log(tr('log.bought', { a: D.short, b: b.name }), 'good'); refreshDock(); refreshTop();
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
  if (spec.kind === 'sam' && G.lv.rule === 'airOnly') { log(tr('log.airOnly'), 'warn'); return false; }
  if (spec.kind === 'sam') { if (G.credits < placeCost(SAM[spec.id])) { log(tr('log.noCredits'), 'warn'); return false; } return true; }
  if (G.phase === 'prep') { log(tr('log.prepAir'), 'warn'); return false; }
  if (!readyCount(spec.id)) { log(tr('log.noCells', { a: AIR[spec.id].short }), 'warn'); return false; }
  return true;
}
function armMode(spec, af) {
  UI.spec = { kind: spec.kind, id: spec.id, af: af || null };
  UI.mode = spec.kind === 'sam' ? 'place' : 'mission';
  UI.ghost = null; UI.ptr = null;
  if (spec.kind === 'sam') {
    const D = SAM[spec.id];
    setHint(tr('hint.sam', { name: D.name, desc: D.desc, col: C.dim, kc: KIND_LBL.cruise, kb: KIND_LBL.ballistic, u: Math.round((D.pk.drone || 0) * 100), c: Math.round((D.pk.cruise || 0) * 100), b: Math.round((D.pk.ballistic || 0) * 100), a: Math.round((D.pk.arm || 0) * 100), rush: G.phase === 'ops' ? tr('hint.rush') : '', place: D.naval ? tr('hint.placeSea') : tr('hint.placeLand') }), 'mode');
  } else {
    const D = AIR[spec.id];
    let t = tr('hint.air1', { name: D.name });
    if (D.pk.drone) t += tr('hint.air2', { u: Math.round(D.pk.drone * 100), c: Math.round(D.pk.cruise * 100), kc: KIND_LBL.cruise });
    if (D.strike) t += tr('hint.air3', { p: Math.round(D.strike * (1 - G.lv.siteDef) * 100) });
    if (D.radar >= 180) t += tr('hint.air4', { r: D.radar });
    if (D.refuel) t += tr('hint.air6', { r: D.refuel });
    setHint(t + (af ? ' (' + af.label + ' · ' + af.home.name + ')' : tr('hint.air5')), 'mode');
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
function validPlace(x, y, D) {
  if (D && D.naval) {
    if (onLand(x, y) || x < 20 || x > WW - 20 || y < 20 || y > WH - 20) return false;
    if (!G.assets.some(a => a.type === 'port' && a.hp > 0 && dst(x, y, a.x, a.y) < PORT_R)) return false;
  } else if (!onLand(x, y)) return false;
  const sep = 20 / Math.max(.2, view.s);
  for (const a of G.assets) if (dst(x, y, a.x, a.y) < sep) return false;
  for (const u of G.units) if (dst(x, y, u.x, u.y) < sep * .8) return false;
  return true;
}
const placeCost = D => Math.round(D.cost * (G.phase === 'prep' ? 1 : 1.5));   // el despliegue urgente en operación cuesta +50 %
function placeUnit(D, x, y) {
  const cost = placeCost(D);
  if (G.credits < cost) { log(tr('log.noCredits'), 'warn'); return false; }
  if (!validPlace(x, y, D)) { log(D.naval ? tr('log.badPosSea') : tr('log.badPos'), 'warn'); return false; }
  G.credits -= cost; G.stats.spentCredits += cost;
  const n = G.units.filter(q => q.def === D).length + 1;
  const u = { id: ++G.id, def: D, x, y, ammo: Math.round(D.ammo * (1 + .12 * U('ammo'))), max: Math.round(D.ammo * (1 + .12 * U('ammo'))), cool: .8, roe: 'free', n, name: D.short + '-' + n, emit: true, paid: cost };
  G.units.push(u); log(tr('log.placed', { n: u.name }), 'good');
  if (G.n === 1 && !G.tut && !UI.hintShown.placed && G.phase === 'prep') {
    UI.hintShown.placed = 1;
    setTimeout(() => G && G.phase === 'prep' && setHint(tr('hint.placed'), 'plan'), 50);
  }
  refreshDock(); refreshTop(); return true;
}
function tracks() { return G.threats.filter(t => t.alive); }
function stationName(a) { return a.mission ? ({ cap: 'CAP', aew: 'AEW', isr: 'ISR', tank: 'TANK', int: tr('mis.int'), strike: tr('mis.strike') })[a.mission.kind] : '—'; }

function launchMission(af, m) {
  const b = af.home;
  if (af.state === 'hangar') {
    if (G.phase === 'prep') { log(tr('log.sortiesLater'), 'warn'); return false; }
    if (b.hp <= 0) { log(tr('log.baseInop', { b: b.name }), 'bad'); return false; }
    af.state = 'out'; af.x = b.x; af.y = b.y; af.cool = 1; G.stats.sorties++;
    SND.launch();
  } else if (af.state !== 'out') return false;
  af.mission = m;
  return true;
}
function missionStation(kind, x, y) { return { kind, x, y, ang: 0, phase: 'transit' }; }
function stationKind(D) { return D.id === 'e2' ? 'aew' : D.id === 'mq9' ? 'isr' : D.id === 'tanker' ? 'tank' : 'cap'; }
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
function pickTargetAsset() {
  const ws = G.assets.filter(a => a.hp > 0); if (!ws.length) return null;
  let r = Math.random() * ws.reduce((a, b) => a + b.tw, 0), t = ws[0];
  for (const a of ws) { r -= a.tw; if (r <= 0) { t = a; break; } }
  return t;
}
function spawnWave(w, idx) {
  if (G.lv.endless) { G.sites.forEach(q => { if (!q.alive && Math.random() < .5) q.alive = true; }); G.credits += 30 + 5 * idx; }
  const alive = G.sites.filter(s => s.alive);
  if (!alive.length) { log(tr('log.waveSupp', { i: idx + 1 }), 'good'); return; }
  const sites = alive.slice().sort(() => Math.random() - .5), ft = w.focus ? pickTargetAsset() : null, batch = [];
  for (const it of w.items) for (let i = 0; i < it.count; i++) {
    const s = ft ? sites[batch.length % Math.min(2, sites.length)] : pick(alive);
    batch.push({ kind: it.kind, site: s, wave: idx, delay: rnd(0, Math.min(5, .3 * it.count + 1)), target: it.kind === 'arm' ? null : ft, evasive: (it.kind === 'drone' || it.kind === 'decoy') && Math.random() < (G.lv.evasive || 0) });
  }
  const twoAxis = ft && new Set(batch.map(p => p.site)).size >= 2;
  if (ft) {   // llegada simultánea de todos los vectores
    const trav = p => dst(p.site.x, p.site.y, ft.x, ft.y) / THREAT[p.kind].spd, tg = batch.filter(p => p.target), mx = tg.length ? Math.max(...tg.map(trav)) : 0;
    for (const p of tg) p.delay = mx - trav(p) + rnd(0, 1.5);
  }
  G.pending.push(...batch); const n = batch.length;
  G.waveStat[idx] = { total: 0, leaked: 0, done: false };
  VO.say('wave', { i: idx + 1, n }, true, 1500);
  log(G.lv.endless ? tr('log.waveE', { i: idx + 1, n }) : tr('log.wave', { i: idx + 1, m: G.lv.waves.length, n }), 'warn'); SND.ping();
  const cnt = { drone: 0, cruise: 0, ballistic: 0, arm: 0 }; for (const it of w.items) cnt[it.kind === 'decoy' ? 'drone' : it.kind] += it.count;
  if (cnt.ballistic) VO.say('bal'); if (cnt.arm) VO.say('arm');
  banner(tr('wave.word') + ' ' + (idx + 1) + (G.lv.endless ? '' : '/' + G.lv.waves.length) + '<small>' + [cnt.drone && KIND_LBL.drone + ' ×' + cnt.drone, cnt.cruise && KIND_LBL.cruise + ' ×' + cnt.cruise, cnt.ballistic && KIND_LBL.ballistic + ' ×' + cnt.ballistic, cnt.arm && 'ARM ×' + cnt.arm].filter(Boolean).join(' · ') + (ft ? '<br>' + tr(twoAxis ? 'wave.twoAxis' : 'wave.focus', { n: ft.name }) : '') + '</small>');
}
function emitters() { const L = []; for (const u of G.units) if (u.def.radar || u.def.sensor) L.push(u); for (const a of G.assets) if (a.radar && a.hp > 0) L.push(a); return L; }
function WX(kind) {   // efecto del clima sobre el alcance de detección
  const w = G && G.lv && G.lv.weather;
  if (w === 'fog') return kind === 'air' ? .9 : .75;
  if (w === 'night') return kind === 'sensor' ? .6 : kind === 'ground' ? .9 : 1;
  if (w === 'storm') return kind === 'sensor' ? .8 : kind === 'ground' ? .85 : .9;
  return 1;
}
const jamMul = e => e.jam > 0 ? .35 : 1;
function emRange(e) {
  if (e.def) { if (e.def.radar) return e.def.radar * radarMul() * WX('ground') * jamMul(e); if (e.def.sensor) return e.def.sensor * WX('sensor') * jamMul(e); return 0; }
  return e.radar * radarMul() * WX('ground') * jamMul(e);
}
const isEmitting = e => e.emit !== false && !(e.rdown > 0);
const isTargeted = e => G.threats.some(t => t.alive && t.kind === 'arm' && t.target === e);
const EM_W = { radar: 3, ship: 2.5, bmd: 2, mrad: 2, shorad: 1.5, laser: .6, gun: .5 };
function toggleEmit(e) {
  if (e.rdown > 0) { log(tr('log.radarDmg', { n: e.name, s: Math.ceil(e.rdown) }), 'warn'); return; }
  e.emit = !e.emit; log(tr('log.emit', { n: e.name, st: e.emit ? 'ON' : 'OFF' }), e.emit ? '' : 'warn'); SND.ping();
  updateDetection(); refreshDock(); if (G.sel && G.sel.ref === e) renderPanel();
}
function spawnThreat(kind, s, wave, ft, ev) {
  const D = THREAT[kind];
  let tgt = null;
  if (kind === 'arm') {
    const em = emitters().filter(isEmitting);
    if (!em.length) { log(tr('log.armAbort'), 'good'); G.stats.evaded++; return; }
    const w = e => e.def ? (EM_W[e.def.id] || 1) : 2;
    let r = Math.random() * em.reduce((a, e) => a + w(e), 0); tgt = em[0];
    for (const e of em) { r -= w(e); if (r <= 0) { tgt = e; break; } }
  } else {
    tgt = ft && ft.hp > 0 ? ft : pickTargetAsset(); if (!tgt) return;
  }
  const sp = D.spd * rnd(.92, 1.08), x = s.x + rnd(-14, 14), y = s.y + rnd(-14, 14);
  const d = dst(x, y, tgt.x, tgt.y), vx = (tgt.x - x) / d * sp, vy = (tgt.y - y) / d * sp;
  G.threats.push({ id: ++G.id, kind, D, x, y, vx, vy, spd: sp, target: tgt, alive: true, tracked: kind === 'ballistic', site: s, _surv: 1, wave, len: d, evasive: !!ev, age: 0, ph: Math.random() * 6.28 });
  if (G.waveStat[wave]) G.waveStat[wave].total++;
  if (kind === 'ballistic') { log(tr('log.balLaunch', { s: s.name }), 'bad'); SND.ping(); }
  if (kind === 'arm') {
    log(tr('log.armLaunch', { n: tgt.name }), 'bad'); SND.ping(); buzz(70);
    banner(tr('banner.arm', { n: tgt.name }));
    if (UI.tab !== 'rad' && UI.mode === 'idle') { UI.tab = 'rad'; buildDock(); }
  }
}
function fx(x, y, col, size, dur) { G.fx.push({ x, y, col, size, dur: dur || .6, t: 0 }); }
function killThreat(t, by) {
  t.alive = false; G.credits += t.D.bounty; G.stats.kills++; G.stats.value += t.D.val;
  { const kk = t.kind === 'decoy' ? 'drone' : t.kind; G.stats.killKind[kk] = (G.stats.killKind[kk] || 0) + 1; }
  const st = G.stats; st.streak++; st.bestStreak = Math.max(st.bestStreak, st.streak);
  if (st.streak === 5 || st.streak === 10 || st.streak === 20 || st.streak === 35) { toast(tr('ms.streak', { n: st.streak }), 'gold'); SND.chime(); }
  fx(t.x, t.y, C.amber, t.kind === 'ballistic' ? 30 : t.kind === 'cruise' ? 22 : 14, .5);
  if (t.kind === 'ballistic') { FXS.hold = Math.max(FXS.hold, .14); FXS.shake = Math.min(1, FXS.shake + .3); SND.thud(); fx(t.x, t.y, '#fff3c4', 44, .45); } else SND.boom();
  floatTxt(t.x, t.y - 6, '+' + t.D.bounty, C.amber);
  if (t.kind === 'cruise' || t.kind === 'ballistic') log(tr('log.killed', { n: t.D.name, by }), 'good');
}
function baseLost(a) {
  const lost = G.air.filter(q => q.home === a && (q.state === 'hangar' || q.state === 'turn'));
  lost.forEach(q => loseAir(q, tr('why.ground', { b: a.name })));
}
function impactARM(t) {
  t.alive = false;
  const e = t.target, isAsset = !!e.type, live = isAsset ? e.hp > 0 : G.units.includes(e);
  if (live && isEmitting(e)) {
    G.stats.leaked++; G.stats.leakKind.arm = (G.stats.leakKind.arm || 0) + 1; leakMark(t);
    FXS.shake = Math.min(1, FXS.shake + .35); FXS.flash = Math.min(.5, FXS.flash + .18); buzz(60); SND.impact();
    if (isAsset) {
      e.hp = Math.max(0, e.hp - 10 * (1 - .07 * U('armor'))); e.rdown = 45; fx(e.x, e.y, C.red, 30, .9);
      log(tr('log.armHitRadar', { n: e.name }), 'bad'); if (e.hp <= 0) { log(tr('log.destroyed', { n: e.name }), 'bad'); baseLost(e); }
    } else {
      G.units.splice(G.units.indexOf(e), 1); fx(e.x, e.y, C.red, 36, 1); if (G.sel && G.sel.ref === e) hidePanel();
      log(tr('log.destroyedArm', { n: e.name }), 'bad');
    }
  } else { G.stats.evaded++; G.stats.armLost++; if (G.stats.armLost === 1) { toast(tr('ms.armFirst'), 'gold'); SND.chime(); } fx(t.x, t.y, C.dim, 14, .5); floatTxt(t.x, t.y - 8, tr('float.armLost'), C.green); log(tr('log.armLost', { n: e.name }), 'good'); }
}
function leakMark(t) {
  const st = G.stats; st.streak = 0; if (!t.seen) st.detN++;
  const ws = G.waveStat[t.wave]; if (ws) ws.leaked++;
  if (st.leaked === 1 && G.phase === 'ops' && !G.demo) { toast(tr('medal.lost', { n: tr('medal.flawless') }), 'warn'); }
}
function impact(t) {
  if (t.kind === 'arm') { impactARM(t); return; }
  t.alive = false;
  const a = t.target;
  G.stats.leaked++; G.stats.leakKind[t.kind] = (G.stats.leakKind[t.kind] || 0) + 1; if (!t.tracked) G.stats.blind++; leakMark(t);
  if (t.D.dmg > 0) {
    const dmg = t.D.dmg * (1 - .07 * U('armor')); a.hp = Math.max(0, a.hp - dmg);
    floatTxt(a.x, a.y - 26, '−' + Math.round(dmg) + '%', C.red); FXS.shake = Math.min(1, FXS.shake + (t.kind === 'ballistic' ? .9 : .3)); FXS.flash = Math.min(.5, FXS.flash + .22); buzz(t.kind === 'ballistic' ? 160 : 45);
    fx(a.x + rnd(-12, 12), a.y + rnd(-12, 12), C.red, t.kind === 'ballistic' ? 46 : 26, .9); SND.impact();
    log(tr('log.hit', { tag: t.D.tag, n: a.name, hp: Math.round(a.hp) }), 'bad');
    if (a.hp <= 0) { log(tr('log.destroyed', { n: a.name }), 'bad'); VO.say('lost', { n: a.name }, true, 800); FXS.slow = 1.8; if (a.type === 'airbase') baseLost(a); }
    else { VO.say('hit', { n: a.name }, true, 7000); if (t.kind === 'ballistic' || a.type === 'capital') FXS.slow = Math.max(FXS.slow, .9); }
  } else fx(a.x, a.y, C.dim, 12, .4);
}
function updateDetection() {
  const rad = [];
  for (const a of G.assets) if (a.radar && a.hp > 0 && isEmitting(a)) rad.push([a.x, a.y, emRange(a)]);
  for (const u of G.units) { if (!isEmitting(u)) continue; if (u.def.radar || u.def.sensor) rad.push([u.x, u.y, emRange(u)]); }
  for (const a of G.air) if (a.state === 'out' || a.state === 'rtb') rad.push([a.x, a.y, a.def.radar * radarMul() * WX('air')]);
  G.radars = rad;
  for (const t of G.threats) {
    if (!t.alive) continue;
    if (t.kind === 'ballistic') { t.tracked = true; continue; }
    t.tracked = false; t.lost = t.kind === 'arm' && !isEmitting(t.target);
    for (const r of rad) if (dst(t.x, t.y, r[0], r[1]) <= r[2]) { t.tracked = true; break; }
  }
  for (const t of G.threats) if (t.alive && t.tracked && !t.seen) { t.seen = true; G.stats.detSum += clamp(dst(t.x, t.y, t.target.x, t.target.y) / (t.len || 1), 0, 1); G.stats.detN++; }
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
  if (t.evasive && t.seen) pk *= .78;
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
    if (u.ammo === 0) { G.stats.dry++; log(tr('log.dry', { n: D.short + '-' + u.n }), 'bad'); }
    else if (!u.low && u.ammo <= u.max * .25) { u.low = true; log(tr('log.low', { n: D.short + '-' + u.n }), 'warn'); }
  }
}
function flyTo(a, x, y, dt) {
  const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy), st = a.def.speed * dt * (G.lv.weather === 'storm' ? .85 : 1);
  a.hdg = Math.atan2(dy, dx);
  if (d <= st) { a.x = x; a.y = y; return true; }
  a.x += dx / d * st; a.y += dy / d * st; return false;
}
function loseAir(a, why) {
  G.air.splice(G.air.indexOf(a), 1); G.stats.airLost++;
  fx(a.x, a.y, C.red, 24, .8); SND.boom(); log(tr('log.airLost', { a: a.label, why }), 'bad');
  if (G.sel && G.sel.ref === a) hidePanel();
}
function startRTB(a) { a.state = 'rtb'; a.mission = null; }
function updateAir(a, dt) {
  const D = a.def;
  if (a.state === 'hangar') return;
  if (a.state === 'turn') {
    a.turn -= dt;
    if (a.turn <= 0) { a.state = 'hangar'; a.fuel = D.fuel; a.ammo = D.ammo; a.x = a.home.x; a.y = a.home.y; log(tr('log.readyAt', { a: a.label, b: a.home.name })); }
    return;
  }
  a.fuel -= dt; a.cool -= dt;
  if (a.fuel <= 0) { loseAir(a, tr('why.fuel')); return; }
  // zona antiaérea alrededor de rampas activas
  for (const s of G.sites) if (s.alive && dst(a.x, a.y, s.x, s.y) < SITE_AA && !(a.mission && a.mission.kind === 'strike')) {
    if (Math.random() < .22 * dt) { loseAir(a, tr('why.aa')); return; }
  }
  if (a.state === 'rtb') {
    const b = rtbBase(a);
    if (!b) { a.hdg += dt; return; }
    if (flyTo(a, b.x, b.y, dt)) { a.state = 'turn'; a.turn = D.turn; a.mission = null; if (a.home !== b) { a.home = b; log(tr('log.lands', { a: a.label, b: b.name })); } }
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
        VO.say('site', null, false, 5000); m.site.alive = false; G.stats.sitesKilled++; if (G.waveIdx <= 2) G.stats.earlySite = true; G.craters.push({ x: m.site.x, y: m.site.y }); FXS.hold = Math.max(FXS.hold, .1); fx(m.site.x, m.site.y, C.amber, 40, 1.2); SND.impact(); G.credits += 60; floatTxt(m.site.x, m.site.y - 20, '+60', C.amber);
        log(tr('log.siteKilled', { s: m.site.name, a: a.label }), 'good');
        const dropped = G.pending.filter(q => q.site === m.site).length; G.pending = G.pending.filter(q => q.site !== m.site);
        if (dropped) log(tr('log.cancelled', { n: dropped }), 'good');
        if (G.sel && G.sel.ref === m.site) hidePanel();
        startRTB(a);
      } else {
        log(tr('log.strikeFail', { a: a.label, s: m.site.name }), 'warn');
        if (Math.random() < .35) { loseAir(a, tr('why.strike')); return; }
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
function resolveWaves() {
  for (let i = 0; i < G.waveIdx; i++) {
    const ws = G.waveStat[i]; if (!ws || ws.done) continue;
    if (G.pending.some(p => p.wave === i) || G.threats.some(t => t.alive && t.wave === i)) continue;
    ws.done = true; if (ws.total <= 0) continue;
    const pct = Math.round((ws.total - ws.leaked) / ws.total * 100), last = i === G.lv.waves.length - 1;
    if (ws.leaked === 0) {
      G.stats.cleanWaves++; FXS.pulse = 1;
      if (!last) { VO.say('clean', null, false, 8000); banner(tr('wave.clean') + '<small>' + tr('wave.cleanSub', { n: ws.total }) + '</small>'); SND.chime(); }
    } else if (!last && pct >= 50) toast(tr('wave.held', { i: i + 1, p: pct }), '');
  }
}
function runEvent(ev) {
  if (ev.kind === 'jam') {
    const em = emitters().filter(e => isEmitting(e) && !(e.jam > 0)); if (!em.length) return;
    const w = e => e.def ? (EM_W[e.def.id] || 1) : 2; let r = Math.random() * em.reduce((a, e) => a + w(e), 0), e0 = em[0];
    for (const e of em) { r -= w(e); if (r <= 0) { e0 = e; break; } }
    e0.jam = 16; e0.offT = 0; G.stats.jams++;
    VO.say('jam', null, true, 4000); banner(tr('banner.jam', { n: e0.name })); log(tr('log.jam', { n: e0.name }), 'bad'); SND.ping(); buzz(40);
    if (UI.tab !== 'rad' && UI.mode === 'idle') { UI.tab = 'rad'; buildDock(); }
  } else if (ev.kind === 'surprise') {
    const cand = G.assets.filter(a => a.hp > 0 && a.type !== 'capital'), tgt = cand.length ? pick(cand) : pickTargetAsset(); if (!tgt) return;
    let sx = rnd(120, WW - 120), sy = -8;
    for (let i = 0; i < 40; i++) { const side = pick(['t', 'l', 'r']), x = side === 'l' ? -8 : side === 'r' ? WW + 8 : rnd(100, WW - 100), y = side === 't' ? -8 : rnd(80, WH * .6); sx = x; sy = y; if (!onLand(clamp(x, 4, WW - 4), clamp(y, 4, WH - 4))) break; }
    const site = { x: sx, y: sy, alive: true, name: tr('surprise.name') };
    for (let i = 0; i < ev.n; i++) G.pending.push({ kind: 'drone', site, wave: -1, delay: rnd(0, 3), target: tgt, evasive: false });
    VO.say('surprise', null, true, 4000); banner(tr('banner.surprise', { n: tgt.name })); log(tr('log.surprise', { n: tgt.name }), 'bad'); SND.ping(); buzz(50);
  } else if (ev.kind === 'reinforce') {
    const bs = airbases().filter(b => b.hp > 0 && baseCount(b) < baseCap());
    if (bs.length) {
      const sd = b => Math.min(...G.sites.map(s => dst(b.x, b.y, s.x, s.y))); bs.sort((a, b) => sd(b) - sd(a));
      const type = G.n >= 7 ? 'f15e' : 'f16'; G.air.push(mkAir(type, ++G.id, bs[0]));
      VO.say('reinforce', null, false, 4000); banner(tr('banner.reinforce', { a: AIR[type].short, b: bs[0].name })); buildDock();
    } else { G.credits += 150; banner(tr('banner.reinforceCr', { c: 150 })); }
    SND.chime();
  } else if (ev.kind === 'order') {
    const cand = G.assets.filter(a => a.hp > 0), tgt = cand.slice().sort((a, b) => b.tw - a.tw)[0]; if (!tgt || G.order) return;
    G.order = { asset: tgt, until: G.t + 40, hp0: tgt.hp };
    VO.say('order', { n: tgt.name }, false, 4000); banner(tr('banner.order', { n: tgt.name })); log(tr('log.order', { n: tgt.name }), 'warn'); SND.ping();
  }
}
function updateEvents(dt) {
  while (G.evIdx < G.lv.events.length && G.t >= G.lv.events[G.evIdx].t) runEvent(G.lv.events[G.evIdx++]);
  for (const e of emitters()) if (e.jam > 0) {
    if (!isEmitting(e)) { e.offT = (e.offT || 0) + dt; if (e.offT >= 2) { e.jam = 0; log(tr('log.retuned', { n: e.name }), 'good'); } } else { e.offT = 0; e.jam = Math.max(0, e.jam - dt); }
  }
  if (G.order && (G.t >= G.order.until || G.order.asset.hp <= 0)) {
    const o = G.order; G.order = null;
    if (o.asset.hp > 0 && o.asset.hp >= o.hp0 - .01) { G.credits += 120; G.stats.ordersOk++; toast(tr('ev.orderOk', { n: o.asset.name }), 'gold'); SND.chime(); }
    else toast(tr('ev.orderFail', { n: o.asset.name }), 'warn');
  }
  // reabastecimiento en vuelo
  for (const o of G.air) o.tank = false;
  for (const t of G.air) if (t.def.refuel && t.state === 'out' && t.mission && t.mission.phase === 'station') {
    for (const o of G.air) if (o !== t && !o.def.refuel && (o.state === 'out' || o.state === 'rtb') && o.fuel < o.def.fuel && dst(o.x, o.y, t.x, t.y) <= t.def.refuel) { o.fuel = Math.min(o.def.fuel, o.fuel + 10 * dt); o.tank = true; }
  }
}
function step(dt) {
  G.t += dt; rpRec(dt);
  G.credits += G.lv.income * dt;
  for (const a of G.assets) if (a.rdown > 0) { a.rdown = Math.max(0, a.rdown - dt); if (a.rdown === 0) log(tr('log.radarUp', { n: a.name }), 'good'); }
  if (G.lv.endless && G.phase === 'ops') while (G.lv.waves.length <= G.waveIdx + 1) G.lv.waves.push(endlessWave(G.lv.waves.length, G.lv));
  while (G.waveIdx < G.lv.waves.length && G.t >= G.lv.waves[G.waveIdx].t) { spawnWave(G.lv.waves[G.waveIdx], G.waveIdx); G.waveIdx++; }
  for (let i = G.pending.length - 1; i >= 0; i--) {
    const p = G.pending[i]; p.delay -= dt;
    if (p.delay <= 0) { if (p.site.alive) spawnThreat(p.kind, p.site, p.wave, p.target, p.evasive); G.pending.splice(i, 1); }
  }
  for (const t of G.threats) {
    if (!t.alive) continue;
    const d = dst(t.x, t.y, t.target.x, t.target.y);
    if (d <= t.spd * dt + 3) impact(t);
    else {
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.evasive && t.seen) { t.age += dt; const lat = t.spd * .9 * Math.cos(t.age * 3.2 + t.ph) * clamp(d / 150, 0, 1); t.x += (-t.vy / t.spd) * lat * dt; t.y += (t.vx / t.spd) * lat * dt; }
    }
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
  updateEvents(dt);
  updateUnits(dt);
  for (const a of G.air.slice()) updateAir(a, dt);
  updateMissiles(dt);
  G.threats = G.threats.filter(t => t.alive);
  for (let i = G.fx.length - 1; i >= 0; i--) { G.fx[i].t += dt; if (G.fx[i].t > G.fx[i].dur) G.fx.splice(i, 1); }
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.1);
  resolveWaves();
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
function hidePanel() { if (G) { G.sel = null; const z = G.apz; G.apz = 0; if (z && !G.over) setSpeed(z); } $('#panel').classList.add('hidden'); }
function select(sel) {
  if (SET.ap && G.speed > 0 && G.phase === 'ops' && !G.demo && !G.over) { G.apz = G.speed; setSpeed(0); }
  G.sel = sel; renderPanel();
}
/* repetición de los últimos segundos: instantáneas a 10 Hz que se reproducen sobre el mapa */
const RP = { buf: [], acc: 0, HZ: 10, SEC: 14 };
function rpRec(dt) {
  RP.acc += dt; if (RP.acc < 1 / RP.HZ || G.over) return; RP.acc = 0;
  const cp = a => a.map(o => Object.assign({}, o));
  RP.buf.push({ threats: cp(G.threats.filter(t => t.alive)), air: cp(G.air), missiles: cp(G.missiles), units: cp(G.units), assets: cp(G.assets), fx: cp(G.fx), radars: G.radars });
  if (RP.buf.length > RP.HZ * RP.SEC) RP.buf.shift();
}
function startReplay(done) {
  if (!G || RP.buf.length < 8) { done(); return; }
  G.rp = { i: 0, acc: 0, done, saved: { threats: G.threats, air: G.air, missiles: G.missiles, units: G.units, assets: G.assets, fx: G.fx, radars: G.radars, sel: G.sel } };
  G.sel = null; $('#overlay').classList.add('hidden'); $('#rpbar').classList.remove('hidden'); rpApply();
}
function rpApply() { const f = RP.buf[G.rp.i]; G.threats = f.threats; G.air = f.air; G.missiles = f.missiles; G.units = f.units; G.assets = f.assets; G.fx = f.fx; G.radars = f.radars; $('#rpfill').style.width = (100 * G.rp.i / RP.buf.length) + '%'; }
function rpAdvance(dt) {
  const r = G.rp; r.acc += dt;
  while (r.acc >= 1 / RP.HZ) { r.acc -= 1 / RP.HZ; r.i++; if (r.i >= RP.buf.length) { endReplay(); return; } }
  rpApply();
}
function endReplay() {
  const r = G.rp; if (!r) return; Object.assign(G, r.saved); G.rp = null; $('#rpbar').classList.add('hidden'); r.done();
}
const pb = (v, mx, col) => '<div class="pb"><i style="width:' + clamp(v / mx * 100, 0, 100) + '%' + (col ? ';background:' + col : '') + '"></i></div>';
const refund = u => G.phase === 'prep' ? (u.paid || u.def.cost) : Math.round(u.def.cost * .6);
const fwdDist = b => Math.round(Math.min(...G.sites.filter(q => q.alive).map(q => dst(b.x, b.y, q.x, q.y)), 9999));
function emitTxt(e) { return e.rdown > 0 ? tr('st.damaged', { s: Math.ceil(e.rdown) }) : e.jam > 0 ? tr('st.jammed', { s: Math.ceil(e.jam) }) : isEmitting(e) ? tr('st.emitting') : tr('st.off'); }
function renderPanel() {
  const p = $('#panel'), s = G && G.sel;
  if (!s || UI.mode !== 'idle') { p.classList.add('hidden'); return; }
  let h = '';
  const r = s.ref;
  if (s.kind === 'asset') {
    h = '<h3>' + r.name + '</h3><div class="sub">' + tr('asset.' + r.type) + '</div><div class="row"><span>' + tr('p.integrity') + '</span><span>' + Math.round(r.hp) + '%</span></div>' + pb(r.hp, 100, r.hp > 50 ? C.green : C.red);
    if (r.type === 'airbase') {
      const here = G.air.filter(q => q.home === r);
      h += '<div class="row"><span>' + tr('p.hangar') + '</span><span>' + here.length + '/' + baseCap() + '</span></div><div class="row"><span>' + tr('p.frontDist') + '</span><span>' + fwdDist(r) + '</span></div>';
      h += here.map(q => '<div class="row sm"><span>' + q.label + '</span><span>' + airStateTxt(q) + '</span></div>').join('');
    }
    if (r.radar) {
      h += '<div class="row"><span>' + tr('p.radarR', { r: r.radar }) + '</span><span>' + emitTxt(r) + '</span></div>';
      h += '<button class="pbtn" data-a="emit"' + (r.hp <= 0 ? ' disabled' : '') + '>' + tr('p.emitter') + ': <b>' + (r.emit ? 'ON' : 'OFF') + '</b><span class="pct">' + (isTargeted(r) ? '⚠ ARM' : '') + '</span></button>';
    }
  } else if (s.kind === 'unit') {
    const D = r.def;
    h = '<h3>' + r.name + '</h3><div class="sub">' + D.name + '</div>';
    if (D.range) h += '<div class="row"><span>' + tr('p.ammo') + '</span><span>' + r.ammo + '/' + r.max + '</span></div>' + pb(r.ammo, r.max) + '<div class="row"><span>' + tr('p.range') + '</span><span>' + D.range + '</span></div>';
    else h += '<div class="row"><span>' + tr('p.detect') + '</span><span>' + D.radar + '</span></div>';
    h += '<div class="row"><span>' + tr('p.emitter') + '</span><span>' + (isTargeted(r) ? tr('p.armTargeted') : emitTxt(r)) + '</span></div>';
    h += '<button class="pbtn' + (isTargeted(r) ? ' danger' : '') + '" data-a="emit">' + tr('p.emitter') + ': <b>' + (r.emit ? tr('p.onTurnOff') : tr('p.offTurnOn')) + '</b></button>';
    if (D.range) {
      h += '<button class="pbtn" data-a="roe">ROE: <b>' + (r.roe === 'free' ? tr('roe.free') : tr('roe.save')) + '</b></button>';
      const cost = Math.round(D.restock * (1 - r.ammo / r.max));
      h += '<button class="pbtn" data-a="restock"' + (r.ammo >= r.max || G.credits < cost ? ' disabled' : '') + '>' + tr('p.restock') + ' <span class="pct">◈ ' + cost + '</span></button>';
    }
    h += '<button class="pbtn" data-a="sell">' + tr('p.sell') + ' <span class="pct">+◈ ' + refund(r) + '</span></button>';
  } else if (s.kind === 'air') {
    const D = r.def;
    h = '<h3>' + r.label + '</h3><div class="sub">' + tr('p.airSub', { name: D.name, b: r.home.name, st: airStateTxt(r) }) + '</div>';
    if (r.state === 'hangar') {
      if (G.phase === 'prep') {
        h += '<div class="sub">' + tr('p.rebase') + '</div>';
        for (const b of airbases()) if (b !== r.home) h += '<button class="pbtn" data-a="rebase" data-t="' + b.id + '"' + (b.hp <= 0 || baseCount(b) >= baseCap() ? ' disabled' : '') + '>→ ' + b.name + '<span class="pct">' + baseCount(b) + '/' + baseCap() + tr('p.front', { n: fwdDist(b) }) + '</span></button>';
      } else h += (r.home.hp > 0 ? '<button class="pbtn" data-a="sortie">' + tr('p.sortie') + ' <span class="pct">' + tr('p.tapMap') + '</span></button>' : '<div class="sub">' + tr('p.baseInop') + '</div>');
    } else if (r.state === 'turn') {
      h += '<div class="row"><span>' + tr('p.turn') + '</span><span>' + Math.ceil(r.turn) + 's</span></div>';
    } else {
      h += '<div class="row"><span>' + tr('p.fuel') + '</span><span>' + Math.round(r.fuel) + 's</span></div>' + pb(r.fuel, D.fuel, C.amber);
      if (D.ammo) h += '<div class="row"><span>' + tr('p.missiles') + '</span><span>' + r.ammo + '/' + D.ammo + '</span></div>' + pb(r.ammo, D.ammo);
      h += '<button class="pbtn" data-a="rtb">' + tr('p.rtb') + '</button>';
      if (r.state === 'out') h += '<button class="pbtn" data-a="retask">' + tr('p.retask') + '</button>';
    }
  } else if (s.kind === 'site') {
    h = '<h3>' + r.name + '</h3><div class="sub">' + tr('p.siteSub', { aa: Math.round(r.def * 100) }) + '</div>';
    const enr = G.air.filter(a => a.mission && a.mission.kind === 'strike' && a.mission.site === r);
    let any = false;
    if (G.phase === 'prep') h += '<div class="sub">' + tr('p.siteprep') + '</div>';
    else for (const type of ['f15e', 'f16', 'ah64', 'mq9']) {
      const D = AIR[type]; if (G.n < D.unlock) continue;
      const rc = readyCount(type), p = strikeP(D, r), bs = bestReady(type, r.x, r.y);
      let acc = p; for (const e of enr) acc = 1 - (1 - acc) * (1 - strikeP(e.def, r));
      any = true;
      h += '<button class="pbtn danger" data-a="strike" data-t="' + type + '"' + (rc ? '' : ' disabled') + '>' + D.short + ' ×' + rc + (bs ? ' <small>' + Math.ceil(dst(bs.home.x, bs.home.y, r.x, r.y) / D.speed) + 's</small>' : '') + '<span class="pct">' + Math.round(p * 100) + '%' + (enr.length ? ' → ' + Math.round(acc * 100) + '%' : '') + '</span></button>';
    }
    if (enr.length) h += '<div class="sub" style="margin-top:6px">' + tr('p.enroute') + enr.map(e => e.label).join(', ') + '</div>';
    if (!any && G.phase === 'ops') h += '<div class="sub">' + tr('p.noStrike') + '</div>';
  } else if (s.kind === 'threat') {
    const tgt = r.target, eta = dst(r.x, r.y, tgt.x, tgt.y) / r.spd;
    h = '<h3>H-' + String(r.id).padStart(3, '0') + ' ' + r.D.tag + '</h3><div class="sub">' + tr('p.threatSub', { name: r.kind === 'decoy' ? THREAT.drone.name : r.D.name, tgt: tgt.name }) + '</div>' +
      '<div class="row"><span>' + tr('p.impactIn') + '</span><span>' + Math.ceil(eta) + 's</span></div>';
    if (r.kind === 'arm') h += '<div class="sub">' + tr('p.armHint', { n: tgt.name }) + '</div><button class="pbtn danger" data-a="emit-t">' + tgt.name + ': ' + (isEmitting(tgt) ? tr('p.turnOff') : tr('p.turnOn')) + '</button>';
    for (const type of ['f16', 'f15e', 'ah64']) {
      const D = AIR[type]; if (G.n < D.unlock) continue;
      const pk = interceptPk(D, r), rc = readyCount(type), bs = bestReady(type, r.x, r.y);
      const t2 = bs ? dst(bs.home.x, bs.home.y, r.x, r.y) / D.speed : 0;
      h += '<button class="pbtn" data-a="int" data-t="' + type + '"' + (rc && pk > 0 && G.phase === 'ops' ? '' : ' disabled') + '>' + tr('p.intercept') + ' ' + D.short + ' ×' + rc + (bs ? ' <small style="color:' + (t2 > eta ? C.red : C.dim) + '">' + Math.ceil(t2) + 's' + (t2 > eta ? ' ' + tr('p.late') : '') + '</small>' : '') + '<span class="pct">' + Math.round(pk * 100) + '%</span></button>';
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
  else if (a === 'restock') { const c = Math.round(r.def.restock * (1 - r.ammo / r.max)); if (G.credits >= c) { G.credits -= c; G.stats.spentCredits += c; r.ammo = r.max; r.low = false; log(tr('log.resupplied', { n: r.name })); } }
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
  if (UI.mode === 'place') g.valid = validPlace(g.x, g.y, SAM[UI.spec.id]);
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
    if (!ok && !g.valid) log(SAM[UI.spec.id].naval ? tr('log.badPosSea') : tr('log.badPos'), 'warn');
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
    if (!af) { log(tr('log.noCells', { a: D.short }), 'warn'); return false; }
    if (launchMission(af, m)) {
      const lbl = m.kind === 'int' ? tr('mis.int') + ' H-' + m.target.id : m.kind === 'strike' ? tr('mis.strike') + ' ' + m.site.name : m.kind.toUpperCase();
      log(af.label + ' (' + af.home.name + ') → ' + lbl);
      if (m.kind === 'strike') log(tr('log.prob', { p: Math.round(strikeP(D, m.site) * 100) }));
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
    if ('qwertyui'.includes(k) && k.length === 1 && ids['qwertyui'.indexOf(k)]) { const id = ids['qwertyui'.indexOf(k)], sp = cardRefs[id].spec; if (UI.spec && UI.spec.id === id && UI.mode !== 'idle') cancelMode(); else if (canArm(sp)) armMode(sp); return; }
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
    for (const co of MAP.countries) if (co.lab && !co.noLab) { c.fillStyle = co.s === 'f' ? 'rgba(120,190,255,.38)' : co.s === 'h' ? 'rgba(255,120,120,.42)' : 'rgba(150,170,185,.3)'; c.fillText(cname(co), co.lab[0], co.lab[1]); }
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
    const dead = a.hp <= 0, col = dead ? '#55606a' : cosCache.tint;
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
function navalSym(r, col) {   // buque de superficie: círculo (NTDS/APP-6) con silueta de casco
  ctx.beginPath(); ctx.arc(0, 0, r * .95, 0, 7); ctx.fillStyle = 'rgba(62,166,255,.2)'; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * .6, r * .1); ctx.lineTo(r * .6, r * .1); ctx.lineTo(r * .4, r * .4); ctx.lineTo(-r * .45, r * .4); ctx.closePath(); ctx.moveTo(-r * .1, r * .1); ctx.lineTo(-r * .1, -r * .35); ctx.lineTo(r * .15, -r * .35); ctx.lineTo(r * .15, r * .1); ctx.stroke();
}
function drawUnit(u) {
  const R = view.R, D = u.def, off = !isEmitting(u) && (D.radar || D.sensor);
  sym(u.x, u.y, () => {
    const bo = fontReady ? R * .85 : R * .8;
    if (off) ctx.globalAlpha = .45;
    if (D.naval) navalSym(R, cosCache.tint);
    else if (fontReady) ntdsGlyph(NT.landF, cosCache.tint, R * 2.0);
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
    if (known && (t.kind === 'cruise' || t.kind === 'ballistic' || t.kind === 'arm') || sel || !known || t.evasive) label(tag + (known && t.evasive ? '~' : '') + (t.lost ? ' ' + tr('lbl.noLock') : '') + (sel ? ' H-' + t.id : ''), 0, R * .5 + 12, known ? '#ff9a9a' : Y, 8);
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
      if (a.def.refuel) ring(a.x, a.y, a.def.refuel, C.green, [3, 4], .35, 1);
      if (a.def.radar >= 180) ring(a.x, a.y, a.def.radar, C.cyan, [2, 5], .28, 1);
    }
  }
  const rb = a.state === 'rtb' ? rtbBase(a) : null;
  if (rb) { const b = rb; ctx.save(); ctx.strokeStyle = 'rgba(160,190,210,.35)'; ctx.setLineDash([3 / view.s, 5 / view.s]); ctx.lineWidth = 1 / view.s; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); }
  trail(a, cosCache.trail);
  sym(a.x, a.y, () => {
    if (!fontReady) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Math.cos(a.hdg) * R * 1.1, Math.sin(a.hdg) * R * 1.1); ctx.lineTo(Math.cos(a.hdg) * R * 2.3, Math.sin(a.hdg) * R * 2.3); ctx.stroke(); }
    airSymbol(a.type, R, a.state === 'rtb' ? '#9fb7c8' : cosCache.tint, a.hdg);
    label(a.label, 0, R * .5 + 12, '#8fc3ee', 8);
    if (a.tank) { ctx.strokeStyle = C.green; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R * 1.7, 0, 7); ctx.stroke(); }
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
    sym(g.x, g.y, () => { ctx.globalAlpha = .85; if (D.naval) navalSym(view.R, col); else if (fontReady) ntdsGlyph(NT.landF, col, view.R * 2.0); else { frameGround(view.R, col); if (D.radar) glyphRadar(view.R, col); else glyphAD(view.R, col, AD_MOD[D.id]); } });
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
  if (G && G.zoom > 1.001 && G.hl) { const zx = G.hl.x * view.s + view.ox, zy = G.hl.y * view.s + view.oy; ctx.translate(zx, zy); ctx.scale(G.zoom, G.zoom); ctx.translate(-zx, -zy); }
  ctx.drawImage(bg, 0, 0, view.w, view.h);
  if (!G) return;
  { const wm = G.lv.weather, now = performance.now();
    if (wm === 'night') { ctx.fillStyle = 'rgba(2,6,22,.4)'; ctx.fillRect(0, 0, view.w, view.h); }
    else if (wm === 'fog') {
      ctx.fillStyle = 'rgba(165,185,200,.14)'; ctx.fillRect(0, 0, view.w, view.h);
      for (let i = 0; i < 4; i++) { const x = ((now * .012 * (i + 1) + i * 250) % (view.w + 400)) - 200, y = view.h * (.15 + .22 * i), g2 = ctx.createRadialGradient(x, y, 10, x, y, 170); g2.addColorStop(0, 'rgba(190,205,215,.2)'); g2.addColorStop(1, 'rgba(190,205,215,0)'); ctx.fillStyle = g2; ctx.fillRect(x - 170, y - 170, 340, 340); }
    } else if (wm === 'storm') { ctx.fillStyle = 'rgba(10,16,30,.28)'; ctx.fillRect(0, 0, view.w, view.h); }
  }
  ctx.save(); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s);
  const selU = G.sel && G.sel.kind === 'unit' ? G.sel.ref : null;
  // coberturas
  for (const u of G.units) {
    if (u.def.range && (SET.rings || u === selU)) ring(u.x, u.y, u.def.range, C.blue, [5, 5], u === selU ? .85 : .26, u === selU ? 1.6 : 1);
    if (u.def.radar && isEmitting(u)) ring(u.x, u.y, emRange(u), u.jam > 0 ? C.amber : C.cyan, [2, 5], u === selU ? .8 : .22, 1);
  }
  for (const b of G.assets) if (b.radar && b.hp > 0 && isEmitting(b)) ring(b.x, b.y, emRange(b), b.jam > 0 ? C.amber : C.cyan, [2, 5], .18, 1);
  for (const s of G.sites) if (s.alive) ring(s.x, s.y, SITE_AA, C.red, [2, 5], .25, 1);
  if (G.phase === 'prep') {   // ejes de amenaza (inteligencia previa)
    ctx.save(); ctx.setLineDash([4 / view.s, 7 / view.s]); ctx.lineWidth = 1 / view.s; ctx.strokeStyle = C.red;
    for (const st of G.sites) for (const a of G.assets) { ctx.globalAlpha = .05 + .45 * a.tw; ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(a.x, a.y); ctx.stroke(); }
    ctx.restore();
  }
  for (const c of G.craters) sym(c.x, c.y, () => {
    const r = view.R * 1.25; ctx.fillStyle = 'rgba(14,8,8,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,60,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .7, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,150,100,.5)'; ctx.beginPath(); ctx.moveTo(-r * .5, -r * .3); ctx.lineTo(r * .5, r * .3); ctx.moveTo(r * .5, -r * .3); ctx.lineTo(-r * .5, r * .3); ctx.stroke();
  });
  for (const s of G.sites) if (s.alive) drawSite(s);
  for (const a of G.assets) drawAsset(a);
  if (G.order) { const oa = G.order.asset; ring(oa.x, oa.y, view.R * 3.1 / view.s, C.amber, [5, 4], .55 + .25 * Math.sin(performance.now() / 250), 1.6); }
  for (const e of emitters()) if (e.jam > 0) ring(e.x, e.y, view.R * (1.8 + .3 * Math.sin(performance.now() / 60)) / view.s, C.red, [2, 3], .8, 1.4);
  if (G.victory && G.hl) sym(G.hl.x, G.hl.y, () => { bracket(view.R * 2.6); label('★ ' + tr('vic.best', { n: G.hl.name, hp: Math.round(G.hl.hp) }), 0, -view.R * 3.4, C.amber, 11); });
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
  if (FXS.pulse > 0) { const cp = capital(); if (cp) { ctx.save(); ctx.strokeStyle = 'rgba(53,208,127,' + (.75 * FXS.pulse) + ')'; ctx.lineWidth = 3 / view.s; ctx.beginPath(); ctx.arc(cp.x, cp.y, (1 - FXS.pulse) * 1400, 0, 7); ctx.stroke(); ctx.restore(); } }
  ctx.restore();
  if (G.lv.weather === 'storm') {
    const now = performance.now(); ctx.save(); ctx.strokeStyle = 'rgba(170,200,230,.28)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 70; i++) { const x = (i * 97 + now * .35) % (view.w + 60), y = (i * 53 + now * 1.4) % (view.h + 40); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 13); }
    ctx.stroke(); ctx.restore();
  }
  if (FXS.lt > 0) { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.fillStyle = 'rgba(220,232,255,' + (FXS.lt * .45) + ')'; ctx.fillRect(0, 0, view.w, view.h); }
  if (FXS.flash > 0) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    const gr = ctx.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * .3, view.w / 2, view.h / 2, Math.max(view.w, view.h) * .7);
    gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(1, 'rgba(255,40,40,' + FXS.flash + ')');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, view.w, view.h);
  }
  // oleada en curso
  if (G.phase === 'prep') { /* la píldora PREPARACIÓN del HUD ya lo indica */ } else if (G.speed === 0 && !G.over) {
    ctx.font = '600 12px ui-monospace,Consolas,monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,176,32,.9)';
    ctx.fillText(tr('pause.word'), view.w / 2, view.h - 10);
  }
}

/* ============================ PANTALLAS ============================ */
function showOverlay(html) { const o = $('#overlay'); o.innerHTML = '<div class="screen"><div class="box">' + html + '</div></div>'; o.classList.remove('hidden'); return o; }
function progress() { const s = saveGet(); s.stars = s.stars || {}; s.up = s.up || {}; s.cp = s.cp || 0; s.ach = s.ach || {}; s.life = s.life || {}; s.medals = s.medals || {}; s.rec = s.rec || {}; return s; }
function unlocked(n) { return n === 1 || (progress().stars[n - 1] > 0) || /[?&]unlock/.test(location.search); }
/* ============================ META: medallas, logros, récords, cosmética ============================ */
const SURG = .5, EAGLE = .55;   // umbrales de las medallas «Cirujano» (ratio coste) y «Ojo de águila» (detección temprana)
const MEDALS = [
  { id: 'flawless', pm: 6, avail: () => true, ok: s => s.leaked === 0 },
  { id: 'surgeon', pm: 6, avail: () => true, ok: s => s.kills >= 6 && s.value > 0 && s.spent / s.value <= SURG },
  { id: 'eagle', pm: 6, avail: () => true, ok: s => s.detN >= 6 && s.detSum / s.detN >= EAGLE },
  { id: 'silence', pm: 8, avail: lv => lv.n >= 4, ok: s => s.armLost >= 1 && !(s.leakKind && s.leakKind.arm) },
  { id: 'mettle', pm: 10, avail: lv => lv.diff && lv.diff !== 'normal', ok: () => true },
  { id: 'preempt', pm: 8, avail: lv => lv.waves.length >= 4, ok: s => s.earlySite }
];
const medalsFor = lv => MEDALS.filter(m => m.avail(lv));
function medalLive(m) {
  const s = G.stats;
  switch (m.id) {
    case 'flawless': return s.leaked > 0 ? 'fail' : 'pend';
    case 'silence': return s.leakKind && s.leakKind.arm ? 'fail' : s.armLost >= 1 ? 'ok' : 'pend';
    case 'preempt': return s.earlySite ? 'ok' : G.waveIdx > 2 ? 'fail' : 'pend';
    default: return m.ok(s) ? 'ok' : 'pend';
  }
}
const TL = () => Math.max(1, THEATERS.length);
const levelsOf = k => { const a = []; if (k < BASE_T) { for (let n = 1; n <= 12; n++) if ((n - 1) % Math.min(BASE_T, TL()) === k) a.push(n); } else for (let i = 0; i < 4; i++) a.push(13 + 4 * (k - BASE_T) + i); return a; };
const secured = (p, k) => levelsOf(k).every(n => p.stars[n] > 0);
const securedCount = p => { let c = 0; for (let k = 0; k < TL(); k++) if (secured(p, k)) c++; return c; };
const starsTotal = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
const medalCount = p => Object.values(p.medals).reduce((a, m) => a + Object.keys(m).length, 0);
function effLife(p) {   // contadores de por vida + el nivel en curso (para logros en directo)
  const L = Object.assign({ kills: 0, bal: 0, cruise: 0, drone: 0, arm: 0, armLost: 0, sites: 0, sorties: 0, cleanWaves: 0, won: 0, played: 0, flawless: 0, econ: 0, narrow: 0, bestStreak: 0, orders: 0, winVet: 0, winExp: 0, endW: 0 }, p.life);
  if (G && !G.over && !G.demo) {
    const s = G.stats; L.kills += s.kills; L.bal += s.killKind.ballistic || 0; L.armLost += s.armLost; L.sites += s.sitesKilled; L.cleanWaves += s.cleanWaves; L.bestStreak = Math.max(L.bestStreak, s.bestStreak);
  }
  return L;
}
const ACH = [
  { id: 'orders5', pm: 15, goal: 5, v: (p, L) => L.orders },
  { id: 'theaterAll', pm: 60, goal: TL(), v: p => securedCount(p) },
  { id: 'endless10', pm: 20, goal: 10, v: (p, L) => L.endW },
  { id: 'endless25', pm: 40, goal: 25, v: (p, L) => L.endW },
  { id: 'daily3', pm: 20, goal: 3, v: p => (p.daily && p.daily.done) || 0 },
  { id: 'special5', pm: 40, goal: 5, v: p => Object.keys(p.special || {}).length },
  { id: 'veteran', pm: 20, goal: 1, v: (p, L) => L.winVet + L.winExp },
  { id: 'expert', pm: 40, goal: 1, v: (p, L) => L.winExp },
  { id: 'first', pm: 10, goal: 1, v: (p, L) => L.won },
  { id: 'kills100', pm: 5, goal: 100, v: (p, L) => L.kills },
  { id: 'kills1000', pm: 30, goal: 1000, v: (p, L) => L.kills },
  { id: 'bal25', pm: 15, goal: 25, v: (p, L) => L.bal },
  { id: 'arm10', pm: 15, goal: 10, v: (p, L) => L.armLost },
  { id: 'sites20', pm: 15, goal: 20, v: (p, L) => L.sites },
  { id: 'flawless1', pm: 10, goal: 1, v: (p, L) => L.flawless },
  { id: 'flawless10', pm: 30, goal: 10, v: (p, L) => L.flawless },
  { id: 'econ', pm: 10, goal: 1, v: (p, L) => L.econ },
  { id: 'streak20', pm: 10, goal: 20, v: (p, L) => L.bestStreak },
  { id: 'clean25', pm: 15, goal: 25, v: (p, L) => L.cleanWaves },
  { id: 'narrow', pm: 10, goal: 1, v: (p, L) => L.narrow },
  { id: 'medals10', pm: 15, goal: 10, v: p => medalCount(p) },
  { id: 'medals25', pm: 30, goal: 25, v: p => medalCount(p) },
  { id: 'theater1', pm: 20, goal: 1, v: p => securedCount(p) },
  { id: 'theater3', pm: 40, goal: 3, v: p => securedCount(p) },
  { id: 'stars24', pm: 25, goal: 24, v: p => starsTotal(p) },
  { id: 'stars36', pm: 50, goal: 36, v: p => starsTotal(p) }
];
function checkAch(silent) {
  const p = progress(), L = effLife(p), out = [];
  for (const a of ACH) { if (p.ach[a.id]) continue; if (a.v(p, L) >= a.goal) { p.ach[a.id] = Date.now(); p.cp += a.pm; out.push(a); } }
  if (out.length) {
    savePut(p); refreshCos();
    if (!silent) { out.forEach(a => toast('🏆 ' + tr('ach.' + a.id + '.name') + ' · +' + a.pm + ' ' + tr('unit.pm'), 'ach')); SND.ach(); buzz(40); }
  }
  return out;
}
/* cosmética desbloqueable: estelas y tinte de los símbolos propios */
const COS = {
  trail: [{ id: 'blue', col: '#3ea6ff' }, { id: 'cyan', col: '#4fe0e8', lvl: 6 }, { id: 'amber', col: '#ffb020', ach: 'econ' }, { id: 'green', col: '#35d07f', ach: 'theater1' }, { id: 'white', col: '#e4f3ff', ach: 'stars24' }],
  tint: [{ id: 'blue', col: '#3ea6ff' }, { id: 'cyan', col: '#4fe0e8', lvl: 6 }, { id: 'aqua', col: '#3fe0b0', ach: 'flawless10' }, { id: 'violet', col: '#b69cff', ach: 'theater3' }]
};
const cosCache = { trail: '#3ea6ff', tint: '#3ea6ff', id: { trail: 'blue', tint: 'blue' } };
const cosOpen = (c, p) => (!c.lvl && !c.ach) || (c.lvl && p.stars[c.lvl] > 0) || (c.ach && p.ach[c.ach]);
function refreshCos() {
  const p = progress();
  for (const kind of ['trail', 'tint']) {
    const l = COS[kind], want = (SET.cos || {})[kind], c = l.find(x => x.id === want && cosOpen(x, p)) || l[0];
    cosCache[kind] = c.col; cosCache.id[kind] = c.id;
  }
}
/* resumen en prosa del parte de situación */
function sitrep(win, ig) {
  const kk = G.stats.killKind, parts = [];
  for (const k of ['drone', 'cruise', 'ballistic', 'arm']) if (kk[k]) parts.push(tr('sum.' + k, { n: kk[k] }));
  const sum = !parts.length ? tr('sum.none') : parts.length === 1 ? parts[0] : parts.slice(0, -1).join(', ') + tr('sum.and') + parts[parts.length - 1];
  const v = (G.n + G.stats.kills) % (win ? 3 : 2);
  return tr('sit.' + (win ? 'w' : 'l') + v, { city: capital().name, sum, ig, theater: tr('th.' + MAP.T.id + '.name') });
}
function unlockCards(n) {
  const nx = n + 1, c = [];
  if (nx > CAMP_N()) return c;
  for (const D of Object.values(SAM)) if (D.unlock === nx) c.push({ t: 'unit', name: D.name, desc: D.desc });
  for (const D of Object.values(AIR)) if (D.unlock === nx) c.push({ t: 'unit', name: D.name, desc: D.role });
  { const k = nx <= BASE_T ? nx - 1 : (nx >= 13 && (nx - 13) % 4 === 0 ? BASE_T + (nx - 13) / 4 : -1), T = THEATERS[k]; if (T && k < TL()) c.push({ t: 'theater', name: tr('th.' + T.id + '.name'), desc: tr('th.' + T.id + '.sub') }); }
  const thr = { 3: ['decoy'], 4: ['cruise', 'arm'], 6: ['ballistic'] }[nx];
  if (thr) thr.forEach(k => c.push({ t: 'threat', name: THREAT[k].name, desc: tr('thr.' + k + '.d') }));
  return c;
}
/* ============================ MODOS: Sin fin, Reto diario, Misiones especiales ============================ */
const SPECIALS = [
  { id: 'airOnly', L: 7, rule: 'airOnly', theater: 0, weather: 'clear', pm: 40 },
  { id: 'austerity', L: 8, rule: 'austerity', theater: 1, weather: 'night', pm: 45 },
  { id: 'storm', L: 9, rule: 'storm', theater: 2, weather: 'storm', pm: 50 },
  { id: 'swarm', L: 8, rule: 'swarm', theater: 3, weather: 'clear', pm: 45 },
  { id: 'rain', L: 10, rule: 'rain', theater: 4, weather: 'fog', pm: 55 }
];
const hashStr = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const dstr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayStr = () => { const m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search); return m ? m[1] : dstr(new Date()); };
const dayBefore = ds => { const d = new Date(ds + 'T12:00:00'); d.setDate(d.getDate() - 1); return dstr(d); };
function dailyConfig(date) {   // el mismo nivel para todo el mundo ese día: teatro, clima, regla, oleadas y rampas salen de la fecha
  const seed = hashStr('c2hell-' + date), r = mulberry(seed), pk = a => a[Math.floor(r() * a.length)];
  return { mode: 'daily', date, seed, L: 7 + Math.floor(r() * 6), theater: Math.floor(r() * TL()), weather: pk(['clear', 'night', 'fog', 'storm']), rule: r() < .45 ? pk(['austerity', 'storm', 'swarm', 'rain']) : null };
}
function endlessConfig() { const seed = (Math.random() * 1e9) | 0, r = mulberry(seed); return { mode: 'endless', seed, L: 7, theater: Math.floor(r() * TL()), weather: ['clear', 'night', 'fog', 'storm'][Math.floor(r() * 4)] }; }
function buildModeLevel(cfg) {
  if (cfg.mode === 'endless') {
    const lv = makeLevel(cfg.L || 7, { endless: true, theater: cfg.theater, weather: cfg.weather, seed: cfg.seed, name: () => tr('md.endless') });
    lv.waves.push(endlessWave(0, lv)); lv.waves.push(endlessWave(1, lv)); return lv;
  }
  if (cfg.mode === 'daily') return makeLevel(cfg.L, { theater: cfg.theater, weather: cfg.weather, rule: cfg.rule, seed: cfg.seed, name: () => tr('md.daily') + ' ' + cfg.date });
  const sp = SPECIALS.find(x => x.id === cfg.id);
  return makeLevel(sp.L, { theater: sp.theater, weather: sp.weather, rule: sp.rule, seed: 5150 + SPECIALS.indexOf(sp), name: () => tr('sp.' + sp.id + '.name') });
}
function endMode(win) {
  const s = G.stats, m = G.mode, p = progress(), ig = Math.round(integrity());
  const score = Math.round(s.kills * 10 + s.cleanWaves * 60 + (m === 'endless' ? G.waveIdx * 40 : win ? 500 + ig * 8 : 0));
  let pm = Math.floor(s.kills / 8), rank = 0, first = false, newBest = false;
  const L = p.life, add = (k, v) => { L[k] = (L[k] || 0) + v; };
  add('played', 1); add('kills', s.kills); add('bal', s.killKind.ballistic || 0); add('cruise', s.killKind.cruise || 0); add('drone', s.killKind.drone || 0); add('arm', s.killKind.arm || 0);
  add('armLost', s.armLost); add('sites', s.sitesKilled); add('sorties', s.sorties); add('cleanWaves', s.cleanWaves); add('orders', s.ordersOk); L.bestStreak = Math.max(L.bestStreak || 0, s.bestStreak);
  if (m === 'endless') {
    const e = p.endless = p.endless || { top: [] }, ent = { s: score, w: G.waveIdx, d: todayStr(), th: G.lv.theater };
    newBest = !e.top.length || score > e.top[0].s; e.top.push(ent); e.top.sort((a, b) => b.s - a.s); rank = e.top.indexOf(ent) + 1; e.top = e.top.slice(0, 5); if (rank > 5) rank = 0;
    L.endW = Math.max(L.endW || 0, G.waveIdx); pm += Math.floor(G.waveIdx * 1.5);
  } else if (m === 'daily') {
    const d = p.daily = p.daily || { days: {}, streak: 0, done: 0 }, key = G.cfg.date, prev = d.days[key];
    if (win) { first = !prev || !prev.win; if (first) { pm += 30; d.streak = d.last === dayBefore(key) ? (d.streak || 0) + 1 : 1; d.last = key; d.done = (d.done || 0) + 1; } newBest = !prev || !prev.win || score > prev.score; }
    if (!prev || score > prev.score || (win && !prev.win)) d.days[key] = { win: win || (prev && prev.win) || false, score: Math.max(score, prev ? prev.score : 0), ig };
    if (win) pm += 15;
  } else {
    const sp = p.special = p.special || {}, id = G.cfg.id, def = SPECIALS.find(x => x.id === id), prev = sp[id];
    if (win) { first = !prev; if (first) pm += def.pm; newBest = !prev || score > prev.score; sp[id] = { score: Math.max(score, prev ? prev.score : 0), ig: Math.max(ig, prev ? prev.ig : 0) }; pm += 10; }
  }
  pm = Math.round(pm * (DIFF[G.lv.diff] || DIFF.normal).pm * (G.lv.pmMul || 1));
  p.cp += pm; savePut(p);
  const ach = checkAch(true), data = { win, m, score, pm, ig, rank, first, newBest, ach, waves: G.waveIdx };
  if (G.tut) endTut();
  if (win) startVictory(data, () => showModeEnd(data)); else { SND.lose(); buzz(120); VO.say('lose', null, true, 500); setTimeout(() => showModeEnd(data), 900); }
}
function showModeEnd(d) {
  const s = G.stats, p = progress(), e = p.endless;
  const head = d.m === 'endless' ? tr('end.lose') : d.win ? tr('end.win') : tr('end.lose');
  const top = d.m === 'endless' && e ? '<div class="tips"><b>' + tr('md.top') + '</b><ul>' + e.top.map((x, i) => '<li' + (d.rank === i + 1 ? ' class="amber"' : '') + '>#' + (i + 1) + ' · ' + x.s + ' pts · ' + tr('md.waveN', { n: x.w }) + ' · ' + x.d + '</li>').join('') + '</ul></div>' : '';
  const tags = (d.newBest ? '<div class="tag gold rv">' + tr('md.newBest') + '</div>' : '') + (d.m === 'daily' && d.first ? '<div class="tag rec rv">' + tr('md.dailyDone') + '<small>' + tr('md.streak', { n: (p.daily || {}).streak || 1 }) + '</small></div>' : '') + (d.m === 'special' && d.first ? '<div class="tag rec rv">' + tr('md.specialDone') + '</div>' : '');
  const ach = d.ach.length ? '<div class="unls rv">' + d.ach.map(a => '<div class="unl gold"><span class="nb">🏆 ' + tr('end.achNew') + '</span><b>' + tr('ach.' + a.id + '.name') + '</b><small>' + tr('ach.' + a.id + '.d') + ' · +' + a.pm + ' ' + tr('unit.pm') + '</small></div>').join('') + '</div>' : '';
  const o = showOverlay('<h2 class="stamp ' + (d.win ? 'win' : 'lose') + '">' + head + '</h2><div class="tags">' + tags + '</div><div class="kv"><span>' + tr('md.score') + '</span><span class="amber">' + d.score + '</span>' +
    (d.m === 'endless' ? '<span>' + tr('md.waves') + '</span><span>' + d.waves + '</span>' : '') +
    '<span>' + tr('end.pm') + '</span><span class="amber">+' + d.pm + ' ' + tr('unit.pm') + '</span><span>' + tr('end.integ') + '</span><span>' + d.ig + '%</span><span>' + tr('end.kills') + '</span><span>' + s.kills + '</span><span>' + tr('end.leaked') + '</span><span>' + s.leaked + '</span><span>' + tr('pz.time') + '</span><span>' + mmss(G.t) + '</span></div>' + top + ach +
    '<div class="endbtns">' + (!d.win && RP.buf.length >= 8 ? '<button class="big" data-a="replay">' + tr('rp.btn') + '</button>' : '') + '<button class="big go" data-a="retry">' + tr('end.retry') + '</button><button class="big" data-a="modes">' + tr('md.title') + '</button><button class="big" data-a="menu">' + tr('back.menu') + '</button></div>');
  const cfg = G.cfg;
  $('[data-a=retry]', o).onclick = () => newGame(G.n, d.m === 'endless' ? endlessConfig() : cfg);
  $('[data-a=modes]', o).onclick = showModes; $('[data-a=menu]', o).onclick = showMenu; if ($('[data-a=replay]', o)) $('[data-a=replay]', o).onclick = () => startReplay(() => showModeEnd(d));
}
function showModeBrief(cfg) {
  const lv = buildModeLevel(cfg), p = progress();
  const diffSeg = '<div class="opt"><span>' + tr('br.diff') + '</span><div class="seg">' + ['normal', 'veteran', 'expert'].map(d => '<button class="pbtn' + (SET.diff === d ? ' sel' : '') + '" data-d="' + d + '">' + tr('diff.' + d) + '</button>').join('') + '</div></div>';
  const T = THEATERS[lv.theater], rule = lv.rule ? '<span>' + tr('md.rule') + '</span><span class="amber">' + tr('rule.' + lv.rule + '.n') + '</span>' : '';
  const ruleD = lv.rule ? '<p class="sub">' + tr('rule.' + lv.rule + '.d') + '</p>' : '';
  const e = p.endless;
  const extra = cfg.mode === 'endless' ? '<p>' + tr('md.endless.long') + '</p>' + (e && e.top.length ? '<div class="kv"><span>' + tr('md.best') + '</span><span class="amber">' + e.top[0].s + ' · ' + tr('md.waveN', { n: e.top[0].w }) + '</span></div>' : '') :
    cfg.mode === 'daily' ? '<p>' + tr('md.daily.long') + '</p>' : '<p>' + tr('sp.' + cfg.id + '.d') + '</p>';
  const o = showOverlay('<h2>' + lv.name.toUpperCase() + '</h2>' + extra +
    '<div class="kv"><span>' + tr('br.theater') + '</span><span>' + tr('th.' + T.id + '.name') + '</span><span>' + tr('br.weather') + '</span><span>' + tr(lv.weather === 'clear' ? 'wx.clear' : 'wx.' + lv.weather) + '</span>' + rule +
    (cfg.mode === 'endless' ? '' : '<span>' + tr('br.waves') + '</span><span>' + lv.waves.length + '</span>') + '<span>' + tr('br.credits') + '</span><span>' + lv.credits + '</span></div>' + ruleD + diffSeg +
    '<button class="big go" data-a="go">' + tr('br.go') + '</button><button class="big" data-a="back">' + tr('br.back') + '</button>');
  $('[data-a=go]', o).onclick = () => newGame(lv.n, cfg); $('[data-a=back]', o).onclick = showModes;
  $$('[data-d]', o).forEach(b => b.onclick = () => { SET.diff = b.dataset.d; saveSet(); showModeBrief(cfg); });
}
function showModes() {
  const p = progress(), e = p.endless || { top: [] }, d = p.daily || { days: {}, streak: 0 }, today = todayStr(), dd = d.days[today], sp = p.special || {};
  const dc = dailyConfig(today), liveStreak = d.last === today || d.last === dayBefore(today) ? d.streak || 0 : 0;
  const card = (m, cls, t, desc, meta) => '<button class="big mcard ' + cls + '" data-m="' + m + '"><b>' + t + '</b><small>' + desc + '</small><em>' + meta + '</em></button>';
  let h = '<h2>' + tr('md.title') + '</h2>' +
    card('endless', 'go', tr('md.endless'), tr('md.endless.d'), e.top.length ? tr('md.best') + ': ' + e.top[0].s + ' · ' + tr('md.waveN', { n: e.top[0].w }) : tr('md.none')) +
    card('daily', '', tr('md.daily') + ' · ' + today, tr('md.daily.d'), (dd && dd.win ? '✔ ' + tr('md.done') + ' · ' + dd.score + ' pts' : tr('md.todo')) + ' · ' + tr('md.streak', { n: liveStreak })) +
    '<div class="sub">' + tr('md.special') + '</div>' + SPECIALS.map(x => card('sp:' + x.id, '', (sp[x.id] ? '✔ ' : '◇ ') + tr('sp.' + x.id + '.name'), tr('sp.' + x.id + '.d'), sp[x.id] ? tr('md.best') + ': ' + sp[x.id].score + ' pts' : '+' + x.pm + ' ' + tr('unit.pm'))).join('');
  const o = showOverlay(h + '<button class="big" data-a="back">' + tr('back.menu') + '</button>');
  $$('[data-m]', o).forEach(b => b.onclick = () => { const m = b.dataset.m; showModeBrief(m === 'endless' ? endlessConfig() : m === 'daily' ? dc : { mode: 'special', id: m.slice(3) }); });
  $('[data-a=back]', o).onclick = showMenu;
}
function showMenu() {
  if (G) { G.speed = 0; }
  const o = showOverlay('<h1 class="title">C2<em>HELL</em></h1><div class="tag">AIR DEFENSE COMMAND &amp; CONTROL — LITE SIM</div>' +
    '<button class="big go" data-a="camp">' + tr('m.camp') + '</button><button class="big" data-a="modes">' + tr('m.modes') + '</button><button class="big" data-a="ach">' + tr('m.ach', { a: Object.keys(progress().ach).length, b: ACH.length }) + '</button><button class="big" data-a="help">' + tr('m.help') + '</button><button class="big" data-a="set">' + tr('m.set') + '</button>' + (G && !G.over && !G.demo ? '<button class="big" data-a="resume">' + tr('m.resume') + '</button>' : ''));
  $('[data-a=camp]', o).onclick = showLevels; $('[data-a=modes]', o).onclick = showModes; $('[data-a=ach]', o).onclick = () => showAch(showMenu); $('[data-a=help]', o).onclick = () => showHelp(showMenu); $('[data-a=set]', o).onclick = () => showSettings(showMenu);
  const r = $('[data-a=resume]', o); if (r) r.onclick = () => o.classList.add('hidden');
}
function drawMini(cv2, T, st) {
  const c = cv2.getContext('2d'), W = cv2.width, H = cv2.height, sx = W / 1000, sy = H / 600;
  const pr = (lat, lon) => [(500 + (lon - T.lonC) * T.kx) * sx, (300 - (lat - T.latC) * T.ky) * sy];
  c.fillStyle = '#09141d'; c.fillRect(0, 0, W, H);
  const col = { f: ['#16384c', 'rgba(62,166,255,.8)'], h: ['#271a1d', 'rgba(255,90,90,.5)'], n: ['#161e24', 'rgba(140,160,175,.3)'] };
  if (st === 'sec') { col.f = ['#1d4f6e', 'rgba(110,200,255,.95)']; col.h = ['#0f0a0c', 'rgba(110,60,60,.35)']; }
  if (st === 'lock') { col.f = ['#12181e', 'rgba(110,125,135,.35)']; col.h = ['#14171a', 'rgba(110,100,100,.3)']; col.n = ['#101519', 'rgba(110,125,135,.2)']; }
  c.lineJoin = 'round';
  for (const co of T.countries) {
    const [f, s] = col[co.s]; c.fillStyle = f; c.strokeStyle = s; c.lineWidth = 1.2;
    for (const r of co.r) { c.beginPath(); r.forEach((q, i) => { const p = pr(q[1], q[0]); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); c.fill(); c.stroke(); }
  }
  for (const q of T.sites) {
    const p = pr(q[0], q[1]); c.strokeStyle = st === 'sec' ? 'rgba(150,110,110,.7)' : st === 'lock' ? 'rgba(130,120,120,.5)' : '#ff5a5a'; c.lineWidth = 1.6; c.beginPath();
    if (st === 'sec') { c.moveTo(p[0] - 4, p[1] - 4); c.lineTo(p[0] + 4, p[1] + 4); c.moveTo(p[0] + 4, p[1] - 4); c.lineTo(p[0] - 4, p[1] + 4); }
    else { c.moveTo(p[0], p[1] - 5); c.lineTo(p[0] + 5, p[1]); c.lineTo(p[0], p[1] + 5); c.lineTo(p[0] - 5, p[1]); c.closePath(); }
    c.stroke();
  }
}
function showLevels() {
  const p = progress();
  let h = '<h2>' + tr('lv.title') + '</h2><div class="kv"><span>' + tr('lv.cp') + '</span><span class="amber">' + p.cp + ' ' + tr('unit.pm') + '</span><span>' + tr('lv.stars') + '</span><span>' + starsTotal(p) + '/' + (CAMP_N() * 3) + '</span><span>' + tr('lv.medals') + '</span><span>' + medalCount(p) + '</span></div>' +
    '<div class="row3"><button class="big" data-a="upg">' + tr('camp.upg') + '</button><button class="big" data-a="ach">' + tr('camp.ach', { a: Object.keys(p.ach).length, b: ACH.length }) + '</button><button class="big" data-a="cos">' + tr('camp.cos') + '</button></div>';
  const nodePos = [];
  for (let k = 0; k < TL(); k++) {
    const T = THEATERS[k], lvls = levelsOf(k), done = lvls.filter(n => p.stars[n] > 0).length, sec = done === lvls.length, lock = !unlocked(lvls[0]);
    const pos = lvls.map((n, i) => { const a = T.assets[i % T.assets.length]; return [(500 + (a.lon - T.lonC) * T.kx) / 10, (300 - (a.lat - T.latC) * T.ky) / 6]; });
    const kx = 3.87, ky = 2.32;   // % → px aproximado de la tarjeta (ancho ≈ 387 px, alto ≈ 232 px)
    for (let it = 0; it < 60; it++) for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {   // separa nodos solapados
      const dx = (pos[j][0] - pos[i][0]) * kx, dy = (pos[j][1] - pos[i][1]) * ky, d = Math.hypot(dx, dy) || .01;
      if (d < 54) { const f = (54 - d) / 2 / d; pos[i][0] -= dx * f / kx; pos[j][0] += dx * f / kx; pos[i][1] -= dy * f / ky; pos[j][1] += dy * f / ky; }
      for (const q of [pos[i], pos[j]]) { q[0] = clamp(q[0], 8, 92); q[1] = clamp(q[1], 14, 84); }
    }
    nodePos.push(pos);
    const nodes = lvls.map((n, i) => {
      const s = p.stars[n] || 0, open = unlocked(n), x = clamp(pos[i][0], 8, 92), y = clamp(pos[i][1], 12, 86);
      return '<button class="nd ' + (s ? 'done' : open ? 'open' : 'lock') + '" data-n="' + n + '"' + (open ? '' : ' disabled') + ' style="left:' + x + '%;top:' + y + '%">' + n + '<small>' + '★'.repeat(s) + '☆'.repeat(3 - s) + '</small></button>';
    }).join('');
    h += '<div class="thc ' + (sec ? 'sec' : lock ? 'lock' : '') + '"><div class="thh"><b>' + tr('th.' + T.id + '.name') + '</b><small>' + tr('th.' + T.id + '.sub') + '</small><span class="bdg">' + (sec ? '✪ ' + tr('camp.secured') : done + '/' + lvls.length) + '</span></div><div class="thm"><canvas width="600" height="360" data-k="' + k + '"></canvas>' + nodes + '</div></div>';
  }
  const o = showOverlay(h + '<button class="big" data-a="back">' + tr('back.menu') + '</button>');
  $$('canvas[data-k]', o).forEach(c2 => { const k = +c2.dataset.k, lvls = levelsOf(k); drawMini(c2, THEATERS[k], lvls.every(n => p.stars[n] > 0) ? 'sec' : !unlocked(lvls[0]) ? 'lock' : ''); });
  $$('.nd', o).forEach(b => b.onclick = () => showBrief(+b.dataset.n));
  $('[data-a=back]', o).onclick = showMenu;
  $('[data-a=upg]', o).onclick = () => showUpgrades(showLevels);
  $('[data-a=ach]', o).onclick = () => showAch(showLevels);
  $('[data-a=cos]', o).onclick = () => showCosmetics(showLevels);
}
function showAch(back) {
  const p = progress(), L = effLife(p);
  let h = '<h2>' + tr('ach.title') + '</h2><div class="kv"><span>' + tr('ach.unlocked') + '</span><span class="amber">' + Object.keys(p.ach).length + '/' + ACH.length + '</span></div>';
  for (const a of ACH) {
    const got = p.ach[a.id], v = Math.min(a.goal, Math.floor(a.v(p, L)));
    h += '<div class="achr' + (got ? ' got' : '') + '"><div class="ai">' + (got ? '🏆' : '○') + '</div><div class="at"><b>' + tr('ach.' + a.id + '.name') + '</b><div class="sub">' + tr('ach.' + a.id + '.d') + '</div>' +
      (got ? '' : pb(v, a.goal, '#35d07f') + '<div class="sub">' + v + ' / ' + a.goal + '</div>') + '</div><div class="ar amber">+' + a.pm + ' ' + tr('unit.pm') + '</div></div>';
  }
  const o = showOverlay(h + '<button class="big" data-a="back">' + tr('back') + '</button>');
  $('[data-a=back]', o).onclick = back || showMenu;
}
function showCosmetics(back) {
  const p = progress();
  let h = '<h2>' + tr('cos.title') + '</h2>';
  for (const kind of ['trail', 'tint']) {
    h += '<div class="sub" style="margin-top:12px">' + tr('cos.' + kind) + '</div><div class="swatches">';
    for (const c of COS[kind]) {
      const open = cosOpen(c, p);
      h += '<button class="sw' + (cosCache.id[kind] === c.id ? ' sel' : '') + (open ? '' : ' lock') + '" data-k="' + kind + '" data-id="' + c.id + '"' + (open ? '' : ' disabled') + ' style="--c:' + c.col + '"><i></i><small>' +
        (open ? tr('cos.c.' + c.id) : '🔒 ' + (c.lvl ? tr('cos.reqLvl', { n: c.lvl }) : tr('cos.reqAch', { a: tr('ach.' + c.ach + '.name') }))) + '</small></button>';
    }
    h += '</div>';
  }
  const o = showOverlay(h + '<button class="big" style="margin-top:16px" data-a="back">' + tr('back') + '</button>');
  $$('.sw', o).forEach(b => b.onclick = () => { SET.cos = SET.cos || {}; SET.cos[b.dataset.k] = b.dataset.id; saveSet(); refreshCos(); showCosmetics(back); });
  $('[data-a=back]', o).onclick = back || showMenu;
}
function showUpgrades(back) {
  const p = progress();
  let h = '<h2>' + tr('upg.title') + '</h2><div class="kv"><span>' + tr('lv.cp') + '</span><span class="amber">' + p.cp + ' ' + tr('unit.pm') + '</span></div>';
  for (const u of UPG) {
    const lv = p.up[u.id] || 0, cost = u.cost * (lv + 1), maxed = lv >= u.max;
    h += '<div class="up"><div><b>' + u.name + '</b> <span class="amber">' + '■'.repeat(lv) + '<span style="opacity:.25">' + '■'.repeat(u.max - lv) + '</span></span><div class="sub">' + u.desc + '</div></div>' +
      '<button class="pbtn" style="width:auto;min-width:82px;margin:0" data-u="' + u.id + '"' + (maxed || p.cp < cost ? ' disabled' : '') + '>' + (maxed ? tr('upg.max') : cost + ' ' + tr('unit.pm')) + '</button></div>';
  }
  const o = showOverlay(h + '<button class="big" data-a="back">' + tr('back') + '</button>');
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
  const got = progress().medals[n] || {};
  const diffSeg = '<div class="opt"><span>' + tr('br.diff') + '</span><div class="seg">' + ['normal', 'veteran', 'expert'].map(d => '<button class="pbtn' + (SET.diff === d ? ' sel' : '') + '" data-d="' + d + '">' + tr('diff.' + d) + '</button>').join('') + '</div></div>';
  const mdl = '<div class="mdl"><b>' + tr('br.medals') + '</b>' + medalsFor(lv).map(m => '<div class="mrow' + (got[m.id] ? ' got' : '') + '"><span>' + (got[m.id] ? '✔ ' : '◇ ') + tr('medal.' + m.id) + ' <small>' + tr('medal.' + m.id + '.d') + '</small></span><span class="amber">+' + m.pm + '</span></div>').join('') + '</div>';
  const rows = [[tr('br.uas'), c.drone + c.decoy], [tr('br.cruise'), c.cruise], [tr('br.bal'), c.ballistic], [tr('br.arm'), c.arm]].filter(r => r[1] > 0)
    .map(r => '<span>' + r[0] + '</span><span>' + r[1] + '</span>').join('');
  const o = showOverlay('<h2>' + tr('br.title', { n, name: lv.name.toUpperCase() }) + '</h2><p>' + tr('br.intro') + '</p>' +
    '<div class="kv"><span>' + tr('br.theater') + '</span><span>' + (THEATERS[lv.theater] ? tr('th.' + THEATERS[lv.theater].id + '.name') : '') + '</span><span>' + tr('br.dur') + '</span><span>' + mmss(est) + '</span><span>' + tr('br.waves') + '</span><span>' + lv.waves.length + '</span><span>' + tr('br.sites') + '</span><span>' + lv.nSites + '</span><span>' + tr('br.credits') + '</span><span>' + lv.credits + '</span><span>' + tr('br.weather') + '</span><span>' + tr(lv.weather === 'clear' ? 'wx.clear' : 'wx.' + lv.weather) + '</span>' + rows + '</div>' + (lv.weather !== 'clear' ? '<p class="sub">' + tr('wx.' + lv.weather + '.d') + '</p>' : '') + diffSeg +
    mdl + '<p class="sub">' + tr('br.phases') + '</p>' +
    '<button class="big go" data-a="go">' + tr('br.go') + '</button><button class="big" data-a="back">' + tr('br.back') + '</button>');
  $('[data-a=go]', o).onclick = () => newGame(n); $('[data-a=back]', o).onclick = showLevels;
  $$('[data-d]', o).forEach(b => b.onclick = () => { SET.diff = b.dataset.d; saveSet(); showBrief(n); });
}
function showHelp(back) {
  const o = showOverlay('<h2>' + tr('help.title') + '</h2><ul>' + [1, 2, 3, 4, 5, 6, 7, 8].map(i => '<li>' + tr('help.' + i, { b: C.blue, r: C.red, y: Y }) + '</li>').join('') + '</ul>' +
    '<div class="legend" id="lg"></div><button class="big" data-a="back">' + tr('back.menu') + '</button>');
  buildLegend($('#lg', o));
  $('[data-a=back]', o).onclick = back || showMenu;
}
function buildLegend(box) {
  const g = (ch, col, k) => () => ntdsGlyph(ch, col, 24 * (k || 1));
  const items = fontReady ? [
    [tr('leg.1'), g(NT.airF, C.blue)],
    [tr('leg.2'), g(NT.airF + hdgChar(0.6), C.blue)],
    [tr('leg.3'), g(NT.airE, C.red)],
    [tr('leg.4'), g(NT.misE, C.red)],
    [tr('leg.5'), g(NT.airU, Y)],
    [tr('leg.6'), g(NT.landF, C.blue)],
    [tr('leg.7'), g(NT.cmdF, C.blue, 1.15)],
    [tr('leg.8'), g(NT.landF, C.blue, 1.15)],
    [tr('leg.9'), g(NT.landE, C.red)]
  ] : [
    [tr('leg.f1'), () => airSymbol('f16', 10, '#e4f3ff')], [tr('leg.f2'), () => airSymbol('e2', 10, '#e4f3ff')], [tr('leg.f3'), () => airSymbol('mq9', 10, '#e4f3ff')],
    [tr('leg.f4'), () => { frameHostileAir(10); ctx.save(); ctx.translate(0, 1); glyphUAV(8.5, '#ffd0d0'); ctx.restore(); }],
    [tr('leg.f5'), () => { frameHostileAir(10); ctx.save(); ctx.translate(0, 1); glyphMissile(8.5, '#ffd0d0'); ctx.restore(); }],
    [tr('leg.f6'), () => frameUnknownAir(10)],
    [tr('leg.f7'), () => { frameGround(10, C.blue); glyphAD(10, C.blue, 'S'); }],
    [tr('leg.f8'), () => { frameGround(10, C.blue); glyphRadar(10, C.blue); }],
    [tr('leg.f9'), () => { frameGround(10, C.blue, 1.15, true); glyphFighter(10, C.blue); }],
    [tr('leg.f10'), () => { ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(11, 0); ctx.lineTo(0, 11); ctx.lineTo(-11, 0); ctx.closePath(); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.stroke(); glyphMissile(8, C.red); }]
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
    armed = true; btn.innerHTML = txt || tr('confirm'); btn.style.borderColor = C.red;
    setTimeout(() => { armed = false; btn.innerHTML = old; btn.style.borderColor = ''; }, 3000);
  };
}
function showPause() {
  if (!G || G.demo || G.over) { showMenu(); return; }
  const was = G.speed; if (was > 0) resumeSpeed = was; setSpeed(0);
  const o = showOverlay('<h2>' + tr('pz.title') + '</h2><div class="kv"><span>' + tr('pz.level') + '</span><span>' + G.n + ' — ' + G.lv.name + '</span><span>' + tr('pz.time') + '</span><span>' + mmss(G.t) + '</span><span>' + tr('p.integrity') + '</span><span>' + Math.round(integrity()) + '%</span><span>' + tr('pz.credits') + '</span><span>' + Math.floor(G.credits) + '</span></div>' +
    '<div class="mdl"><b>' + tr('br.medals') + '</b>' + medalsFor(G.lv).map(m => { const sv = medalLive(m); return '<div class="mrow ' + sv + '"><span>' + (sv === 'ok' ? '✔ ' : sv === 'fail' ? '✕ ' : '○ ') + tr('medal.' + m.id) + '</span><span class="amber">+' + m.pm + '</span></div>'; }).join('') + '</div>' +
    '<button class="big go" data-a="res">' + tr('pz.resume') + '</button><button class="big" data-a="restart">' + tr('pz.restart') + '</button><button class="big" data-a="set">' + tr('m.set') + '</button><button class="big" data-a="help">' + tr('m.help') + '</button><button class="big" data-a="quit">' + tr('pz.quit') + '</button>');
  const back = () => showPause();
  $('[data-a=res]', o).onclick = () => { o.classList.add('hidden'); if (was > 0) setSpeed(resumeSpeed); };
  $('[data-a=set]', o).onclick = () => { G.speed = 0; showSettings(() => { o.classList.add('hidden'); showPauseKeep(was); }); };
  $('[data-a=help]', o).onclick = () => showHelp(() => showPauseKeep(was));
  confirmBtn($('[data-a=restart]', o), () => newGame(G.n, G.cfg));
  confirmBtn($('[data-a=quit]', o), () => { G.demo = false; showLevels(); });
}
let resumeSpeed = 1;
function showPauseKeep(was) { if (was > 0) resumeSpeed = was; G.speed = was; showPause(); }
function showSettings(back) {
  const onoff = (k, name) => '<div class="opt"><span>' + name + '</span><button class="pbtn" data-k="' + k + '">' + (SET[k] ? tr('set.on') : tr('set.off')) + '</button></div>';
  const seg = [[.85, 'S'], [1, 'M'], [1.25, 'L']].map(([v, l]) => '<button class="pbtn' + (SET.scale === v ? ' sel' : '') + '" data-sc="' + v + '">' + l + '</button>').join('');
  const langSeg = I18N.langs.map(l => '<button class="pbtn' + (I18N.lang === l.code ? ' sel' : '') + '" data-lang="' + l.code + '">' + l.name + '</button>').join('');
  const diffSeg = ['normal', 'veteran', 'expert'].map(d => '<button class="pbtn' + (SET.diff === d ? ' sel' : '') + '" data-d="' + d + '">' + tr('diff.' + d) + '</button>').join('');
  const o = showOverlay('<h2>' + tr('set.title') + '</h2><div class="opt"><span>' + tr('set.diff') + '</span><div class="seg">' + diffSeg + '</div></div><div class="opt"><span>' + tr('set.lang') + '</span><div class="seg">' + langSeg + '</div></div>' + onoff('snd', tr('set.snd')) + onoff('vib', tr('set.vib')) + onoff('rings', tr('set.rings')) +
    '<div class="opt"><span>' + tr('set.scale') + '</span><div class="seg">' + seg + '</div></div>' + onoff('music', tr('set.music')) + onoff('voice', tr('set.voice')) + onoff('cb', tr('set.cb')) + onoff('ap', tr('set.ap')) +
    '<div class="opt"><span>' + tr('set.ui') + '</span><div class="seg">' + [[1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, l]) => '<button class="pbtn' + (SET.ui === v ? ' sel' : '') + '" data-ui="' + v + '">' + l + '</button>').join('') + '</div></div>' +
    '<button class="big" data-a="fs">' + tr('set.fs') + '</button><button class="big" data-a="tut">' + tr('set.tut') + '</button><button class="big" data-a="reset">' + tr('set.reset') + '</button><button class="big" data-a="back">' + tr('back') + '</button>');
  $$('[data-d]', o).forEach(b => b.onclick = () => { SET.diff = b.dataset.d; saveSet(); showSettings(back); });
  $$('[data-lang]', o).forEach(b => b.onclick = () => { I18N.setLang(b.dataset.lang); showSettings(back); });
  $$('[data-k]', o).forEach(b => b.onclick = () => { const k = b.dataset.k; SET[k] = !SET[k]; if (k === 'snd') { SND.on = SET.snd; SND.init(); } if (k === 'voice' && !SET.voice && window.speechSynthesis) speechSynthesis.cancel(); applyA11y(); saveSet(); showSettings(back); });
  $$('[data-ui]', o).forEach(b => b.onclick = () => { SET.ui = +b.dataset.ui; applyA11y(); saveSet(); showSettings(back); });
  $$('[data-sc]', o).forEach(b => b.onclick = () => { SET.scale = +b.dataset.sc; saveSet(); resize(); showSettings(back); });
  $('[data-a=fs]', o).onclick = toggleFS;
  $('[data-a=tut]', o).onclick = () => { SET.tutDone = false; saveSet(); const t = $('[data-a=tut]', o); t.textContent = tr('set.tutDone'); };
  confirmBtn($('[data-a=reset]', o), () => { const keep = { set: SET }; savePut(keep); SET.tutDone = false; saveSet(); showSettings(back); }, tr('set.resetConfirm'));
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
  if (s.blind >= 3) t.push(tr('tip.blind'));
  if ((lk.ballistic || 0) > 0 && !G.units.some(u => u.def.id === 'bmd' || u.def.id === 'mrad')) t.push(tr('tip.bal'));
  if ((lk.arm || 0) > 0) t.push(tr('tip.arm'));
  if (s.dry > 0) t.push(tr('tip.dry', { n: s.dry }));
  if (!s.strikes && G.n >= 3) t.push(tr('tip.strike'));
  if (s.airLost > 1) t.push(tr('tip.air', { n: s.airLost }));
  if (!win && !t.length) t.push(tr('tip.lose'));
  if (win && st < 3 && !t.length) t.push(tr('tip.stars'));
  return t.slice(0, 2);
}
function endLevel(win) {
  G.over = true; setSpeed(0);
  if (G.mode && G.mode !== 'camp') return endMode(win);
  const s = G.stats, lv = G.lv, n = G.n;
  const ig = Math.round(integrity()), st = win ? (ig >= 90 ? 3 : ig >= 65 ? 2 : 1) : 0;
  const ratio = s.value > 0 ? s.spent / s.value : 0;
  const econ = win && s.kills >= 6 && ratio <= SURG;
  const p = progress(), firstWin = win && !p.stars[n];
  const got = (p.medals[n] = p.medals[n] || {});
  const medals = medalsFor(lv).map(m => { const ok = win && m.ok(s, lv), isNew = ok && !got[m.id]; if (isNew) got[m.id] = 1; return { m, ok, isNew }; });
  const medalPM = medals.reduce((a, x) => a + (x.isNew ? x.m.pm : 0), 0);
  const pm = Math.round(((win ? 15 + 10 * st + (firstWin ? 15 : 0) : 0) + Math.floor(s.kills / 8)) * (DIFF[lv.diff] || DIFF.normal).pm) + medalPM;
  // récords por nivel
  const recs = [];
  if (win) {
    const prev = p.rec[n], nr = Object.assign({}, prev || {}), rat = s.kills >= 6 ? Math.round(ratio * 100) / 100 : null, tm = Math.round(G.t);
    if (!prev || ig > prev.ig) { if (prev) recs.push({ k: 'ig', a: ig + '%', b: prev.ig + '%' }); nr.ig = ig; }
    if (rat !== null && (prev == null || prev.ratio == null || rat < prev.ratio)) { if (prev && prev.ratio != null) recs.push({ k: 'ratio', a: rat.toFixed(2), b: prev.ratio.toFixed(2) }); nr.ratio = rat; }
    if (!prev || tm < prev.time) { if (prev) recs.push({ k: 'time', a: mmss(tm), b: mmss(prev.time) }); nr.time = tm; }
    p.rec[n] = nr;
  }
  // contadores de por vida
  const L = p.life, add = (k, v) => { L[k] = (L[k] || 0) + v; };
  add('played', 1); add('kills', s.kills); add('bal', s.killKind.ballistic || 0); add('cruise', s.killKind.cruise || 0); add('drone', s.killKind.drone || 0); add('arm', s.killKind.arm || 0);
  add('armLost', s.armLost); add('sites', s.sitesKilled); add('sorties', s.sorties); add('cleanWaves', s.cleanWaves); L.bestStreak = Math.max(L.bestStreak || 0, s.bestStreak);
  add('orders', s.ordersOk);
  if (win) { add('won', 1); if (lv.diff === 'veteran') add('winVet', 1); if (lv.diff === 'expert') add('winExp', 1); if (s.leaked === 0) add('flawless', 1); if (econ) add('econ', 1); if (ig < 40) add('narrow', 1); p.stars[n] = Math.max(p.stars[n] || 0, st); }
  p.cp += pm; savePut(p);
  const ach = checkAch(true), unl = win ? unlockCards(n) : [];
  if (G.tut) endTut();
  const data = { win, st, ig, ratio, econ, pm, medals, recs, unl, ach, tips: endTips(win, st), sit: sitrep(win, ig), firstWin };
  if (win) startVictory(data);
  else { SND.lose(); buzz(120); VO.say('lose', null, true, 500); setTimeout(() => showEnd(data), 900); }
}
function startVictory(data, cb) {   // vuelta de honor: zoom al activo mejor defendido + celebración, luego la pantalla de resultados
  let best = null;
  for (const a of G.assets) if (a.hp > 0 && (!best || a.hp > best.hp || (a.hp === best.hp && a.type === 'capital'))) best = a;
  G.hl = best; G.victory = { t: 0, shown: false, cb: cb || (() => showEnd(data)) };
  VO.say('win', null, true, 500); banner(tr('end.win') + '<small>' + tr('vic.sub', { n: G.lv.name }) + '</small>');
  SND.fanfare(); buzz(60); FXS.pulse = 1;
}
function victoryTick(dt) {
  const V = G.victory; V.t += dt;
  const k = Math.min(1, V.t / 2.2); G.zoom = 1 + .28 * (k * k * (3 - 2 * k));
  G.assets.forEach((a, i) => { if (!V['f' + i] && V.t > .3 + .25 * i && a.hp > 0) { V['f' + i] = 1; fx(a.x, a.y, C.green, 46, 1.1); fx(a.x, a.y, C.blue, 70, 1.4); } });
  if (!V.shown && V.t > 3.6) { V.shown = true; V.cb(); }
}
const cntFmt = (el, v) => { const d = +el.dataset.dec || 0; el.textContent = (el.dataset.pre || '') + (d ? v.toFixed(d) : Math.round(v)) + (el.dataset.suf || ''); };
function showEnd(d) {
  const s = G.stats, win = d.win;
  const cnt = (to, o) => { o = o || {}; return '<span class="cnt" data-to="' + to + '"' + (o.pre ? ' data-pre="' + o.pre + '"' : '') + (o.suf ? ' data-suf="' + o.suf + '"' : '') + (o.dec ? ' data-dec="' + o.dec + '"' : '') + '>' + (o.pre || '') + (o.dec ? (0).toFixed(o.dec) : '0') + (o.suf || '') + '</span>'; };
  const starsH = '<div class="stars" id="st">' + [0, 1, 2].map(i => '<span class="sx' + (i < d.st ? ' fill' : '') + '">★</span>').join('') + '</div>';
  const tags = [];
  if (d.econ) tags.push('<div class="tag gold">' + tr('end.econ') + '<small>' + tr('end.econSub', { r: d.ratio.toFixed(2) }) + '</small></div>');
  for (const r of d.recs) tags.push('<div class="tag rec">' + tr('end.rec.' + r.k) + ' <b>' + r.a + '</b><small>' + tr('end.recPrev', { b: r.b }) + '</small></div>');
  const kv = '<div class="kv pre" id="kv"><span>' + tr('end.pm') + '</span>' + cnt(d.pm, { pre: '+', suf: ' ' + tr('unit.pm') }).replace('class="cnt"', 'class="cnt amber"') +
    '<span>' + tr('end.integ') + '</span>' + cnt(d.ig, { suf: '%' }) + '<span>' + tr('end.kills') + '</span>' + cnt(s.kills) + '<span>' + tr('end.leaked') + '</span>' + cnt(s.leaked) +
    '<span>' + tr('end.fired') + '</span>' + cnt(s.fired) + '<span>' + tr('end.ratio') + '</span>' + cnt(d.ratio, { dec: 2 }) + '<span>' + tr('end.airLost') + '</span>' + cnt(s.airLost) +
    '<span>' + tr('end.streak') + '</span>' + cnt(s.bestStreak) + '<span>' + tr('end.clean') + '</span><span>' + s.cleanWaves + '/' + G.lv.waves.length + '</span><span>' + tr('pz.time') + '</span><span>' + mmss(G.t) + '</span></div>';
  const medH = win ? '<div class="medals pre" id="md"><div class="sub">' + tr('end.medals') + '</div>' + d.medals.map((x, i) => '<div class="md ' + (x.ok ? 'ok' : 'no') + (x.isNew ? ' new' : '') + '" style="animation-delay:' + (i * .22) + 's"><b>' + (x.ok ? '✔ ' : '✕ ') + tr('medal.' + x.m.id) + '</b><small>' + tr('medal.' + x.m.id + '.d') + '</small>' + (x.isNew ? '<span class="pmx">+' + x.m.pm + ' ' + tr('unit.pm') + '</span>' : '') + '</div>').join('') + '</div>' : '';
  const unlH = d.unl.length ? '<div class="unls pre" id="ul">' + d.unl.map((u, i) => '<div class="unl" style="animation-delay:' + (i * .18) + 's"><span class="nb">' + tr('unl.' + u.t) + '</span><b>' + u.name + '</b><small>' + u.desc + '</small></div>').join('') + '</div>' : '';
  const achH = d.ach.length ? '<div class="unls pre" id="ac">' + d.ach.map((a, i) => '<div class="unl gold" style="animation-delay:' + (i * .18) + 's"><span class="nb">🏆 ' + tr('end.achNew') + '</span><b>' + tr('ach.' + a.id + '.name') + '</b><small>' + tr('ach.' + a.id + '.d') + ' · +' + a.pm + ' ' + tr('unit.pm') + '</small></div>').join('') + '</div>' : '';
  const sitH = '<div class="sitrep pre" id="sit"><b>' + tr('end.sitrep') + '</b> ' + d.sit + '</div>';
  const tipsH = d.tips.length ? '<div class="tips pre" id="tp"><b>' + tr('end.tips') + '</b><ul>' + d.tips.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' : '';
  const btns = '<div class="endbtns pre" id="eb">' + (!win && RP.buf.length >= 8 ? '<button class="big" data-a="replay">' + tr('rp.btn') + '</button>' : '') + (win && G.mode === 'camp' && G.n < CAMP_N() ? '<button class="big go" data-a="next">' + tr('end.next') + '</button>' : '') + '<button class="big" data-a="upg">' + tr('end.upg', { cp: progress().cp, pm: tr('unit.pm') }) + '</button><button class="big" data-a="retry">' + tr('end.retry') + '</button><button class="big" data-a="menu">' + tr('end.menu') + '</button></div>';
  const o = showOverlay('<h2 class="stamp ' + (win ? 'win' : 'lose') + ' pre" id="stamp">' + (win ? tr('end.win') : tr('end.lose')) + '</h2>' + (win ? starsH : '') + '<div class="tags" id="tg"></div>' + kv + medH + sitH + unlH + achH + tipsH + btns);
  $('#tg', o).innerHTML = tags.join('');
  const q = a => $('[data-a=' + a + ']', o);
  if (q('next')) q('next').onclick = () => showBrief(G.n + 1);
  q('upg').onclick = () => showUpgrades(() => showLevels());
  q('retry').onclick = () => newGame(G.n, G.cfg); q('menu').onclick = showLevels; if (q('replay')) q('replay').onclick = () => startReplay(() => showEnd(d));
  // secuencia de revelado (toca la pantalla para saltarla)
  const show = id => { const e = $('#' + id, o); if (e) { e.classList.remove('pre'); e.classList.add('rv'); } };
  let raf = 0;
  const animCounters = skip => {
    const els = $$('.cnt', o); show('kv');
    if (skip) { els.forEach(e => cntFmt(e, +e.dataset.to)); return; }
    const t0 = performance.now(), dur = 1100;
    const run = now => { const k = Math.min(1, (now - t0) / dur), e2 = 1 - Math.pow(1 - k, 3); els.forEach(e => cntFmt(e, +e.dataset.to * e2)); if (Math.floor(k * 14) !== animCounters.last) { animCounters.last = Math.floor(k * 14); SND.tick(); } if (k < 1) raf = requestAnimationFrame(run); };
    raf = requestAnimationFrame(run);
  };
  const steps = [{ d: 100, fn: () => show('stamp') }];
  if (win) for (let i = 0; i < 3; i++) steps.push({ d: 520, fn: skip => { const e = $$('.sx', o)[i]; if (e && i < d.st) { e.classList.add('on'); if (!skip) { SND.star(i); buzz(30); } } } });
  steps.push({ d: 400, fn: animCounters });
  steps.push({ d: 1250, fn: skip => { $$('.tag', o).forEach((e, i) => { e.style.animationDelay = (i * .2) + 's'; e.classList.add('rv'); }); if (!skip && $$('.tag', o).length) SND.chime(); } });
  steps.push({ d: 450, fn: skip => { show('md'); if (!skip) d.medals.forEach((x, i) => { if (x.ok) setTimeout(() => SND.chime(), 150 + i * 220); }); } });
  steps.push({ d: 700, fn: () => show('sit') });
  steps.push({ d: 500, fn: skip => { show('ul'); if (!skip && d.unl.length) SND.ach(); } });
  steps.push({ d: 500, fn: skip => { show('ac'); if (!skip && d.ach.length) SND.ach(); } });
  steps.push({ d: 300, fn: () => { show('tp'); show('eb'); } });
  let i = 0, timer = 0, fin = false;
  const next = () => { if (fin) return; if (i >= steps.length) return; const s2 = steps[i++]; timer = setTimeout(() => { s2.fn(false); next(); }, s2.d); };
  const finish = () => { if (fin) return; fin = true; clearTimeout(timer); cancelAnimationFrame(raf); while (i < steps.length) steps[i++].fn(true); $$('.cnt', o).forEach(e => cntFmt(e, +e.dataset.to)); $$('.sx.fill', o).forEach(e => e.classList.add('on')); };
  $('.box', o).addEventListener('pointerdown', e => { if (!e.target.closest('button')) finish(); });
  next();
}

/* ============================ ARRANQUE ============================ */
let last = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (FXS.hold > 0) FXS.hold = Math.max(0, FXS.hold - dt);
  if (FXS.slow > 0) FXS.slow = Math.max(0, FXS.slow - dt);
  if (G && G.rp) { rpAdvance(dt); draw(); requestAnimationFrame(frame); return; }
  FXS.pulse = Math.max(0, FXS.pulse - dt * .7);
  if (G && !G.over && G.speed > 0 && !(FXS.hold > 0)) {
    let rem = dt * G.speed * (FXS.slow > 0 ? .3 : 1);
    while (rem > 0 && !G.over) { const h = Math.min(rem, 1 / 30); step(h); rem -= h; }
  } else if (G && !G.over && FXS.hold > 0) { /* hitstop */ } else if (G && G.over) { const fd = G.victory ? dt * .5 : dt; if (G.victory) victoryTick(dt); for (const e of G.fx) e.t += fd; G.fx = G.fx.filter(e => e.t < e.dur); G.floats.forEach(f => f.t += fd); G.floats = G.floats.filter(f => f.t < 1.1); }
  FXS.shake = Math.max(0, FXS.shake - dt * 1.8); FXS.flash = Math.max(0, FXS.flash - dt * .9); FXS.lt = Math.max(0, FXS.lt - dt * 2.5);
  if (G && !G.over && G.speed > 0 && G.lv.weather === 'storm' && Math.random() < dt * .12) FXS.lt = .6;
  draw();
  requestAnimationFrame(frame);
}
let slow = 0, achTick = 0;
function musicLevel() {
  if (!G || G.demo || G.over || G.phase !== 'ops' || G.speed <= 0 || !$('#overlay').classList.contains('hidden')) return 0;
  const n = G.threats.filter(t => t.alive).length;
  return n === 0 ? 1 : (n >= 8 || integrity() < 50) ? 3 : 2;
}
setInterval(() => {
  SND.setMusic(musicLevel());
  if (!G) return;
  if (!G.over && !G.demo && ++achTick % 4 === 0) checkAch();
  refreshTop(); refreshDock(); tutTick();
  if (G.sel) { if (G.sel.kind === 'threat' && !G.sel.ref.alive) hidePanel(); else if (G.sel.kind === 'air' && !G.air.includes(G.sel.ref)) hidePanel(); else renderPanel(); }
}, 250);

function applyLang() {
  document.documentElement.lang = I18N.lang; document.title = tr('app.title');
  $$('[data-i18n]').forEach(e => { e.textContent = tr(e.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(e => e.setAttribute('aria-label', tr(e.dataset.i18nAria)));
  $$('[data-i18n-title]').forEach(e => { e.title = tr(e.dataset.i18nTitle); });
  const rot = $('#rotate'); if (rot) { $('span', rot).textContent = tr('rotate.msg'); $('button', rot).setAttribute('aria-label', tr('a.close')); }
  if (MAP) renderBG();
  if (G) {
    setPhase(G.phase); buildDock(); refreshTop(); renderPanel();
    if (G.tut) tutShow(); else if ($('#hint').dataset.key === 'plan') setHint(tr('hint.plan'), 'plan');
  }
}
function init() {
  I18N.init(); I18N.onChange(applyLang); applyLang(); applyA11y();
  $('#rpskip').onclick = () => endReplay();
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
  
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => SND.init(), { passive: true }));
  document.addEventListener('visibilitychange', () => { if (SND.ac) { try { document.hidden ? SND.ac.suspend() : SND.ac.resume(); } catch (e) { /* sin audio */ } if (document.hidden && window.speechSynthesis) speechSynthesis.cancel(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.over && !G.demo && G.speed > 0) { resumeSpeed = G.speed; setSpeed(0); log(tr('log.autoPause'), 'warn'); } });
  const rot = document.createElement('div'); rot.id = 'rotate'; rot.className = 'hidden'; rot.innerHTML = '<span></span><button>✕</button>';
  $('#mapwrap').appendChild(rot); $('button', rot).onclick = () => { rot.dataset.off = 1; rot.classList.add('hidden'); };
  window.__rot = () => { const show = innerWidth > innerHeight * 1.15 && ('ontouchstart' in window) && !rot.dataset.off; rot.classList.toggle('hidden', !show); };
  document.addEventListener('gesturestart', e => e.preventDefault());
  loadNTDS(); SET.cos = SET.cos || {}; refreshCos();
  newGame(1); G.demo = true; G.tut = null; setHint(null); setSpeed(0);
  resize(); showMenu();
  requestAnimationFrame(t => { last = t; frame(t); });
  const m = /[?&]level=(\d+)/.exec(location.search); if (m) { $('#overlay').classList.add('hidden'); newGame(+m[1]); }
}
window.__C2 = { RP, VO, SND, startReplay, endReplay, applyA11y, musicLevel, SPECIALS, dailyConfig, endlessConfig, buildModeLevel, showModes, showModeBrief, endMode, endlessWave, theaterOf, CAMP_N, THEATERS, DIFF, WEATHER, WX, emRange, runEvent, spawnWave, MEDALS, ACH, COS, checkAch, effLife, medalsFor, endLevel, showEnd, showLevels, showAch, showCosmetics, progress, I18N, tr, applyLang, SET, restockAll, showPause, showSettings, tutTick, TUT, get G() { return G; }, get MAP() { return MAP; }, newGame, step, setSpeed, startOps, SAM, AIR, THREAT, makeLevel, placeUnit, launchMission, missionStation, firstReady, bestReady, inPoly, onLand, toggleEmit, emitters, isEmitting, airbases, validPlace, resize, view, UI, select, buildDock, refreshDock };
init();
})();
