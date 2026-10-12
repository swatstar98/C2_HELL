# Cumplimiento de tienda — borrador listo para copiar

> Preparado a partir de lo que hace el código a 12-oct-2026. No es asesoramiento legal: revisa las respuestas antes de enviarlas y vuelve a comprobarlas cuando cambie algo (sobre todo si activas el endpoint online).

## 1. Política de privacidad
- Archivo: `privacy.html` (5 idiomas, mismo fichero). Se publica con GitHub Pages (`pages.yml`): `https://<usuario>.github.io/<repo>/privacy.html`.
- Pega esa URL en **Play Console → Contenido de la app → Política de privacidad** y en **App Store Connect → Información de la app**.
- Pon la misma URL en `config.js` → `privacyUrl` para que el enlace de Créditos apunte a la pública.
- Si cambia lo que se envía al servidor, actualiza el texto y la fecha.

## 2. Google Play — Seguridad de los datos (Data safety)
Estado actual: `endpoint` vacío en `config.js` → la app **no hace ninguna petición de red propia**. Si lo activas, responde con la columna «con online».

| Pregunta | Ahora (sin online) | Con online activado |
|---|---|---|
| ¿Recopila o comparte datos del usuario? | **No** | **Sí** (recopila; no comparte con terceros) |
| Tipos de datos | — | «Identificadores de usuario o dispositivo» (ID anónimo aleatorio de la app); «Actividad en la app» (eventos de partida, puntuaciones); «Info y rendimiento de la app» solo si añades crash reporting |
| Finalidad | — | Funcionalidad de la app (marcadores, guardado en la nube) y analítica |
| ¿Opcional? | — | **Sí**: desactivado por defecto, el jugador lo activa en Ajustes |
| Cifrado en tránsito | — | Sí, **si el servidor va por HTTPS** (obligatorio: ponlo detrás de TLS) |
| Solicitud de borrado | — | Sí: por correo (indicado en la política). Play exige además una URL/forma de pedirlo |
| Compras dentro de la app | Declarar compras (las gestiona Google Play) | igual |
| Publicidad | No | No |
| Ubicación, contactos, fotos, micrófono, cámara | No | No |

## 3. Apple — Privacidad de la app (nutrition label)
- Sin online: **«Datos no recopilados»**.
- Con online: «Identificadores → ID de dispositivo/usuario» y «Uso → Interacción con el producto», ambos **no vinculados a la identidad**, **no usados para seguimiento**, finalidad «Analítica / Funcionalidad de la app».
- App Tracking Transparency: **no hace falta** (no hay seguimiento).
- Exportación/cifrado: `ITSAppUsesNonExemptEncryption=false` ya lo pone `patch_native.js` (solo se usa HTTPS estándar).

## 4. Clasificación por edad (cuestionarios IARC / Apple)
- Violencia: **fantasía/militar estilizada, sin sangre, sin víctimas representadas** (símbolos tácticos NTDS, radares, misiles). Probable resultado: PEGI 7–12 / ESRB Everyone 10+ / Apple 9+–12+. Responde con honestidad: «violencia de fantasía o caricaturesca: leve».
- Sin lenguaje soez, sin apuestas, sin contenido sexual, sin chat entre usuarios, sin compartir ubicación.
- Compras: sí (contenido digital), **sin cajas de botín**, sin aleatoriedad de pago.
- Público objetivo: **13+** (así no entras en la política «Familias» ni en COPPA).
- La campaña de Corea es histórica y educativa; el texto de la ficha ya aclara que es una simulación ligera, no un parte operativo.

## 4b. Declaraciones de Play Console
- Anuncios: **no contiene anuncios**.
- Apps de noticias/salud/finanzas/gobierno: no.
- Permisos de la app (AndroidManifest): `INTERNET` (Capacitor), `VIBRATE`. Nada más: no pidas más.
- Tipo de app: juego · Categoría: Estrategia (o Simulación).
- Contacto de desarrollador: rotorliftsim@gmail.com (visible en la ficha).
- Cuenta de **persona física** nueva: Google exige **prueba cerrada con ≥12 testers durante 14 días** antes de publicar en producción. Empieza ya a reclutarlos (tu búsqueda de testers sirve para esto).

## 5. Licencias y atribuciones (todo lo que lleva el juego)
| Elemento | Licencia | Obligación | Dónde se cumple |
|---|---|---|---|
| Música: VSCO 2 Community Edition (Versilian Studios) | CC0 1.0 | ninguna (se acredita igualmente) | Créditos + `audio/LICENSE-samples.txt` |
| Mapas: Natural Earth | Dominio público | ninguna | Créditos («MAPAS») |
| Iconos tácticos `ntds_icons` | MIT / SIL OFL (ver ficheros) | conservar aviso de licencia | `assets/fonts/LICENSE-MIT.txt`, `OFL.txt` |
| Fuentes de interfaz | revisar `assets/fonts` | conservar licencia | `assets/fonts/` |
| Símbolos NTDS | Estándar militar de EE. UU. de época (uso como inspiración gráfica) | ninguna | — |
| Fotos históricas | **Ninguna incluida ahora** (`window.C2_PHOTOS = {}`) | Si las añades con `tools/fetch_hist_photos.js`: comprueba licencia por foto (dominio público de EE. UU. / Wikimedia Commons) y deja el crédito visible | `hist/img/credits.js` |
| Nombres y logos | «C2 HELL» y «RotorLift Sims» son marcas propias; busca anterioridades en tiendas y en EUIPO antes de invertir en marketing | — | — |
| Dependencias npm (Capacitor, etc.) | MIT/Apache-2.0 | conservar avisos en el paquete | `package-lock.json` |

## 6. Listado de la ficha (ya hecho)
`store/listing_*.md` ×5 idiomas con los límites de Play validados por `npm test` (título ≤30, corta ≤80, larga ≤4000). Feature graphic en `store/feature_*.png`, capturas en `store/shots/`.

## 7. Antes de enviar a revisión
- [ ] URL de privacidad pública funcionando
- [ ] Data safety + IARC + público objetivo rellenados
- [ ] AAB firmado con `npm run aab` (tienda activada) y subido a prueba interna → cerrada (14 días, 12 testers) → producción
- [ ] Productos in-app creados con los IDs de `config.js` (`c2hell_full`, `c2hell_pack_*`, `c2hell_camp_korea`) y **probados con cuenta de pruebas de licencia** (la pasarela nativa no está verificada en dispositivo real)
- [ ] Capturas por idioma y feature graphic subidos
- [ ] Revisión de la sensibilidad de la campaña de Corea (tono neutral, sin exaltación; ya está redactado como histórico/educativo)
