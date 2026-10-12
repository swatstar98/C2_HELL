import { handle, purge } from './handler.js';
export default {
  async fetch(req, env) {
    try { return await handle(req, env, Date.now(), req.headers.get('cf-connecting-ip')); }
    catch (e) { console.error(e && e.message); return new Response('{"error":"server"}', { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(purge(env)); }
};
