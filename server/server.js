// Servidor de referencia (sin dependencias) para los extras online opcionales de C2 HELL:
//   POST /event      telemetría anónima (solo si el jugador activa «Funciones online»)
//   POST /score      {id,nick,mode,key,score}  → marcadores (mejor puntuación por jugador y tabla)
//   GET  /scores     ?mode=daily&key=2026-10-11&limit=20
//   POST /save       {data,code?} → {code}      guardado en la nube por código (el código ES la credencial: no hay cuentas)
//   GET  /save/:code → {data}
// Uso: node server/server.js   (PORT=8787 DATA_DIR=./server/data). Los datos se guardan en ficheros JSON/NDJSON.
// LIMITACIONES: sin cuentas ni autenticación; las puntuaciones las envía el cliente y NO son a prueba de trampas.
// Para producción ponlo detrás de HTTPS (reverse proxy) y revisa los límites de tasa.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = +process.env.PORT || 8787, DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DIR, { recursive: true });
const F = { scores: path.join(DIR, 'scores.json'), saves: path.join(DIR, 'saves.json'), events: path.join(DIR, 'events.ndjson') };
const load = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return {}; } };
let scores = load(F.scores), saves = load(F.saves);
const flush = () => { fs.writeFileSync(F.scores, JSON.stringify(scores)); fs.writeFileSync(F.saves, JSON.stringify(saves)); };
const hits = new Map();   // límite de tasa muy simple: 60 peticiones/min por IP
function limited(ip) { const n = Date.now(), a = (hits.get(ip) || []).filter(t => n - t < 60000); a.push(n); hits.set(ip, a); return a.length > 60; }
const clean = (s, n) => String(s == null ? '' : s).replace(/[^\w .\-áéíóúñüçãõâêôàèìòùäöß]/gi, '').slice(0, n);
function body(req) { return new Promise((res, rej) => { let b = ''; req.on('data', c => { b += c; if (b.length > 300000) { rej(new Error('big')); req.destroy(); } }); req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { rej(e); } }); }); }
http.createServer(async (req, res) => {
  const send = (c, o) => { res.writeHead(c, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }); res.end(JSON.stringify(o)); };
  if (req.method === 'OPTIONS') return send(204, {});
  const ip = req.socket.remoteAddress || '?'; if (limited(ip)) return send(429, { error: 'rate' });
  const u = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && u.pathname === '/health') return send(200, { ok: true });
    if (req.method === 'POST' && u.pathname === '/event') { const b = await body(req); fs.appendFile(F.events, JSON.stringify({ t: Date.now(), id: clean(b.id, 24), ev: clean(b.ev, 24), v: clean(b.v, 12), lang: clean(b.lang, 4), d: b.d }) + '\n', () => {}); return send(200, { ok: true }); }
    if (req.method === 'POST' && u.pathname === '/score') {
      const b = await body(req), sc = Math.round(+b.score); if (!(sc >= 0 && sc <= 1e6)) return send(400, { error: 'score' });
      const mode = clean(b.mode, 12), key = clean(b.key, 16), id = clean(b.id, 24); if (!mode || !id) return send(400, { error: 'args' });
      const k = mode + '|' + key, t = scores[k] = scores[k] || {}, prev = t[id];
      if (!prev || sc > prev.score) t[id] = { score: sc, nick: clean(b.nick, 12) || 'PILOT-' + id.slice(0, 4).toUpperCase(), t: Date.now() };
      flush(); return send(200, { ok: true });
    }
    if (req.method === 'GET' && u.pathname === '/scores') {
      const t = scores[clean(u.searchParams.get('mode'), 12) + '|' + clean(u.searchParams.get('key'), 16)] || {}, lim = Math.min(50, +u.searchParams.get('limit') || 20);
      return send(200, { top: Object.values(t).sort((a, b) => b.score - a.score).slice(0, lim).map(x => ({ nick: x.nick, score: x.score })) });
    }
    if (req.method === 'POST' && u.pathname === '/save') {
      const b = await body(req); if (typeof b.data !== 'string' || b.data.length > 200000 || b.data.slice(0, 5) !== 'C2H1.') return send(400, { error: 'data' });
      let code = clean(b.code, 12).toUpperCase().replace(/[^A-Z0-9]/g, ''); if (!code) { do { code = crypto.randomBytes(5).toString('hex').toUpperCase(); } while (saves[code]); }
      saves[code] = { data: b.data, t: Date.now() }; flush(); return send(200, { code });
    }
    const m = /^\/save\/([A-Za-z0-9]{1,12})$/.exec(u.pathname);
    if (req.method === 'GET' && m) { const r = saves[m[1].toUpperCase()]; return r ? send(200, { data: r.data }) : send(404, { error: 'nf' }); }
    send(404, { error: 'nf' });
  } catch (e) { send(400, { error: 'bad' }); }
}).listen(PORT, () => console.log('C2 HELL server en :' + PORT + ' · datos en ' + DIR));
