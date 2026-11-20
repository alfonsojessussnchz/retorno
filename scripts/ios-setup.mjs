// Crea el proyecto de Xcode (la primera vez), pone el icono, pide permiso de ubicación y sincroniza.
import { execSync } from 'node:child_process';
import { existsSync, cpSync, readFileSync, writeFileSync } from 'node:fs';

const run = cmd => execSync(cmd, { stdio: 'inherit' });
if (!existsSync('ios')) run('npx cap add ios');

// Icono de la app (1024×1024 sin transparencia)
const set = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (existsSync(set)) {
  const json = JSON.parse(readFileSync(`${set}/Contents.json`, 'utf8'));
  for (const img of json.images) if (img.filename) cpSync('assets/icon-1024.png', `${set}/${img.filename}`);
  console.log('✓ icono puesto');
}

// Info.plist: solo vertical, barra de estado clara y el texto del permiso de ubicación (obligatorio en iOS)
const plist = 'ios/App/App/Info.plist';
if (existsSync(plist)) {
  let x = readFileSync(plist, 'utf8');
  x = x.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*<array>)[\s\S]*?(<\/array>)/,
    '$1\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t$2');
  if (!x.includes('UIStatusBarStyle')) x = x.replace('<dict>', '<dict>\n\t<key>UIStatusBarStyle</key>\n\t<string>UIStatusBarStyleLightContent</string>');
  if (!x.includes('NSLocationWhenInUseUsageDescription')) x = x.replace('<dict>',
    '<dict>\n\t<key>NSLocationWhenInUseUsageDescription</key>\n\t<string>Retorno usa tu ubicación para buscar cargas cerca de donde has descargado.</string>');
  writeFileSync(plist, x);
  console.log('✓ Info.plist ajustado');
}

run('npx cap sync ios');
