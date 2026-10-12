// Redis en memoria con solo los comandos que usa vercel/lib/handler.js (para probar sin red). Imita el formato de Upstash.
module.exports = function fakeRedis() {
  const kv = new Map(), exp = new Map(); let clock = Date.now();
  const alive = k => { const e = exp.get(k); if (e !== undefined && e <= clock) { kv.delete(k); exp.delete(k); } return kv.has(k); };
  const C = {
    INCR: ([k]) => { alive(k); const v = (kv.get(k) || 0) + 1; kv.set(k, v); return v; },
    EXPIRE: ([k, s]) => { if (!alive(k)) return 0; exp.set(k, clock + s * 1000); return 1; },
    SET: ([k, v, ...o]) => { if (o.includes('NX') && alive(k)) return null; kv.set(k, v); const i = o.indexOf('EX'); if (i >= 0) exp.set(k, clock + o[i + 1] * 1000); return 'OK'; },
    GET: ([k]) => alive(k) ? kv.get(k) : null,
    HINCRBY: ([k, f, n]) => { alive(k); const h = kv.get(k) || {}; h[f] = (h[f] || 0) + +n; kv.set(k, h); return h[f]; },
    HSET: ([k, f, v]) => { alive(k); const h = kv.get(k) || {}; h[f] = v; kv.set(k, h); return 1; },
    HMGET: ([k, ...fs]) => { const h = alive(k) ? kv.get(k) : {}; return fs.map(f => h[f] === undefined ? null : h[f]); },
    HGETALL: ([k]) => { const h = alive(k) ? kv.get(k) : {}; return Object.entries(h).flatMap(([f, v]) => [f, String(v)]); },
    PFADD: ([k, ...m]) => { alive(k); const s = kv.get(k) || new Set(); m.forEach(x => s.add(x)); kv.set(k, s); return 1; },
    PFCOUNT: ([k]) => alive(k) ? kv.get(k).size : 0,
    LPUSH: ([k, ...v]) => { alive(k); const l = kv.get(k) || []; v.forEach(x => l.unshift(x)); kv.set(k, l); return l.length; },
    LTRIM: ([k, a, b]) => { const l = kv.get(k) || []; kv.set(k, l.slice(+a, +b + 1)); return 'OK'; },
    ZADD: ([k, ...a]) => { alive(k); const z = kv.get(k) || new Map(); let gt = false; if (a[0] === 'GT') { gt = true; a.shift(); } const sc = +a[0], m = a[1]; if (!z.has(m) || !gt || sc > z.get(m)) z.set(m, sc); kv.set(k, z); return 1; },
    ZRANGE: ([k, a, b, ...o]) => { const z = alive(k) ? kv.get(k) : new Map(); let r = [...z.entries()].sort((x, y) => x[1] - y[1]); if (o.includes('REV')) r.reverse(); r = r.slice(+a, +b + 1); return o.includes('WITHSCORES') ? r.flatMap(([m, s]) => [m, String(s)]) : r.map(x => x[0]); }
  };
  return { advance(ms) { clock += ms; }, kv, async pipeline(cmds) { return cmds.map(([c, ...a]) => { if (!C[c]) throw new Error('fake redis: comando no soportado ' + c); return C[c](a.map(x => x)); }); } };
};
