// Genera los iconos PWA y los recursos de Capacitor Assets a partir de tools/icon*.svg (usa Playwright + Chromium).
// Uso: node tools/make_icons.js   (requiere `playwright` instalado)
const fs = require('fs'), path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const root = path.join(__dirname, '..');
const svg = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
  const shot = async (html, w, h, out, transparent) => {
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    await pg.setContent('<style>html,body{margin:0;background:' + (transparent ? 'transparent' : '#07110f') + '}svg{width:' + w + 'px;height:' + h + 'px;display:block}</style>' + html);
    await pg.screenshot({ path: path.join(root, out), omitBackground: !!transparent }); await pg.close();
  };
  const full = svg('icon.svg'), fg = svg('icon_fg.svg');
  for (const [s, o] of [[192, 'icons/icon-192.png'], [512, 'icons/icon-512.png'], [180, 'icons/apple-touch-icon.png'], [1024, 'assets/icon-only.png']]) await shot(full, s, s, o);
  // maskable: el diseño completo ya deja el contenido dentro de la zona segura (80 %)
  await shot(full, 512, 512, 'icons/maskable-512.png');
  await shot(fg, 1024, 1024, 'assets/icon-foreground.png', true);
  await shot('<div style="width:1024px;height:1024px;background:#07110f"></div>', 1024, 1024, 'assets/icon-background.png');
  const splash = '<div style="width:2732px;height:2732px;background:#07110f;display:flex;align-items:center;justify-content:center"><div style="width:900px;height:900px">' + full.replace('<svg ', '<svg style="width:100%;height:100%" ') + '</div></div>';
  await shot(splash, 2732, 2732, 'assets/splash.png'); await shot(splash, 2732, 2732, 'assets/splash-dark.png');
  await b.close(); console.log('iconos generados');
})();
