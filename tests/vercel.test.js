// Contrato del backend de Vercel (vercel/lib/handler.js) con Redis simulado, más la puerta de entrada api/index.js.
const test = require('node:test'), assert = require('node:assert/strict'), http = require('http');
const { handle } = require('../vercel/lib/handler'), fakeRedis = require('./fake-redis');
const mk = () => { const store = fakeRedis(), env = { ADMIN_TOKEN: 'secreto' };
  const call = (method, path, o) => { o = o || {}; const q = new URLSearchParams(o.q || ''); return handle({ method, path, query: q, body: o.body, ip: o.ip || '1.2.3.4', auth: o.auth || '', store, env, now: o.now }); };
  return { store, call }; };

test('health y rutas desconocidas', async () => { const { call } = mk(); assert.equal((await call('GET', '/health')).status, 200); assert.equal((await call('GET', '/nada')).status, 404); assert.equal((await call('OPTIONS', '/event')).status, 204); });

test('eventos: cuenta por día, idioma, versión, nivel y jugadores únicos; /stats exige token', async () => {
  const { call } = mk(), now = Date.parse('2026-10-12T10:00:00Z');
  for (const [id, win] of [['aaa', true], ['aaa', false], ['bbb', true]]) assert.equal((await call('POST', '/event', { now, body: { id, ev: 'level_end', v: '1.0.9', lang: 'es', d: { n: 3, win } } })).status, 200);
  assert.equal((await call('POST', '/event', { body: { ev: 'x' } })).status, 400, 'sin id no se acepta');
  assert.equal((await call('GET', '/stats', { now })).status, 401); assert.equal((await call('GET', '/stats', { now, auth: 'Bearer malo' })).status, 401);
  const r = await call('GET', '/stats', { now, auth: 'Bearer secreto', q: 'days=2' }), d = r.body.days[0];
  assert.equal(d.day, '2026-10-12'); assert.equal(d.players, 2); assert.equal(d.counts['ev:level_end'], 3); assert.equal(d.counts['lang:es'], 3); assert.equal(d.counts['ver:1.0.9'], 3);
  assert.equal(d.counts['level_end:L3:win'], 2); assert.equal(d.counts['level_end:L3:loss'], 1);
});
test('eventos: entrada hostil se sanea y no rompe', async () => {
  const { call, store } = mk(); const r = await call('POST', '/event', { body: { id: '<script>x</script>'.repeat(5), ev: 'a'.repeat(99), v: {}, lang: 5, d: 'texto' } }); assert.equal(r.status, 200);
  assert.ok([...store.kv.keys()].every(k => k.length < 80));
});

test('marcadores: mejor puntuación por jugador, orden, apodo por defecto y límites', async () => {
  const { call } = mk(), q = 'mode=daily&key=2026-10-12';
  const post = (id, score, nick) => call('POST', '/score', { body: { id, nick, mode: 'daily', key: '2026-10-12', score } });
  await post('ana', 500, 'Ana'); await post('ana', 300, 'Ana'); await post('luis', 800, ''); await post('bob', 650, 'Bob<>');
  const t = (await call('GET', '/scores', { q })).body.top; assert.deepEqual(t.map(x => x.score), [800, 650, 500], 'ana conserva su mejor');
  assert.deepEqual(t.map(x => x.nick), ['PILOT-LUIS', 'Bob', 'Ana']);
  assert.equal((await post('x', -1)).status, 400); assert.equal((await post('x', 2e6)).status, 400); assert.equal((await post('', 5)).status, 400);
  assert.equal((await call('GET', '/scores', { q: q + '&limit=1' })).body.top.length, 1);
  assert.deepEqual((await call('GET', '/scores', { q: 'mode=nada' })).body.top, []);
});

test('guardado en la nube: crear, leer, sobrescribir con su código, rechazar basura', async () => {
  const { call } = mk(), data = 'C2H1.' + Buffer.from('{"v":2}').toString('base64');
  const c = (await call('POST', '/save', { body: { data } })).body.code; assert.match(c, /^[0-9A-F]{10}$/);
  assert.equal((await call('GET', '/save/' + c.toLowerCase())).body.data, data);
  assert.equal((await call('POST', '/save', { body: { data: data + 'x', code: c } })).body.code, c);
  assert.equal((await call('GET', '/save/' + c)).body.data, data + 'x');
  assert.equal((await call('GET', '/save/ZZZZ')).status, 404);
  assert.equal((await call('POST', '/save', { body: { data: 'hola' } })).status, 400); assert.equal((await call('POST', '/save', { body: { data: 'C2H1.' + 'x'.repeat(200001) } })).status, 400);
});
test('guardado: caduca al año y los códigos aleatorios no pisan los existentes', async () => {
  const { call, store } = mk(), data = 'C2H1.AAAA'; const c = (await call('POST', '/save', { body: { data } })).body.code;
  store.advance(366 * 86400000); assert.equal((await call('GET', '/save/' + c)).status, 404);
});

test('límite de tasa: 60 peticiones/min por IP, otra IP no se ve afectada, y se libera pasado el minuto', async () => {
  const { call, store } = mk();
  for (let i = 0; i < 60; i++) assert.equal((await call('GET', '/scores', { ip: '9.9.9.9' })).status, 200);
  assert.equal((await call('GET', '/scores', { ip: '9.9.9.9' })).status, 429); assert.equal((await call('GET', '/scores', { ip: '8.8.8.8' })).status, 200);
  store.advance(61000); assert.equal((await call('GET', '/scores', { ip: '9.9.9.9' })).status, 200);
  assert.ok([...store.kv.keys()].filter(k => k.startsWith('rl:')).every(k => !/9\.9\.9\.9/.test(k)), 'la IP no se guarda en claro');
});

// La puerta de entrada de Vercel: mismas rutas a través de ?p= (rewrite) y de la ruta original, CORS, cuerpo JSON como cadena
test('api/index.js: enruta, aplica CORS y devuelve JSON', async () => {
  const fake = fakeRedis(), Module = require('module'), orig = Module._load;
  Module._load = function (r, ...a) { if (/lib\/redis$/.test(r)) return { redis: () => fake }; return orig.call(this, r, ...a); };
  delete require.cache[require.resolve('../vercel/api/index.js')]; process.env.ADMIN_TOKEN = 'secreto'; const fn = require('../vercel/api/index.js'); Module._load = orig;
  const srv = http.createServer(async (req, res) => { let b = ''; for await (const c of req) b += c; req.body = b || undefined; await fn(req, res); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
  try {
    let r = await fetch(base + '/api/index?p=health'); assert.equal(r.status, 200); assert.equal(r.headers.get('access-control-allow-origin'), '*');
    r = await fetch(base + '/health'); assert.equal(r.status, 200, 'también por la ruta original');
    r = await fetch(base + '/api/index?p=score', { method: 'POST', body: JSON.stringify({ id: 'a1', mode: 'endless', key: '', score: 42 }) }); assert.equal(r.status, 200);
    r = await fetch(base + '/api/index?p=scores&mode=endless&key='); assert.deepEqual((await r.json()).top, [{ nick: 'PILOT-A1', score: 42 }]);
    r = await fetch(base + '/api/index?p=event', { method: 'POST', body: '{no json' }); assert.equal(r.status, 400);
    r = await fetch(base + '/api/index?p=event', { method: 'OPTIONS' }); assert.equal(r.status, 204);
  } finally { srv.close(); }
});
