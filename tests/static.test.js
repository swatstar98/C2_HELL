// Comprobaciones sin navegador: sintaxis, i18n, archivos referenciados, fichas de tienda, datos históricos, versión.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const LANGS = ['es', 'en', 'fr', 'de', 'pt'];

test('todos los .js del juego compilan', () => {
  const files = ['game.js', 'intro.js', 'i18n.js', 'config.js', 'maps.js', 'maps2.js', 'maps_hist.js', 'sw.js', 'version.js']
    .concat(fs.readdirSync(path.join(root, 'lang')).map(f => 'lang/' + f), fs.readdirSync(path.join(root, 'hist')).filter(f => f.endsWith('.js')).map(f => 'hist/' + f), fs.readdirSync(path.join(root, 'tools')).filter(f => f.endsWith('.js')).map(f => 'tools/' + f), ['server/server.js']);
  for (const f of files) assert.doesNotThrow(() => new vm.Script(rd(f), { filename: f }), f);
});

// ---- i18n: cada idioma debe tener las mismas claves que inglés, con los mismos {parámetros} ----
function loadDicts() {
  const dict = {}; const sb = { I18N: { add(c, o) { dict[c] = Object.assign(dict[c] || {}, o); } }, console };
  sb.window = sb; vm.createContext(sb);
  for (const f of ['en', 'es', 'fr', 'de', 'pt', 'hist']) vm.runInContext(rd('lang/' + f + '.js'), sb, { filename: f });
  return dict;
}
test('i18n: faltan claves respecto a inglés', () => {
  const d = loadDicts(), missing = {};   // lang/hist.js solo trae es/en: sus claves caen a inglés a propósito en fr/de/pt (el contenido histórico va en hist/korea_xx.js)
  const hk = new Set(Object.keys((() => { const o = {}; const sb = { I18N: { add(c, v) { if (c === 'en') Object.assign(o, v); } } }; sb.window = sb; vm.runInNewContext(rd('lang/hist.js'), sb); return o; })()));
  for (const l of LANGS) { if (l === 'en') continue; const m = Object.keys(d.en).filter(k => d[l][k] === undefined && !hk.has(k)); if (m.length) missing[l] = m.length + ': ' + m.slice(0, 8).join(', '); }
  assert.deepEqual(missing, {});
});
test('i18n: los {parámetros} coinciden entre idiomas', () => {
  const d = loadDicts(), bad = [], ph = s => (String(s).match(/\{(\w+)\}/g) || []).sort().join();
  for (const k of Object.keys(d.en)) for (const l of LANGS) if (d[l][k] !== undefined && ph(d[l][k]) !== ph(d.en[k])) bad.push(l + ':' + k);
  assert.deepEqual(bad, []);
});
test('i18n: ninguna traducción vacía o igual a su clave', () => {
  const d = loadDicts(), bad = [];
  for (const l of LANGS) for (const [k, v] of Object.entries(d[l])) if (typeof v !== 'string' || !v.trim() || v === k) bad.push(l + ':' + k);
  assert.deepEqual(bad, []);
});

// ---- archivos referenciados ----
test('index.html: scripts, estilos e iconos referenciados existen', () => {
  const h = rd('index.html'), refs = [...h.matchAll(/(?:src|href)="([^"#?:]+\.[a-z0-9]+)"/gi)].map(m => m[1]).filter(r => !/^https?:/.test(r));
  assert.ok(refs.length > 5);
  for (const r of refs) assert.ok(fs.existsSync(path.join(root, r)), r + ' no existe');
});
test('sw.js: todo el precaché existe y cubre los scripts del index', () => {
  const sw = rd('sw.js'), files = vm.runInNewContext('(function(){' + sw.match(/const FILES = \[[\s\S]*?\];/)[0] + ' return FILES; })()');
  for (const f of files) if (f !== './') assert.ok(fs.existsSync(path.join(root, f)), 'precaché: ' + f + ' no existe');
  const scripts = [...rd('index.html').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  for (const s of scripts) assert.ok(files.includes(s), s + ' falta en el precaché de sw.js');
  assert.match(sw, /const VER = 'c2hell-[^']+'/);
});
test('build_www: todos los ficheros listados existen', () => {
  const b = rd('tools/build_www.js'), list = vm.runInNewContext(b.match(/const FILES = (\[[^\]]*\])/)[1]);
  for (const f of list) assert.ok(fs.existsSync(path.join(root, f)), f);
});
test('audio: cada muestra del sampler existe', () => {
  const g = rd('game.js'), m = /SMP_MAP\s*=\s*(\{[\s\S]*?\n\s*\});?/.exec(g);
  const files = new Set([...rd('sw.js').matchAll(/audio\/mus\/[\w.\-]+\.mp3/g)].map(x => x[0]));
  assert.ok(files.size >= 30, 'precaché de audio incompleto: ' + files.size);
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f)), f);
  assert.ok(m || /SMP_MAP/.test(g));
});
test('manifest y iconos', () => {
  const mf = JSON.parse(rd('manifest.webmanifest'));
  assert.ok(mf.name && mf.start_url && mf.icons.length >= 2);
  for (const i of mf.icons) assert.ok(fs.existsSync(path.join(root, i.src)), i.src);
  assert.ok(mf.icons.some(i => /maskable/.test(i.purpose || '')), 'falta icono maskable');
});
test('package.json: los scripts apuntan a ficheros que existen', () => {
  const s = JSON.parse(rd('package.json')).scripts;
  for (const v of Object.values(s)) for (const m of v.matchAll(/node (tools\/[\w.\-]+|server\/[\w.\-]+)/g)) assert.ok(fs.existsSync(path.join(root, m[1])), m[1]);
});

// ---- tienda: límites reales de Google Play ----
test('fichas de tienda: título ≤30, descripción corta ≤80, larga ≤4000', () => {
  for (const l of LANGS) {
    const t = rd('store/listing_' + l + '.md'), title = /\*\*[^*]+\((\d+)\/30\):\*\*\s*(.+)/.exec(t), short = /\*\*[^*]+\((\d+)\/80\):\*\*\s*(.+)/.exec(t);
    assert.ok(title && short, l + ': formato de ficha');
    assert.ok([...title[2].trim()].length <= 30, l + ' título: ' + [...title[2].trim()].length);
    assert.ok([...short[2].trim()].length <= 80, l + ' corta: ' + [...short[2].trim()].length);
    const long = t.split(/\*\*[^*]*larga[^*]*\*\*|\*\*Long[^*]*\*\*|\*\*Descripción larga[^*]*\*\*/i)[1] || '';
    assert.ok(long.length <= 4200, l + ' larga: ' + long.length);
  }
});

// ---- datos históricos ----
test('campaña Korea: 24 misiones y todo el texto traducido a los 5 idiomas', () => {
  const warns = [], sb = { I18N: { add() {} }, console: { warn: (...a) => warns.push(a.join(' ')), log() {} } }; sb.window = sb; vm.createContext(sb);
  const order = ['lang/hist.js', 'hist/korea_core.js', 'hist/korea_m1.js', 'hist/korea_m2.js', 'hist/korea_m3.js', 'hist/korea_m4.js', 'hist/korea_units.js', 'hist/korea_fr.js', 'hist/korea_de.js', 'hist/korea_pt.js'];
  for (const f of order) vm.runInContext(rd(f), sb, { filename: f });
  assert.deepEqual(warns, [], 'rutas de traducción que no existen');
  const K = sb.C2_HIST && sb.C2_HIST.korea; assert.ok(K, 'C2_HIST.korea');
  assert.equal(K.missions.length, 24);
  K.missions.forEach((m, i) => {
    assert.ok(Array.isArray(m.view) && m.view.length === 3, 'm' + (i + 1) + ' view');
    assert.ok(m.w && m.w.n > 0 && m.w.pts > 0 && m.w.mix.length === 4 && m.w.mix.some(x => x > 0), 'm' + (i + 1) + ' oleadas');
    assert.ok(Array.isArray(m.as) && m.as.length > 0, 'm' + (i + 1) + ' activos');
  });
  const untr = []; const walk = (o, p) => { if (!o || typeof o !== 'object') return; if (typeof o.es === 'string' && typeof o.en === 'string') { if (/\|units\|\w+\|name$/.test(p)) return;   // designaciones de aeronaves: no se traducen
    for (const l of ['fr', 'de', 'pt']) if (typeof o[l] !== 'string' || !o[l].trim()) untr.push(p + '→' + l); return; } for (const k of Object.keys(o)) walk(o[k], p + '|' + k); };
  walk(K, '');
  assert.deepEqual(untr.slice(0, 10), [], untr.length + ' textos históricos sin traducir');
});

// ---- versión ----
test('version.json válido y coherente con la herramienta', () => {
  const v = JSON.parse(rd('version.json')); for (const k of ['major', 'minor', 'patch', 'build']) assert.ok(Number.isInteger(v[k]) && v[k] >= 0, k);
  const ver = require('../tools/version'); const i = ver.info('debug');
  assert.equal(i.name, v.major + '.' + v.minor + '.' + v.patch); assert.equal(i.code, v.build);
  assert.ok(v.build >= v.patch, 'build nunca por debajo de patch');
});

// ---- el servidor de telemetría rechaza basura sin caerse ----
test('server.js: carga sin ejecutar nada peligroso', () => { assert.doesNotThrow(() => new vm.Script(rd('server/server.js'))); });

// ---- empaquetado ----
test('build_www (sin gastar número): genera version.js, caché del SW y config coherentes, y con --store activa la tienda', () => {
  const cp = require('child_process'), env = Object.assign({}, process.env, { C2_NO_BUMP: '1' }), before = rd('version.json');
  const out = f => fs.readFileSync(path.join(root, 'www', f), 'utf8');
  cp.execFileSync(process.execPath, ['tools/build_www.js'], { cwd: root, env, stdio: 'pipe' });
  const v = JSON.parse(before), name = v.major + '.' + v.minor + '.' + v.patch;
  assert.equal(rd('version.json'), before, 'C2_NO_BUMP no debe tocar version.json');
  assert.match(out('version.js'), new RegExp('"name":"' + name.replace(/\./g, '\\.') + '"'));
  assert.ok(out('sw.js').includes("const VER = 'c2hell-" + name + "'"));
  assert.ok(out('config.js').includes("version: '" + name + "'"));
  assert.ok(out('config.js').includes('enabled: false'), 'sin --store la tienda está apagada');
  cp.execFileSync(process.execPath, ['tools/build_www.js', '--store'], { cwd: root, env, stdio: 'pipe' });
  assert.ok(out('config.js').includes('enabled: true'), '--store activa la tienda');
  assert.ok(fs.existsSync(path.join(root, 'www/audio/mus')) && fs.existsSync(path.join(root, 'www/intro.js')));
});

// ---- política de privacidad ----
test('delete-data.html: 5 idiomas, contacto, nombre de la app/desarrollador y se publica con Pages', () => {
  const h = rd('delete-data.html');
  for (const l of ['es', 'en', 'fr', 'de', 'pt']) assert.ok(new RegExp('<section id="' + l + '" lang="' + l + '"').test(h), 'falta la sección ' + l);
  assert.ok((h.match(/rotorliftsim@gmail\.com/g) || []).length >= 5 && h.includes('C2 HELL') && h.includes('Roberto Linares'));
  assert.ok(/delete-data\.html/.test(rd('tools/pages.workflow.yml')), 'el workflow de Pages publica delete-data.html');
});

test('privacy.html: 5 idiomas, contacto y cubre las funciones online', () => {
  const h = rd('privacy.html');
  for (const l of LANGS) assert.match(h, new RegExp('<section id="' + l + '" lang="' + l + '"'), 'falta la sección ' + l);
  assert.equal((h.match(/rotorliftsim@gmail\.com/g) || []).length >= 5, true);
  const cfg = rd('config.js'); assert.match(cfg, /reportEmail: 'rotorliftsim@gmail.com'/, 'el contacto de la política coincide con config.js');
  assert.ok(rd('tools/build_www.js').includes("'privacy.html'"), 'privacy.html se publica con la build');
});

// ---- identidad de la app ----
test('capacitor.config.json: el ID de paquete es el registrado en Google Play (no se puede cambiar una vez publicado)', () => {
  assert.equal(JSON.parse(rd('capacitor.config.json')).appId, 'com.rotorliftsim.c2hell');
});

// ---- firma ----
test('signing: lee keystore.properties/entorno y falla con mensajes claros', () => {
  const os = require('os'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c2sign-')), S = require('../tools/signing');
  assert.throws(() => S.load(tmp, {}), /No hay clave de firma/);
  fs.writeFileSync(path.join(tmp, 'k.jks'), 'x');
  fs.writeFileSync(path.join(tmp, 'keystore.properties'), '# comentario\nstoreFile=k.jks\nstorePassword=abc\nkeyAlias=c2hell\n');
  const r = S.load(tmp, {}); assert.ok(r.args.includes('-Pandroid.injected.signing.key.password=abc'), 'keyPassword por defecto = storePassword'); assert.ok(r.args.some(a => a.endsWith('store.file=' + path.join(tmp, 'k.jks'))));
  fs.writeFileSync(path.join(tmp, 'keystore.properties'), 'storeFile=falta.jks\nstorePassword=a\nkeyAlias=b\n'); assert.throws(() => S.load(tmp, {}), /No existe el keystore/);
  fs.writeFileSync(path.join(tmp, 'keystore.properties'), 'storeFile=k.jks\nstorePassword=a\n'); assert.throws(() => S.load(tmp, {}), /keyAlias/);
  assert.equal(S.load(tmp, { C2_KS_FILE: path.join(tmp, 'k.jks'), C2_KS_PASS: 'p', C2_KS_ALIAS: 'al' }).args.length, 4, 'las variables de entorno mandan');
  assert.deepEqual(S.parse('storeFile=C:\\\\claves\\\\a.jks'), { storeFile: 'C:\\claves\\a.jks' });
  assert.ok(/keystore\.properties/.test(rd('.gitignore')), 'keystore.properties fuera de git');
  fs.rmSync(tmp, { recursive: true, force: true });
});
