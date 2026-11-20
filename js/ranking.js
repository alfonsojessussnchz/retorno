/* Retorno · el motor: decide qué ofertas te encajan y les pone nota sobre 100.
   No depende de la bolsa: trabaja con el formato común de oferta (ver js/sources/timocom.js). */
'use strict';

const Ranking = (() => {
  const clamp = x => Math.max(0, Math.min(1, x));
  const BODIES = ['Lona', 'Frigorífico', 'Caja cerrada', 'Plataforma'];

  // Días entre hoy y la fecha de carga (0 = hoy)
  function daysFrom(today, isoDate) {
    const a = new Date(today + 'T00:00:00'), b = new Date(isoDate + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  /**
   * @param offer  oferta en formato común
   * @param ctx    { pos:{lat,lon}, radiusKm, dests:[ciudades], marginKm, truck:{body,tons,meters,adr},
   *                 favs:[nombres], blocked:[nombres], today:'YYYY-MM-DD', roadFactor }
   */
  function evaluate(offer, ctx) {
    const f = ctx.roadFactor || 1.22;
    const straight = Geo.haversine(ctx.pos.lat, ctx.pos.lon, offer.from.lat, offer.from.lon);
    const emptyKm = Math.round(straight * f);
    const loadedKm = offer.km || Geo.road(offer.from, offer.to, f);

    // ¿A qué destino de los que quieres te deja más cerca?
    let offKm = Infinity, city = null;
    for (const c of ctx.dests) {
      const ref = Geo.destRef(c); if (!ref) continue;
      const k = Geo.road(offer.to, ref, f);
      if (k < offKm) { offKm = k; city = c; }
    }

    const why = [];
    if (straight > ctx.radiusKm) why.push('radio');
    if (!ctx.dests.length || offKm > ctx.marginKm) why.push('destino');
    if (offer.body && offer.body !== 'Cualquiera' && offer.body !== ctx.truck.body) why.push('caja');
    if ((offer.weightT || 0) > ctx.truck.tons || (offer.meters || 0) > ctx.truck.meters) why.push('no cabe');
    if (offer.adr && !ctx.truck.adr) why.push('ADR');
    if (ctx.blocked.includes(offer.company.name)) why.push('bloqueada');
    const day = daysFrom(ctx.today, offer.loadDate);
    if (day < 0) why.push('caducada');

    // €/km real = precio / (km en vacío hasta cargar + km cargado). Sin precio → nota neutra.
    const ekm = offer.price ? offer.price / (emptyKm + loadedKm) : null;
    const parts = [
      ['€/km real', ekm == null ? 25 : clamp((ekm - 0.6) / 0.8) * 50, 50],
      ['Cercanía', clamp(1 - straight / Math.max(ctx.radiusKm, 1)) * 20, 20],
      ['Destino', isFinite(offKm) ? clamp(1 - offKm / ctx.marginKm) * 15 : 0, 15],
      ['Fecha', day <= 0 ? 10 : day === 1 ? 6 : 2, 10],
      ['Empresa', ctx.favs.includes(offer.company.name) ? 5 : 2.5, 5],
    ];
    const score = Math.round(parts.reduce((s, p) => s + p[1], 0));
    return { ...offer, straight, emptyKm, loadedKm, offKm, city, ekm, day, parts, score, ok: !why.length, why };
  }

  const SORTS = {
    score: (a, b) => b.score - a.score,
    ekm: (a, b) => (b.ekm ?? -1) - (a.ekm ?? -1),
    empty: (a, b) => a.emptyKm - b.emptyKm,
    date: (a, b) => a.day - b.day || (a.loadHour ?? 24) - (b.loadHour ?? 24),
  };

  function rank(offers, ctx, sort = 'score') {
    const all = offers.map(o => evaluate(o, ctx));
    return { all, fits: all.filter(o => o.ok).sort(SORTS[sort] || SORTS.score) };
  }

  return { BODIES, evaluate, rank, daysFrom };
})();

if (typeof module !== 'undefined') module.exports = Ranking;
