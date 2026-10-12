// Extremo a extremo: el juego real (Chromium) hablando con el backend de Vercel (handler + api/index.js) y Redis simulado.
const test = require('node:test'), assert = require('node:assert/strict'), http = require('http'), Module = require('module');
const { serve, browser, open } = require('./lib'), fakeRedis = require('./fake-redis');
let srv, br, api, apiUrl, store;
test.before(async () => {
  store = fakeRedis(); const orig = Module._load; Module._load = function (r, ...a) { if (/lib\/redis$/.test(r)) return { redis: () => store }; return orig.call(this, r, ...a); };
  const fn = require('../vercel/api/index.js'); Module._load = orig;
  api = http.createServer(async (req, res) => { let b = ''; for await (const c of req) b += c; req.body = b || undefined; const u = new URL(req.url, 'http://x'); req.url = '/api/index?p=' + encodeURIComponent(u.pathname.slice(1)) + (u.search ? '&' + u.search.slice(1) : ''); await fn(req, res); });
  await new Promise(r => api.listen(0, '127.0.0.1', r)); apiUrl = 'http://127.0.0.1:' + api.address().port;
  srv = await serve(); br = await browser();
});
test.after(async () => { await br.close(); srv.close(); api.close(); });

test('con «Funciones online» apagadas el juego no hace ninguna petición de red', async () => {
  const pg = await open(br, srv.url, 'lang=en&nointro', { endpoint: apiUrl }); const reqs = []; pg.on('request', r => { if (r.url().startsWith(apiUrl)) reqs.push(r.url()); });
  await pg.evaluate(() => { __C2.newGame(1); __C2.G.demo = false; __C2.startOps(1); for (let i = 0; i < 3000 && !__C2.G.over; i++) __C2.step(1 / 20); }); await pg.waitForTimeout(500);
  assert.deepEqual(reqs, [], 'sin opt-in no debe salir nada'); await pg.context().close();
});

test('con opt-in: eventos, marcador y guardado en la nube funcionan contra el backend', async () => {
  const pg = await open(br, srv.url, 'lang=en&nointro', { endpoint: apiUrl, init: "localStorage.setItem('c2hell.save', JSON.stringify({v:2,set:{online:true,nick:'Tester'}}));" });
  assert.ok(await pg.evaluate(() => __C2.SET.online), 'el opt-in se aplica');
  await pg.evaluate(() => { __C2.newGame(1); __C2.G.demo = false; __C2.startOps(1); for (let i = 0; i < 6000 && !__C2.G.over; i++) __C2.step(1 / 20); });
  await pg.waitForFunction(() => __C2.G.over); await pg.waitForTimeout(800);
  const evs = [...store.kv.entries()].filter(([k]) => k.startsWith('st:')).flatMap(([, h]) => Object.keys(h)); assert.ok(evs.includes('ev:level_end'), 'llegó level_end: ' + evs);
  assert.ok(![...store.kv.keys()].some(k => /127\.0\.0\.1/.test(k)), 'sin IP en claro');
  // marcador (modo sin fin) y guardado por código
  const r = await pg.evaluate(async () => { const A = __C2; A.Net.score('endless', '', 321, {}); await new Promise(r => setTimeout(r, 400)); const top = await A.Net.top('endless', ''); const up = await A.Net.req('POST', '/save', { data: A.exportSave() }); const down = await A.Net.req('GET', '/save/' + up.code); return { top: top.top, code: up.code, ok: A.importSave(down.data) }; });
  assert.deepEqual(r.top, [{ nick: 'Tester', score: 321 }]); assert.match(r.code, /^[0-9A-F]{10}$/); assert.equal(r.ok, true);
  assert.deepEqual(pg.errs.filter(e => !/ERR_|Failed to load/.test(e)), []); await pg.context().close();
});

test('si el backend no responde el juego sigue funcionando sin errores', async () => {
  const pg = await open(br, srv.url, 'lang=en&nointro', { endpoint: 'http://127.0.0.1:9', init: "localStorage.setItem('c2hell.save', JSON.stringify({v:2,set:{online:true}}));" });
  await pg.evaluate(() => { __C2.newGame(1); __C2.G.demo = false; __C2.startOps(1); for (let i = 0; i < 6000 && !__C2.G.over; i++) __C2.step(1 / 20); }); await pg.waitForTimeout(500);
  assert.deepEqual(pg.errs.filter(e => !/ERR_|Failed to load|CORS|net::/.test(e)), []); assert.ok(await pg.evaluate(() => !!document.getElementById('overlay'))); await pg.context().close();
});
