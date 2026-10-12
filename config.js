/* Configuración opcional. Déjalo vacío para jugar 100 % sin conexión (por defecto).
 * Si despliegas server/server.js (o un backend compatible), pon aquí su URL base, p. ej. "https://mi-servidor.example/c2hell".
 *   endpoint → marcadores online, telemetría anónima (opt-in) y guardado en la nube por código.
 *   store    → tienda (juego completo + packs de teatro). enabled:false = todo desbloqueado (web/PWA, desarrollo).
 *              Las builds de tienda lo activan con `npm run sync:store` (ver README_DELIVERY.md). Con ?store=sim se prueba con compras simuladas.
 *              prices = precio de reserva; en la app nativa se usa el precio localizado que devuelve la tienda. */
window.C2_CONFIG = {
  endpoint: '', privacyUrl: '', version: '1.0.0', reportEmail: 'rotorliftsim@gmail.com',
  store: { enabled: false, sim: false, prices: { c2hell_full: '2,99 €', c2hell_pack_baltico: '0,99 €', c2hell_pack_marrojo: '0,99 €', c2hell_pack_taiwan: '0,99 €', c2hell_pack_balcanes: '0,99 €', c2hell_camp_korea: '2,99 €' } }
};
