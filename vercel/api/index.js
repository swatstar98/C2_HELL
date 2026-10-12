// Punto de entrada único de Vercel (vercel.json reescribe todas las rutas aquí con ?p=<ruta>).
'use strict';
const { handle } = require('../lib/handler'), { redis } = require('../lib/redis');
let store; const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Cache-Control': 'no-store' };
module.exports = async (req, res) => {
  const send = (c, o) => { res.writeHead(c, Object.assign({ 'Content-Type': 'application/json' }, cors)); res.end(c === 204 ? undefined : JSON.stringify(o)); };
  try {
    const u = new URL(req.url, 'http://x'), p = u.searchParams.get('p'); u.searchParams.delete('p');
    const path = '/' + String(p != null ? p : u.pathname.replace(/^\/(api\/index)?/, '')).replace(/^\/+/, '').replace(/\/+$/, '');
    let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { return send(400, { error: 'bad' }); } }
    store = store || redis();
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
    const r = await handle({ method: req.method, path, query: u.searchParams, body, ip, auth: req.headers.authorization || '', store, env: process.env });
    send(r.status, r.body);
  } catch (e) { console.error(e && e.message); send(500, { error: 'server' }); }
};
