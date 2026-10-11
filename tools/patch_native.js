// Ajustes que las plantillas de Capacitor no traen de serie y que hacen falta para C2 HELL.
// Las carpetas android/ e ios/ NO se versionan (se regeneran con `npm run native:add:*`), así que este script es idempotente
// y se ejecuta tras `cap add` y tras cada `cap sync` (npm run sync).
//   Android: orientación vertical fija, permiso de vibración, pantalla completa inmersiva.
//   iOS:     solo vertical (iPhone y iPad), sin barra de estado, sin pregunta de cifrado en App Store Connect.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), only = process.argv[2];
const rd = f => fs.readFileSync(f, 'utf8'), wr = (f, s) => fs.writeFileSync(f, s);
let touched = 0;

function android() {
  const man = path.join(root, 'android/app/src/main/AndroidManifest.xml');
  if (!fs.existsSync(man)) return;
  let s = rd(man);
  if (!/android:screenOrientation=/.test(s)) s = s.replace(/<activity\b/, '<activity\n            android:screenOrientation="portrait"');
  else s = s.replace(/android:screenOrientation="[^"]*"/, 'android:screenOrientation="portrait"');
  if (!/android.permission.VIBRATE/.test(s)) s = s.replace(/<\/manifest>/, '    <uses-permission android:name="android.permission.VIBRATE" />\n</manifest>');
  wr(man, s); touched++;
  // pantalla completa inmersiva y cutout (notch) permitido
  const styles = path.join(root, 'android/app/src/main/res/values/styles.xml');
  if (fs.existsSync(styles)) {
    let t = rd(styles);
    if (!/windowLayoutInDisplayCutoutMode/.test(t)) t = t.replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, '$1\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>');
    wr(styles, t);
  }
  console.log('android/ parcheado: orientación vertical, VIBRATE, cutout');
}

function ios() {
  const plist = path.join(root, 'ios/App/App/Info.plist');
  if (!fs.existsSync(plist)) return;
  let s = rd(plist);
  const arr = '<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>';
  s = s.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*)<array>[\s\S]*?<\/array>/, '$1' + arr);
  s = s.replace(/(<key>UISupportedInterfaceOrientations~ipad<\/key>\s*)<array>[\s\S]*?<\/array>/, '$1' + arr);
  const add = (key, val) => { if (!s.includes('<key>' + key + '</key>')) s = s.replace(/<\/dict>\s*<\/plist>/, '\t<key>' + key + '</key>\n\t' + val + '\n</dict>\n</plist>'); };
  add('UIStatusBarHidden', '<true/>'); add('UIViewControllerBasedStatusBarAppearance', '<false/>'); add('ITSAppUsesNonExemptEncryption', '<false/>'); add('UIRequiresFullScreen', '<true/>');
  wr(plist, s); touched++;
  console.log('ios/ parcheado: solo vertical, sin barra de estado, ITSAppUsesNonExemptEncryption=false');
}

if (!only || only === 'android') android();
if (!only || only === 'ios') ios();
if (!touched) console.log('No hay carpetas nativas todavía: ejecuta `npm run native:add:android` / `native:add:ios`.');
