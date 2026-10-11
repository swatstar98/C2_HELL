// Genera 10 posts de Instagram 1080x1350 por idioma a partir de capturas reales del juego.
// Uso: node tools/store_shots.js es,en && node tools/social_posts.js [es,en]
const path = require('path'), fs = require('fs'); let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const root = path.resolve(__dirname, '..'), shots = path.join(root, 'store', 'shots'), out = path.join(root, 'social');
const langs = (process.argv[2] || 'es,en').split(',');
const TX = {
  es: {
    k: 'SIMULADOR TÁCTICO DE DEFENSA AÉREA',
    p1: ['DEFIENDE EL CIELO.', 'REVIVE LA HISTORIA.', 'Radares, misiles y cazas. Un mando y control para el móvil.'],
    p2: ['TÚ DAS LAS ÓRDENES.', 'Oleada a oleada.', 'Coloca defensas, lanza interceptores y no dejes que caiga tu base.'],
    p3: ['SABE LEER EL RADAR.', 'Azul: amigo · Rojo: hostil · Amarillo: desconocido.', 'Simbología táctica NTDS, la misma de los centros de mando reales.'],
    p4: ['PLANIFICA.', 'LUEGO ACTÚA.', 'Cada misión tiene dos fases: PREPARACIÓN y OPERACIÓN.'], c4: ['PREPARACIÓN', 'OPERACIÓN'],
    p5: ['24 MISIONES.', 'UNA GUERRA.', 'Campaña de Corea, 1950–1953. Cada misión dura unos 5 minutos.'],
    p6: ['24 DIC 1950 · HUNGNAM', 'El último barco.', 'Unos 100 000 soldados y casi otros tantos civiles esperan para ser evacuados. Tú proteges el puerto.'],
    p7: ['CADA MISIÓN, UN OBJETIVO DISTINTO.', ['EVACUAR', 'Protege el puerto hasta el último barco'], ['DESTRUIR', 'Ataca las bases enemigas'], ['DERRIBAR', 'Limpia el cielo de cazas'], ['MANTENER', 'Que tu activo siga en pie']],
    p8: ['TUS PILOTOS TIENEN NOMBRE.', 'Indicativo, derribos y condecoraciones.', 'Los que pierdas, los echarás de menos.'],
    p9: ['COMPARTE TU PARTE DE MISIÓN.'],
    p10: ['BUSCAMOS TESTERS.', 'Prueba la campaña y dinos qué mejorarías.', 'Enlace en la bio.']
  },
  en: {
    k: 'TACTICAL AIR DEFENSE SIMULATOR',
    p1: ['DEFEND THE SKY.', 'RELIVE HISTORY.', 'Radars, missiles and fighters. Command & control for your phone.'],
    p2: ['YOU GIVE THE ORDERS.', 'Wave after wave.', 'Place defenses, scramble interceptors and keep your base standing.'],
    p3: ['LEARN TO READ THE RADAR.', 'Blue: friendly · Red: hostile · Yellow: unknown.', 'NTDS tactical symbology, the kind real command centers use.'],
    p4: ['PLAN.', 'THEN ACT.', 'Every mission has two phases: PREPARATION and OPERATION.'], c4: ['PREPARATION', 'OPERATION'],
    p5: ['24 MISSIONS.', 'ONE WAR.', 'Korean War campaign, 1950–1953. About 5 minutes per mission.'],
    p6: ['24 DEC 1950 · HUNGNAM', 'The last ship.', 'About 100,000 soldiers and nearly as many civilians wait to be evacuated. You protect the port.'],
    p7: ['EVERY MISSION, A DIFFERENT GOAL.', ['EVACUATE', 'Protect the port until the last ship'], ['DESTROY', 'Strike the enemy bases'], ['SHOOT DOWN', 'Clear the sky of fighters'], ['HOLD', 'Keep your asset standing']],
    p8: ['YOUR PILOTS HAVE NAMES.', 'Callsigns, kills and decorations.', 'The ones you lose, you will miss.'],
    p9: ['SHARE YOUR MISSION REPORT.'],
    p10: ['WE NEED TESTERS.', 'Play the campaign and tell us what to improve.', 'Link in bio.']
  }
};
const css = `*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:"DejaVu Sans Mono",ui-monospace,Menlo,Consolas,monospace;color:#d3e6f2;background:radial-gradient(ellipse at 50% 0%,#12283a,#04080c 70%)}
.kick{position:absolute;left:64px;top:56px;font-size:24px;letter-spacing:.14em;color:#7390a3}.logo{position:absolute;right:64px;top:50px;font-size:34px;font-weight:700;letter-spacing:.12em}.logo em{color:#ff4d4d;font-style:normal}
h1{position:absolute;left:64px;right:64px;font-size:74px;line-height:1.05;letter-spacing:.03em;font-weight:700}h1 em{color:#ff4d4d;font-style:normal}h1 .a{color:#ffb020}
.sub{position:absolute;left:64px;right:64px;font-size:30px;line-height:1.35;color:#9fb7c8}
.ph{position:absolute;border:3px solid #2a5468;border-radius:38px;overflow:hidden;box-shadow:0 0 60px rgba(79,224,232,.12),0 30px 80px rgba(0,0,0,.6)}.ph img{display:block;width:100%}
.lab{position:absolute;font-size:26px;letter-spacing:.14em;font-weight:700;text-align:center}
.grid{position:absolute;left:64px;right:64px;top:360px;display:grid;grid-template-columns:1fr 1fr;gap:28px}.cell{border:2px solid #2a5468;background:linear-gradient(180deg,#122233,#0b1520);padding:36px 32px;min-height:330px;clip-path:polygon(24px 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%,0 24px)}.cell b{display:block;font-size:50px;letter-spacing:.06em;margin-bottom:18px}.cell span{font-size:28px;color:#9fb7c8;line-height:1.35}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#35d07f,#4fe0e8,#ff4d4d)}`;
const head = (L, n) => `<div class="kick">${TX[L].k}</div><div class="logo">C2<em>HELL</em></div>`;
function page(L, n, shot) {
  const T = TX[L], img = k => 'file://' + path.join(shots, `${L}_${k}.png`), P = T['p' + n];
  const title = (a, b) => `<h1 style="top:140px">${a}${b ? '<br><span class="a">' + b + '</span>' : ''}</h1>`;
  let body = '';
  if (n === 1) body = title(P[0], P[1]).replace('<span class="a">', '<em>').replace('</span>', '</em>') + `<div class="sub" style="top:380px">${P[2]}</div><div class="ph" style="left:210px;top:520px;width:660px"><img src="${img('1_menu')}"></div>`;
  if (n === 2) body = title(P[0], P[1]) + `<div class="sub" style="top:380px">${P[2]}</div><div class="ph" style="left:210px;top:510px;width:660px"><img src="${img('4_operation')}"></div>`;
  if (n === 3) body = `<h1 style="top:140px;font-size:60px">${P[0]}</h1>` + `<div class="sub" style="top:230px">${P[1]}<br><span style="color:#7390a3">${P[2]}</span></div><div class="ph" style="left:80px;top:470px;width:920px;height:720px"><img src="${img('radar')}" style="position:absolute;width:1300px;left:-190px;top:-565px"></div>`;
  if (n === 4) body = title(P[0], P[1]) + `<div class="sub" style="top:380px">${P[2]}</div>` +
    `<div class="ph" style="left:70px;top:520px;width:450px;transform:rotate(-3deg)"><img src="${img('prep')}"></div><div class="lab" style="left:70px;top:1260px;width:450px;color:#ffb020">${T.c4[0]}</div>` +
    `<div class="ph" style="left:560px;top:520px;width:450px;transform:rotate(3deg)"><img src="${img('4_operation')}"></div><div class="lab" style="left:560px;top:1260px;width:450px;color:#35d07f">${T.c4[1]}</div>`;
  if (n === 5) body = title(P[0], P[1]) + `<div class="sub" style="top:380px">${P[2]}</div><div class="ph" style="left:210px;top:520px;width:660px"><img src="${img('2_campaign')}"></div>`;
  if (n === 6) body = `<h1 style="top:140px;font-size:50px;color:#ffb020">${P[0]}</h1><h1 style="top:215px">${P[1]}</h1><div class="sub" style="top:330px;font-size:28px">${P[2]}</div><div class="ph" style="left:210px;top:530px;width:660px"><img src="${img('3_briefing')}"></div>`;
  if (n === 7) body = `<h1 style="top:140px;font-size:60px">${P[0]}</h1><div class="grid">` + P.slice(1).map((c, i) => `<div class="cell"><b style="color:${['#35d07f', '#ff4d4d', '#4fe0e8', '#ffb020'][i]}">${c[0]}</b><span>${c[1]}</span></div>`).join('') + `</div>`;
  if (n === 8) body = `<h1 style="top:140px;font-size:62px">${P[0]}</h1><div class="sub" style="top:230px">${P[1]}<br><span style="color:#7390a3">${P[2]}</span></div><div class="ph" style="left:210px;top:420px;width:660px"><img src="${img('5_debrief')}"></div>`;
  if (n === 10) body = `<h1 style="top:250px;font-size:96px">${P[0]}</h1><div class="sub" style="top:560px;font-size:40px;color:#d3e6f2">${P[1]}</div><div class="sub" style="top:760px;font-size:44px;color:#35d07f;letter-spacing:.06em">▶ ${P[2]}</div><div class="ph" style="left:280px;top:880px;width:520px;transform:rotate(-2deg)"><img src="${img('4_operation')}"></div>`;
  return `<!doctype html><meta charset=utf-8><style>${css}</style>${n === 10 || n === 7 ? '' : ''}${head(L, n)}${body}<div class="bar"></div>`;
}
(async () => {
  const b = await pw.chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  for (const L of langs) {
    fs.mkdirSync(path.join(out, L), { recursive: true });
    // capturas extra: fase de preparación y tarjeta de parte
    const g = await (await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true })).newPage();
    await g.goto('file://' + root + '/index.html?lang=' + L + '&unlock'); await g.waitForTimeout(600);
    await g.waitForTimeout(900); await g.evaluate(() => { document.querySelectorAll('.mnav,.mhead').forEach(e => e.style.visibility = 'hidden'); });
    await g.waitForTimeout(300); await g.screenshot({ path: path.join(shots, `${L}_radar.png`) });
    await g.evaluate(() => { const A = window.__C2; A.SET.tutDone = true; A.newGame(12, { mode: 'hist', camp: 'korea', m: 12 }); A.G.demo = false; });
    await g.waitForTimeout(1500); await g.evaluate(() => { const x = document.querySelector('#hint .x'); x && x.click(); });
    await g.waitForTimeout(400); await g.screenshot({ path: path.join(shots, `${L}_prep.png`) });
    const card = await g.evaluate(() => { const A = window.__C2; A.G.air[0].kills = 7; A.G.stats.kills = 43; A.G.over = true; A.endHist(true); return A.reportCard({ id: 'korea', m: 12, st: 3, ig: 93, top: { n: A.G.air[0].call, k: 7, l: A.G.air[0].label } }).toDataURL('image/png'); });
    fs.writeFileSync(path.join(out, L, 'post09.png'), Buffer.from(card.split(',')[1], 'base64')); await g.close();
    const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
    for (let n = 1; n <= 10; n++) {
      if (n === 9) continue;
      const f = path.join(root, 'social', '.tmp.html'); fs.writeFileSync(f, page(L, n)); await p.goto('file://' + f); await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(out, L, `post${String(n).padStart(2, '0')}.png`) });
    }
    await p.close(); console.log('ok', L);
  }
  try { fs.unlinkSync(path.join(root, 'social', '.tmp.html')); } catch (e) {} await b.close();
})();
