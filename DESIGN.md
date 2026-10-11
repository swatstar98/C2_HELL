# C2 HELL — notas de diseño y arquitectura

Lite sim de mando y control antiaéreo (estilo Command: Modern Operations) con mecánica de tower defense.
Web pura (Canvas 2D + HTML), sin dependencias. Funciona en PC (ratón/teclado) y móvil (táctil).

## Ejecutar
Abre `index.html` (doble clic) o sirve la carpeta (`npx serve .`).
Parámetros de depuración: `?unlock` (todos los niveles), `?level=7` (salta al nivel), `?lang=en|es`.

## Empaquetar para Android (Capacitor)
```
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init c2hell com.tuempresa.c2hell --web-dir=.
npx cap add android && npx cap sync && npx cap open android
```

## Arquitectura
- Diseño **vertical** (portrait-first; en escritorio se centra una columna). `index.html` + `style.css` + `game.js` (IIFE).
- `maps.js`: **datos generados** (Natural Earth vía world-atlas) en `window.C2_MAPS`: 3 teatros reales (Iberia, Mediterráneo central, Norte de Australia) con anillos [lon,lat] que se proyectan al cargar cada nivel. Conflictos ficticios entre países reales; el teatro cambia cíclicamente por nivel.
- **Dos fases por nivel**: PREPARACIÓN (en pausa: defensas + reparto de aeronaves entre 3 bases) y OPERACIÓN (salidas, radares ON/OFF; desplegar cuesta +50 %). Los misiles antirradar (ARM) cazan emisores encendidos.
- **i18n** (ES + EN, ampliable): `i18n.js` (`I18N.t(clave, {param})`, detección por navegador/`?lang=xx`, se guarda en `localStorage c2hell.lang`), diccionarios en `lang/es.js` y `lang/en.js`. En `game.js` se usa `tr('clave')`; el HTML estático usa `data-i18n`, `data-i18n-aria`, `data-i18n-title`. Los nombres de datos (SAM, aviones, amenazas, mejoras, niveles, activos) son *getters* que consultan el diccionario, así el idioma cambia en caliente desde AJUSTES. Para añadir un idioma: crea `lang/xx.js` con `I18N.add('xx', {...})` (incluye `'lang.name'`) y añade la etiqueta `<script>`. Las claves que falten caen a en → es.
- Progreso en `localStorage c2hell.save`; el idioma va aparte (no se borra con «Borrar progreso»).

## Recompensa y meta-progresión
- **Ceremonia de victoria** (`endLevel` → `startVictory` → `showEnd`): vuelta de honor con zoom al activo mejor defendido, fanfarria, estrellas una a una (sonido + vibración), contadores animados con «tick», etiqueta de *victoria económica*, récords por nivel, medallas, SITREP, tarjetas de desbloqueo (unidades, teatro, amenaza) y logros nuevos. Tocar la pantalla salta la animación.
- **Medallas por nivel** (`MEDALS`, +PM la primera vez): Cielo limpio, Cirujano (`SURG`), Ojo de águila (`EAGLE`), Silencio de radio, Ataque preventivo. Umbrales calibrados con un bot; se ven en el briefing y en la pausa.
- **Logros globales** (`ACH`, 18) con contadores de por vida (`p.life`), recompensa en PM y toast en directo; pantalla LOGROS en menú y campaña.
- **Feedback de combate**: hitstop + golpe grave en derribos balísticos, cráter al destruir una rampa, pulso verde y banner «OLEADA RECHAZADA» en oleadas sin impactos, toasts de hitos (racha ×5/10/20, primer ARM esquivado, medalla perdida).
- **Campaña por teatros**: minimapas reales con 4 nodos por teatro; teatro «asegurado» = azul y rampas tachadas.
- **Estilo** (`COS`): color de estelas y tinte de símbolos propios, desbloqueables por nivel 6 o logros.
- Guardado: `localStorage c2hell.save` → `stars, up, cp, ach, life, medals, rec, set`.

## Bucle de juego
- Niveles 1–12 (duración ≈ 35 s → 5 min), a partir del 13 escalan sin fin. Empiezan en pausa (fase de planificación) y admiten 1×/2×/4×.
- Amenazas: UAS, señuelos (indistinguibles de UAS), misiles de crucero, balísticos. Salen de **rampas hostiles**.
- Defensas (pestaña DEFENSA): AAA, SHORAD, SAM medio, ABM, radar. Cada una con Pk por tipo de amenaza, munición finita, ROE (libre / ahorrar).
- Aviones (pestaña AIRE): F-16C, F-15E, E-2D (AEW), MQ-9. Misiones: CAP, interceptación, ataque a rampa (con % de éxito mostrado), estación AEW/ISR. Combustible, munición, turnaround, bajas por AA enemiga.
- Detección: solo ves lo que cubren radares/sensores (los balísticos se detectan siempre).
- Economía: créditos pasivos + recompensa por derribo; reabastecer munición cuesta créditos.
- Derrota: capital destruida o integridad < 25 %. Estrellas por integridad final (≥65 % / ≥90 %).

## Controles
- Tarjeta del dock: tap = armar, luego tap/arrastrar en el mapa (en táctil el fantasma sube 46 px para no taparlo con el dedo). Arrastrar la tarjeta hacia el mapa también funciona.
- Tap en unidad/contacto/rampa: panel con acciones y % de éxito.
- Teclado: Espacio = pausa, 1/2/3 = 1×/2×/4×, Esc = cancelar.

## Dónde tocar el balance
`SAM`, `AIR`, `THREAT`, `SPAWN_WIN`, `makeLevel()` en `game.js`. `window.__C2` expone el estado para tests headless
(ver el bot de simulación: `step(dt)` avanza la sim sin render).

## Ideas siguientes
Más teatros, más tipos de amenaza (enjambres con evasión), audio real, guardado en la nube, empaquetado Capacitor, más idiomas.

## Créditos
Simbología NTDS: fuente **NTDS Icons** de Peter Ellis Jones — https://github.com/peterellisjones/ntds-icons
(fuente bajo SIL OFL 1.1, código MIT/Apache-2.0). Archivos y licencias en `assets/fonts/`.
La fuente va incrustada en base64 en `style.css` (funciona desde `file://` y en Capacitor); si no carga, el juego usa símbolos vectoriales de respaldo.

## Profundidad táctica (Fase A)
- **Clima** por nivel (despejado/niebla/noche/tormenta): multiplica el alcance de sensores (`WX`, `emRange`); la tormenta frena las aeronaves. Overlay visual y chip `#wx`.
- **Guerra electrónica**: evento `jam` reduce un emisor a ×.35 durante 16 s; apagarlo 2 s lo resintoniza.
- **Eventos en nivel**: refuerzos, ataque sorpresa (drones desde un flanco), orden del mando (proteger un activo 40 s, +120 créditos), interferencia.
- **Oleadas concentradas** (nivel ≥5): foco en un objetivo, a veces en dos ejes con llegada simultánea. **Drones evasivos** (nivel ≥7) con Pk ×.78.
- **Unidades nuevas**: CIWS láser, destructor DDG (solo en el mar a ≤ `PORT_R` de un puerto), AH-64, nodriza KC-46 (repostaje en vuelo).
- **Dificultad** Normal/Veterano/Experto (`DIFF`): amenazas, créditos y PM; medalla «Temple» y 3 logros nuevos.

## Teatros y modos (Fase B)
- `maps2.js` añade 4 teatros (Báltico, Mar Rojo, Taiwán, Balcanes) generados con `world-atlas` (Natural Earth, dominio público). Niveles 13-28 (4 por teatro); `theaterOf(n)`, `CAMP_N()`, `levelsOf(k)` lo generalizan.
- `newGame(n, cfg)`: `cfg = {mode:'endless'|'daily'|'special', ...}`; `buildModeLevel(cfg)` construye el nivel. Los modos no tocan estrellas/medallas de campaña; pagan PM y puntúan.
- **Sin fin**: oleadas generadas al vuelo (`endlessWave`), rampas que se reconstruyen, puntuación = derribos + oleadas + oleadas limpias. Top‑5 local (`p.endless`).
- **Reto diario**: nivel fijado por la fecha (`dailyConfig`, semilla FNV). La *composición* del nivel (teatro, clima, regla, oleadas, rampas) es idéntica para todos; los dados del combate no están sincronizados. Racha diaria (`p.daily`). `?date=YYYY-MM-DD` para pruebas.
- **Misiones especiales** (`SPECIALS`): Solo aire, Austeridad, Tormenta perfecta, Enjambre, Lluvia de misiles (`lv.rule`).
- Marcadores: solo en el dispositivo; la clasificación online queda para el endpoint opcional de la Fase D.

## Audio, repetición y accesibilidad (Fase C)
- **Música** procedural (WebAudio, Am–F–C–G) con 4 niveles de intensidad según la situación (`musicLevel`): pad → bajo → arpegio+charles → bombo. Bus separado del SFX; `AudioContext.resume()` en el primer gesto (necesario en iOS) y suspensión al pasar a segundo plano.
- **Voces del mando**: `speechSynthesis` del sistema (`VO.say`), una frase por evento (oleada, balísticos, ARM, impacto, interferencia, órdenes…), limitada por tiempo. Depende de las voces instaladas en el dispositivo.
- **Repetición**: instantáneas a 10 Hz de los últimos 14 s (`RP`), reproducibles tras una derrota. **Cámara lenta** (×0,3) tras un impacto grave (`FXS.slow`).
- **Accesibilidad**: modo daltónico (paleta naranja/celeste/amarillo + CSS vars), tamaño de texto A/A+/A++ (CSS `zoom`), pausa automática al abrir un panel.
- **Idiomas**: es, en, fr, de, pt (`lang/*.js`; `tools` de generación en el repo de trabajo). Los nombres de país del mapa solo están localizados en es/en.

## Entrega móvil (Fase D)
- **PWA** (`manifest.webmanifest`, `sw.js`, iconos) y **Capacitor 6** (`capacitor.config.json`, `tools/build_www.js` → `www/`). Las carpetas `android/` e `ios/` se regeneran con `npm run native:add:*` y `tools/patch_native.js` las parchea (vertical, VIBRATE, notch; iOS solo vertical y sin barra de estado).
- `buzz()` usa `Capacitor.Plugins.Haptics` si existe (iOS) y `navigator.vibrate` si no. `nativeInit()` oculta la barra de estado, gestiona el botón atrás y pausa en segundo plano. `SND.init()` reanuda el AudioContext y arranca un `<audio>` silencioso (truco del interruptor de silencio de iOS).
- **Red opcional** (`Net`, `showSaveTools`, `showBoard`): copia de seguridad por código `C2H1.`, y con `config.js` + `server/server.js`: marcadores, telemetría anónima (opt‑in) y guardado en la nube por código.
