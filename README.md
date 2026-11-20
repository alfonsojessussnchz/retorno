<div align="center">

<img src="icons/icon-512.png" alt="Retorno" width="120">

# Retorno

**Descargas, pulsas «Vacío» y te busca el viaje de vuelta.**

App para transportistas que encuentra cargas de retorno cerca de donde estás y te las ordena por lo que de verdad te dejan en el bolsillo.

![Beta](https://img.shields.io/badge/estado-base%20beta%200.1-ff6a2b?style=flat)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=flat&logo=capacitor&logoColor=white)
![Bolsa](https://img.shields.io/badge/bolsa-TIMOCOM-16498a?style=flat)

**[▶ Abrir la app](https://alfonsojessussnchz.github.io/retorno/)**

</div>

---

> 🧪 **En base beta.** Todo funciona, pero las cargas son de una **TIMOCOM simulada** (empresas, precios y contactos ficticios) hasta tener acceso a la API real.

## 🚛 De qué va esto

Cuando un camionero descarga, lo que más le cuesta es encontrar el retorno. Retorno lo hace de un toque: coge tu ubicación, mira las cargas en el radio que elijas, se queda con las que van hacia donde tú quieres y te las ordena por **€/km real**, contando los kilómetros en vacío hasta el punto de carga.

Está hecha a mano, igual que Mfit: HTML, CSS y JavaScript, sin compilación.

## ✨ Lo más chulo

- **Botón ESTOY VACÍO.** Un toque: GPS, búsqueda y ranking. Sin escribir nada.
- **Radar.** Tú en el centro, el círculo de tu radio y cada carga con su puesto y una rayita hacia donde va.
- **Nota sobre 100 que se explica sola.** €/km real (50), cercanía (20), destino (15), fecha (10) y empresa (5). Cada oferta te dice por qué tiene esa nota.
- **Filtros de camionero de verdad:** tipo de caja, toneladas, metros lineales, ADR, destinos y cuánto te puede dejar de lejos.
- **Modo «Avísame».** Sigue buscando y, si sale algo en tu top 3, vibra y te manda una notificación.
- **Empresas favoritas y bloqueadas.** Las buenas suben y las que no quieres no vuelven a salir.
- **Juega con las normas de TIMOCOM:** máximo 30 ofertas por búsqueda, el contacto se pide aparte, contador de consultas y las ofertas nunca se guardan en el móvil.

## 🗂️ Estructura

```
├── index.html               → estructura y pestañas (Viajes, Filtros, Empresas)
├── css/styles.css           → diseño (azul autovía y naranja baliza)
├── js/
│   ├── config.js            → simulada o real, servidor puente, consultas, avisos
│   ├── geo.js               → ciudades, destinos y distancias
│   ├── ranking.js           → el motor: filtros y nota
│   ├── sources/timocom.js   → conector de TIMOCOM y formato común de oferta
│   ├── sources/mock.js      → TIMOCOM simulada
│   ├── store.js             → ajustes, favoritas y contador
│   ├── native.js            → GPS, vibración y notificaciones
│   └── app.js               → pantallas y acciones
├── server/timocom-proxy.mjs → servidor puente (las claves de TIMOCOM van aquí, no en el móvil)
├── test/                    → pruebas del motor (npm test)
└── scripts/                 → app nativa de iPhone (igual que Mfit)
```

## 🛠️ Cómo tocarla

**Verla en local:**
```bash
cd ~/"m3 way/Retorno"
python3 -m http.server 8001
```
Y abre `http://localhost:8001` en Chrome. (El 8000 lo usa Mfit.)

**Cambiar cómo puntúa:** `js/ranking.js`. **Pasar a TIMOCOM real:** rellenar los `TODO` de `server/timocom-proxy.mjs`, arrancarlo en el VPS y en `js/config.js` poner `source: 'api'`, `apiBase` y `appToken`.

> ⚠️ El repo es público: las credenciales de TIMOCOM y el token nunca se suben, van solo en el servidor.

## 📱 Ponerla en el iPhone

**Como web app (sin Xcode):** abre [la app](https://alfonsojessussnchz.github.io/retorno/) en Safari → Compartir → *Añadir a pantalla de inicio*. Pide permiso de ubicación la primera vez.

**Como app nativa:** `npm install` y `npm run ios`, y ▶ en Xcode, igual que con Mfit.

## 📝 Cambios

- **0.1** — Primera beta: botón Vacío con GPS, radar, filtros de destino y camión, ranking por €/km real, búsqueda en 2 pasos al estilo TIMOCOM, contador de consultas, favoritas/bloqueadas, modo «Avísame» y servidor puente preparado.

---

<div align="center">

Hecha pensando en los que vuelven de vacío 🛣️

</div>
