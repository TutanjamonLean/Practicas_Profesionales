/**
 * BiblioTech - Configuración del frontend
 *
 * Este archivo se carga antes de js/scripts.js en todas las páginas.
 *
 * API_URL: dirección pública del backend.
 *
 *   - Si el backend sirve también este frontend (un único Web Service de
 *     Node.js), dejar el valor vacío: se usa el mismo origen ("/api").
 *   - Si el frontend está publicado como sitio aparte (por ejemplo, un
 *     Static Site de Render), pegar acá la URL que Render muestra para el
 *     Web Service del backend. Se puede escribir con o sin "/api" al final;
 *     el cliente lo agrega solo.
 *
 *   Ejemplo de forma (NO usar este valor, reemplazarlo por la URL real):
 *     API_URL: 'https://<nombre-del-servicio>.onrender.com'
 */
window.BIBLIO_CONFIG = {
  API_URL: 'https://proyecto-bibliotech.onrender.com'
};
