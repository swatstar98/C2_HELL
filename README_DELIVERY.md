# C2 HELL — entrega para Android, iOS y web

Un único código (HTML/JS/Canvas) se entrega de tres formas: **web/PWA**, **Android** (Capacitor) e **iOS** (Capacitor).
Idiomas: es, en, fr, de, pt. Vertical fijo.

## 1. Probar ya en el móvil (sin instalar nada)
- **GitHub Pages**: activa *Settings → Pages → Source: GitHub Actions* y lanza el workflow **Web / PWA**. Abre la URL en el móvil y usa *Añadir a pantalla de inicio* (Android: Chrome; iOS: Safari → Compartir). Funciona sin conexión tras la primera visita (service worker).
- **Red local**: `node tools/serve.js` y abre `http://IP-DEL-PC:8080` en el móvil. (El service worker y el portapapeles solo funcionan en `localhost` o HTTPS.)

## 2. Android (APK / AAB)
Requisitos: Node 22+, JDK 21, Android Studio reciente (SDK 36; Capacitor 8 apunta a targetSdk 36, minSdk 24).
```bash
npm install
npm run native:add:android     # genera android/, lo parchea (vertical, VIBRATE, notch) y crea los iconos
npm run android:apk            # APK de depuración → android/app/build/outputs/apk/debug/
npm run android                # o abre el proyecto en Android Studio
```
- **Instalar el APK**: copia `app-debug.apk` al móvil y ábrelo (permite «orígenes desconocidos»), o `adb install app-debug.apk`.
- **Google Play**: genera un keystore (`keytool -genkey -v -keystore release.jks -alias c2hell -keyalg RSA -keysize 2048 -validity 10000`), guárdalo fuera del repo y compila `npm run android:aab` firmando desde Android Studio (*Build → Generate Signed Bundle*). El workflow **Android** lo hace solo si defines los secretos `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
- Ficha de Play: categoría Juegos → Estrategia; permisos usados: solo VIBRATE (y INTERNET, que Capacitor declara, solo se usa si activas las funciones online). Necesitas icono 512, gráfico destacado 1024×500 y capturas verticales.

## 3. iOS (IPA / TestFlight)
**Requiere un Mac con Xcode reciente (Capacitor 8 usa Swift Package Manager, ya no CocoaPods; despliegue mínimo iOS 15)**, y una cuenta de Apple Developer (99 USD/año) para dispositivo real y TestFlight.
```bash
npm install
npm run native:add:ios         # genera ios/, lo parchea (solo vertical, sin barra de estado) y crea los iconos
npm run ios                    # abre Xcode
```
En Xcode: *App → Signing & Capabilities* → elige tu equipo y un Bundle Identifier propio (por defecto `com.swatstar.c2hell`), conecta el iPhone y pulsa Run. Para TestFlight: *Product → Archive → Distribute App*.
El workflow **iOS** compila una build de simulador sin firma (comprueba que el proyecto compila), no genera IPA.

## 4. Qué está verificado y qué no
| Parte | Estado |
|---|---|
| Juego en Chromium (retrato 400×820 y 420×860), 5 idiomas, modos, repetición, accesibilidad | Probado con Playwright |
| PWA: manifest, service worker, carga sin conexión | Probado en Chromium (localhost) |
| `cap add android` / `cap add ios`, parche de orientación/permisos, generación de iconos y `www/` | Ejecutado en Linux: los proyectos nativos se generan y el parche se aplica (idempotente) |
| Puente Capacitor (háptica, botón atrás, pausa al pasar a segundo plano, barra de estado) | Probado **con un mock** de `window.Capacitor`; **no** en un dispositivo real |
| Compilar el APK/AAB, instalar y jugar en Android | **No probado** (el entorno de desarrollo no tenía Android SDK ni acceso a Google Maven) |
| Compilar/ejecutar en iOS | **No probado** (necesita macOS/Xcode) |
| Audio (música, SFX) | Se programa y arranca (AudioContext en estado `running`), pero **no se ha escuchado**; el desbloqueo por gesto y el truco del interruptor de silencio de iOS están sin verificar en dispositivo |
| Voces del mando (`speechSynthesis`) | La llamada no falla, pero **no se ha oído**; depende de las voces instaladas en el sistema (en algunos Android/WebView puede no haber voz) |
| Rendimiento en móviles de gama baja | Sin medir |

### Lista de comprobación en dispositivo real
1. Orientación bloqueada en vertical (también con el móvil girado) y sin barras negras con *notch*.
2. Primer toque → arranca la música; con el interruptor de silencio de iOS activado, ¿suena?
3. Háptica en impactos (iOS no tiene `navigator.vibrate`; se usa el plugin Haptics).
4. Botón *atrás* de Android: cierra paneles / abre pausa; pasar la app a segundo plano pausa la partida.
5. Voces: Ajustes → *Voces del mando* (instala una voz de tu idioma en el sistema si no hay).
6. Rendimiento en el nivel 12 y en *Defensa sin fin* a 4×.
7. Cambiar idioma en Ajustes y recorrer menús (las etiquetas de país del mapa solo están localizadas en es/en).

## 5. Guardado, marcadores y telemetría (todo opcional)
- **Copia de seguridad (siempre disponible, sin servidor)**: Ajustes → *Guardado y copia de seguridad* genera un código `C2H1.…` que puedes copiar, compartir o guardar en un archivo y restaurar en otro dispositivo.
- **Nube, marcadores online y telemetría**: apagados por defecto. Para activarlos despliega `server/server.js` (Node, sin dependencias; ponlo detrás de HTTPS) y rellena `endpoint` en `config.js`. Entonces aparece en Ajustes el interruptor *Funciones online*, que envía puntuaciones y eventos anónimos (id aleatorio, sin datos personales). El guardado en la nube funciona por **código** (quien tenga el código puede leer/escribir ese guardado: no hay cuentas).
- Límites: no hay backend alojado en esta entrega (hay que ponerlo tú); las puntuaciones las manda el cliente y **no son a prueba de trampas**; el reto diario fija el nivel (teatro, clima, regla, oleadas, rampas) por fecha, pero los dados del combate no están sincronizados entre jugadores. Si activas lo online, publica una política de privacidad (las tiendas la piden).

## 6. Estructura
```
index.html style.css game.js i18n.js lang/*.js maps*.js config.js   ← el juego
manifest.webmanifest sw.js icons/                                      ← PWA
package.json capacitor.config.json tools/ assets/                       ← Capacitor y recursos (iconos/splash)
server/server.js                                                        ← servidor opcional de referencia
.github/workflows/{android,ios,pages}.yml                               ← CI
```
`android/`, `ios/` y `www/` no se versionan: se regeneran con `npm run native:add:*` y `npm run sync`. Tras editar el juego: `npm run sync`.

## Tienda (juego completo + packs de teatro)

**Modelo:** campaña de 12 niveles (3 teatros) gratis. De pago, una sola vez y sin anuncios: **Juego completo** (los 4 teatros extra + Sin fin + Reto diario + Misiones especiales + futuras ampliaciones) o un **pack por teatro** (4 niveles). Precios de referencia en `config.js` (2,99 € / 0,99 €); en la app nativa se muestra el precio localizado que devuelve la tienda.

**Estados** (`Store.mode()` en `game.js`):
| Modo | Cuándo | Efecto |
|---|---|---|
| `off` | `store.enabled:false` (por defecto: web/PWA, desarrollo, APK de depuración) | Todo desbloqueado |
| `sim` | `?store=sim` en la URL, o `store.sim:true` | Compra **simulada** (no cobra): solo para probar |
| `live` | `store.enabled:true` + app nativa con el plugin | Compra real vía Google Play / StoreKit |
| `nobilling` | `store.enabled:true` pero sin pasarela | No se puede comprar (falla cerrado, nada se regala) |

**Para publicar con tienda:**
1. Crea en Play Console y App Store Connect estos productos **únicos / no consumibles**: `c2hell_full`, `c2hell_pack_baltico`, `c2hell_pack_marrojo`, `c2hell_pack_taiwan`, `c2hell_pack_balcanes` (el id de pack es `c2hell_pack_` + el `id` del teatro en `maps2.js`).
2. Genera con la tienda activada: `npm run sync:store` (o `npm run android:aab:store`). El workflow `android.yml` ya lo hace para el AAB firmado.
3. iOS: en Xcode añade la capability **In-App Purchase** al target App.
4. Prueba con cuentas de prueba de licencia (Play) y Sandbox (Apple) **antes** de publicar.

**Pasarela:** `initBilling()` usa el plugin `@capgo/native-purchases` y expone `window.C2_BILLING` (`purchase`, `restore`, `price`). Para cambiar de plugin (RevenueCat, etc.) basta con rellenar ese mismo contrato.

**Limitaciones (honestas):**
- La integración nativa **no está probada** en dispositivo real ni contra las tiendas; sí lo está la lógica con una pasarela simulada (`tools` de prueba headless).
- El desbloqueo se guarda en `localStorage` (`save.iap`) y se comprueba en el cliente: un jugador con el móvil rooteado podría falsificarlo. Es un riesgo aceptable para un pago de pocos euros; la solución sería validar recibos en un servidor.
- `iap` no entra en el código de copia de seguridad ni en la nube, a propósito: si no, bastaría compartir un código para regalar el juego. Al reinstalar se recupera con **Restaurar compras**.
- Apple exige el botón *Restaurar compras* (está en la pantalla de tienda) y, para vender, cuenta de desarrollador de pago.
