// Copia solo lo necesario para la app (sin node_modules, servidor, herramientas ni carpetas nativas) a www/ para Capacitor.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
const FILES = ['index.html', 'sw.js', 'style.css', 'game.js', 'intro.js', 'i18n.js', 'config.js', 'maps.js', 'maps2.js', 'maps_hist.js', 'manifest.webmanifest'];
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const cp = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
for (const f of FILES) cp(path.join(root, f), path.join(out, f));
for (const f of fs.readdirSync(path.join(root, 'lang'))) cp(path.join(root, 'lang', f), path.join(out, 'lang', f));
const copyDir = (a, b2) => { for (const f of fs.readdirSync(a)) { const s2 = path.join(a, f); if (fs.statSync(s2).isDirectory()) copyDir(s2, path.join(b2, f)); else cp(s2, path.join(b2, f)); } };
copyDir(path.join(root, 'hist'), path.join(out, 'hist'));
for (const f of fs.readdirSync(path.join(root, 'assets/fonts'))) cp(path.join(root, 'assets/fonts', f), path.join(out, 'assets/fonts', f));
for (const f of fs.readdirSync(path.join(root, 'icons'))) cp(path.join(root, 'icons', f), path.join(out, 'icons', f));
// --store (o C2_STORE=1) activa la tienda (juego completo + packs) en la build nativa; sin ello la app sale con todo desbloqueado.
if ((process.env.C2_STORE === '1' || process.argv.includes('--store'))) {
  const f = path.join(out, 'config.js'); const t = fs.readFileSync(f, 'utf8');
  if (!/enabled: false/.test(t)) throw new Error('config.js: no se encuentra store.enabled:false');
  fs.writeFileSync(f, t.replace('enabled: false', 'enabled: true')); console.log('Tienda ACTIVADA en www/config.js');
}
console.log('www/ listo (' + fs.readdirSync(out).length + ' entradas)');
