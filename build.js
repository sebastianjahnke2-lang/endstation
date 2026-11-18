// Baut aus src/ die eine index.html. Ohne Abhängigkeiten.
//
//   node build.js          schreibt index.html
//   node build.js --check  prüft nur, ob index.html aktuell ist
//
// Der Quelltext besteht aus ES-Modulen, damit die Tests in Node dieselben
// Dateien direkt laden können. Für die Auslieferung werden die Module in
// Abhängigkeitsreihenfolge aneinandergehängt, Importe und Exporte entfernt
// und alles in eine Funktion gepackt. Dafür gelten vier Regeln:
//   1. Nur benannte Importe aus relativen Pfaden: import { a, b } from './x.js';
//   2. Kein Umbenennen (kein "as"), kein export default, kein export { ... }.
//   3. Namen auf oberster Ebene sind im ganzen Projekt eindeutig.
//   4. Keine Kreisbezüge zwischen Modulen.
// Verstöße brechen den Build mit einer Meldung ab.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const WURZEL = dirname(fileURLToPath(import.meta.url));
const SRC = join(WURZEL, 'src');
export const ZIEL = join(WURZEL, 'index.html');

const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*'(\.{1,2}\/[^']+)';?[ \t]*$/gm;
const EXPORT = /^export\s+(?=(?:async\s+)?(?:const|let|function|class)\b)/gm;
const DEKLARATION = /^(?:export\s+)?(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm;

function fehler(datei, text) {
  throw new Error(`Build: ${relative(WURZEL, datei)}: ${text}`);
}

function ladeModul(datei, module, stapel) {
  if (module.has(datei)) return;
  if (stapel.includes(datei)) fehler(datei, 'Kreisbezug zwischen Modulen');

  const quelle = readFileSync(datei, 'utf8');
  const importe = [];
  let rumpf = quelle.replace(IMPORT, (_, namen, pfad) => {
    const liste = namen.split(',').map((n) => n.trim()).filter(Boolean);
    for (const name of liste) {
      if (/\s/.test(name)) fehler(datei, `Import "${name}" wird umbenannt, das kann der Build nicht`);
    }
    importe.push({ von: join(dirname(datei), pfad), namen: liste });
    return '';
  });
  if (/^import\b/m.test(rumpf)) fehler(datei, "nur Importe der Form import { a } from './x.js'; sind erlaubt");

  for (const { von } of importe) ladeModul(von, module, [...stapel, datei]);

  const exporte = new Set();
  const namen = [];
  for (const treffer of quelle.matchAll(DEKLARATION)) {
    namen.push(treffer[1]);
    if (treffer[0].startsWith('export')) exporte.add(treffer[1]);
  }
  if (/^(?:export\s+)?(?:const|let|var)\s*[[{]/m.test(quelle)) {
    fehler(datei, 'keine zerlegende Zuweisung auf oberster Ebene');
  }
  rumpf = rumpf.replace(EXPORT, '');
  if (/^export\b/m.test(rumpf)) fehler(datei, 'nur export vor const, let, function oder class ist erlaubt');

  for (const { von, namen: gewollt } of importe) {
    for (const name of gewollt) {
      if (!module.get(von).exporte.has(name)) {
        fehler(datei, `"${name}" wird von ${relative(WURZEL, von)} nicht exportiert`);
      }
    }
  }
  module.set(datei, { rumpf: rumpf.trim(), exporte, namen });
}

export function buendle(einstieg) {
  const module = new Map();
  ladeModul(einstieg, module, []);

  const vergeben = new Map();
  for (const [datei, { namen }] of module) {
    for (const name of namen) {
      if (vergeben.has(name)) {
        fehler(datei, `"${name}" gibt es schon in ${relative(WURZEL, vergeben.get(name))}`);
      }
      vergeben.set(name, datei);
    }
  }

  const teile = [...module].map(
    ([datei, { rumpf }]) => `// --- ${relative(SRC, datei).replaceAll('\\', '/')}\n${rumpf}`,
  );
  const js = `(function () {\n'use strict';\n\n${teile.join('\n\n')}\n})();`;
  new vm.Script(js, { filename: 'index.html (Skript)' }); // nur Syntaxprüfung, läuft nicht
  return js;
}

export function baue() {
  const vorlage = readFileSync(join(SRC, 'vorlage.html'), 'utf8');
  const css = readFileSync(join(SRC, 'style.css'), 'utf8').trim();
  const js = buendle(join(SRC, 'main.js'));

  if (/<\/script/i.test(js)) throw new Error('Build: "</script" im Skript würde die Seite zerreißen');
  if (/<\/style/i.test(css)) throw new Error('Build: "</style" im CSS würde die Seite zerreißen');
  for (const marke of ['/*__CSS__*/', '/*__JS__*/']) {
    if (vorlage.split(marke).length !== 2) throw new Error(`Build: ${marke} muss genau einmal in vorlage.html stehen`);
  }
  // split/join statt replace, damit "$" im Quelltext nichts auslöst
  return vorlage.split('/*__CSS__*/').join(css).split('/*__JS__*/').join(js);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = baue();
  if (process.argv.includes('--check')) {
    let vorhanden = '';
    try { vorhanden = readFileSync(ZIEL, 'utf8'); } catch { /* fehlt noch */ }
    if (vorhanden !== html) {
      console.error('index.html ist veraltet. Bitte "npm run build" ausführen.');
      process.exit(1);
    }
    console.log('index.html ist aktuell.');
  } else {
    writeFileSync(ZIEL, html);
    console.log(`index.html geschrieben (${(Buffer.byteLength(html) / 1024).toFixed(1)} kB).`);
  }
}
