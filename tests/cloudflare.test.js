// Contrato del backend de Cloudflare (cloudflare/src/handler.js) sobre SQLite real con el schema.sql de producción.
const test = require('node:test'), assert = require('node:assert/strict'), d1 = require('./d1');
let H; test.before(async () => { H = await import('../cloudflare/src/handler.js'); });
const mk = () => { const env = { DB: d1(), ADMIN_TOKEN: 'secreto' };
  const call = async (method, path, o) => { o = o || {}; const init = { method, headers: Object.assign({}, o.headers) }; if (o.body !== undefined) init.body = typeof o.body === 'string' ? o.body : JSON.stringify(o.body);
    const r = await H.handle(new Request('http://x' + path, init), env, o.now, o.ip || '1.2.3.4'); return { status: r.status, body: r.status === 204 ? null : await r.json(), headers: r.headers }; };
  return { env, call }; };

test('health, CORS y rutas desconocidas', async () => { const { call } = mk(); assert.equal((await call('GET', '/health')).status, 200); assert.equal((await call('GET', '/nada')).status, 404); const o = await call('OPTIONS', '/event'); assert.equal(o.status, 204); assert.equal(o.headers.get('access-control-allow-origin'), '*'); });

test('eventos: contadores por día, idioma, versión, nivel y jugadores únicos; /stats exige token', async () => {
  const { call } = mk(), now = Date.parse('2026-10-12T10:00:00Z');
  for (const [id, win] of [['aaa', true], ['aaa', false], ['bbb', true]]) assert.equal((await call('POST', '/event', { now, body: { id, ev: 'level_end', v: '1.0.9', lang: 'es', d: { n: 3, win } } })).status, 200);
  assert.equal((await call('POST', '/event', { now, body: { ev: 'x' } })).status, 400);
  assert.equal((await call('GET', '/stats', { now })).status, 401); assert.equal((await call('GET', '/stats', { now, headers: { Authorization: 'Bearer malo' } })).status, 401);
  const r = await call('GET', '/stats?days=2', { now, headers: { Authorization: 'Bearer secreto' } }), d = r.body.days[0];
  assert.equal(r.body.days.length, 2); assert.equal(d.day, '2026-10-12'); assert.equal(d.players, 2); assert.equal(d.counts['ev:level_end'], 3); assert.equal(d.counts['lang:es'], 3); assert.equal(d.counts['ver:1.0.9'], 3);
  assert.equal(d.counts['level_end:L3:win'], 2); assert.equal(d.counts['level_end:L3:loss'], 1); assert.equal(r.body.days[1].players, 0);
});
test('/stats sin ADMIN_TOKEN configurado queda cerrado', async () => { const { env, call } = mk(); delete env.ADMIN_TOKEN; assert.equal((await call('GET', '/stats', { headers: { Authorization: 'Bearer ' } })).status, 401); });
test('eventos: entrada hostil o malformada se sanea y no rompe', async () => {
  const { env, call } = mk(); assert.equal((await call('POST', '/event', { body: { id: "x'); DROP TABLE counters;--", ev: 'a'.repeat(99), v: {}, lang: 5, d: 'texto' } })).status, 200);
  assert.equal((await call('POST', '/event', { body: '{no json' })).status, 400); assert.equal((await call('POST', '/event', { body: '[1,2]' })).status, 400); assert.equal((await call('POST', '/event', { body: 'x'.repeat(300001) })).status, 413);
  const rows = env.DB.raw.prepare('SELECT k FROM counters').all(); assert.ok(rows.length > 0 && rows.every(r => r.k.length < 40));
});

test('marcadores: mejor puntuación por jugador, orden, apodo por defecto y límites', async () => {
  const { call } = mk(), q = '?mode=daily&key=2026-10-12';
  const post = (id, score, nick) => call('POST', '/score', { body: { id, nick, mode: 'daily', key: '2026-10-12', score } });
  await post('ana', 500, 'Ana'); await post('ana', 300, 'Ana'); await post('luis', 800, ''); await post('bob', 650, 'Bob<>');
  const t = (await call('GET', '/scores' + q)).body.top; assert.deepEqual(t.map(x => x.score), [800, 650, 500], 'ana conserva su mejor'); assert.deepEqual(t.map(x => x.nick), ['PILOT-LUIS', 'Bob', 'Ana']);
  assert.equal((await post('x', -1)).status, 400); assert.equal((await post('x', 2e6)).status, 400); assert.equal((await post('', 5)).status, 400);
  assert.equal((await call('GET', '/scores' + q + '&limit=1')).body.top.length, 1); assert.deepEqual((await call('GET', '/scores?mode=nada')).body.top, []);
});

test('guardado en la nube: crear, leer, sobrescribir con su código, rechazar basura', async () => {
  const { call } = mk(), data = 'C2H1.' + Buffer.from('{"v":2}').toString('base64');
  const c = (await call('POST', '/save', { body: { data } })).body.code; assert.match(c, /^[0-9A-F]{10}$/);
  assert.equal((await call('GET', '/save/' + c.toLowerCase())).body.data, data);
  assert.equal((await call('POST', '/save', { body: { data: data + 'x', code: c } })).body.code, c); assert.equal((await call('GET', '/save/' + c)).body.data, data + 'x');
  assert.equal((await call('GET', '/save/ZZZZ')).status, 404); assert.equal((await call('POST', '/save', { body: { data: 'hola' } })).status, 400);
  assert.equal((await call('POST', '/save', { body: { data: 'C2H1.' + 'x'.repeat(200001) } })).status, 400);
  const c2 = (await call('POST', '/save', { body: { data } })).body.code; assert.notEqual(c2, c, 'cada guardado nuevo recibe un código distinto');
});

test('limpieza programada: caducan guardados (365 d), marcadores (120 d) y contadores (400 d), y solo eso', async () => {
  const { env, call } = mk(), t0 = Date.parse('2026-01-01T00:00:00Z'), day = 86400000, data = 'C2H1.AAAA';
  const c = (await call('POST', '/save', { now: t0, body: { data } })).body.code;
  await call('POST', '/score', { now: t0, body: { id: 'old', mode: 'daily', key: 'k', score: 1 } }); await call('POST', '/event', { now: t0, body: { id: 'p', ev: 'level_end', v: '1', lang: 'en' } });
  await H.purge(env, t0 + 100 * day); assert.equal((await call('GET', '/save/' + c)).status, 200); assert.equal((await call('GET', '/scores?mode=daily&key=k')).body.top.length, 1);
  await H.purge(env, t0 + 130 * day); assert.equal((await call('GET', '/scores?mode=daily&key=k')).body.top.length, 0, 'marcador caducado'); assert.equal((await call('GET', '/save/' + c)).status, 200);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) c FROM counters').get().c > 0, true);
  await H.purge(env, t0 + 370 * day); assert.equal((await call('GET', '/save/' + c)).status, 404, 'guardado caducado');
  await H.purge(env, t0 + 410 * day); assert.equal(env.DB.raw.prepare('SELECT COUNT(*) c FROM counters').get().c, 0); assert.equal(env.DB.raw.prepare('SELECT COUNT(*) c FROM dau').get().c, 0);
});

test('límite de tasa: 60 peticiones/min por IP, otra IP no se ve afectada, y se libera pasado el minuto', async () => {
  const { call } = mk(), now = Date.parse('2026-10-12T10:00:00Z');
  for (let i = 0; i < 60; i++) assert.equal((await call('GET', '/scores', { ip: '9.9.9.9', now })).status, 200);
  assert.equal((await call('GET', '/scores', { ip: '9.9.9.9', now })).status, 429); assert.equal((await call('GET', '/scores', { ip: '8.8.8.8', now })).status, 200);
  assert.equal((await call('GET', '/scores', { ip: '9.9.9.9', now: now + 61000 })).status, 200);
});

test('esquema: idempotente (se puede ejecutar dos veces) y sin datos personales', () => {
  const db = d1().raw, sql = require('fs').readFileSync(require('path').join(__dirname, '..', 'cloudflare', 'schema.sql'), 'utf8'); assert.doesNotThrow(() => db.exec(sql));
  const cols = db.prepare("SELECT m.name t, p.name c FROM sqlite_master m, pragma_table_info(m.name) p WHERE m.type = 'table'").all().map(r => r.t + '.' + r.c);
  assert.ok(!cols.some(c => /ip|email|name$|device/i.test(c.split('.')[1])), 'columnas: ' + cols);
});
