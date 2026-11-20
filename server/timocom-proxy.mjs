// Retorno · servidor puente entre la app y TIMOCOM (sin dependencias, Node 22+).
// Por qué existe: las credenciales de TIMOCOM no pueden ir dentro de la app del móvil.
// La app llama aquí con X-App-Token; este servidor llama a TIMOCOM y devuelve el formato común de oferta.
//
// Arrancar (en tu VPS):  APP_TOKEN=... TIMOCOM_USER=... TIMOCOM_PASSWORD=... PORT=8787 node server/timocom-proxy.mjs
// Probar:                curl -H 'X-App-Token: ...' -d '{"lat":42.6,"lon":-5.57,"radiusKm":50}' http://localhost:8787/timocom/search

import { createServer } from 'node:http';

const PORT = +(process.env.PORT || 8787);
const APP_TOKEN = process.env.APP_TOKEN || '';
const TIMOCOM = {
  base: process.env.TIMOCOM_BASE || '',        // URL de la API que te den
  user: process.env.TIMOCOM_USER || '',
  password: process.env.TIMOCOM_PASSWORD || '',
};

const MAX = 30; // norma de TIMOCOM: máximo 30 ofertas anónimas por búsqueda

// ---------------------------------------------------------------------------------------------
// TODO cuando llegue la documentación de Freight Exchange Search:
//  1. timocomSearch(): montar la petición de búsqueda por área (posición + radio, fechas, tipo de caja)
//  2. toOffer(): traducir cada oferta de TIMOCOM al formato común (ver js/sources/timocom.js)
//  3. timocomContact(): el segundo paso, que devuelve los datos de contacto de una oferta
// ---------------------------------------------------------------------------------------------
async function timocomSearch(q) {
  if (!TIMOCOM.base) throw Object.assign(new Error('TIMOCOM aún no configurado'), { status: 501 });
  // const r = await fetch(`${TIMOCOM.base}/...`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({...}) });
  // const data = await r.json();
  // return data.<lista>.slice(0, MAX).map(toOffer);
  throw Object.assign(new Error('Búsqueda pendiente de implementar con la documentación'), { status: 501 });
}
async function timocomContact(id) {
  if (!TIMOCOM.base) throw Object.assign(new Error('TIMOCOM aún no configurado'), { status: 501 });
  throw Object.assign(new Error('Contacto pendiente de implementar con la documentación'), { status: 501 });
}
// function authHeaders() { return { Authorization: 'Basic ' + Buffer.from(`${TIMOCOM.user}:${TIMOCOM.password}`).toString('base64'), 'Content-Type': 'application/json' }; }
// function toOffer(raw) { return { id, source: 'TIMOCOM', company: {...}, from: {...}, to: {...}, km, loadDate, loadHour, price, currency, body, weightT, meters, adr }; }

// ---------------------------------------------------------------------------------------------
const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
const send = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', ...cors }); res.end(JSON.stringify(body)); };
const readJson = req => new Promise((ok, ko) => {
  let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { ko(Object.assign(new Error('JSON no válido'), { status: 400 })); } });
});

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.url === '/health') return send(res, 200, { ok: true, timocom: !!TIMOCOM.base });
  if (!APP_TOKEN || req.headers['x-app-token'] !== APP_TOKEN) return send(res, 401, { error: 'Token no válido' });
  try {
    if (req.method === 'POST' && req.url === '/timocom/search') {
      const q = await readJson(req);
      if (![q.lat, q.lon, q.radiusKm].every(Number.isFinite)) return send(res, 400, { error: 'Faltan lat, lon o radiusKm' });
      const offers = await timocomSearch(q);
      return send(res, 200, { offers: offers.slice(0, MAX) }); // no se guarda nada: se responde y se olvida
    }
    if (req.method === 'POST' && req.url === '/timocom/contact') {
      const { id } = await readJson(req);
      if (!id) return send(res, 400, { error: 'Falta id' });
      return send(res, 200, { contact: await timocomContact(String(id)) });
    }
    send(res, 404, { error: 'No existe' });
  } catch (e) {
    send(res, e.status || 502, { error: e.message });
  }
}).listen(PORT, () => console.log(`Retorno · servidor puente en http://localhost:${PORT}`));
