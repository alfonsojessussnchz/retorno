/* Retorno · ajustes guardados en el móvil.
   Se guardan tus filtros, tu camión, tus empresas favoritas/bloqueadas y el contador de consultas del día.
   Las ofertas y los contactos de TIMOCOM NO se guardan: viven solo en memoria mientras la app está abierta
   (TIMOCOM exige borrarlos como muy tarde el día de carga). */
'use strict';

const Store = (() => {
  const KEY = 'retorno.v1';
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const DEF = {
    pos: { lat: 42.5987, lon: -5.5671, name: 'León', gps: false },
    radiusKm: 50, dests: ['Málaga', 'Sevilla'], marginKm: 60,
    truck: { body: 'Lona', tons: 24, meters: 13.6, adr: false },
    sort: 'score', favs: [], blocked: [],
    quota: { date: today(), count: 0 },
  };
  let s;
  try { s = { ...structuredClone(DEF), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { s = structuredClone(DEF); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* sin almacenamiento: sigue en memoria */ } };

  function useQuery() {
    if (s.quota.date !== today()) s.quota = { date: today(), count: 0 };
    s.quota.count++; save();
    return s.quota.count;
  }
  function quotaLeft() {
    if (s.quota.date !== today()) return CONFIG.dailyQuota;
    return Math.max(0, CONFIG.dailyQuota - s.quota.count);
  }
  function toggle(list, name) {
    s[list] = s[list].includes(name) ? s[list].filter(x => x !== name) : [...s[list], name];
    if (list === 'blocked') s.favs = s.favs.filter(x => !s.blocked.includes(x));
    save();
  }

  return { get: () => s, set: patch => { Object.assign(s, patch); save(); }, save, today, useQuery, quotaLeft, toggle };
})();
