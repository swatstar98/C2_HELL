// Renderiza offline la música con instrumentos reales (4 niveles × 8 compases) a WAV, sin jugar.
// Uso: node tools/serve.js 8099   (otra terminal)   y   node tools/render_music.js [carpeta_salida]
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const D = path.resolve(process.argv[2] || 'music_out') + path.sep; fs.mkdirSync(D, { recursive: true });
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined),args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto('http://localhost:8099/index.html?lang=es'); await p.waitForTimeout(300);
await p.evaluate(()=>window.__C2.SND.init());
await p.waitForFunction(()=>{const s=window.__C2.SND.smp;return s&&(s.ready||s.failed)},{timeout:30000});
const info=await p.evaluate(()=>{const s=window.__C2.SND.smp;return {ready:s.ready,failed:s.failed,n:Object.keys(s.buf).length}}); console.log('samples:',info);
const bpms=[76,88,100,116];
for(let lvl=0;lvl<4;lvl++){
  const r=await p.evaluate(async([lvl,bpm])=>{
    const SND=window.__C2.SND, d=60/bpm/4, steps=8*16, sr=32000, dur=steps*d+3;
    const oc=new OfflineAudioContext(2,Math.ceil(sr*dur),sr);
    const save={ac:SND.ac,mbus:SND.mbus,rev:SND.rev};
    SND.ac=oc; SND.mbus=oc.createGain(); SND.mbus.gain.value=.55; SND.mbus.connect(oc.destination); SND.rev=null; SND.setupRev();
    for(let i=0;i<steps;i++) SND.musicStepS(i,i*d+.05,d,lvl);
    const buf=await oc.startRendering(); Object.assign(SND,save);
    const ch=buf.getChannelData(0); let pk=0,ss=0; for(let i=0;i<ch.length;i++){const v=Math.abs(ch[i]); if(v>pk)pk=v; ss+=v*v;}
    const i16=new Int16Array(ch.length); for(let i=0;i<ch.length;i++) i16[i]=Math.max(-1,Math.min(1,ch[i]))*32767;
    let bin=''; const u=new Uint8Array(i16.buffer); for(let i=0;i<u.length;i+=8192) bin+=String.fromCharCode.apply(null,u.subarray(i,i+8192));
    return {pk,rms:Math.sqrt(ss/ch.length),sr,b64:btoa(bin)};
  },[lvl,bpms[lvl]]);
  console.log('nivel',lvl,'pico',r.pk.toFixed(2),'rms',r.rms.toFixed(3));
  const pcm=Buffer.from(r.b64,'base64'); const h=Buffer.alloc(44); h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(r.sr,24);h.writeUInt32LE(r.sr*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);
  fs.writeFileSync(D+`real${lvl}.wav`,Buffer.concat([h,pcm]));
}
console.log('errores',errs); await b.close()})();
