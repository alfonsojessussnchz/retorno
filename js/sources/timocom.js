/* Retorno · conector de TIMOCOM.
   La app solo habla con este archivo. Con CONFIG.source = 'mock' usa la bolsa simulada;
   con 'api' llama a tu servidor puente (server/), que es quien habla con TIMOCOM con tus credenciales.

   FORMATO COMÚN DE OFERTA (lo que espera el resto de la app):
   {
     id, source,
     company: { name, tid, vat },                 // en el paso 1 TIMOCOM solo deja mostrar esto
     from: { name, lat, lon }, to: { name, lat, lon },
     km,                                          // km cargado (si no viene, se calcula)
     loadDate: 'YYYY-MM-DD', loadHour,            // loadHour puede ser null
     price, currency,                             // price puede ser null ("a negociar")
     body: 'Lona' | 'Frigorífico' | 'Caja cerrada' | 'Plataforma' | 'Cualquiera',
     weightT, meters, adr
   }
   CONTACTO (paso 2): { person, phone, email }
*/
'use strict';

const Timocom = (() => {
  const headers = () => ({ 'Content-Type': 'application/json', 'X-App-Token': CONFIG.appToken });

  async function call(path, body) {
    const r = await fetch(CONFIG.apiBase + path, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`TIMOCOM respondió ${r.status}`);
    return r.json();
  }

  // TODO (cuando llegue la documentación): ajustar los nombres de los campos a la respuesta real.
  // Lo ideal es que el servidor puente ya devuelva el formato común y aquí no haya que tocar nada.
  function mapOffer(raw) {
    return {
      id: String(raw.id),
      source: 'TIMOCOM',
      company: { name: raw.company?.name ?? '—', tid: raw.company?.timocomId ?? '', vat: raw.company?.vatId ?? '' },
      from: { name: raw.from?.city ?? '', lat: +raw.from?.lat, lon: +raw.from?.lon },
      to: { name: raw.to?.city ?? '', lat: +raw.to?.lat, lon: +raw.to?.lon },
      km: raw.distanceKm ?? null,
      loadDate: raw.loadingDate,
      loadHour: raw.loadingHour ?? null,
      price: raw.price?.amount ?? null,
      currency: raw.price?.currency ?? 'EUR',
      body: raw.bodyType ?? 'Cualquiera',
      weightT: raw.weightT ?? 0,
      meters: raw.lengthM ?? 0,
      adr: !!raw.adr,
    };
  }

  /** Paso 1: ofertas en un área. q = { lat, lon, radiusKm, dests, body, dateFrom, dateTo } */
  async function search(q) {
    if (CONFIG.source === 'mock') return Mock.search({ ...q, max: CONFIG.maxResults });
    const data = await call('/timocom/search', q);
    return (data.offers || []).slice(0, CONFIG.maxResults).map(mapOffer);
  }

  /** Paso 2: contacto de una oferta (cuenta como consulta) */
  async function contact(id) {
    if (CONFIG.source === 'mock') return Mock.contact(id);
    const data = await call('/timocom/contact', { id });
    return data.contact || null;
  }

  return { search, contact, mapOffer };
})();

if (typeof module !== 'undefined') module.exports = Timocom;
