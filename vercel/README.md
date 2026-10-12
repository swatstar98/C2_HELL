# Backend de C2 HELL en Vercel

Sustituye al `server/server.js` de la Raspberry Pi: mismas rutas y mismo contrato (el cliente no cambia), pero sin servidor propio.
Funciones sin servidor + **Upstash Redis** (base de datos clave-valor) para guardar contadores, marcadores y partidas en la nube. Sin dependencias npm.

| Ruta | Para qué |
|---|---|
| `POST /event` | Telemetría anónima (solo si el jugador activa «Funciones online»): contadores por día, idioma, versión, victorias/derrotas por nivel y misión, y jugadores únicos diarios |
| `POST /score`, `GET /scores` | Marcadores (mejor puntuación por jugador) |
| `POST /save`, `GET /save/CODIGO` | Guardado en la nube por código (caduca al año sin uso) |
| `GET /stats?days=14` | Resumen para ti, con `Authorization: Bearer <ADMIN_TOKEN>` |
| `GET /health` | Comprobación |

## Puesta en marcha (≈10 min)
1. Sube el repo a GitHub (ya lo tienes) y en Vercel: **Add New → Project → importa el repo** y en *Root Directory* pon **`vercel`**.
2. En el proyecto: **Storage → Create Database → Upstash Redis** (Marketplace) y conéctalo al proyecto. Vercel añade solo `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. En **Settings → Environment Variables** añade `ADMIN_TOKEN` con una cadena larga aleatoria (para `/stats`). Opcional: `KEEP_RECENT=1` guarda los últimos 2000 eventos en bruto (gasta más comandos).
4. Despliega. Comprueba `https://<tu-proyecto>.vercel.app/health` → `{"ok":true}`.
5. En el juego, `config.js` → `endpoint: 'https://<tu-proyecto>.vercel.app'`. A partir de ahí «Funciones online» aparece en Ajustes (apagado por defecto).
6. Mira las estadísticas: `curl -H "Authorization: Bearer $ADMIN_TOKEN" "https://<tu-proyecto>.vercel.app/stats?days=14"`.
7. Actualiza Data safety / privacidad como indica `store/COMPLIANCE.md` (columna «con online»).

## Cosas que debes saber
- **Licencia de Vercel:** el plan Hobby es solo para uso personal/no comercial. Un juego con compras dentro de la app es comercial, así que lo correcto es el plan Pro (o un proveedor cuyo plan gratuito permita uso comercial, p. ej. Cloudflare Workers; `lib/handler.js` es independiente de Vercel y se porta cambiando solo `api/index.js` y `lib/redis.js`). Comprueba los términos vigentes.
- **Cuota de Upstash:** cada evento gasta ~9 comandos Redis (límite de tasa + contadores). Revisa el límite mensual de tu plan en upstash.com y ajusta (p. ej. enviar solo `level_end`) si te quedas corto.
- **Límite de tasa:** 60 peticiones/min por IP; solo se guarda un hash de la IP durante 60 s (coherente con la política de privacidad).
- **Antitrampas:** las puntuaciones las manda el cliente; no son a prueba de trampas (igual que antes).
- **Retención:** contadores 400 días, marcadores 120 días, partidas guardadas 365 días desde la última escritura.
- Pruebas: `npm test` incluye `tests/vercel.test.js` (contrato con Redis simulado) y `tests/online.test.js` (el juego real contra este backend). **No se ha probado contra Vercel ni Upstash reales**: desde aquí no hay acceso; el primer despliegue es la prueba de humo.
