// Mismo contrato que server/server.js (el cliente no cambia), pero sin estado propio: todo vive en Redis.
//   GET  /health
//   POST /event   {id,ev,v,lang,d}        telemetría anónima → contadores diarios + usuarios únicos + últimos eventos
//   POST /score   {id,nick,mode,key,score}
//   GET  /scores  ?mode=&key=&limit=
//   POST /save    {data,code?} → {code}   guardado en la nube (el código ES la credencial)
//   GET  /save/CODE → {data}
//   GET  /stats   (cabecera Authorization: Bearer <ADMIN_TOKEN>)  resumen de telemetría
'use strict';
const crypto = require('crypto');
const clean = (s, n) => String(s == null ? '' : s).replace(/[^\w .\-áéíóúñüçãõâêôàèìòùäöß]/gi, '').slice(0, n);
const day = (t) => new Date(t || Date.now()).toISOString().slice(0, 10);
const TTL = { rate: 60, stat: 400 * 86400, board: 120 * 86400, save: 365 * 86400, recent: 0 };
const RATE_MAX = 60, RECENT_MAX = 2000;

async function handle(ctx) {
  // ctx = { method, path, query: URLSearchParams, body, ip, auth, store, env, now }
  const { method, path, query, store } = ctx, now = ctx.now || Date.now(), env = ctx.env || {};
  const ok = (o, c) => ({ status: c || 200, body: o || {} });
  if (method === 'OPTIONS') return ok({}, 204);
  if (method === 'GET' && path === '/health') return ok({ ok: true });

  // límite de tasa: ventana fija de 60 s por IP. Se guarda un hash de la IP durante 60 s y nada más (ver política de privacidad)
  const ipk = 'rl:' + crypto.createHash('sha256').update(String(ctx.ip || '?') + day(now)).digest('hex').slice(0, 16);
  const [n] = await store.pipeline([['INCR', ipk], ['EXPIRE', ipk, TTL.rate]]);
  if (n > RATE_MAX) return ok({ error: 'rate' }, 429);

  if (method === 'POST' && path === '/event') {
    const b = ctx.body || {}, id = clean(b.id, 24), ev = clean(b.ev, 24), v = clean(b.v, 12), lang = clean(b.lang, 4);
    if (!id || !ev) return ok({ error: 'args' }, 400);
    const d = day(now), sk = 'st:' + d, cmds = [['HINCRBY', sk, 'ev:' + ev, 1], ['HINCRBY', sk, 'lang:' + lang, 1], ['HINCRBY', sk, 'ver:' + v, 1], ['PFADD', 'dau:' + d, id], ['EXPIRE', sk, TTL.stat], ['EXPIRE', 'dau:' + d, TTL.stat]];
    const x = b.d && typeof b.d === 'object' ? b.d : {};
    // el desglose por nivel/misión es lo que más sirve para equilibrar el juego: nº de partidas y victorias por nivel
    const lvl = ev === 'level_end' ? 'L' + clean(x.n, 4) : ev === 'hist_end' ? clean(x.camp, 8) + clean(x.m, 3) : ev === 'mode_end' ? clean(x.m, 8) : '';
    if (lvl) { cmds.push(['HINCRBY', sk, ev + ':' + lvl + ':' + (x.win ? 'win' : 'loss'), 1]); }
    if (env.KEEP_RECENT === '1') cmds.push(['LPUSH', 'recent', JSON.stringify({ t: now, id, ev, v, lang, d: JSON.stringify(x).slice(0, 300) })], ['LTRIM', 'recent', 0, RECENT_MAX - 1]);   // opcional: gasta 2 comandos más por evento
    await store.pipeline(cmds); return ok({ ok: true });
  }

  if (method === 'POST' && path === '/score') {
    const b = ctx.body || {}, sc = Math.round(+b.score); if (!(sc >= 0 && sc <= 1e6)) return ok({ error: 'score' }, 400);
    const mode = clean(b.mode, 12), key = clean(b.key, 16), id = clean(b.id, 24); if (!mode || !id) return ok({ error: 'args' }, 400);
    const board = 'sc:' + mode + '|' + key, nick = clean(b.nick, 12) || 'PILOT-' + id.slice(0, 4).toUpperCase();
    await store.pipeline([['ZADD', board, 'GT', sc, id], ['EXPIRE', board, TTL.board], ['HSET', 'nick', id, nick]]); return ok({ ok: true });
  }
  if (method === 'GET' && path === '/scores') {
    const board = 'sc:' + clean(query.get('mode'), 12) + '|' + clean(query.get('key'), 16), lim = Math.max(1, Math.min(50, +query.get('limit') || 20));
    const [rows] = await store.pipeline([['ZRANGE', board, 0, lim - 1, 'REV', 'WITHSCORES']]);
    const ids = [], scs = []; for (let i = 0; i < rows.length; i += 2) { ids.push(rows[i]); scs.push(+rows[i + 1]); }
    const nicks = ids.length ? (await store.pipeline([['HMGET', 'nick', ...ids]]))[0] : [];
    return ok({ top: ids.map((id, i) => ({ nick: (nicks && nicks[i]) || 'PILOT-' + id.slice(0, 4).toUpperCase(), score: scs[i] })) });
  }

  if (method === 'POST' && path === '/save') {
    const b = ctx.body || {}; if (typeof b.data !== 'string' || b.data.length > 200000 || b.data.slice(0, 5) !== 'C2H1.') return ok({ error: 'data' }, 400);
    let code = clean(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) { for (let i = 0; i < 5; i++) { const c = crypto.randomBytes(5).toString('hex').toUpperCase(), [r] = await store.pipeline([['SET', 'save:' + c, JSON.stringify({ data: b.data, t: now }), 'EX', TTL.save, 'NX']]); if (r === 'OK') { code = c; break; } } if (!code) return ok({ error: 'busy' }, 503); }
    else await store.pipeline([['SET', 'save:' + code, JSON.stringify({ data: b.data, t: now }), 'EX', TTL.save]]);
    return ok({ code });
  }
  const m = /^\/save\/([A-Za-z0-9]{1,12})$/.exec(path);
  if (method === 'GET' && m) { const [r] = await store.pipeline([['GET', 'save:' + m[1].toUpperCase()]]); if (!r) return ok({ error: 'nf' }, 404); return ok({ data: JSON.parse(r).data }); }

  if (method === 'GET' && path === '/stats') {
    const tok = env.ADMIN_TOKEN || ''; if (!tok || ctx.auth !== 'Bearer ' + tok) return ok({ error: 'auth' }, 401);
    const days = Math.max(1, Math.min(60, +query.get('days') || 14)), ds = []; for (let i = 0; i < days; i++) ds.push(day(now - i * 86400000));
    const res = await store.pipeline(ds.flatMap(d => [['HGETALL', 'st:' + d], ['PFCOUNT', 'dau:' + d]]));
    const out = ds.map((d, i) => { const h = res[2 * i] || {}, o = {}; if (Array.isArray(h)) for (let k = 0; k < h.length; k += 2) o[h[k]] = +h[k + 1]; else Object.assign(o, h); return { day: d, players: res[2 * i + 1] || 0, counts: o }; });
    return ok({ days: out });
  }
  return ok({ error: 'nf' }, 404);
}
module.exports = { handle, clean };
