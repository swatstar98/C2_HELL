// Firma del AAB de Play Store. Lee keystore.properties (en la raíz del repo, fuera de git) o variables de entorno y
// devuelve los argumentos -P que Gradle usa para firmar bundleRelease. Con «Play App Signing» (lo normal) esta es la CLAVE DE SUBIDA.
//   keystore.properties:
//     storeFile=C:\\claves\\c2hell-upload.jks      (ruta absoluta, o relativa a la raíz del repo)
//     storePassword=...
//     keyAlias=c2hell
//     keyPassword=...
// Variables equivalentes: C2_KS_FILE, C2_KS_PASS, C2_KS_ALIAS, C2_KS_KEYPASS.
const fs = require('fs'), path = require('path');
function parse(txt) { const o = {}; for (const l of txt.split(/\r?\n/)) { const m = /^\s*([A-Za-z]+)\s*=\s*(.*?)\s*$/.exec(l); if (m && !l.trim().startsWith('#')) o[m[1]] = m[2].replace(/\\\\/g, '\\'); } return o; }
function load(root, env) {
  env = env || process.env; let c = {};
  const f = path.join(root, 'keystore.properties');
  if (fs.existsSync(f)) c = parse(fs.readFileSync(f, 'utf8'));
  if (env.C2_KS_FILE) c = { storeFile: env.C2_KS_FILE, storePassword: env.C2_KS_PASS, keyAlias: env.C2_KS_ALIAS, keyPassword: env.C2_KS_KEYPASS || env.C2_KS_PASS };
  if (!c.storeFile) throw new Error('No hay clave de firma. Crea keystore.properties en la raíz (ver tools/signing.js) o define C2_KS_FILE/C2_KS_PASS/C2_KS_ALIAS.');
  const file = path.isAbsolute(c.storeFile) ? c.storeFile : path.join(root, c.storeFile);
  if (!fs.existsSync(file)) throw new Error('No existe el keystore: ' + file);
  for (const k of ['storePassword', 'keyAlias']) if (!c[k]) throw new Error('Falta «' + k + '» en la configuración de firma.');
  const keyPassword = c.keyPassword || c.storePassword;
  return { file, args: ['-Pandroid.injected.signing.store.file=' + file, '-Pandroid.injected.signing.store.password=' + c.storePassword, '-Pandroid.injected.signing.key.alias=' + c.keyAlias, '-Pandroid.injected.signing.key.password=' + keyPassword] };
}
module.exports = { load, parse };
