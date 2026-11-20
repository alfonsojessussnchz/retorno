/* Retorno · configuración. Lo único que hay que tocar cuando llegue el acceso a TIMOCOM. */
'use strict';

const CONFIG = {
  // 'mock' = cargas simuladas (para probar ya) · 'api' = TIMOCOM real a través de tu servidor puente (server/)
  source: 'mock',

  // Dirección de tu servidor puente (por ejemplo en tu VPS de Hostinger). Las credenciales de TIMOCOM
  // viven allí, nunca en el móvil.
  apiBase: 'https://TU-DOMINIO/retorno-api',

  // Clave sencilla para que solo tu app pueda usar el servidor puente (la misma que APP_TOKEN en el servidor)
  appToken: 'cambia-esto',

  // Normas de TIMOCOM: máximo 30 ofertas por búsqueda; cada búsqueda y cada contacto abierto cuentan como consulta
  maxResults: 30,
  dailyQuota: 100,        // contingente de ejemplo: cámbialo por el que te den

  // Modo "Avísame": cada cuántos minutos vuelve a buscar mientras la app está abierta
  watchMinutes: 5,
  demoWatchSeconds: 15,   // en modo 'mock' va más rápido para que lo veas

  // Distancia en carretera ≈ línea recta × este factor (hasta tener rutas reales)
  roadFactor: 1.22,
};

if (typeof module !== 'undefined') module.exports = CONFIG;
