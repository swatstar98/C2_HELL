# Backend de C2 HELL en Cloudflare (Workers + D1)

Sustituye al `server/server.js` de la Raspberry Pi: mismas rutas y mismo contrato (el cliente no cambia), sin servidor que mantener.
Un Worker (código en `src/`) + una base de datos **D1** (SQLite gestionado, `schema.sql`). Sin dependencias de ejecución.

| Ruta | Para qué |
|---|---|
| `POST /event` | Telemetría anónima (solo si el jugador activa «Funciones online»): contadores por día, idioma, versión, victorias/derrotas por nivel y misión, y jugadores únicos diarios |
| `POST /score`, `GET /scores` | Marcadores (mejor puntuación por jugador) |
| `POST /save`, `GET /save/CODIGO` | Guardado en la nube por código |
| `GET /stats?days=14` | Resumen para ti, con `Authorization: Bearer <ADMIN_TOKEN>` |
| `GET /health` | Comprobación |

## Puesta en marcha (≈10 min, desde esta carpeta)
1. Cuenta gratuita en cloudflare.com. Luego `npm install` y `npx wrangler login`.
2. `npx wrangler d1 create c2hell` → copia el `database_id` que imprime a `wrangler.toml`.
3. `npm run db:init` crea las tablas en la base remota.
4. `npx wrangler secret put ADMIN_TOKEN` (pega una cadena larga aleatoria; protege `/stats`).
5. `npm run deploy` → te da la URL `https://c2hell-api.<tu-subdominio>.workers.dev`. Comprueba `/health`.
6. En el juego, `config.js` → `endpoint: 'https://c2hell-api.<tu-subdominio>.workers.dev'`. «Funciones online» aparece en Ajustes (apagado por defecto).
7. Estadísticas: `curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://…workers.dev/stats?days=14"`.
8. Actualiza Data safety / privacidad como indica `store/COMPLIANCE.md` (columna «con online»).

Probar en local sin cuenta: `npm run db:init:local` y `npx wrangler dev --local`.

## Cosas que debes saber
- **Cuotas del plan gratuito** (documentación de Cloudflare, oct-2026): 100 000 peticiones/día para Workers; D1: 100 000 filas escritas/día, 5 millones leídas/día, 5 GB. Cada evento escribe ~4–5 filas, así que caben unos 20 000 eventos al día. Si te quedas corto, el plan de pago de Workers incluye mucho más; el juego ignora los errores de red, así que no se rompe nada.
- **Uso comercial:** no he encontrado en la documentación de Workers/D1 una restricción de uso comercial en el plan gratuito (a diferencia del plan Hobby de Vercel). Aun así, confirma los términos de servicio vigentes antes de lanzar.
- **Límite de tasa:** el Worker limita a 60 peticiones/min por IP en memoria (mejor esfuerzo: cada instancia lleva su cuenta y la IP no se guarda en ningún sitio). Para un límite global, crea una regla en *Security → WAF → Rate limiting rules* (el plan gratuito incluye una).
- **Antitrampas:** las puntuaciones las manda el cliente; no son a prueba de trampas.
- **Retención:** un cron diario borra guardados de más de 365 días, marcadores de más de 120 y contadores de más de 400.
- **Pruebas** (`npm test` en la raíz): `tests/cloudflare.test.js` ejecuta el handler sobre SQLite real con el `schema.sql` de producción, y `tests/online.test.js` hace que el juego real hable con él. Además lo arranqué en el runtime real (`wrangler dev --local`, workerd + D1 local) y probé health, event, score, save y stats por HTTP. **No está desplegado en Cloudflare**: desde aquí no hay cuenta; el primer despliegue es la prueba de humo.
