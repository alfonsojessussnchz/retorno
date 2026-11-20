// Pruebas del motor de ranking y de la bolsa simulada:  npm test
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);

globalThis.Geo = require('../js/geo.js');
globalThis.Ranking = require('../js/ranking.js');
globalThis.Mock = require('../js/sources/mock.js');

const today = '2026-11-20';
const ctx = { pos: { lat: 42.5987, lon: -5.5671 }, radiusKm: 50, dests: ['Sevilla'], marginKm: 60,
  truck: { body: 'Lona', tons: 24, meters: 13.6, adr: false }, favs: [], blocked: [], today, roadFactor: 1.22 };
const base = { id: 't1', company: { name: 'Prueba SL', tid: '1', vat: 'ESB1' }, from: { name: 'Astorga', lat: 42.4589, lon: -6.0563 },
  to: { name: 'Dos Hermanas', lat: 37.2828, lon: -5.9209 }, km: null, loadDate: today, loadHour: 10, price: 900,
  body: 'Lona', weightT: 20, meters: 12, adr: false };
let n = 0; const t = (name, fn) => { fn(); n++; console.log('✓', name); };

t('una carga que cumple todo encaja', () => {
  const r = Ranking.evaluate(base, ctx);
  assert.equal(r.ok, true, r.why.join());
  assert.ok(r.emptyKm > 40 && r.emptyKm < 60, 'Astorga está a ~42 km de León en línea recta');
  assert.ok(r.score > 0 && r.score <= 100);
});
t('€/km real cuenta los km en vacío', () => {
  const r = Ranking.evaluate(base, ctx);
  assert.equal(r.ekm.toFixed(4), (900 / (r.emptyKm + r.loadedKm)).toFixed(4));
});
t('sin precio: nota neutra y sin €/km', () => {
  const r = Ranking.evaluate({ ...base, price: null }, ctx);
  assert.equal(r.ekm, null); assert.equal(r.parts[0][1], 25);
});
t('fuera de radio, otra caja, no cabe, ADR, bloqueada y caducada se descartan', () => {
  assert.ok(Ranking.evaluate({ ...base, from: { name: 'Burgos', lat: 42.3439, lon: -3.6969 } }, ctx).why.includes('radio'));
  assert.ok(Ranking.evaluate({ ...base, body: 'Frigorífico' }, ctx).why.includes('caja'));
  assert.ok(Ranking.evaluate({ ...base, weightT: 30 }, ctx).why.includes('no cabe'));
  assert.ok(Ranking.evaluate({ ...base, adr: true }, ctx).why.includes('ADR'));
  assert.ok(Ranking.evaluate(base, { ...ctx, blocked: ['Prueba SL'] }).why.includes('bloqueada'));
  assert.ok(Ranking.evaluate({ ...base, loadDate: '2026-11-19' }, ctx).why.includes('caducada'));
});
t('destino fuera del margen se descarta', () => {
  assert.ok(Ranking.evaluate({ ...base, to: { name: 'Madrid', lat: 40.4168, lon: -3.7038 } }, ctx).why.includes('destino'));
});
t('"Cualquiera" vale para cualquier caja', () => {
  assert.equal(Ranking.evaluate({ ...base, body: 'Cualquiera' }, ctx).ok, true);
});
t('favorita suma puntos', () => {
  const a = Ranking.evaluate(base, ctx).score, b = Ranking.evaluate(base, { ...ctx, favs: ['Prueba SL'] }).score;
  assert.ok(b > a);
});
t('mejor €/km queda primero', () => {
  const { fits } = Ranking.rank([{ ...base, id: 'barata', price: 600 }, { ...base, id: 'cara', price: 1400 }], ctx, 'ekm');
  assert.equal(fits[0].id, 'cara');
});

const offers = await Mock.search({ lat: 42.5987, lon: -5.5671, radiusKm: 150, dests: ['Sevilla'], max: 30 });
t('la bolsa simulada respeta el máximo de 30 y el radio', () => {
  assert.ok(offers.length <= 30 && offers.length > 0);
  assert.ok(offers.every(o => Geo.haversine(42.5987, -5.5671, o.from.lat, o.from.lon) <= 150));
});
const again = await Mock.search({ lat: 42.5987, lon: -5.5671, radiusKm: 150, dests: ['Sevilla'], max: 30 });
t('al repetir la búsqueda se mantienen ofertas y salen nuevas', () => {
  const ids = new Set(offers.map(o => o.id));
  assert.ok(again.some(o => ids.has(o.id)) && again.some(o => !ids.has(o.id)));
});
const c = await Mock.contact(offers[0].id);
t('el contacto se pide aparte (paso 2)', () => { assert.ok(c.phone && c.email && !('phone' in offers[0])); });

console.log(`\n${n} pruebas OK`);
