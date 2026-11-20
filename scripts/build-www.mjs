// Copia la web a www/ (lo que Capacitor mete en la app) y añade capacitor.js.
// La web (GitHub Pages) se sirve desde la raíz; www/ no se sube a git.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'www';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const p of ['index.html', 'manifest.webmanifest', 'css', 'js', 'icons']) cpSync(p, `${OUT}/${p}`, { recursive: true });

const core = 'node_modules/@capacitor/core/dist/capacitor.js';
if (!existsSync(core)) { console.error('Falta @capacitor/core: ejecuta primero «npm install»'); process.exit(1); }
cpSync(core, `${OUT}/js/capacitor.js`);

let html = readFileSync(`${OUT}/index.html`, 'utf8');
html = html.replace('<script src="js/config.js"></script>', '<script src="js/capacitor.js"></script>\n  <script src="js/config.js"></script>');
writeFileSync(`${OUT}/index.html`, html);
console.log('✓ www/ lista');
