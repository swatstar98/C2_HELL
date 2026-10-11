# Protocolo de playtest — C2 HELL (campaña Corea)

El bot automático gana las 24 misiones, pero **no dice nada sobre dificultad ni diversión para humanos**. Esto solo lo responden jugadores reales.

## Muestra
- 5–8 personas por ronda. Mezcla: 2–3 que jueguen tower defense/estrategia, 2–3 casuales, 1–2 interesados en historia militar.
- Dispositivo real (Android de gama media como mínimo). Sesión de 20–30 min, sin explicar nada antes.

## Cómo observar
1. Instalar el APK (`npm run apk`). Partida nueva, idioma del jugador.
2. Pedir que piense en voz alta. No ayudar durante 3 minutos; anotar dónde se atasca.
3. Que juegue las misiones 1–3 (tutorial + objetivos distintos). Cronometrar.
4. Al terminar, el cuestionario.

## Cuestionario (escala 1–5 salvo indicación)
- Entendí qué tenía que hacer en la fase de PREPARACIÓN. / en la de OPERACIÓN.
- Entendí el objetivo de la misión (evacuar / destruir / derribar / mantener) sin que nadie me lo explicara. (sí/no + «dímelo con tus palabras»)
- La dificultad de la misión 1 / 2 / 3 fue: muy fácil … muy difícil.
- ¿Leíste el briefing? ¿El archivo histórico? ¿Te interesó? (sí/no/un poco)
- ¿Recuerdas el indicativo de algún piloto? (abierto)
- ¿Compartirías el parte de misión? ¿Con quién? (abierto)
- ¿Jugarías la misión 4? ¿Pagarías 2,99 € por las 20 restantes? (sí/no/depende)
- Lo que más te gustó / lo que más te frustró. (abierto)

## Qué medir (observación)
- Tiempo hasta colocar la primera unidad; nº de veces que abre el tutorial.
- Misiones perdidas antes de ganar la 1.ª vez (objetivo: ≤1 de media en las misiones 1–3).
- Abandono: ¿en qué misión/pantalla paran de jugar?
- Pulsaciones erróneas / elementos pequeños en pantalla táctil.

## Criterios de éxito para seguir adelante
- ≥ 70 % entiende el objetivo sin ayuda.
- ≥ 60 % quiere jugar la misión 4 y ≥ 40 % dice que pagaría.
- Misiones 1–3: tasa de victoria a la 1.ª o 2.ª ≥ 80 %.
- Sin bloqueos (soft-locks) ni errores visuales graves en 3+ dispositivos distintos.

## Telemetría disponible
Eventos `hist_end` `{camp, m, win, st, ig, t}` vía `Net.event` (solo si hay servidor configurado en `config.js`). Con ellos se puede ver por misión: victorias, estrellas, integridad y duración. Es opt-in; sin servidor no se envía nada.

## Después de la ronda
Ajustar: umbrales de `goal`/`lim` en `hist/korea_m*.js`, oleadas, y textos. Repetir con gente nueva (los que ya jugaron ya no son «vírgenes»).
