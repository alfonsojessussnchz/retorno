# Retorno · beta 0.1

App para transportistas. Cuando descargas, pulsas **ESTOY VACÍO**: coge tu GPS, busca cargas en el radio que elijas
hacia los destinos que quieras y te las ordena por **€/km real** (contando los km en vacío hasta el punto de carga).

Está montada igual que Mfit: HTML + CSS + JavaScript sin compilación, instalable como app (PWA) y con proyecto nativo
de iPhone con Capacitor.

**Fuente de cargas:** TIMOCOM (API *Freight Exchange Search*). Mientras llega el acceso funciona con una
**TIMOCOM simulada** (`CONFIG.source = 'mock'` en `js/config.js`): las cargas, empresas y contactos son ficticios.

## Cómo probarla

**En el Mac:**
```bash
cd ~/"m3 way/Retorno"
python3 -m http.server 8001
```
Abre `http://localhost:8001` en Chrome (`Cmd+Opt+I` → icono de móvil). El GPS funciona en `localhost`.

**En el móvil:** súbela a GitHub Pages (HTTPS, necesario para el GPS) → iPhone → Compartir → «Añadir a pantalla de inicio».

**Pruebas del motor:** `npm test`

## App nativa para iPhone (Capacitor)

```bash
cd ~/"m3 way/Retorno"
npm install        # la primera vez
npm run ios        # prepara www/, crea el proyecto de Xcode, pone icono y permiso de ubicación, y abre Xcode
```
En Xcode: elige tu iPhone → *Signing & Capabilities* → *Team* → ▶ (igual que con Mfit).
Tras cambiar código web: `npm run sync` y ▶.

Funciones nativas (`js/native.js`): GPS con permiso de iOS, vibración y notificación cuando el modo «Avísame»
encuentra una carga nueva en tu top 3.

## Cómo se conecta con TIMOCOM

```
App (móvil) ──X-App-Token──▶ servidor puente (tu VPS) ──credenciales──▶ TIMOCOM
```
Las credenciales de TIMOCOM **nunca** van en la app: viven en el servidor puente (`server/timocom-proxy.mjs`,
Node 22 sin dependencias).

Cuando llegue la documentación:
1. Rellenar los `TODO` de `server/timocom-proxy.mjs` (búsqueda por área, traducción al formato común y contacto).
2. Arrancarlo en el VPS: `APP_TOKEN=... TIMOCOM_BASE=... TIMOCOM_USER=... TIMOCOM_PASSWORD=... npm run server`
3. En `js/config.js`: `source: 'api'`, `apiBase` (la URL del servidor) y `appToken` (el mismo `APP_TOKEN`).
4. Ajustar `dailyQuota` al contingente que te den.

## Normas de TIMOCOM que ya respeta

- **Máximo 30 ofertas** por búsqueda, anónimas (empresa, ID TIMOCOM y CIF).
- **Contacto en un segundo paso** («Ver contacto»), que cuenta como consulta.
- **Contador de consultas** diario.
- **Datos de ofertas solo en memoria:** no se guardan en el móvil; se borran al cerrar la app y las caducadas
  (día de carga pasado) se descartan.
- **Listas propias** de empresas favoritas y bloqueadas.
- **«Avísame»** consulta cada 5 min mientras la app está abierta (en modo simulado, cada 15 s).

## Cómo puntúa (sobre 100)

| Parte | Puntos | Cálculo |
|---|---|---|
| €/km real | 50 | precio ÷ (km en vacío + km cargado); 0,60 €/km = 0 y 1,40 €/km = 50. Sin precio: 25 |
| Cercanía | 20 | cuanto más cerca de ti esté la carga dentro del radio |
| Destino | 15 | cuanto más cerca te deje de la ciudad que quieres, dentro del margen |
| Fecha | 10 | hoy 10, mañana 6, después 2 |
| Empresa | 5 | favorita 5, normal 2,5 |

Se descartan: fuera de radio, destino no buscado, otra caja, no cabe (t o metros), ADR si no tienes, bloqueadas y caducadas.
Distancias: línea recta × 1,22 (`CONFIG.roadFactor`) hasta tener rutas reales.

## Estructura

```
index.html               estructura y barra de pestañas (Viajes, Filtros, Empresas)
css/styles.css           estilos (azul autovía, naranja baliza)
js/config.js             fuente (mock/api), servidor puente, contingente, avisos
js/geo.js                ciudades, destinos y distancias
js/ranking.js            el motor: filtros y puntuación (no depende de la bolsa)
js/sources/timocom.js    conector de TIMOCOM y formato común de oferta
js/sources/mock.js       TIMOCOM simulada
js/store.js              ajustes, favoritas/bloqueadas y contador (localStorage)
js/native.js             GPS, vibración y notificaciones (Capacitor)
js/app.js                pantallas y acciones
server/timocom-proxy.mjs servidor puente (rellenar con la documentación de TIMOCOM)
test/ranking.test.mjs    pruebas del motor y de la bolsa simulada
scripts/                 build-www.mjs e ios-setup.mjs (igual que Mfit + permiso de ubicación)
```

## Cambios

- **0.1** — Primera beta: botón Vacío con GPS, radar, filtros de destino y camión, ranking por €/km real,
  búsqueda en 2 pasos al estilo TIMOCOM, contador de consultas, favoritas/bloqueadas, modo «Avísame»,
  servidor puente preparado.
