/* Retorno · geografía: distancias, ciudades y destinos */
'use strict';

const Geo = (() => {
  const TOWNS = [
    ['León', 42.5987, -5.5671], ['Astorga', 42.4589, -6.0563], ['La Bañeza', 42.3007, -5.8986], ['Ponferrada', 42.5466, -6.5962],
    ['Valencia de Don Juan', 42.2934, -5.5175], ['Sahagún', 42.3711, -5.0294], ['Benavente', 42.0024, -5.6782],
    ['Mansilla de las Mulas', 42.4983, -5.417], ['Palencia', 42.0096, -4.5288], ['Valladolid', 41.6523, -4.7245],
    ['Zamora', 41.5035, -5.7446], ['Oviedo', 43.3614, -5.8494], ['Burgos', 42.3439, -3.6969], ['Salamanca', 40.9701, -5.6635],
    ['Santander', 43.4623, -3.8099], ['Madrid', 40.4168, -3.7038], ['Getafe', 40.3057, -3.7329], ['Toledo', 39.8628, -4.0273],
    ['Zaragoza', 41.6488, -0.8891], ['Pamplona', 42.8125, -1.6458], ['Bilbao', 43.263, -2.935], ['Barcelona', 41.3874, 2.1686],
    ['Valencia', 39.4699, -0.3763], ['Alicante', 38.3452, -0.481], ['Murcia', 37.9922, -1.1307], ['Almería', 36.834, -2.4637],
    ['Granada', 37.1773, -3.5986], ['Córdoba', 37.8882, -4.7794], ['Sevilla', 37.3891, -5.9845], ['Málaga', 36.7213, -4.4214],
    ['Cádiz', 36.5271, -6.2886], ['Huelva', 37.2614, -6.9447], ['Badajoz', 38.8794, -6.9707], ['A Coruña', 43.3623, -8.4115],
    ['Vigo', 42.2406, -8.7207],
  ];

  // Destinos que se pueden elegir. El primero de cada lista es la ciudad de referencia.
  const DEST = {
    'Málaga': [['Málaga', 36.7213, -4.4214], ['Antequera', 37.0194, -4.5612], ['Vélez-Málaga', 36.7808, -4.1006], ['Marbella', 36.5101, -4.8825]],
    'Sevilla': [['Sevilla', 37.3891, -5.9845], ['Dos Hermanas', 37.2828, -5.9209], ['Alcalá de Guadaíra', 37.3384, -5.8392], ['Utrera', 37.1853, -5.7808]],
    'Madrid': [['Madrid', 40.4168, -3.7038], ['Getafe', 40.3057, -3.7329], ['Coslada', 40.4238, -3.5613], ['Alcalá de Henares', 40.4818, -3.3643]],
    'Barcelona': [['Barcelona', 41.3874, 2.1686], ['El Prat', 41.3246, 2.0953], ['Sabadell', 41.5463, 2.1086]],
    'Valencia': [['Valencia', 39.4699, -0.3763], ['Sagunto', 39.6798, -0.2784], ['Riba-roja', 39.546, -0.57]],
    'Zaragoza': [['Zaragoza', 41.6488, -0.8891], ['Calatayud', 41.3535, -1.6432]],
    'Bilbao': [['Bilbao', 43.263, -2.935], ['Barakaldo', 43.2976, -2.9886]],
    'Murcia': [['Murcia', 37.9922, -1.1307], ['Molina de Segura', 38.0548, -1.2077], ['Cartagena', 37.6257, -0.9966]],
    'Córdoba': [['Córdoba', 37.8882, -4.7794], ['Lucena', 37.4088, -4.4852]],
    'Granada': [['Granada', 37.1773, -3.5986], ['Motril', 36.745, -3.5179]],
    'A Coruña': [['A Coruña', 43.3623, -8.4115], ['Arteixo', 43.3047, -8.5078]],
    'Valladolid': [['Valladolid', 41.6523, -4.7245], ['Medina del Campo', 41.3115, -4.9146]],
    'Alicante': [['Alicante', 38.3452, -0.481], ['Elche', 38.2669, -0.6983]],
    'Badajoz': [['Badajoz', 38.8794, -6.9707], ['Mérida', 38.9161, -6.3437]],
  };

  const R = Math.PI / 180;
  // Distancia en línea recta (km)
  function haversine(lat1, lon1, lat2, lon2) {
    const x = Math.sin((lat2 - lat1) * R / 2) ** 2 + Math.cos(lat1 * R) * Math.cos(lat2 * R) * Math.sin((lon2 - lon1) * R / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(x));
  }
  // Distancia aproximada por carretera (km)
  const road = (a, b, factor = 1.22) => Math.round(haversine(a.lat, a.lon, b.lat, b.lon) * factor);

  function nearest(lat, lon) {
    let best = null, d = Infinity;
    for (const t of TOWNS) { const k = haversine(lat, lon, t[1], t[2]); if (k < d) { d = k; best = t[0]; } }
    return { name: best, km: d };
  }
  const town = name => { const t = TOWNS.find(x => x[0] === name); return t ? { name: t[0], lat: t[1], lon: t[2] } : null; };
  const destRef = city => { const d = DEST[city] && DEST[city][0]; return d ? { name: d[0], lat: d[1], lon: d[2] } : null; };

  return { TOWNS, DEST, haversine, road, nearest, town, destRef };
})();

if (typeof module !== 'undefined') module.exports = Geo;
