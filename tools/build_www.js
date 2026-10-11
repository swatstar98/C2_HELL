// Copia solo lo necesario para la app (sin node_modules, servidor, herramientas ni carpetas nativas) a www/ para Capacitor.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'www');
const FILES = ['index.html', 'sw.js', 'style.css', 'game.js', 'i18n.js', 'config.js', 'maps.js', 'maps2.js', 'manifest.webmanifest'];
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const cp = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
for (const f of FILES) cp(path.join(root, f), path.join(out, f));
for (const f of fs.readdirSync(path.join(root, 'lang'))) cp(path.join(root, 'lang', f), path.join(out, 'lang', f));
for (const f of fs.readdirSync(path.join(root, 'assets/fonts'))) cp(path.join(root, 'assets/fonts', f), path.join(out, 'assets/fonts', f));
for (const f of fs.readdirSync(path.join(root, 'icons'))) cp(path.join(root, 'icons', f), path.join(out, 'icons', f));
console.log('www/ listo (' + fs.readdirSync(out).length + ' entradas)');
