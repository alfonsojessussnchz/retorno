/* Retorno · bolsa simulada. Imita cómo responde TIMOCOM (máx. 30 ofertas anónimas en un área;
   el contacto se pide aparte) para poder probar la app sin acceso real. Todo es ficticio. */
'use strict';

const Mock = (() => {
  const SHIP = ['Hortofrutícola del Páramo', 'Cárnicas Bierzo', 'Logística Torío', 'Papelera del Esla', 'Áridos Órbigo',
    'Conservas Valdería', 'Embalajes Cea', 'Maderas Omaña', 'Lácteos Porma', 'Distribuciones Luna', 'Vinos Tierra Alta', 'Piensos Curueño'];
  const NAMES = ['Laura', 'Marcos', 'Elena', 'Javier', 'Nuria', 'Rubén', 'Sara', 'Iván', 'Marta', 'Diego'];
  const slug = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
  const pools = new Map(); // ofertas "publicadas" por zona, para que entre búsquedas se mantengan y vayan saliendo nuevas
  const contacts = new Map();
  let nextId = 1;

  function offer(r, pos, dests) {
    let from;
    const near = Geo.TOWNS.filter(t => Geo.haversine(pos.lat, pos.lon, t[1], t[2]) < 160);
    if (r() < 0.5 && near.length) {
      const t = near[Math.floor(r() * near.length)];
      from = { name: t[0], lat: t[1] + (r() - 0.5) * 0.03, lon: t[2] + (r() - 0.5) * 0.03 };
    } else {
      const d = 3 + r() * 150, b = r() * 2 * Math.PI;
      const lat = pos.lat + d * Math.cos(b) / 111, lon = pos.lon + d * Math.sin(b) / (111 * Math.cos(pos.lat * Math.PI / 180));
      from = { name: 'Pol. ind. cerca de ' + Geo.nearest(lat, lon).name, lat, lon };
    }
    const keys = Object.keys(Geo.DEST);
    let to, km = 0;
    for (let i = 0; i < 12 && km < 80; i++) {
      const c = r() < 0.45 && dests.length ? dests[Math.floor(r() * dests.length)] : keys[Math.floor(r() * keys.length)];
      const t = Geo.DEST[c][Math.floor(r() * Geo.DEST[c].length)];
      to = { name: t[0], lat: t[1], lon: t[2] };
      km = Geo.road(from, to);
    }
    const tons = Math.round((2 + r() * 22) * 2) / 2;
    const day = r() < 0.45 ? 0 : r() < 0.7 ? 1 : 2;
    const date = new Date(); date.setDate(date.getDate() + day);
    const company = SHIP[Math.floor(r() * SHIP.length)];
    const id = 'mock-' + nextId++;
    contacts.set(id, {
      person: NAMES[Math.floor(r() * NAMES.length)] + ' (tráfico)',
      phone: '600 000 ' + (100 + Math.floor(r() * 900)),
      email: 'trafico@' + slug(company) + '.example',
    });
    return {
      id, source: 'TIMOCOM (simulada)',
      company: { name: company, tid: String(100000 + Math.floor(r() * 900000)), vat: 'ESB' + String(Math.floor(r() * 1e8)).padStart(8, '0') },
      from, to, km,
      loadDate: iso(date), loadHour: 6 + Math.floor(r() * 12),
      price: r() < 0.15 ? null : Math.round(km * (0.95 + r() * 0.75) / 10) * 10, currency: 'EUR',
      body: r() < 0.12 ? 'Cualquiera' : Ranking.BODIES[Math.floor(r() ** 1.7 * Ranking.BODIES.length)],
      weightT: tons, meters: Math.min(13.6, Math.round((1 + tons * 0.5 + r() * 2) * 10) / 10),
      adr: r() < 0.12,
    };
  }

  // Paso 1: búsqueda por área → hasta `max` ofertas anónimas (sin contacto).
  // La primera vez se "publican" 70 ofertas en la zona; en cada búsqueda siguiente aparecen 1 o 2 nuevas.
  async function search({ lat, lon, radiusKm, dests = [], max = 30 }) {
    const key = lat.toFixed(2) + ',' + lon.toFixed(2), pos = { lat, lon };
    let p = pools.get(key);
    if (!p) {
      const r = rng(Math.round(lat * 100) * 7919 + Math.round(lon * 100) * 104729 + new Date().getDate());
      p = { r, list: Array.from({ length: 70 }, () => offer(r, pos, dests)) };
      pools.set(key, p);
    } else {
      const n = 1 + Math.floor(p.r() * 2);
      for (let i = 0; i < n; i++) p.list.unshift(offer(p.r, pos, dests));
    }
    await new Promise(res => setTimeout(res, 350)); // como si fuera la red
    return p.list.filter(o => Geo.haversine(lat, lon, o.from.lat, o.from.lon) <= radiusKm).slice(0, max).map(o => ({ ...o }));
  }
  // Paso 2: datos de contacto de una oferta
  async function contact(id) {
    await new Promise(res => setTimeout(res, 200));
    return contacts.get(id) || null;
  }

  return { search, contact };
})();

if (typeof module !== 'undefined') module.exports = Mock;
