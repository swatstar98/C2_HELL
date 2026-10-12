// Pruebas de comportamiento en Chromium real (Playwright): arranque, i18n visible, simulación, tienda, guardado, offline, rendimiento.
// Variables: C2_CHROMIUM=/ruta/chromium (opcional) · C2_PERF_MS=8 (presupuesto de paso de simulación, ms) · C2_FULL=1 (todas las misiones y niveles; por defecto una muestra)
const test = require('node:test'), assert = require('node:assert/strict');
const { serve, browser, open } = require('./lib');
const FULL = process.env.C2_FULL === '1', LANGS = ['es', 'en', 'fr', 'de', 'pt'];
let srv, br;
test.before(async () => { srv = await serve(); br = await browser(); });
test.after(async () => { await br.close(); srv.close(); });
const page = (q, o) => open(br, srv.url, q, o);
const noErrs = pg => assert.deepEqual(pg.errs, [], 'errores en la página');

// Recorre el estado buscando NaN/Infinity (la clase de bug que más silenciosamente rompe una sim)
const BAD = () => {
  const bad = [], seen = new Set();
  const walk = (o, p, d) => { if (d > 4 || !o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); for (const k of Object.keys(o)) { const v = o[k]; if (typeof v === 'number' && !isFinite(v)) bad.push(p + '.' + k); else if (typeof v === 'object') walk(v, p + '.' + k, d + 1); } };
  const G = window.__C2.G; for (const k of ['assets', 'units', 'sites', 'threats', 'pending', 'missiles', 'air', 'stats']) walk(G[k], k, 0);
  if (!isFinite(G.credits) || G.credits < -1e-6) bad.push('credits=' + G.credits);
  return bad.slice(0, 10);
};

for (const l of LANGS) test('arranque limpio y sin claves de traducción a la vista · ' + l, async () => {
  const miss = new Set();
  const pg = await page('lang=' + l + '&unlock&nointro', { init: () => { let v; Object.defineProperty(window, 'I18N', { configurable: true, get: () => v, set: o => { const t = o.t; o.t = (k, p, d) => { const r = t(k, p, d); if (r === k && d === undefined && /\./.test(k)) (window.__missing = window.__missing || new Set()).add(k); return r; }; v = o; } }); } });
  await pg.evaluate(() => { const A = __C2; A.showLevels(); A.showAch(); A.showCosmetics(); A.showModes(); A.showSettings(); A.showSaveTools(); A.showStore(); A.showHist && A.showCamp('korea'); A.showHistBrief('korea', 1); A.showArchive('korea'); A.showUpgrades(() => {}); });
  await pg.evaluate(() => { const A = __C2; A.newGame(3); A.startOps(1); for (let i = 0; i < 400; i++) A.step(1 / 20); A.showPause(); });
  const m = await pg.evaluate(() => [...(window.__missing || [])]);
  assert.deepEqual(m, [], 'claves sin traducir en ' + l);
  noErrs(pg); await pg.context().close();
});

test('generador de niveles: oleadas coherentes (niveles 1-30 × 3 dificultades)', async () => {
  const pg = await page('lang=en&unlock&nointro');
  const r = await pg.evaluate(() => { const A = __C2, bad = []; for (const diff of ['normal', 'veteran', 'expert']) for (let n = 1; n <= 30; n++) { const L = A.makeLevel(n, { diff }); if (!L.waves.length) bad.push(n + ' sin oleadas'); let pt = -1; for (const w of L.waves) { if (!(w.t >= pt) || !isFinite(w.t)) bad.push(n + diff + ' t'); pt = w.t; if (!w.items.length || w.items.some(i => !(i.count > 0) || !Number.isInteger(i.count))) bad.push(n + diff + ' items'); } if (!(L.credits > 0)) bad.push(n + ' credits'); } return bad; });
  assert.deepEqual(r, []); noErrs(pg); await pg.context().close();
});

// Simulación sin intervención hasta que termina la partida: no debe lanzar, ni producir NaN, ni colgarse
async function play(pg, spec) {
  return pg.evaluate(({ spec, BAD }) => {
    const A = __C2; const bad = new Function('return (' + BAD + ')()');
    if (spec.hist) A.newGame(1, { mode: 'hist', camp: 'korea', m: spec.hist }); else if (spec.mode === 'daily') A.newGame(1, A.dailyConfig('2026-10-12')); else if (spec.mode === 'endless') A.newGame(1, { mode: 'endless', seed: 12345, L: 7, theater: 0, weather: 'clear' }); else A.newGame(spec.n);
    const G = A.G; G.demo = false;
    if (spec.defend) { let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; const keys = ['mrad', 'shorad', 'gun', 'radar', 'mrad', 'bmd']; for (let i = 0; i < 400 && G.credits > 40; i++) { const D = A.SAM[keys[i % keys.length]]; if (D) A.placeUnit(D, 40 + rnd() * 920, 40 + rnd() * (1000 * A.view.h / A.view.w - 80)); } }
    A.startOps(1); let i = 0, errs = []; const max = spec.max || 12000;
    while (!G.over && i++ < max) { A.step(1 / 20); if (i % 200 === 0) { const b = bad(); if (b.length) errs.push(b); } }
    return { over: G.over, steps: i, t: Math.round(G.t), bad: errs.slice(0, 3), kills: G.stats.kills, leaked: G.stats.leaked, units: G.units.length, threats: G.stats.kills + G.stats.leaked + G.threats.length };
  }, { spec, BAD: BAD.toString() });
}
const levels = FULL ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 20] : [1, 4, 8, 12, 20];
for (const n of levels) test('simulación completa · nivel ' + n + ' (sin defensas y con defensas aleatorias)', async () => {
  const pg = await page('lang=en&unlock&nointro');
  for (const defend of [false, true]) { const r = await play(pg, { n, defend }); assert.deepEqual(r.bad, [], 'NaN/Infinity en el estado'); assert.ok(r.steps < 12000 || r.over, 'la partida no termina (n=' + n + ' defend=' + defend + ')'); assert.ok(r.t > 20 && r.threats > 0, 'la simulación no hizo nada: ' + JSON.stringify(r)); if (defend) assert.ok(r.units > 0, 'no se colocó ninguna defensa'); }
  noErrs(pg); await pg.context().close();
});
const missions = FULL ? Array.from({ length: 24 }, (_, i) => i + 1) : [1, 5, 9, 14, 19, 24];
for (const m of missions) test('simulación completa · misión Corea ' + m, async () => {
  const pg = await page('lang=es&unlock&nointro');
  const r = await play(pg, { hist: m, defend: true, max: 9000 }); assert.deepEqual(r.bad, []); assert.ok(r.over || r.steps >= 9000); assert.ok(r.threats > 0 && r.units > 0, JSON.stringify(r));
  noErrs(pg); await pg.context().close();
});
for (const mode of ['daily', 'endless']) test('simulación · modo ' + mode, async () => {
  const pg = await page('lang=en&unlock&nointro'); const r = await play(pg, { mode, defend: true, max: 6000 }); assert.deepEqual(r.bad, []); noErrs(pg); await pg.context().close();
});

test('rendimiento: lógica de simulación en una oleada pesada dentro de presupuesto (el dibujado solo se mide en dispositivo)', async () => {
  const pg = await page('lang=en&unlock&nointro');
  const r = await pg.evaluate(() => { const A = __C2; A.newGame(1, { mode: 'endless', seed: 99, L: 7, theater: 0, weather: 'clear' }); const G = A.G; G.demo = false; G.credits = 1e6; let seed = 3; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; for (let i = 0; i < 150; i++) A.placeUnit(A.SAM[['mrad', 'shorad', 'gun', 'radar'][i % 4]], 40 + rnd() * 920, 40 + rnd() * (1000 * A.view.h / A.view.w - 80)); A.startOps(1); for (let i = 0; i < 6000; i++) { G.credits = 1e5; A.step(1 / 20); if (G.over) { G.over = false; } } const ts = []; for (let i = 0; i < 300; i++) { const t0 = performance.now(); A.step(1 / 20); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return { med: ts[150], p95: ts[285], threats: G.threats.length, units: G.units.length }; });
  const lim = +process.env.C2_PERF_MS || 8; console.log('   paso de sim: mediana ' + r.med.toFixed(2) + ' ms · p95 ' + r.p95.toFixed(2) + ' ms · ' + r.threats + ' amenazas · ' + r.units + ' unidades');
  assert.ok(r.med < lim, 'mediana ' + r.med.toFixed(2) + ' ms ≥ presupuesto ' + lim + ' ms'); noErrs(pg); await pg.context().close();
});

// ---- tienda ----
test('tienda: apagada (todo abierto), simulada (bloqueos y compras) y real con facturación falsa', async () => {
  let pg = await page('lang=en&nointro');
  assert.equal(await pg.evaluate(() => __C2.Store.mode()), 'off');
  assert.ok(await pg.evaluate(() => __C2.Store.modes() && __C2.Store.theater(6))); await pg.context().close();
  pg = await page('store=sim&lang=en&nointro');
  assert.equal(await pg.evaluate(() => __C2.Store.mode()), 'sim');
  assert.ok(await pg.evaluate(() => __C2.Store.theater(2) && !__C2.Store.theater(3) && !__C2.Store.modes()));
  await pg.evaluate(() => __C2.newGame(13)); assert.match(await pg.innerText('#overlay'), /STORE/i, 'nivel de pago abre la tienda');
  await pg.evaluate(() => __C2.Store.grant('c2hell_pack_taiwan'));
  assert.ok(await pg.evaluate(() => __C2.Store.theater(5) && !__C2.Store.theater(3)), 'un pack abre solo su teatro');
  await pg.reload(); await pg.waitForFunction(() => window.__C2);
  assert.ok(await pg.evaluate(() => __C2.Store.theater(5)), 'la compra persiste tras recargar'); noErrs(pg); await pg.context().close();
  pg = await page('lang=en&nointro', { store: true, init: () => { window.C2_BILLING = { purchase: id => Promise.resolve(id === 'c2hell_full'), restore: () => Promise.resolve(['c2hell_pack_taiwan']), price: id => '€1.99' }; } });
  assert.equal(await pg.evaluate(() => __C2.Store.mode()), 'live');
  assert.equal(await pg.evaluate(() => __C2.Store.buy('c2hell_pack_iran')), false); assert.ok(!(await pg.evaluate(() => __C2.Store.theater(4))), 'compra rechazada no concede');
  assert.equal(await pg.evaluate(() => __C2.Store.buy('c2hell_full')), true); assert.ok(await pg.evaluate(() => __C2.Store.modes()), 'compra aceptada concede el juego completo');
  noErrs(pg); await pg.context().close();
  pg = await page('lang=en&nointro', { store: true });   // tienda activa pero sin facturación (p. ej. fallo del plugin): no debe regalar nada ni romperse
  assert.equal(await pg.evaluate(() => __C2.Store.mode()), 'nobilling');
  assert.ok(!(await pg.evaluate(() => __C2.Store.modes())), 'sin facturación no se desbloquea nada'); await pg.evaluate(() => __C2.showStore()); noErrs(pg); await pg.context().close();
});

// ---- guardado ----
const seed = (obj, raw) => ({ init: `try{localStorage.setItem('c2hell.save', ${JSON.stringify(raw !== undefined ? raw : JSON.stringify(obj))})}catch(e){}` });
test('guardado: JSON corrupto no rompe el juego y se aparta en un backup', async () => {
  const pg = await page('lang=en&nointro', { init: "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');localStorage.setItem('c2hell.save','{{{no es json');}" });
  assert.deepEqual(await pg.evaluate(() => Object.keys(__C2.progress()).includes('stars')), true);
  assert.equal(await pg.evaluate(() => localStorage.getItem('c2hell.save.bak')), '{{{no es json'); noErrs(pg); await pg.context().close();
});
test('guardado: formato antiguo (sin versión) migra, conserva progreso y sanea basura', async () => {
  const old = { stars: { 1: 3, 2: 2 }, cp: 12, up: { budget: 2 }, ach: 'basura', set: { snd: false, diff: 'imposible', ui: 9 }, medals: [1, 2] };
  const pg = await page('lang=en&nointro', { init: "if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');localStorage.setItem('c2hell.save'," + JSON.stringify(JSON.stringify(old)) + ");}" });
  const r = await pg.evaluate(() => { const p = __C2.progress(), raw = JSON.parse(localStorage.getItem('c2hell.save')); return { stars: p.stars, cp: p.cp, up: p.up, ach: p.ach, medals: p.medals, v: raw.v, diff: __C2.SET.diff, ui: __C2.SET.ui, snd: __C2.SET.snd, backup: !!localStorage.getItem('c2hell.save.v1') }; });
  assert.deepEqual(r.stars, { 1: 3, 2: 2 }); assert.equal(r.cp, 12); assert.deepEqual(r.up, { budget: 2 });
  assert.deepEqual(r.ach, {}, 'tipo inválido sustituido'); assert.deepEqual(r.medals, {});
  assert.equal(r.v, 2); assert.equal(r.diff, 'normal'); assert.equal(r.ui, 1); assert.equal(r.snd, false, 'ajuste válido se conserva'); assert.ok(r.backup, 'copia del guardado v1');
  noErrs(pg); await pg.context().close();
});
test('guardado: exportar/importar ida y vuelta; rechaza basura y códigos de versión futura', async () => {
  const pg = await page('lang=en&nointro');
  const r = await pg.evaluate(() => { const A = __C2, p = A.progress(); p.stars = { 1: 3 }; p.cp = 7; A.savePut(p); const code = A.exportSave(); localStorage.removeItem('c2hell.save'); const ok = A.importSave(code), q = A.progress();
    const fut = 'C2H1.' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 99, cp: 1 }))));
    return { ok, stars: q.stars, cp: q.cp, junk: A.importSave('hola'), junk2: A.importSave('C2H1.@@@'), fut: A.importSave(fut), cpAfter: A.progress().cp }; });
  assert.equal(r.ok, true); assert.deepEqual(r.stars, { 1: 3 }); assert.equal(r.cp, 7); assert.equal(r.junk, false); assert.equal(r.junk2, false); assert.equal(r.fut, false); assert.equal(r.cpAfter, 7);
  noErrs(pg); await pg.context().close();
});
test('guardado: sin localStorage el juego arranca igualmente', async () => {
  const pg = await page('lang=en&nointro', { init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('denegado'); } }); } });
  await pg.evaluate(() => { __C2.newGame(1); __C2.startOps(1); for (let i = 0; i < 100; i++) __C2.step(1 / 20); });
  assert.deepEqual(pg.errs.filter(e => !/denegado/.test(e)), []); await pg.context().close();
});

// ---- accesibilidad ----
test('accesibilidad: modo daltónico y escala de interfaz', async () => {
  const pg = await page('lang=en&nointro');
  const r = await pg.evaluate(() => { const A = __C2, d = document.documentElement; A.SET.cb = true; A.SET.ui = 1.3; A.applyA11y(); const on = [d.dataset.cb, d.dataset.ui]; A.SET.cb = false; A.SET.ui = 1; A.applyA11y(); return { on, off: [d.dataset.cb || null, d.dataset.ui] }; });
  assert.deepEqual(r.on, ['1', '1.3']); assert.deepEqual(r.off, [null, '1']);
  // objetivos táctiles de la botonera: ≥ 40 px
  await pg.evaluate(() => { __C2.newGame(1); __C2.startOps(0); });
  const small = await pg.evaluate(() => [...document.querySelectorAll('#dock button, .big')].filter(b => b.offsetParent && (b.getBoundingClientRect().height < 36)).map(b => b.className + ':' + Math.round(b.getBoundingClientRect().height)).slice(0, 5));
  assert.deepEqual(small, [], 'botones demasiado pequeños para tocar'); noErrs(pg); await pg.context().close();
});

// ---- intro ----
test('intro: se muestra con ?intro y desaparece al saltarla; no aparece con ?nointro', async () => {
  let pg = await page('lang=en&intro');
  assert.ok(await pg.evaluate(() => !!document.getElementById('intro')), 'overlay de intro presente');
  await pg.mouse.click(200, 400); await pg.waitForFunction(() => !document.getElementById('intro'), null, { timeout: 8000 }); noErrs(pg); await pg.context().close();
  pg = await page('lang=en&nointro'); assert.ok(await pg.evaluate(() => !document.getElementById('intro'))); await pg.context().close();
});

// ---- PWA / offline ----
test('PWA: el service worker precachea y la app arranca sin red', async () => {
  const pg = await page('lang=en&nointro');
  await pg.evaluate(() => navigator.serviceWorker.ready); await pg.waitForTimeout(1500);
  const keys = await pg.evaluate(() => caches.keys()); assert.ok(keys.some(k => /^c2hell-/.test(k)), 'caché c2hell-* creada: ' + keys);
  await pg.context().setOffline(true); await pg.reload(); await pg.waitForFunction(() => window.__C2 && window.__C2.SET, null, { timeout: 10000 });
  assert.ok(await pg.evaluate(() => { __C2.newGame(1); return !!__C2.G; }), 'juega offline'); await pg.context().close();
});
