// Feature graphic 1024x500 (Google Play). Usa la captura de operación ya generada. Uso: node tools/store_graphic.js [lang]
const path = require('path'), fs = require('fs'); let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const root = path.resolve(__dirname, '..'), L = process.argv[2] || 'en';
const T = { es: 'Defiende el cielo. Reescribe la historia.', en: 'Defend the sky. Relive history.', fr: 'Défendez le ciel. Revivez l’histoire.', de: 'Verteidige den Himmel. Erlebe Geschichte.', pt: 'Defenda o céu. Reviva a história.' };
const tmp = path.join(root, 'store', '.tmp_feature.html');
const img = 'file://' + root + '/store/shots/' + L + '_4_operation.png';
const html = `<body style="margin:0;width:1024px;height:500px;background:linear-gradient(120deg,#05090f,#0e1c2b);font-family:monospace;color:#d6e4f0;overflow:hidden;position:relative">
<div style="position:absolute;left:56px;top:120px;font-size:84px;font-weight:700;letter-spacing:4px">C2<span style="color:#ff4d4d">HELL</span></div>
<div style="position:absolute;left:60px;top:240px;width:520px;font-size:28px;line-height:1.3;color:#f0b44c">${T[L] || T.en}</div>
<div style="position:absolute;left:60px;top:370px;font-size:18px;color:#8fb3d0;letter-spacing:2px">NTDS · KOREA 1950–53 · ES EN FR DE PT</div>
<img src="${img}" style="position:absolute;right:50px;top:-20px;width:300px;border:2px solid #2a4258;border-radius:14px;transform:rotate(4deg)"></body>`;
(async () => { const b = await pw.chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const p = await b.newPage({ viewport: { width: 1024, height: 500 } }); fs.writeFileSync(tmp, html); await p.goto('file://' + tmp); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(root, 'store', `feature_${L}.png`) }); await b.close(); fs.unlinkSync(tmp); console.log('ok'); })();
