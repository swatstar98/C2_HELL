# C2 HELL — notas de diseño y arquitectura

Lite sim de mando y control antiaéreo (estilo Command: Modern Operations) con mecánica de tower defense.
Web pura (Canvas 2D + HTML), sin dependencias. Funciona en PC (ratón/teclado) y móvil (táctil).

## Ejecutar
Abre `index.html` (doble clic) o sirve la carpeta (`npx serve .`).
Parámetros de depuración: `?unlock` (todos los niveles), `?level=7` (salta al nivel).

## Empaquetar para Android (Capacitor)
```
npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init c2hell com.tuempresa.c2hell --web-dir=.
npx cap add android && npx cap sync && npx cap open android
```

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
Arte/iconografía APP-6 más completa, mejoras entre niveles (meta-progresión), más tipos de amenaza (HARM, enjambres con evasión),
mapas reales por nivel, audio real, guardado en la nube, empaquetado Capacitor.

## Créditos
Simbología NTDS: fuente **NTDS Icons** de Peter Ellis Jones — https://github.com/peterellisjones/ntds-icons
(fuente bajo SIL OFL 1.1, código MIT/Apache-2.0). Archivos y licencias en `assets/fonts/`.
La fuente va incrustada en base64 en `style.css` (funciona desde `file://` y en Capacitor); si no carga, el juego usa símbolos vectoriales de respaldo.
