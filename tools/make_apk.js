// Genera un APK de DEPURACIÓN instalable (firmado con la clave debug automática de Android) en dist/C2HELL-debug.apk.
//   node tools/make_apk.js           → APK con todo desbloqueado (tienda desactivada): ideal para probar en el móvil
//   node tools/make_apk.js --release → AAB de Play Store (requiere keystore; ver README_DELIVERY.md) con la tienda activada
// Requisitos: Node 22+, JDK 21 y Android SDK (Android Studio los trae). Funciona en Windows, macOS y Linux.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..'), win = process.platform === 'win32', release = process.argv.includes('--release');
const die = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };
const run = (cmd, args, opt) => { console.log('\n› ' + [cmd].concat(args).join(' ')); const r = cp.spawnSync(cmd, args, Object.assign({ cwd: root, stdio: 'inherit', shell: win }, opt)); if (r.status !== 0) die('Falló: ' + cmd + ' ' + args.join(' ')); };

// 1) comprobaciones previas con mensajes claros
if (+process.versions.node.split('.')[0] < 22) die('Hace falta Node 22 o superior (tienes ' + process.version + ').');
const jv = cp.spawnSync('java', ['-version'], { encoding: 'utf8', shell: win }), jm = /version "(\d+)/.exec((jv.stderr || '') + (jv.stdout || ''));
if (!jm) die('No encuentro Java. Instala JDK 21 (o abre el proyecto una vez con Android Studio, que incluye uno) y revisa JAVA_HOME.');
if (+jm[1] < 21) die('Capacitor 8 necesita JDK 21 o superior (tienes ' + jm[1] + '). Define JAVA_HOME con un JDK 21.');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (fs.existsSync(path.join(root, 'android/local.properties')) ? /sdk\.dir=(.*)/.exec(fs.readFileSync(path.join(root, 'android/local.properties'), 'utf8')) : null);
const sdkDir = Array.isArray(sdk) ? sdk[1].replace(/\\\\/g, '\\').replace(/\\:/g, ':').trim() : sdk;
if (!sdkDir || !fs.existsSync(sdkDir)) die('No encuentro el Android SDK. Instala Android Studio y define ANDROID_HOME (Windows: %LOCALAPPDATA%\\Android\\Sdk; macOS: ~/Library/Android/sdk).');
// JAVA_HOME inválido (típico tras copiar una ruta que no existe): Gradle lo usa antes que el java del PATH y falla. Se corrige para esta ejecución.
const javaBin = h => h && fs.existsSync(path.join(h, 'bin', win ? 'java.exe' : 'java'));
if (process.env.JAVA_HOME && !javaBin(process.env.JAVA_HOME)) {
  console.log('Aviso: JAVA_HOME apunta a una ruta que no existe (' + process.env.JAVA_HOME + '). Busco el JDK que está en uso…');
  const w = cp.spawnSync(win ? 'where' : 'which', ['java'], { encoding: 'utf8', shell: win }), first = (w.stdout || '').split(/\r?\n/).filter(Boolean)[0];
  let home = first ? path.dirname(path.dirname(fs.existsSync(first) ? fs.realpathSync(first) : first)) : null;
  if (!javaBin(home)) home = ['C:\\Program Files\\Android\\Android Studio\\jbr', '/Applications/Android Studio.app/Contents/jbr/Contents/Home'].find(javaBin);
  if (!javaBin(home)) die('JAVA_HOME (' + process.env.JAVA_HOME + ') no existe. Bórralo (PowerShell: Remove-Item Env:JAVA_HOME) o apúntalo a la carpeta real del JDK 21 (la que contiene bin\\java.exe).');
  process.env.JAVA_HOME = home; console.log('Uso JAVA_HOME=' + home);
}
console.log('Node ' + process.version + ' · JDK ' + jm[1] + ' · SDK ' + sdkDir);

// 2) dependencias, proyecto nativo y web
if (!fs.existsSync(path.join(root, 'node_modules'))) run('npm', ['ci'], { env: Object.assign({}, process.env, { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' }) });
if (!fs.existsSync(path.join(root, 'android'))) run('npm', ['run', 'native:add:android']);
fs.writeFileSync(path.join(root, 'android/local.properties'), 'sdk.dir=' + sdkDir.replace(/\\/g, '\\\\').replace(/:/g, '\\:') + '\n');
run('npm', ['run', release ? 'sync:store' : 'sync']);

// 3) compilar
const gw = path.join(root, 'android', win ? 'gradlew.bat' : 'gradlew'); if (!win) try { fs.chmodSync(gw, 0o755); } catch (e) { /* ya ejecutable */ }
let signArgs = []; if (release) { try { const sg = require('./signing').load(root); signArgs = sg.args; console.log('Firmando con ' + sg.file); } catch (e) { die(e.message); } }
run(gw, [release ? 'bundleRelease' : 'assembleDebug'].concat(signArgs), { cwd: path.join(root, 'android') });

// 4) recoger el resultado
const outDir = path.join(root, 'dist'); fs.mkdirSync(outDir, { recursive: true });
const src = release ? path.join(root, 'android/app/build/outputs/bundle/release/app-release.aab') : path.join(root, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (!fs.existsSync(src)) die('Compiló, pero no encuentro el resultado en ' + src);
const dst = path.join(outDir, release ? 'C2HELL-release.aab' : 'C2HELL-debug.apk'); fs.copyFileSync(src, dst);
console.log('\n✔ Listo: ' + dst + ' (' + (fs.statSync(dst).size / 1048576).toFixed(1) + ' MB)');
if (release) { const v = cp.spawnSync('jarsigner', ['-verify', dst], { encoding: 'utf8', shell: win }); console.log(/jar verified/i.test((v.stdout || '') + (v.stderr || '')) ? '  Firma verificada (jarsigner).' : '  (No pude verificar la firma con jarsigner; Play Console la comprobará al subirlo.)'); }
if (!release) console.log('  Instálalo: copia el APK al móvil y ábrelo (permite «instalar apps de origen desconocido»), o con el móvil por USB: adb install -r "' + dst + '"');
