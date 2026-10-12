// Utilidades comunes de la suite: servidor estático efímero + Chromium de Playwright.
// Playwright: el de node_modules del repo; en CI/entornos sin él se puede fijar C2_CHROMIUM=/ruta/chromium.
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rs) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.normalize(path.join(root, p));
      if (!f.startsWith(root) || /[\\/](node_modules|android|ios|\.git|server|tests)[\\/]/.test(f)) { rs.writeHead(403); return rs.end(); }
      fs.readFile(f, (e, d) => { if (e) { rs.writeHead(404); return rs.end('404'); } rs.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); rs.end(d); });
    }).listen(0, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + srv.address().port + '/', close: () => srv.close() }));
  });
}

async function browser() {
  const { chromium } = require('playwright');
  const o = { args: ['--autoplay-policy=no-user-gesture-required'] };
  if (process.env.C2_CHROMIUM) o.executablePath = process.env.C2_CHROMIUM;
  return chromium.launch(o);
}

// Abre una página nueva y recoge errores (pageerror + console.error). q = query string, p. ej. 'lang=en&unlock'.
async function open(b, base, q, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: opt.w || 420, height: opt.h || 860 }, hasTouch: true });
  if (opt.init) await ctx.addInitScript(opt.init);
  // opt.store: sirve config.js con la tienda activada, como hace `build_www.js --store` en la build de tienda
  if (opt.store) await ctx.route('**/config.js', async r => { const t = await (await r.fetch()).text(); await r.fulfill({ contentType: 'text/javascript', body: t.replace('enabled: false', 'enabled: true') }); });
  const pg = await ctx.newPage(); pg.errs = [];
  pg.on('pageerror', e => pg.errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') pg.errs.push('console: ' + m.text()); });
  await pg.goto(base + 'index.html?' + (q || ''));
  await pg.waitForFunction(() => window.__C2 && window.__C2.SET, null, { timeout: 15000 });
  return pg;
}
module.exports = { root, serve, browser, open };
