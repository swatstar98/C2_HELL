// Adaptador mínimo de la API de D1 (prepare/bind/run/all/first/batch) sobre node:sqlite, ejecutando el schema.sql real.
const fs = require('fs'), path = require('path');
module.exports = function d1() {
  const { DatabaseSync } = require('node:sqlite'), db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'schema.sql'), 'utf8'));
  const stmt = (sql, args) => ({
    bind: (...a) => stmt(sql, a),
    run: async () => { const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes) } }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    first: async () => db.prepare(sql).get(...args) || null
  });
  return {
    raw: db, prepare: sql => stmt(sql, []),
    async batch(list) { db.exec('BEGIN'); try { const out = []; for (const s of list) out.push(await s.run()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } }
  };
};
