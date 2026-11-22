// Baut den Prototyp "Falsche Farben" zu einer einzigen index.html in diesem Ordner.
// Nutzt das Build-Skript des Hauptspiels (dieselben vier Regeln für den Quelltext)
// und dessen Seitenrahmen src/style.css mit allen iPhone-Vorgaben.
//
//   node prototyp/falsche-farben/build.js          schreibt index.html
//   node prototyp/falsche-farben/build.js --check  prüft nur, ob sie aktuell ist

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buendle } from '../../build.js';

const ORDNER = dirname(fileURLToPath(import.meta.url));
export const FARBENZIEL = join(ORDNER, 'index.html');

export function baueFarben() {
  const vorlage = readFileSync(join(ORDNER, 'src', 'vorlage.html'), 'utf8');
  const css = readFileSync(join(ORDNER, '..', '..', 'src', 'style.css'), 'utf8').trim();
  const js = buendle(join(ORDNER, 'src', 'main.js'));
  if (/<\/script/i.test(js)) throw new Error('Build: "</script" im Skript würde die Seite zerreißen');
  for (const marke of ['/*__CSS__*/', '/*__JS__*/']) {
    if (vorlage.split(marke).length !== 2) throw new Error(`Build: ${marke} muss genau einmal in vorlage.html stehen`);
  }
  return vorlage.split('/*__CSS__*/').join(css).split('/*__JS__*/').join(js);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = baueFarben();
  if (process.argv.includes('--check')) {
    let vorhanden = '';
    try { vorhanden = readFileSync(FARBENZIEL, 'utf8'); } catch { /* fehlt noch */ }
    if (vorhanden !== html) {
      console.error('prototyp/falsche-farben/index.html ist veraltet. Bitte "npm run build" ausführen.');
      process.exit(1);
    }
    console.log('prototyp/falsche-farben/index.html ist aktuell.');
  } else {
    writeFileSync(FARBENZIEL, html);
    console.log(`prototyp/falsche-farben/index.html geschrieben (${(Buffer.byteLength(html) / 1024).toFixed(1)} kB).`);
  }
}
