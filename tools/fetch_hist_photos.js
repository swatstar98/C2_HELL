#!/usr/bin/env node
/* Descarga las fotos de hist/img/manifest.json (solo las entradas con "url") a hist/img/<campaña>_<ficha>.jpg
 * y escribe los créditos en hist/img/credits.js (window.C2_PHOTOS), que el juego fusiona en C.photos.  Uso: node tools/fetch_hist_photos.js */
const fs = require('fs'), path = require('path'), https = require('https');
const dir = path.join(__dirname, '..', 'hist', 'img'), man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const get = (u, n = 0) => new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': 'C2HELL-asset-fetch/1.0 (contact: project owner)' } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 5) return res(get(new URL(r.headers.location, u).href, n + 1));
  if (r.statusCode !== 200) return rej(new Error(u + ' → ' + r.statusCode));
  const b = []; r.on('data', d => b.push(d)); r.on('end', () => res(Buffer.concat(b)));
}).on('error', rej));
(async () => {
  let sharp = null; try { sharp = require('sharp'); } catch (e) { /* sin redimensionado */ }
  const credits = {};
  for (const camp in man) for (const k in man[camp]) {
    const e = man[camp][k]; if (!e.url) continue;
    try {
      let buf = await get(e.url); if (sharp) buf = await sharp(buf).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer();
      fs.writeFileSync(path.join(dir, camp + '_' + k + '.jpg'), buf); (credits[camp] = credits[camp] || {})[k] = e.credit || ''; console.log('OK ', camp, k, buf.length, 'bytes');
    } catch (err) { console.error('ERR', camp, k, err.message); }
  }
  fs.writeFileSync(path.join(dir, 'credits.js'), '/* generado por tools/fetch_hist_photos.js */\nwindow.C2_PHOTOS = ' + JSON.stringify(credits, null, 1) + ';\n');
})();
