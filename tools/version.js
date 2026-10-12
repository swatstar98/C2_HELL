// Numerador de versiones. Fuente única: version.json  { major, minor, patch, build }
//   versionName = major.minor.patch   (se muestra al jugador; patch sube solo en cada empaquetado)
//   versionCode = build               (entero que solo crece: Android versionCode / iOS CURRENT_PROJECT_VERSION)
// `npm run www|sync|apk|aab` empaquetan y suben patch y build (ver build_www.js). major/minor se cambian a mano:
//   node tools/version.js                muestra la versión actual
//   node tools/version.js minor          1.0.x → 1.1.0   (build sigue creciendo)
//   node tools/version.js major          1.x.y → 2.0.0
//   node tools/version.js set 1.2.0      fija major.minor.patch
//   node tools/version.js bump           sube patch y build (lo hace el empaquetado solo; C2_NO_BUMP=1 lo evita)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..'), file = path.join(root, 'version.json');
const read = () => { const v = JSON.parse(fs.readFileSync(file, 'utf8')); ['major', 'minor', 'patch', 'build'].forEach(k => { if (!Number.isInteger(v[k]) || v[k] < 0) throw new Error('version.json: «' + k + '» debe ser un entero ≥ 0'); }); return v; };
const write = v => fs.writeFileSync(file, JSON.stringify({ major: v.major, minor: v.minor, patch: v.patch, build: v.build }, null, 2) + '\n');
const name = v => v.major + '.' + v.minor + '.' + v.patch;
function git() {
  try {
    const h = cp.execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const dirty = cp.execSync('git status --porcelain --untracked-files=no', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() ? '-dirty' : '';
    return h + dirty;
  } catch (e) { return 'nogit'; }
}
function bump() { const v = read(); v.patch++; v.build++; write(v); return v; }
function info(channel) { const v = read(); return { name: name(v), code: v.build, date: new Date().toISOString().slice(0, 10), commit: git(), channel: channel || 'debug' }; }
module.exports = { read, write, name, bump, info };

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2); let v = read();
  if (cmd === 'minor') { v.minor++; v.patch = 0; v.build++; write(v); }
  else if (cmd === 'major') { v.major++; v.minor = 0; v.patch = 0; v.build++; write(v); }
  else if (cmd === 'bump') v = bump();
  else if (cmd === 'set') { const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(arg || ''); if (!m) { console.error('Uso: node tools/version.js set 1.2.0'); process.exit(1); } v.major = +m[1]; v.minor = +m[2]; v.patch = +m[3]; v.build++; write(v); }
  else if (cmd) { console.error('Comandos: minor | major | bump | set X.Y.Z'); process.exit(1); }
  v = read(); console.log('C2 HELL v' + name(v) + ' (build ' + v.build + ')');
}
