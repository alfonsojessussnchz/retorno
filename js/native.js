/* Retorno · funciones del móvil: GPS, vibración y avisos.
   Dentro de la app de iPhone usa los plugins de Capacitor; en la web usa lo que da el navegador. */
'use strict';

const Native = (() => {
  const C = window.Capacitor;
  const isNative = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform() && typeof C.registerPlugin === 'function');
  const plug = name => (isNative && C.isPluginAvailable(name) ? C.registerPlugin(name) : null);
  const Geoloc = plug('Geolocation');
  const Haptics = plug('Haptics');
  const Notif = plug('LocalNotifications');
  const StatusBar = plug('StatusBar');
  const quiet = p => (p && p.catch ? p.catch(() => {}) : p);
  let notifId = 2000;

  function init() {
    if (!isNative) return;
    document.documentElement.classList.add('native');
    if (StatusBar) quiet(StatusBar.setStyle({ style: 'DARK' }));
  }

  // Tu posición actual → { lat, lon }. Lanza error si no hay permiso o no se puede.
  async function getPosition() {
    if (Geoloc) {
      let p = await Geoloc.checkPermissions();
      if (p.location !== 'granted') p = await Geoloc.requestPermissions({ permissions: ['location'] });
      if (p.location !== 'granted') throw new Error('Sin permiso de ubicación');
      const r = await Geoloc.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
      return { lat: r.coords.latitude, lon: r.coords.longitude };
    }
    if (!navigator.geolocation) throw new Error('Este navegador no da ubicación');
    return new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(
      r => ok({ lat: r.coords.latitude, lon: r.coords.longitude }),
      e => ko(new Error(e.code === 1 ? 'Sin permiso de ubicación' : 'No se pudo obtener la ubicación')),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }));
  }

  const tap = () => { if (Haptics) quiet(Haptics.impact({ style: 'MEDIUM' })); };
  function success() {
    if (Haptics) quiet(Haptics.notification({ type: 'SUCCESS' }));
    else if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  async function askNotifications() {
    try {
      if (Notif) {
        let p = await Notif.checkPermissions();
        if (p.display !== 'granted') p = await Notif.requestPermissions();
        return p.display === 'granted';
      }
      if ('Notification' in window) return (await Notification.requestPermission()) === 'granted';
    } catch (e) { /* sin avisos */ }
    return false;
  }

  // Aviso de "nueva carga buena"
  async function notify(title, body) {
    success();
    try {
      if (Notif) await Notif.schedule({ notifications: [{ id: notifId++, title, body, schedule: { at: new Date(Date.now() + 500) } }] });
      else if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: 'icons/icon-192.png' });
    } catch (e) { /* el aviso dentro de la app ya sale igualmente */ }
  }

  return { isNative, init, getPosition, tap, success, askNotifications, notify };
})();
