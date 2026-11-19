// Balance-Bericht: lässt die drei Bots über feste Seeds fahren und zeigt die Zahlen.
//
//   npm run balance            500 Fahrten je Bot
//   npm run balance -- 2000    andere Anzahl
//
// Kein Test, nur ein Bericht. Die Grenzen prüft tests/bots.test.js.

import { BOTS, fahre } from './bots.js';
import { WAGENZAHL } from '../src/kern/wagen.js';

export function werteAus(name, fahrten, optionen = {}) {
  const bot = BOTS[name];
  const laeufe = [];
  for (let seed = 1; seed <= fahrten; seed++) laeufe.push(fahre(seed, bot, optionen));

  const jeWagen = [];
  for (let nr = 0; nr < WAGENZAHL; nr++) {
    const dort = laeufe.map((l) => l.wagen.find((w) => w.nr === nr)).filter(Boolean);
    const geschafft = dort.filter((w) => w.geschafft);
    const mittel = (liste, f) => (liste.length ? liste.reduce((s, w) => s + f(w), 0) / liste.length : 0);
    jeWagen.push({
      nr,
      erreicht: dort.length / fahrten,
      geschafft: geschafft.length / fahrten,
      zuege: mittel(geschafft, (w) => w.zuege),
      zuegeMin: geschafft.length ? Math.min(...geschafft.map((w) => w.zuege)) : 0,
      zuegeMax: geschafft.length ? Math.max(...geschafft.map((w) => w.zuege)) : 0,
      treffer: mittel(dort, (w) => w.treffer),
      ausgewichen: mittel(dort, (w) => w.ausgewichen),
      herzen: mittel(geschafft, (w) => w.herzen),
      meisteGegner: Math.max(0, ...dort.map((w) => w.meisteGegner)),
    });
  }
  const tode = {};
  for (const l of laeufe) {
    const letzter = l.wagen[l.wagen.length - 1];
    if (l.status === 'tot') {
      const schluessel = `Wagen ${letzter.nr + 1}, ${letzter.todDurch}`;
      tode[schluessel] = (tode[schluessel] || 0) + 1;
    }
  }
  const zuegeGesamt = laeufe.reduce((s, l) => s + l.wagen.reduce((t, w) => t + w.zuege, 0), 0);
  const ruheVoll = laeufe.reduce((s, l) => s + l.wagen.reduce((t, w) => t + w.ruheVoll, 0), 0);
  return {
    name,
    fahrten,
    halt: laeufe.filter((l) => l.status === 'halt').length / fahrten,
    haengt: laeufe.filter((l) => l.status === 'haengt').length,
    ungueltig: laeufe.reduce((s, l) => s + l.ungueltig, 0),
    ruheVoll: zuegeGesamt ? ruheVoll / zuegeGesamt : 0,
    jeWagen,
    tode: Object.entries(tode).sort((a, b) => b[1] - a[1]),
  };
}

function prozent(x) {
  return `${(x * 100).toFixed(0).padStart(3)} %`;
}

function drucke(b) {
  console.log(`\n${b.name}: Halt erreicht ${prozent(b.halt)}   (hängt: ${b.haengt}, ungültige Züge: ${b.ungueltig}, volle Ruhe: ${prozent(b.ruheVoll)} der Züge)`);
  console.log('  Wagen  erreicht  geschafft  Züge (min-max)   Treffer  ausgew.  Herzen  Gegner');
  for (const w of b.jeWagen) {
    console.log(
      `  ${String(w.nr + 1).padStart(5)}  ${prozent(w.erreicht).padStart(8)}  ${prozent(w.geschafft).padStart(9)}  ` +
        `${w.zuege.toFixed(0).padStart(4)} (${w.zuegeMin}-${w.zuegeMax})`.padEnd(16) +
        `  ${w.treffer.toFixed(2).padStart(7)}  ${w.ausgewichen.toFixed(1).padStart(7)}  ${w.herzen.toFixed(1).padStart(6)}  ${String(w.meisteGegner).padStart(6)}`,
    );
  }
  if (b.tode.length) console.log('  Häufigste Tode: ' + b.tode.slice(0, 5).map(([k, n]) => `${k} (${n})`).join(', '));
}

if (process.argv[1] && process.argv[1].endsWith('balance.js')) {
  const fahrten = Number(process.argv[2]) || 500;
  for (const name of Object.keys(BOTS)) drucke(werteAus(name, fahrten));
  console.log('\nMit Unachtsamkeit (jeder zwölfte Zug zufällig):');
  drucke(werteAus('ausgewogener', fahrten, { fehlerquote: 1 / 12 }));
}
