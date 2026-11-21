// Selbstkontrolle des Prototyps "Kontrolle" im Browser: Lernhalt, dann eine Schicht. Die ersten Halte
// spielt es mit dem kürzesten Weg (Wischen und Tippen), dann lässt es drei entkommen. Vergleicht nach jeder
// Eingabe den Zustand mit einer Nachrechnung in Node und macht Bilder.
//
//   node prototyp/kontrolle/werkzeug/fotos.mjs 390x844
//   node prototyp/kontrolle/werkzeug/fotos.mjs 360x600

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeKontrolle } from '../src/kern/durchgang.js';
import { kuerzesterFang } from '../src/kern/pruefung.js';
import { berechneMasse, feldMitte } from '../../freier-platz/src/anzeige/masse.js';
import { oeffne, bilderOrdner } from '../../../werkzeug/browser.mjs';

const DATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const SEED = 4242;
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, wische, canvas } = await oeffne(B, H);
await seite.goto(`file://${DATEI}#probe&seed=${SEED}`);
await seite.evaluate(() => window.localStorage.clear()); // wie bei der allerersten Fahrt auf einem Gerät
await seite.reload();
await seite.waitForFunction(() => typeof window.kontrollZustand === 'function');
await seite.waitForTimeout(200);

const k = await canvas();
const m = berechneMasse(k.b, k.h);
const soll = erzeugeKontrolle(SEED, { lernhalt: true });
const maengel = [];
let gleich = 0;
const bild = (name) => seite.screenshot({ path: join(ordner, `kontrolle-${B}x${H}-${name}.png`) });
const erwarte = (bedingung, text) => {
  if (!bedingung) maengel.push(text);
};

// eine Eingabe im Browser und dieselbe im Kern. Nach Fang oder Halt wartet es, bis das Bild weiterläuft.
async function gib(h, pause) {
  if (h === 'hoch' || h === 'runter') {
    await wische(k.x + k.b / 2, k.y + k.h * 0.45, 0, h === 'hoch' ? -60 : 60);
  } else if (h === 'warten') {
    await seite.touchscreen.tap(k.x + m.warten.x + m.warten.b / 2, k.y + m.warten.y + m.warten.h / 2);
  } else {
    const p = feldMitte(m, h.x, h.y);
    await seite.touchscreen.tap(k.x + p.x, k.y + p.y);
  }
  const e = soll.act(soll.zustand.status === 'faehrt' ? h : 'weiter');
  const lang = e.some((x) => x.typ === 'gefangen' || x.typ === 'halt' || x.typ === 'neuerHalt');
  // nach Fang oder Halt hält das Bild an: In dieser Zeit nimmt es keine Eingabe an
  await seite.waitForTimeout(typeof pause === 'number' ? pause : 170);
  if (lang) await seite.waitForFunction(() => window.kontrollBereit(), null, { timeout: 8000 });
  const ist = await seite.evaluate(() => window.kontrollZustand());
  if (ist === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`nach ${JSON.stringify(h)}: Browser und Kern weichen ab`);
  return e;
}

// Lernhalt
erwarte(soll.zustand.lernhalt, 'bei leerem Speicher müsste der Lernhalt kommen');
await bild('0a-lernhalt-wischen');
await gib('hoch', 300);
await bild('0b-lernhalt-er-steht-auf');
await seite.waitForTimeout(600);
await gib('hoch');
await gib('hoch', 500);
await bild('0c-lernhalt-antippen');
const lern = soll.zustand.fahrgaeste.find((f) => f.schwarz);
await gib({ tipp: 'feld', x: lern.x, y: lern.y });
const gemerkt = await seite.evaluate(() => window.localStorage.getItem('endstation.kontrolle.1'));
erwarte(gemerkt && gemerkt.includes('"gelernt":true'), `der Lernhalt müsste gemerkt sein: ${gemerkt}`);
await gib({ tipp: 'feld', x: 2, y: 4 }, 600);
erwarte(!soll.zustand.lernhalt && soll.zustand.halt === 0, 'nach dem Lernhalt müsste die Schicht beginnen');
await bild('1-schicht-halt-1');

// die ersten fünf Halte auf dem kürzesten Weg. Bilder: Scheinschläfer hebt den Kopf, Toilettengänger geht
for (let halt = 0; halt < 5; halt++) {
  if (halt === 2) {
    // der Scheinschläfer: nach vorn gehen, bis er hinter dem Kontrolleur den Kopf hebt
    for (let i = 0; i < 6 && soll.zustand.status === 'faehrt'; i++) {
      const e = await gib('hoch', 60);
      if (e.some((x) => x.typ === 'kopfHoch')) {
        await seite.waitForTimeout(180);
        await bild('2-halt-3-kopf-hoch');
        break;
      }
    }
  }
  const weg = kuerzesterFang(JSON.parse(JSON.stringify(soll.zustand)));
  erwarte(weg, `Halt ${halt + 1}: kein Weg`);
  for (const h of weg) {
    const vorher = soll.zustand.halt;
    const e = await gib(h, h === "hoch" || h === "runter" ? 260 : null);
    if (e.some((x) => x.typ === 'toilette')) {
      await seite.waitForTimeout(600);
      await bild(`3-halt-${vorher + 1}-toilette`);
    }
  }
  erwarte(soll.zustand.halt === halt + 1, `nach Halt ${halt + 1} müsste sofort der nächste kommen`);
}
await bild('4-halt-6-linie');
const nachFuenf = JSON.parse(await seite.evaluate(() => window.localStorage.getItem('endstation.kontrolle.1')));
erwarte(nachFuenf.weiteste === 4, `die weiteste Station müsste gemerkt sein: ${JSON.stringify(nachFuenf)}`);

// drei entkommen lassen
let muetze = false;
for (let i = 0; i < 200 && soll.zustand.status !== 'aus'; i++) {
  const e = await gib('warten', null);
  if (!muetze && e.some((x) => x.typ === 'station' && x.entkommen === 1)) {
    muetze = true;
    await bild('5-eine-muetze-weg');
  }
}
erwarte(soll.zustand.status === 'aus', 'nach drei Entkommenen müsste die Schicht enden');
await seite.waitForTimeout(500);
await bild('6-ende-station');

// ein Tipp beginnt sofort die nächste Schicht
await gib({ tipp: 'feld', x: 2, y: 4 }, 900);
erwarte(soll.zustand.status === 'faehrt' && soll.zustand.halt === 0 && soll.zustand.schicht === 1, 'ein Tipp müsste die nächste Schicht beginnen');
await bild('7-naechste-schicht');

// neu laden: kein Lernhalt, die weiteste Station bleibt markiert
await seite.reload();
await seite.waitForFunction(() => typeof window.kontrollZustand === 'function');
erwarte(!JSON.parse(await seite.evaluate(() => window.kontrollZustand())).lernhalt, 'nach dem Neuladen dürfte der Lernhalt nicht wiederkommen');

for (const meldung of meldungen) maengel.push(`Konsole: ${meldung}`);
console.log(`${B}x${H}: Engine ${motor}, Feld ${m.s} px, ${gleich} Eingaben stimmen mit dem Kern überein`);
console.log(`  Bilder in ${ordner}`);
if (maengel.length) {
  console.log('  MÄNGEL:');
  for (const x of maengel) console.log(`   - ${x}`);
} else console.log('  keine Mängel');
await browser.close();
process.exit(maengel.length ? 1 : 0);
