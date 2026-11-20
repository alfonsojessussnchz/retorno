/* Retorno · pantallas y acciones */
'use strict';

const App = (() => {
  const $ = s => document.querySelector(s);
  const S = Store.get();
  const DAYS = ['Hoy', 'Mañana', 'Pasado mañana'];
  const fmt = (n, d = 0) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayLabel = d => d < 0 ? 'Caducada' : DAYS[d] || `En ${d} días`;

  // Estado de la sesión (no se guarda: las ofertas de TIMOCOM no pueden quedarse en el móvil)
  let tab = 'trips', empty = false, loading = false, stale = false;
  let offers = [], result = { all: [], fits: [] };
  const gone = new Set(), contacts = new Map();
  let watchTimer = null, newIds = new Set();

  const ctx = () => ({ pos: S.pos, radiusKm: S.radiusKm, dests: S.dests, marginKm: S.marginKm, truck: S.truck,
    favs: S.favs, blocked: S.blocked, today: Store.today(), roadFactor: CONFIG.roadFactor });
  const recompute = () => { result = Ranking.rank(offers.filter(o => !gone.has(o.id)), ctx(), S.sort); };

  let tt;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 4200); }

  // ---------- Búsqueda ----------
  async function locate() {
    try {
      const p = await Native.getPosition();
      S.pos = { ...p, name: Geo.nearest(p.lat, p.lon).name, gps: true }; Store.save();
      return true;
    } catch (e) {
      toast(`${e.message}. Busco desde ${S.pos.name}; puedes cambiarlo en Filtros.`);
      return false;
    }
  }

  async function search({ silent = false } = {}) {
    if (Store.quotaLeft() <= 0) { toast('Has gastado las consultas de hoy'); return null; }
    loading = !silent; if (!silent) render();
    try {
      const d = new Date(); const to = new Date(); to.setDate(d.getDate() + 2);
      const list = await Timocom.search({ lat: S.pos.lat, lon: S.pos.lon, radiusKm: S.radiusKm, dests: S.dests,
        body: S.truck.body, dateFrom: Store.today(), dateTo: to.toISOString().slice(0, 10) });
      Store.useQuery();
      const before = new Set(offers.map(o => o.id));
      offers = list; stale = false;
      newIds = silent ? new Set(list.filter(o => !before.has(o.id)).map(o => o.id)) : new Set();
      for (const id of [...contacts.keys()]) if (!list.some(o => o.id === id)) contacts.delete(id);
      recompute();
      return { before };
    } catch (e) {
      toast('No se pudo buscar: ' + e.message);
      return null;
    } finally { loading = false; render(); }
  }

  async function goEmpty() {
    empty = true; Native.tap(); loading = true; render();
    await locate();
    await search();
  }
  function goLoaded() {
    empty = false; offers = []; result = { all: [], fits: [] }; gone.clear(); contacts.clear(); stopWatch(); render();
  }

  // ---------- Modo "Avísame" ----------
  function startWatch() {
    const ms = CONFIG.source === 'mock' ? CONFIG.demoWatchSeconds * 1000 : CONFIG.watchMinutes * 60000;
    Native.askNotifications();
    watchTimer = setInterval(async () => {
      const r = await search({ silent: true });
      if (!r) return;
      const top = result.fits.slice(0, 3).find(o => !r.before.has(o.id));
      if (top) {
        const pos = result.fits.indexOf(top) + 1;
        const msg = `${top.from.name} → ${top.to.name}` + (top.ekm ? ` · ${fmt(top.ekm, 2)} €/km` : '');
        toast(`Nueva carga #${pos}: ${msg}`);
        Native.notify(`Nueva carga #${pos} para ti`, msg);
      }
    }, ms);
    toast(CONFIG.source === 'mock' ? `Vigilando cada ${CONFIG.demoWatchSeconds} s (demo)` : `Vigilando cada ${CONFIG.watchMinutes} min mientras la app esté abierta`);
  }
  function stopWatch() { clearInterval(watchTimer); watchTimer = null; }

  // ---------- Pantalla: Viajes ----------
  function drawRadar() {
    const s = $('#radar'); if (!s) return;
    const W = s.clientWidth, H = s.clientHeight; if (!W) return;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 22, range = S.radiusKm * 1.15, k = R / range, rr = S.radiusKm * k;
    const cos = Math.cos(S.pos.lat * Math.PI / 180);
    const pos = o => [cx + (o.from.lon - S.pos.lon) * cos * 111 * k, cy - (o.from.lat - S.pos.lat) * 111 * k];
    let h = `<circle cx="${cx}" cy="${cy}" r="${rr}" class="r1"/><circle cx="${cx}" cy="${cy}" r="${rr / 2}" class="r2"/>
      <line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" class="ax"/><line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="ax"/>
      <text x="${cx}" y="${cy - R - 7}" class="lb" text-anchor="middle">N</text><text x="${cx + rr * .71 + 6}" y="${cy - rr * .71 - 6}" class="lb">${S.radiusKm} km</text>`;
    if (empty) {
      for (const o of result.all) if (!o.ok) { const [x, y] = pos(o); h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="dot0"/>`; }
      result.fits.slice().reverse().forEach(o => {
        const i = result.fits.indexOf(o) + 1, [x, y] = pos(o);
        let dx = (o.to.lon - o.from.lon) * cos, dy = -(o.to.lat - o.from.lat); const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
        h += `<line x1="${x}" y1="${y}" x2="${x + dx * 24}" y2="${y + dy * 24}" class="dir"/><circle cx="${x}" cy="${y}" r="10" class="dot" data-go="${esc(o.id)}"/><text x="${x}" y="${y + 4}" class="dn" text-anchor="middle">${i}</text>`;
      });
    }
    h += `<circle cx="${cx}" cy="${cy}" r="10" class="pulse"/><circle cx="${cx}" cy="${cy}" r="8" class="me"/>`;
    s.innerHTML = h;
  }

  function card(o, i) {
    const fav = S.favs.includes(o.company.name), c = contacts.get(o.id);
    const bars = o.parts.map(([n, v, m]) => `<div><b>${n}</b><span><i style="width:${(v / m * 100).toFixed(0)}%"></i></span><em>${fmt(v)} / ${m}</em></div>`).join('');
    return `<article class="card${i === 0 ? ' first' : ''}${newIds.has(o.id) ? ' new' : ''}" id="c-${esc(o.id)}">
      <div class="top"><span class="rank">${i + 1}</span>
        <div class="route"><b>${esc(o.from.name)}</b> → <b>${esc(o.to.name)}</b><small>Para ${esc(o.city)} · te deja a ${fmt(o.offKm)} km</small></div>
        <div class="score"><b>${o.score}</b><small>puntos</small></div></div>
      <div class="kpis">
        <div class="hi"><b>${o.ekm == null ? '—' : fmt(o.ekm, 2) + ' €/km'}</b><small>${o.ekm == null ? 'precio a negociar' : 'real'}</small></div>
        <div><b>${o.price == null ? 'A negociar' : fmt(o.price) + ' €'}</b><small>porte</small></div>
        <div><b>${fmt(o.emptyKm)} km</b><small>en vacío</small></div>
        <div><b>${fmt(o.loadedKm)} km</b><small>cargado</small></div></div>
      <div class="meta"><span>${dayLabel(o.day)}${o.loadHour != null ? ' ' + o.loadHour + ':00' : ''}</span><span>${o.body === 'Cualquiera' ? 'Cualquier caja' : esc(o.body)}</span>
        <span>${fmt(o.weightT, 1)} t · ${fmt(o.meters, 1)} m</span>${o.adr ? '<span class="adr">ADR</span>' : ''}
        <span>${esc(o.company.name)}${fav ? ' <span class="g">· favorita</span>' : ''} · ID ${esc(o.company.tid)} · ${esc(o.company.vat)}</span></div>
      ${c ? `<div class="contact"><b>${esc(c.person)}</b><br>Tel. <a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a> · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
        <small>Se borra al cerrar la app y, como muy tarde, el día de carga.</small></div>` : ''}
      <details><summary>Por qué ${o.score} puntos</summary><div class="why">${bars}</div></details>
      <div class="acts">
        <button class="sm main" data-contact="${esc(o.id)}">${c ? 'Ocultar contacto' : 'Ver contacto'}</button>
        <button class="sm${fav ? ' on' : ''}" data-fav="${esc(o.company.name)}">${fav ? 'Quitar favorita' : 'Empresa favorita'}</button>
        <button class="sm" data-block="${esc(o.company.name)}">Bloquear</button>
        <button class="sm" data-gone="${esc(o.id)}">Descartar</button></div>
    </article>`;
  }

  function tripsView() {
    const q = Store.quotaLeft();
    const btn = loading ? `<span class="spin"></span>BUSCANDO…` : empty ? `VACÍO · BUSCANDO<small>Pulsa cuando hayas cargado</small>` : `ESTOY VACÍO<small>Te busco viaje desde donde estés</small>`;
    let res;
    if (!empty) res = `<div class="empty"><b>Vas cargado</b>Cuando descargues, pulsa ESTOY VACÍO: cojo tu ubicación y te busco retornos.</div>`;
    else if (loading && !offers.length) res = `<div class="empty"><b>Buscando…</b>Consultando ${CONFIG.source === 'mock' ? 'la bolsa simulada' : 'TIMOCOM'}.</div>`;
    else {
      const cnt = {}; result.all.forEach(o => o.why.forEach(w => (cnt[w] = (cnt[w] || 0) + 1)));
      const names = { destino: 'van a otro sitio', caja: 'otra caja', 'no cabe': 'no caben', ADR: 'piden ADR', bloqueada: 'de bloqueadas', caducada: 'caducadas' };
      const extra = Object.entries(cnt).filter(([w]) => names[w]).map(([w, n]) => `${n} ${names[w]}`).join(', ');
      res = `<section class="head">
          <h2>${result.fits.length ? `${result.fits.length} viaje${result.fits.length > 1 ? 's' : ''} para ti` : 'Nada que te encaje'}</h2>
          <p class="sum">${offers.length} ofertas en ${S.radiusKm} km${offers.length >= CONFIG.maxResults ? ' (máximo por búsqueda)' : ''}${extra ? ' · descartadas: ' + extra : ''}</p>
          <span class="quota${q < 10 ? ' low' : ''}">Consultas hoy: ${CONFIG.dailyQuota - q} de ${CONFIG.dailyQuota}</span>
          <div class="tools">
            <select id="sort" aria-label="Ordenar">${[['score', 'Mejor puntuación'], ['ekm', 'Más €/km real'], ['empty', 'Menos km en vacío'], ['date', 'Antes en fecha']]
              .map(([v, t]) => `<option value="${v}"${S.sort === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
            <button id="refresh"${loading ? ' disabled' : ''}>Actualizar</button></div>
          <label class="check"><input type="checkbox" id="watch"${watchTimer ? ' checked' : ''}>Avísame si sale algo mejor</label>
        </section>
        ${stale ? `<div class="stale">Has cambiado los filtros de búsqueda. <button class="sm main" id="restale">Buscar de nuevo</button></div>` : ''}
        <div class="list">${result.fits.length ? result.fits.map(card).join('') :
          `<div class="empty"><b>Ahora no hay nada que encaje</b>Amplía el radio o el margen en destino, añade destinos o activa "Avísame".</div>`}</div>`;
    }
    return `<section class="box">
        <div class="where"><div><b>${S.pos.gps ? 'Cerca de ' : ''}${esc(S.pos.name)}</b><span class="muted">${S.pos.gps ? 'Tu GPS' : 'Elegido a mano'} · ${S.radiusKm} km · hacia ${S.dests.length ? esc(S.dests.join(', ')) : 'ningún destino'}</span></div>
          <button data-tab="filters">Cambiar</button></div>
        <button class="big${empty ? ' on' : ''}" id="empty"${loading ? ' disabled' : ''}>${btn}</button>
        <div class="fig"><svg id="radar" role="img" aria-label="Radar de cargas alrededor de tu posición"></svg></div>
        <div class="leg"><span><i style="background:var(--blue)"></i>Tú</span><span><i style="background:var(--acc)"></i>Te encaja</span><span><i style="background:var(--mute);opacity:.5"></i>No encaja</span></div>
      </section>${res}`;
  }

  // ---------- Pantalla: Filtros ----------
  function filtersView() {
    const t = S.truck;
    return `<section class="box"><h2>Dónde estás</h2>
        <div class="loc"><button id="gps" class="sm main">Usar mi GPS</button>
        <select id="city" aria-label="Elegir ciudad">${Geo.TOWNS.map(x => `<option${!S.pos.gps && S.pos.name === x[0] ? ' selected' : ''}>${x[0]}</option>`).join('')}${S.pos.gps ? '<option selected>Mi GPS</option>' : ''}</select></div>
        <p class="muted">Al pulsar ESTOY VACÍO siempre se intenta coger tu GPS primero.</p></section>
      <section class="box"><h2>Qué buscas</h2>
        <div class="row"><label for="radius">Radio de búsqueda <output>${S.radiusKm} km</output></label><input type="range" id="radius" min="10" max="150" step="5" value="${S.radiusKm}"></div>
        <div class="row"><div class="lab">Quiero ir a</div><div class="chips">${Object.keys(Geo.DEST).map(c => `<button class="chip" data-dest="${c}" aria-pressed="${S.dests.includes(c)}">${c}</button>`).join('')}</div></div>
        <div class="row"><label for="margin">Margen en destino <output>${S.marginKm} km</output></label><input type="range" id="margin" min="20" max="120" step="10" value="${S.marginKm}"></div></section>
      <section class="box"><h2>Tu camión</h2><div class="grid2">
        <label>Tipo de caja<select id="body">${Ranking.BODIES.map(b => `<option${t.body === b ? ' selected' : ''}>${b}</option>`).join('')}</select></label>
        <label>Carga máx. (t)<input type="number" id="tons" min="1" max="40" step="0.5" value="${t.tons}"></label>
        <label>Metros lineales<input type="number" id="meters" min="1" max="20" step="0.1" value="${t.meters}"></label>
        <label class="check"><input type="checkbox" id="adr"${t.adr ? ' checked' : ''}>Tengo ADR</label></div></section>`;
  }

  // ---------- Pantalla: Empresas ----------
  function companiesView() {
    const list = (arr, kind, empty) => arr.length ? arr.map(n => `<div class="co"><span>${esc(n)}</span><button class="sm" data-${kind}="${esc(n)}">${kind === 'fav' ? 'Quitar' : 'Desbloquear'}</button></div>`).join('') : `<p class="muted">${empty}</p>`;
    return `<section class="box"><h2>Favoritas</h2><p class="muted">Suben en el ranking (+2,5 puntos).</p>${list(S.favs, 'fav', 'Aún no tienes. Márcalas desde una oferta.')}</section>
      <section class="box"><h2>Bloqueadas</h2><p class="muted">Sus ofertas no te salen.</p>${list(S.blocked, 'block', 'Ninguna bloqueada.')}</section>
      <section class="box"><h2>Conexión</h2><dl>
        <dt>Bolsa</dt><dd>${CONFIG.source === 'mock' ? 'TIMOCOM simulada (datos ficticios)' : 'TIMOCOM'}</dd>
        <dt>Consultas hoy</dt><dd>${CONFIG.dailyQuota - Store.quotaLeft()} de ${CONFIG.dailyQuota}</dd>
        <dt>Máx. por búsqueda</dt><dd>${CONFIG.maxResults} ofertas</dd>
        <dt>Datos de ofertas</dt><dd>Solo en memoria; nunca se guardan</dd></dl></section>`;
  }

  // ---------- Render y eventos ----------
  function render() {
    $('#src').textContent = CONFIG.source === 'mock' ? 'TIMOCOM simulada' : 'TIMOCOM';
    document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#view').innerHTML = tab === 'trips' ? tripsView() : tab === 'filters' ? filtersView() : companiesView();
    if (tab === 'trips') drawRadar();
  }

  const searchChanged = () => { if (empty && offers.length) stale = true; };

  function bind() {
    document.addEventListener('click', async e => {
      const t = e.target.closest('button, circle[data-go]'); if (!t) return;
      const d = t.dataset;
      if (d.tab) { tab = d.tab; render(); window.scrollTo(0, 0); return; }
      if (t.id === 'empty') return empty ? goLoaded() : goEmpty();
      if (t.id === 'refresh' || t.id === 'restale') return search();
      if (t.id === 'gps') { if (await locate()) { toast('Ubicación: cerca de ' + S.pos.name); searchChanged(); render(); } return; }
      if (d.go) { document.getElementById('c-' + d.go)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      if (d.dest) { const c = d.dest; S.dests = S.dests.includes(c) ? S.dests.filter(x => x !== c) : [...S.dests, c]; Store.save(); recompute(); render(); return; }
      if (d.gone) { gone.add(d.gone); recompute(); render(); return; }
      if (d.fav) { Store.toggle('favs', d.fav); recompute(); render(); return; }
      if (d.block) {
        const was = S.blocked.includes(d.block); Store.toggle('blocked', d.block); recompute(); render();
        if (!was) toast(d.block + ' bloqueada: no volverá a salir'); return;
      }
      if (d.contact) {
        const id = d.contact;
        if (contacts.has(id)) { contacts.delete(id); render(); return; }
        if (Store.quotaLeft() <= 0) { toast('Has gastado las consultas de hoy'); return; }
        try { const c = await Timocom.contact(id); Store.useQuery(); if (c) contacts.set(id, c); render(); }
        catch (err) { toast('No se pudo abrir el contacto: ' + err.message); }
      }
    });
    document.addEventListener('input', e => {
      const t = e.target;
      if (t.id === 'radius') { S.radiusKm = +t.value; t.previousElementSibling.querySelector('output').textContent = S.radiusKm + ' km'; Store.save(); searchChanged(); recompute(); }
      if (t.id === 'margin') { S.marginKm = +t.value; t.previousElementSibling.querySelector('output').textContent = S.marginKm + ' km'; Store.save(); recompute(); }
    });
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.id === 'sort') { S.sort = t.value; Store.save(); recompute(); render(); }
      if (t.id === 'watch') t.checked ? startWatch() : stopWatch();
      if (t.id === 'city') { const x = Geo.town(t.value); if (x) { S.pos = { ...x, gps: false }; Store.save(); searchChanged(); recompute(); } }
      if (t.id === 'body') { S.truck.body = t.value; Store.save(); recompute(); }
      if (t.id === 'tons' || t.id === 'meters') { S.truck[t.id] = +t.value || 0; Store.save(); recompute(); }
      if (t.id === 'adr') { S.truck.adr = t.checked; Store.save(); recompute(); }
    });
    new ResizeObserver(() => drawRadar()).observe($('#view'));
  }

  function init() { Native.init(); bind(); render(); }
  return { init };
})();

App.init();
