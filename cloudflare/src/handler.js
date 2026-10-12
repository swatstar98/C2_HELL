// Mismo contrato que server/server.js (el cliente no cambia), sobre Cloudflare D1.
//   GET  /health
//   POST /event   {id,ev,v,lang,d}        telemetría anónima → contadores diarios + jugadores únicos
//   POST /score   {id,nick,mode,key,score}      GET /scores?mode=&key=&limit=
//   POST /save    {data,code?} → {code}         GET /save/CODE → {data}     (el código ES la credencial)
//   GET  /stats?days=14   con  Authorization: Bearer <ADMIN_TOKEN>
// Solo usa APIs estándar (Request/Response/crypto) y la interfaz de D1 (prepare/bind/run/all/first/batch), así se prueba también con SQLite local.
const clean = (s, n) => String(s == null ? '' : s).replace(/[^\w .\-áéíóúñüçãõâêôàèìòùäöß]/gi, '').slice(0, n);
const day = t => new Date(t).toISOString().slice(0, 10);
export const RETENTION = { save: 365, board: 120, stat: 400 };   // días
const RATE_MAX = 60, hits = new Map();   // límite de tasa por IP en memoria del isolate (solo mejora de mejor esfuerzo; ver README para la regla de WAF)

const J = (o, status) => new Response(status === 204 ? null : JSON.stringify(o || {}), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Cache-Control': 'no-store' } });
function limited(ip, now) {
  const a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 60000) hits.delete(k);
  return a.length > RATE_MAX;
}
const upsert = (db, d, k) => db.prepare('INSERT INTO counters (day, k, n) VALUES (?, ?, 1) ON CONFLICT (day, k) DO UPDATE SET n = n + 1').bind(d, k);
const same = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const hex = n => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); };

export async function handle(req, env, now, ip) {
  now = now || Date.now(); const u = new URL(req.url), path = '/' + u.pathname.replace(/^\/+|\/+$/g, ''), method = req.method, db = env.DB, q = u.searchParams;
  if (method === 'OPTIONS') return J({}, 204);
  if (method === 'GET' && path === '/health') return J({ ok: true });
  if (limited(ip || req.headers.get('cf-connecting-ip') || '?', now)) return J({ error: 'rate' }, 429);
  let body = {};
  if (method === 'POST') { const t = await req.text(); if (t.length > 300000) return J({ error: 'big' }, 413); try { body = t ? JSON.parse(t) : {}; } catch (e) { return J({ error: 'bad' }, 400); } if (!body || typeof body !== 'object') return J({ error: 'bad' }, 400); }

  if (method === 'POST' && path === '/event') {
    const id = clean(body.id, 24), ev = clean(body.ev, 24), v = clean(body.v, 12), lang = clean(body.lang, 4);
    if (!id || !ev) return J({ error: 'args' }, 400);
    const d = day(now), x = body.d && typeof body.d === 'object' ? body.d : {};
    // desglose por nivel/misión: lo que más sirve para equilibrar la dificultad (partidas y victorias por nivel)
    const lvl = ev === 'level_end' ? 'L' + clean(x.n, 4) : ev === 'hist_end' ? clean(x.camp, 8) + clean(x.m, 3) : ev === 'mode_end' ? clean(x.m, 8) : '';
    const st = [db.prepare('INSERT OR IGNORE INTO dau (day, id) VALUES (?, ?)').bind(d, id), upsert(db, d, 'ev:' + ev), upsert(db, d, 'lang:' + lang), upsert(db, d, 'ver:' + v)];
    if (lvl) st.push(upsert(db, d, ev + ':' + lvl + ':' + (x.win ? 'win' : 'loss')));
    await db.batch(st); return J({ ok: true });
  }
  if (method === 'POST' && path === '/score') {
    const sc = Math.round(+body.score); if (!(sc >= 0 && sc <= 1e6)) return J({ error: 'score' }, 400);
    const mode = clean(body.mode, 12), key = clean(body.key, 16), id = clean(body.id, 24); if (!mode || !id) return J({ error: 'args' }, 400);
    const nick = clean(body.nick, 12) || 'PILOT-' + id.slice(0, 4).toUpperCase();
    await db.prepare('INSERT INTO scores (board, id, score, nick, t) VALUES (?, ?, ?, ?, ?) ON CONFLICT (board, id) DO UPDATE SET score = excluded.score, nick = excluded.nick, t = excluded.t WHERE excluded.score > scores.score').bind(mode + '|' + key, id, sc, nick, now).run();
    return J({ ok: true });
  }
  if (method === 'GET' && path === '/scores') {
    const lim = Math.max(1, Math.min(50, +q.get('limit') || 20)), board = clean(q.get('mode'), 12) + '|' + clean(q.get('key'), 16);
    const r = await db.prepare('SELECT nick, score FROM scores WHERE board = ? ORDER BY score DESC, t ASC LIMIT ?').bind(board, lim).all();
    return J({ top: (r.results || []).map(x => ({ nick: x.nick, score: x.score })) });
  }
  if (method === 'POST' && path === '/save') {
    if (typeof body.data !== 'string' || body.data.length > 200000 || body.data.slice(0, 5) !== 'C2H1.') return J({ error: 'data' }, 400);
    let code = clean(body.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code) await db.prepare('INSERT INTO saves (code, data, t) VALUES (?, ?, ?) ON CONFLICT (code) DO UPDATE SET data = excluded.data, t = excluded.t').bind(code, body.data, now).run();
    else {
      for (let i = 0; i < 5 && !code; i++) { const c = hex(5), r = await db.prepare('INSERT OR IGNORE INTO saves (code, data, t) VALUES (?, ?, ?)').bind(c, body.data, now).run(); if (r.meta && r.meta.changes === 1) code = c; }
      if (!code) return J({ error: 'busy' }, 503);
    }
    return J({ code });
  }
  const m = /^\/save\/([A-Za-z0-9]{1,12})$/.exec(path);
  if (method === 'GET' && m) { const r = await db.prepare('SELECT data FROM saves WHERE code = ?').bind(m[1].toUpperCase()).first(); return r ? J({ data: r.data }) : J({ error: 'nf' }, 404); }

  if (method === 'GET' && path === '/stats') {
    const tok = env.ADMIN_TOKEN || ''; if (!tok || !same(req.headers.get('Authorization') || '', 'Bearer ' + tok)) return J({ error: 'auth' }, 401);
    const days = Math.max(1, Math.min(60, +q.get('days') || 14)), from = day(now - (days - 1) * 86400000);
    const [c, p] = await Promise.all([db.prepare('SELECT day, k, n FROM counters WHERE day >= ?').bind(from).all(), db.prepare('SELECT day, COUNT(*) AS c FROM dau WHERE day >= ? GROUP BY day').bind(from).all()]);
    const out = []; for (let i = 0; i < days; i++) out.push({ day: day(now - i * 86400000), players: 0, counts: {} });
    const ix = Object.fromEntries(out.map(o => [o.day, o]));
    for (const r of c.results || []) if (ix[r.day]) ix[r.day].counts[r.k] = r.n;
    for (const r of p.results || []) if (ix[r.day]) ix[r.day].players = r.c;
    return J({ days: out });
  }
  return J({ error: 'nf' }, 404);
}

// Limpieza programada (cron diario): borra lo que supera la retención
export async function purge(env, now) {
  now = now || Date.now(); const db = env.DB, ms = 86400000;
  await db.batch([
    db.prepare('DELETE FROM saves WHERE t < ?').bind(now - RETENTION.save * ms),
    db.prepare('DELETE FROM scores WHERE t < ?').bind(now - RETENTION.board * ms),
    db.prepare('DELETE FROM counters WHERE day < ?').bind(day(now - RETENTION.stat * ms)),
    db.prepare('DELETE FROM dau WHERE day < ?').bind(day(now - RETENTION.stat * ms))
  ]);
}
