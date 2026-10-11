# Fotos de época (opcional)

Cada ficha del archivo histórico muestra `hist/img/<campaña>_<ficha>.jpg` si existe (p. ej. `korea_f86.jpg`); si no existe, no se muestra nada.
El crédito sale de `K.photos[<ficha>]` en `hist/<campaña>_units.js`.

**Solo imágenes de dominio público o con licencia compatible** (fotografías oficiales del gobierno de EE. UU. — USAF, US Navy, NARA, US Army —,
CC0 o CC-BY con atribución). Comprueba la licencia en la página del archivo antes de añadirla.

Flujo: rellena `manifest.json` (ficha → `url` directa de la imagen, `credit`) y ejecuta `node tools/fetch_hist_photos.js` desde tu PC
(el entorno de desarrollo remoto no tiene salida a esos sitios). El script descarga, reduce a 640 px de ancho si hay `sharp` instalado
y escribe los créditos en `credits.js`, que carga el juego.
