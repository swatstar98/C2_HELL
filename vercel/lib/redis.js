// Cliente mínimo de Upstash Redis por REST (sin dependencias). Con la integración de Vercel Marketplace las variables se llaman
// KV_REST_API_URL / KV_REST_API_TOKEN (o UPSTASH_REDIS_REST_URL / _TOKEN): se aceptan ambas.
'use strict';
function redis(env) {
  env = env || process.env;
  const url = (env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, ''), token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || '';
  if (!url || !token) throw new Error('Falta la base de datos: define KV_REST_API_URL y KV_REST_API_TOKEN (Upstash Redis).');
  // pipeline([[ 'SET', 'k', 'v' ], ['GET', 'k']]) → [valor1, valor2]  (una sola petición HTTP)
  return {
    async pipeline(cmds) {
      const r = await fetch(url + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
      if (!r.ok) throw new Error('redis http ' + r.status);
      const out = await r.json(); return out.map(o => { if (o.error) throw new Error('redis: ' + o.error); return o.result; });
    }
  };
}
module.exports = { redis };
