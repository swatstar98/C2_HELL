/* C2 HELL — intro de arranque (~5 s, saltable con un toque / tecla).
 * Secuencia: anillos de radar → barrido → contacto hostil → intercepción → logotipo → firma RotorLift Sims.
 * Se omite con ?nointro, en automatización (navigator.webdriver; fuerza con ?intro) y en enlaces ?level=N.
 * Respeta prefers-reduced-motion (fotograma final estático ~1,6 s). Sin dependencias; los textos van por I18N. */
'use strict';
(function () {
  const q = location.search;
  const forced = /[?&]intro(=1)?(&|$)/.test(q);
  if (!forced && (/[?&]nointro/.test(q) || /[?&]level=\d+/.test(q) || navigator.webdriver)) return;
  const t = (k, d) => (window.I18N ? I18N.t(k, null, d) : d);
  if (window.I18N) I18N.init();
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const css = `
#intro{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vh;background:radial-gradient(ellipse at 50% 35%,#0d2019,#050b09 72%);touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent}
#intro svg{width:min(94vw,520px,calc(86vh*400/600));height:auto;display:block;overflow:visible}
#intro .hint{position:absolute;left:0;right:0;bottom:max(18px,env(safe-area-inset-bottom));text-align:center;font:600 11px/1 ui-monospace,Consolas,monospace;letter-spacing:.2em;color:#7f9a8f;opacity:0;animation:iFi .6s 1.2s forwards}
#intro.out{animation:iOut .45s forwards;pointer-events:none}
#intro .dr{stroke-dasharray:1;stroke-dashoffset:1;animation:iDr var(--t,.7s) var(--d,0s) ease-out forwards}
#intro .fi{opacity:0;animation:iFi .45s var(--d,0s) forwards}
#intro .fo{animation:iFo .3s var(--d,0s) forwards}
#intro .pop{opacity:0;transform-box:fill-box;transform-origin:center;animation:iPop .35s var(--d,0s) cubic-bezier(.2,1.6,.4,1) forwards}
#intro .die{transform-box:fill-box;transform-origin:center;animation:iDie .3s var(--d,0s) ease-in forwards}
#intro .sw{transform-origin:256px 256px;animation:iSw 1.5s var(--d,0s) cubic-bezier(.3,.1,.2,1) both}
#intro .ping{opacity:0;transform-box:fill-box;transform-origin:center;animation:iPing .7s var(--d,0s) ease-out forwards}
@keyframes iDr{to{stroke-dashoffset:0}}
@keyframes iFi{to{opacity:1}}
@keyframes iFo{to{opacity:0}}
@keyframes iPop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
@keyframes iDie{to{opacity:0;transform:scale(1.7)}}
@keyframes iSw{from{transform:rotate(-300deg)}to{transform:rotate(0)}}
@keyframes iPing{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(2.6)}}
@keyframes iOut{to{opacity:0}}
#intro.rm *{animation-duration:.001s!important;animation-delay:0s!important}`;

  // letras del wordmark (caja 24×36, trazo 5)
  const L = {
    C: 'M21 3H8L3 8V28L8 33H21', '2': 'M3 9L9 3H15L21 9V15L3 27V33H21', H: 'M3 3V33M21 3V33M3 18H21',
    E: 'M21 3H3V33H21M3 18H17', L: 'M3 3V33H21'
  };
  const word = [['C', 0, '#e8f3ee'], ['2', 30, '#e8f3ee'], ['H', 78, '#ff5a4d'], ['E', 108, '#ff5a4d'], ['L', 138, '#ff5a4d'], ['L', 168, '#ff5a4d']]
    .map((w, i) => `<path class="dr" pathLength="1" style="--d:${(2.45 + i * 0.1).toFixed(2)}s;--t:.45s" transform="translate(${w[1]})" stroke="${w[2]}" d="${L[w[0]]}"/>`).join('');
  const RL = 'M3 33V3H16L21 8V14L16 19H3M12 19L21 33', RO = 'M8 3H16L21 8V28L16 33H8L3 28V8Z', RT = 'M2 3H22M12 3V33', RS = 'M21 9L15 3H9L3 9V13L9 18H15L21 23V27L15 33H9L3 27';
  const brand = `<g class="fi" style="--d:3.8s" transform="translate(106 548) scale(.5)" fill="none" stroke-width="4.5" stroke-linejoin="miter">
<g stroke="#8fa3bf"><path d="${RL}"/><path transform="translate(30)" d="${RO}"/><path transform="translate(60)" d="${RT}"/><path transform="translate(90)" d="${RO}"/><path transform="translate(120)" d="${RL}"/><path transform="translate(150)" d="M3 3V33H21"/><path transform="translate(180)" d="M3 3V33"/><path transform="translate(196)" d="M21 3H3V33M3 17H17"/><path transform="translate(226)" d="${RT}"/></g>
<g stroke="#ffa31a"><path transform="translate(270)" d="${RS}"/><path transform="translate(300)" d="M3 3V33"/><path transform="translate(316)" d="M3 33V3L12 15L21 3V33"/><path transform="translate(350)" d="${RS}"/></g></g>`;

  const svg = `<svg viewBox="0 0 400 600" role="img" aria-label="C2 HELL">
<g transform="translate(200 190) scale(.62) translate(-256 -256)" fill="none">
<g stroke="#2fe0a0">
<circle class="dr" pathLength="1" style="--d:.1s;--t:.8s" cx="256" cy="256" r="60" stroke-width="4" opacity=".6"/>
<circle class="dr" pathLength="1" style="--d:.25s;--t:.8s" cx="256" cy="256" r="115" stroke-width="4" opacity=".45"/>
<circle class="dr" pathLength="1" style="--d:.4s;--t:.8s" cx="256" cy="256" r="170" stroke-width="5" opacity=".35"/>
<path class="fi" style="--d:.9s" d="M256 62V84M256 428V450M62 256H84M428 256H450" stroke-width="6" opacity=".7"/>
</g>
<g class="sw" style="--d:.4s"><path d="M256 256L206.8 72.5A190 190 0 0 1 365 100.4Z" fill="#2fe0a0" opacity=".2"/><path d="M256 256L365 100.4" stroke="#2fe0a0" stroke-width="5"/></g>
<path class="pop" style="--d:1.3s" d="M146 350A24 24 0 0 1 194 350Z" fill="#4da3ff" fill-opacity=".3" stroke="#4da3ff" stroke-width="9" stroke-linejoin="miter"/>
<circle class="pop" style="--d:.3s" cx="256" cy="256" r="11" fill="#2fe0a0"/>
<circle class="ping" style="--d:2s" cx="359" cy="176" r="26" stroke="#ff5a4d" stroke-width="5"/>
<g class="pop" style="--d:2s"><g class="die" style="--d:2.75s"><path d="M333 188L359 152L385 188Z" fill="#ff5a4d" fill-opacity=".3" stroke="#ff5a4d" stroke-width="10" stroke-linejoin="miter"/></g></g>
<g class="fo" style="--d:2.85s"><path class="dr" pathLength="1" style="--d:2.35s;--t:.3s" d="M256 256L359 186" stroke="#ffd166" stroke-width="5"/></g>
<circle class="ping" style="--d:2.7s" cx="359" cy="176" r="30" stroke="#ffd166" stroke-width="7"/>
</g>
<g transform="translate(37 392) scale(1.7)" fill="none" stroke-width="5" stroke-linejoin="miter">${word}</g>
<text class="fi" style="--d:3.4s" x="200" y="490" text-anchor="middle" fill="#7f9a8f" font-family="ui-monospace,Consolas,monospace" font-weight="600" font-size="13" letter-spacing="2.5">${t('intro.tag', 'AIR DEFENSE COMMAND')}</text>
${brand}
</svg>`;

  const el = document.createElement('div');
  el.id = 'intro'; el.setAttribute('aria-label', 'C2 HELL');
  el.innerHTML = '<style>' + css + '</style>' + svg + '<div class="hint">' + t('intro.skip', 'TAP TO SKIP') + '</div>';
  if (still) el.classList.add('rm');
  document.body.appendChild(el);

  let done = false;
  function finish() {
    if (done) return; done = true;
    el.classList.add('out');
    el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
    setTimeout(() => el.remove(), 700);
    ['pointerdown', 'keydown'].forEach(ev => removeEventListener(ev, finish, true));
  }
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); finish(); });
  addEventListener('keydown', finish, true);
  window.__introSkip = finish;
  setTimeout(finish, still ? 1600 : 5200);
})();
