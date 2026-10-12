# C2 HELL

Lite sim de **mando y control antiaéreo** con mecánica de tower defense, para móvil y PC. Vertical, simbología táctica NTDS, estética de consola de mando (al estilo *Command: Modern Operations*). Cada nivel tiene dos fases: **PREPARACIÓN** (en pausa: colocas defensas y repartes aeronaves) y **OPERACIÓN** (tiempo real: salidas, radares ON/OFF, oleadas).

- Idiomas: **es, en, fr, de, pt** (es y en son obligatorios en todo lo que se añada).
- Un único código web (HTML + Canvas 2D + JS puro, **sin framework ni bundler**) que se entrega como PWA, Android e iOS (Capacitor 8).
- Modos: campaña por teatros, sin fin, reto diario, misiones especiales y **campañas históricas** (PoC: Guerra de Corea, 24 misiones).

> Documentación complementaria: [`DESIGN.md`](DESIGN.md) (diseño y arquitectura en detalle), [`README_DELIVERY.md`](README_DELIVERY.md) (APK/AAB/iOS/tienda/CI), [`PLAYTEST.md`](PLAYTEST.md) (protocolo de pruebas con jugadores), [`hist/img/README.md`](hist/img/README.md) (fotos de archivo y licencias).

## Empezar en 2 minutos

Requisitos: **Node 22+**. Para el APK además JDK 21 y Android SDK (ver `README_DELIVERY.md`).

```bash
npm ci
node tools/serve.js        # http://localhost:8080 (y desde el móvil: http://IP-DEL-PC:8080)
```

También vale abrir `index.html` con doble clic; el service worker y el portapapeles solo funcionan en `localhost` o HTTPS.

### Parámetros de URL para desarrollo
| Parámetro | Efecto |
|---|---|
| `?unlock` | Todos los niveles y misiones desbloqueados (también salta el tutorial obligatorio) |
| `?level=7` | Salta directamente al nivel 7 (sin intro) |
| `?nointro` / `?intro` | Omite la intro de arranque / la fuerza (por defecto se omite en automatización: `navigator.webdriver`) |
| `?lang=es\|en\|fr\|de\|pt` | Idioma (solo si no hay uno guardado en `localStorage c2hell.lang`; en pruebas usa un contexto limpio) |
| Zoom del mapa | Pellizco (2 dedos, también desplaza), rueda del ratón, botones +/− (el del medio ajusta a pantalla), teclas `+` `−` `0`; con zoom, un dedo arrastra el mapa en reposo y el botón derecho/central del ratón desplaza siempre |
| `?store=sim` | Prueba la tienda con compras simuladas |

### Comandos npm
| Comando | Qué hace |
|---|---|
| `npm run serve` | Servidor estático local |
| `npm run www` | Copia la web a `www/` (lo que empaqueta Capacitor; `www/` no se versiona) |
| `npm run apk` | APK de depuración en `dist/` con todo desbloqueado |
| `npm run ver` / `ver:minor` / `ver:major` | Muestra la versión / sube minor (1.0.x→1.1.0) / sube major. Fuente única: `version.json` |
| `npm test` | Suite completa: estática (sintaxis, i18n ×5, archivos, fichas de tienda, build) + navegador (arranque por idioma, simulación de niveles/misiones/modos, tienda, guardado, offline, accesibilidad). `C2_FULL=1` = todas las misiones; `C2_CHROMIUM=/ruta` si Playwright no tiene su Chromium |
| `npm run test:static` | Solo la parte sin navegador (~1 s) |
| `npm run lint` | ESLint (`eslint.config.js`): 0 errores; detecta variables no definidas |
| `npm run aab` | AAB de Play Store con la tienda activada (necesita keystore) |
| `npm run icons` | Regenera iconos desde `tools/icon*.svg` |
| `npm run server` | Servidor de referencia para extras online (opcional) |
| `node tools/store_shots.js [es,en,…]` | Capturas de tienda 1080×1920 por idioma (requiere Playwright) |
| `node tools/store_graphic.js <lang>` | Feature graphic 1024×500 |
| `node tools/social_posts.js [es,en]` | 10 posts de Instagram 1080×1350 en `social/` (captions en `social/captions.md`; requiere antes `store_shots.js`) |
| `node tools/fetch_hist_photos.js` | Descarga y redimensiona fotos de archivo (ver `hist/img/README.md`) |

## Estructura

```
index.html          Esqueleto del HUD (#top, #mapwrap, #cmd, #dock, #overlay) y carga de scripts
style.css           Todo el estilo (incluye la fuente NTDS Icons en base64)
game.js             Todo el juego (IIFE, ~2800 líneas) — ver mapa de secciones abajo
audio/mus/         Samples de instrumentos reales (CC0, VSCO 2 CE; ver audio/LICENSE-samples.txt). Los carga `SND.loadSamples()`; sin ellos suena el sintetizador
intro.js           Intro de arranque (SVG + CSS + sonido WebAudio, ~5 s, saltable; textos `intro.*` en lang/hist.js)
i18n.js, lang/*.js  Motor y diccionarios (es, en, fr, de, pt); lang/hist.js = textos de campañas + loader C2_HTR
maps*.js            Datos geográficos generados (Natural Earth): teatros modernos y mapas históricos
hist/               Campañas históricas: <id>_core.js, _m1..m4.js, _units.js y traducciones _fr/_de/_pt.js
config.js           Opcional: endpoint online y tienda (precios de reserva)
sw.js               Service worker (sube VER al publicar)
server/server.js    Servidor de referencia sin dependencias (marcadores, telemetría opt-in, guardado por código)
tools/              Scripts de build, iconos, APK, capturas de tienda, fotos
store/              Fichas de tienda por idioma y gráficos generados
.github/workflows/  CI: web (Pages), Android, iOS
```

### Mapa de `game.js`
Está dividido por bloques con cabecera `/* ==== NOMBRE ==== */`; búscalos con grep:
`DEFINICIONES` (SAM, AIR, THREAT: balance) · `GEOGRAFÍA` · `MEJORAS PERMANENTES` · `NIVELES` (`makeLevel`) · `ESTADO` · `OBJETIVOS DE MISIÓN` · `AUDIO` · `VOCES` · `LOG / HUD` · `TUTORIAL` · `DOCK` · `ENTIDADES` · `SIMULACIÓN` (`step(dt)`) · `SELECCIÓN / PANEL` · `PUNTERO` · `RENDER` (símbolos NTDS) · `PANTALLAS` · `TIENDA` · `META` (medallas, logros) · `MODOS` · `RED OPCIONAL` · `CAMPAÑAS HISTÓRICAS` · `ARRANQUE`.

## Reglas importantes

1. **Los iconos del mapa son sagrados**: se dibujan en el canvas con la fuente NTDS Icons (`ntdsGlyph`, con respaldo vectorial). Cambios de UI van en HTML/CSS; no se tocan los símbolos sin pedirlo.
2. **Todo texto visible va por `tr('clave')`** (y las claves en los 5 idiomas). Nada de strings sueltos en `game.js`.
3. **Móvil primero**: objetivos táctiles ≥ 44 px (`--tap`), respetar safe areas (`env(safe-area-inset-*)`), controles frecuentes en la zona del pulgar (barra `#cmd` y dock abajo). Probar siempre a 360×640, 402×874 y 412×915.
4. **Sin dependencias en runtime**. Las de `package.json` son solo para empaquetar (Capacitor) y herramientas.
5. Al cambiar archivos que cachea la PWA, sube `VER` en `sw.js`; si añades un archivo, añádelo a `FILES`.

## Tareas habituales

### Añadir o cambiar texto / idioma
Claves en `lang/<idioma>.js`. Cada clave debe existir al menos en es y en; si falta en el idioma activo cae a en → es → la propia clave. Para un idioma nuevo: crear `lang/xx.js` que llame a `I18N.add('xx', {...})` y añadirlo a `index.html` y `sw.js`. Los textos de campañas usan `{es, en}` y se traducen aparte con `C2_HTR(id, lang, {'ruta|del|texto': '…'})` (ver `hist/korea_fr.js`); los `{placeholders}` deben coincidir en todos los idiomas.

### Balance
`SAM`, `AIR`, `THREAT`, `SPAWN_WIN` y `makeLevel()` en `game.js`. En campañas históricas, el objetivo y la dificultad de cada misión están en `hist/<id>_m*.js` (`goal`, `lim`, oleadas).

### Crear una campaña histórica nueva
1. `hist/<id>_core.js`: `window.C2_HIST['<id>'] = { name, years, intro, chapters, missions, era, ribbons, upg, free, … }` (copia la estructura de `korea_core.js`).
2. `hist/<id>_m1.js …`: misiones (briefing, mapa, oleadas, `goal`: `evac | strike | ace | keep`, archivo «qué ocurrió realmente»).
3. `hist/<id>_units.js`: aeronaves/unidades de la época; `era.str` sustituye textos, `era.skin` el aspecto, `era.callsigns` los indicativos.
4. Traducciones `hist/<id>_fr|de|pt.js`.
5. Registrar los scripts en `index.html`, `sw.js` (`FILES`) y, si es de pago, el producto `c2hell_camp_<id>` en `config.js` y en la tienda. `tools/build_www.js` copia `hist/` entero.
6. Fotos opcionales: `hist/img/manifest.json` + `tools/fetch_hist_photos.js` (solo con licencia verificada; no se muestra ninguna sin crédito).

### Guardado
`localStorage`: `c2hell.save` (progreso: estrellas, mejoras, logros, `hist[campaña] = {stars, best, up, cp, aces, rib}`) y `c2hell.lang` aparte. Hay exportar/importar en Ajustes.

### Reportar errores
Ajustes y menú de pausa tienen «🐞 Reportar un error» (`showReport` en `game.js`): abre el correo del jugador (`mailto:`) hacia `reportEmail` de `config.js` con la descripción y un informe técnico (versión, dispositivo, estado de partida, últimos eventos y errores JS). No hay envío por servidor: el jugador pulsa enviar en su app de correo.

## Pruebas

**No hay tests automáticos en el repositorio todavía** (las comprobaciones se han hecho con scripts de Playwright locales). El juego expone `window.__C2` (estado `G`, `newGame`, `step(dt)`, `placeUnit`, `startOps`, `endHist`, `showCamp`…) para poder simularlo sin render:

```js
// node probar.js  (npm i playwright ya está en devDependencies)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 412, height: 915 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/index.html?lang=es&unlock');
  await pg.evaluate(() => { const A = window.__C2; A.SET.tutDone = true; A.newGame(12, { mode: 'hist', camp: 'korea', m: 12 }); A.startOps(1); for (let i = 0; i < 400; i++) A.step(1 / 20); });
  await pg.screenshot({ path: 'ops.png' }); console.log('errores JS:', errs); await b.close();
})();
```
Antes de dar un cambio por bueno: sin errores JS, `node --check` de los `.js` tocados, probar en los tres viewports móviles y los 5 idiomas si tocaste textos.

## Entrega
Android/iOS/tienda/CI: [`README_DELIVERY.md`](README_DELIVERY.md). Resumen: `npm run apk` genera el APK de depuración; el AAB firmado y los secretos del workflow están descritos allí. El SDK de Android no está en el sandbox de desarrollo remoto: el APK se compila en local.

## Estado y limitaciones conocidas
- Balance de las campañas validado solo con un bot; falta playtest con personas (`PLAYTEST.md`).
- Traducciones fr/de/pt sin revisión de nativos; exactitud histórica sin revisar por un historiador.
- Sin fotos de archivo incluidas (slots y script listos).
- Comportamiento de Web Share/compras y safe areas sin probar en dispositivo real.
- Fichas de aviones que se solapan con etiquetas cerca de las bases; etiqueta del frente sobre el log.

## Créditos y licencias
Simbología NTDS: fuente **NTDS Icons** de Peter Ellis Jones — https://github.com/peterellisjones/ntds-icons (fuente SIL OFL 1.1, código MIT/Apache-2.0; archivos y licencias en `assets/fonts/`). Datos geográficos: Natural Earth (dominio público) vía world-atlas. Fotos de archivo: ver créditos en `hist/img/credits.js` (ninguna incluida por ahora).

## Versiones automáticas

`version.json` = `{major, minor, patch, build}`. Cada empaquetado (`npm run www|sync|apk|aab…`) sube **patch y build** una vez y propaga el número:
`www/version.js` (`window.C2_VERSION`, visible en Créditos e Informe), `www/sw.js` (caché nueva, ya no hay que tocar `VER` a mano), `www/config.js`, Android (`versionCode`=build, `versionName`) e iOS (`CURRENT_PROJECT_VERSION`, `MARKETING_VERSION`) vía `tools/patch_native.js`.
`C2_NO_BUMP=1` (o `--no-bump`) empaqueta sin gastar número. Commitea `version.json` tras publicar una build para que no se repitan códigos.

## Guardado

`localStorage['c2hell.save']` lleva `v` (= `SAVE_V` en `game.js`). Al cargar se migra por pasos (`SAVE_MIGRATIONS[n]`: n → n+1) y se guarda una copia del original en `c2hell.save.v<n>`; un JSON ilegible se aparta en `c2hell.save.bak`. Para cambiar el formato: sube `SAVE_V` y añade la migración (y un test en `tests/game.test.js`). Un código de exportación de una versión futura se rechaza en lugar de corromper el progreso.

## Cumplimiento de tienda

`privacy.html` (política en 5 idiomas, se publica con la build) y `store/COMPLIANCE.md` (respuestas de Data safety / App Privacy, clasificación por edad, licencias y lista previa al envío). Pon la URL pública en `config.js → privacyUrl`.

## Backend online (opcional)

`cloudflare/` es un backend sin servidor (Cloudflare Workers + D1) con el mismo contrato que `server/server.js`; sirve para telemetría opt-in, marcadores y guardado en la nube sin mantener la Raspberry. Guía en `cloudflare/README.md`.
