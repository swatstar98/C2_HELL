// Genera capturas de tienda 1080x1920 por idioma. Uso: node tools/store_shots.js [es,en,...]
// Requiere playwright (npm i -D playwright; npx playwright install chromium).
const path = require('path'); const fs = require('fs');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const root = path.resolve(__dirname, '..'); const out = path.join(root, 'store', 'shots');
const langs = (process.argv[2] || 'es,en,fr,de,pt').split(',');
(async () => {
  const opt = fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
  const b = await pw.chromium.launch(opt);
  for (const L of langs) {
    const pg = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true })).newPage();
    await pg.goto('file://' + root + '/index.html?lang=' + L + '&unlock'); await pg.waitForTimeout(600);
    const shot = async n => { await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(out, `${L}_${n}.png`) }); };
    await pg.evaluate(() => { const A = window.__C2; A.SET.tutDone = true; A.showMenu && A.showMenu(); });
    await shot('1_menu');
    await pg.evaluate(() => window.__C2.showCamp('korea')); await pg.waitForTimeout(200); await pg.evaluate(() => { document.querySelectorAll('*').forEach(e => { if (e.scrollTop) e.scrollTop = 0; }); }); await shot('2_campaign');
    await pg.evaluate(() => window.__C2.showHistBrief('korea', 12)); await shot('3_briefing');
    await pg.evaluate(() => { const A = window.__C2; A.newGame(12, { mode: 'hist', camp: 'korea', m: 12 }); A.G.demo = false;
      const c = A.G.assets[0]; for (const id of ['radar', 'mrad', 'shorad']) for (let i = 0; i < 3; i++) A.placeUnit(A.SAM[id], c.x + (i - 1) * 70, c.y + 60 + i * 10);
      A.startOps(1); for (let i = 0; i < 400; i++) A.step(1 / 20); });
    await shot('4_operation');
    await pg.evaluate(() => { const A = window.__C2, G = A.G; if (G.air[0]) G.air[0].kills = 6; if (G.air[1]) G.air[1].kills = 2; G.stats.kills = 8; G.over = true; A.endHist(true); });
    await pg.waitForTimeout(6800); await pg.evaluate(() => { document.querySelectorAll('*').forEach(e => { if (e.scrollTop) e.scrollTop = 0; }); });
    await shot('5_debrief');
    await pg.evaluate(() => window.__C2.showArchive('korea')); await shot('6_archive');
    await pg.close();
  }
  await b.close(); console.log('OK ->', out);
})();
