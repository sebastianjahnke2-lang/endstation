// Selbstkontrolle im Browser: Halt ohne Sperre. Der ausgewogene Bot fährt in Node bis vor die letzte Tür,
// die Fahrt wird als Aufzeichnung in den Speicher gelegt, im Browser geht der letzte Schritt durch die Tür.
// Zweimal: einmal mit leerer Fahrkarte (der Schaffner nickt), einmal mit Lochungen (er locht).
//
//   node werkzeug/halt.mjs 390x844

import { join } from 'node:path';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { neueAufzeichnung, zeichneAuf } from '../src/kern/fortsetzen.js';
import { helleLochungen } from '../src/kern/fahrkarte.js';
import { bereinigeStand } from '../src/speicher.js';
import { ausgewogener } from '../tests/bots.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const ordner = bilderOrdner();
const maengel = [];
const erwarte = (b, text) => { if (!b) maengel.push(text); };

// Fährt mit dem Bot bis zur letzten Eingabe vor dem Halt. leer: eine Fahrt, deren Karte leer bleibt.
function fahrtBisVorDenHalt(leer) {
  for (let seed = 1; seed < 400; seed++) {
    // leer: nur der letzte Wagen, damit keine Lochung (etwa vom Kontrolleur) dazukommt
    const optionen = leer ? { staerken: {}, mehrAmTisch: 0, startWagen: 6 } : { staerken: {}, mehrAmTisch: 0 };
    const spiel = erzeugeSpiel(seed, JSON.parse(JSON.stringify(optionen)));
    const z = spiel.zustand;
    const auf = neueAufzeichnung(seed, optionen, z);
    const merk = {};
    for (let i = 0; i < 1500 && z.status === 'faehrt'; i++) {
      const aktion = ausgewogener(z, merk);
      const vorher = JSON.stringify(z);
      const e = spiel.act(aktion);
      if (!e.length || (e.length === 1 && e[0].typ === 'ungueltig')) { spiel.act('warten'); zeichneAuf(auf, 'warten', z); continue; }
      if (e.some((x) => x.typ === 'halt')) {
        if (leer !== (helleLochungen(z.fahrkarte) === 0)) break;
        return { seed, optionen, auf, letzte: aktion, vorher };
      }
      zeichneAuf(auf, aktion, z);
    }
  }
  return null;
}

const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };
const { browser, seite, motor, meldungen } = await oeffne(B, H);
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));

for (const leer of [true, false]) {
  const name = leer ? 'nickt' : 'locht';
  const f = fahrtBisVorDenHalt(leer);
  if (!f) { maengel.push(`${name}: keine passende Fahrt gefunden`); continue; }
  const stand = bereinigeStand(null);
  stand.gelernt = { wischen: true, ausweichen: true, anrempeln: true };
  stand.fahrt = f.auf;
  await seite.goto(`file://${SPIELDATEI}#probe`);
  await seite.evaluate((s) => window.localStorage.setItem('endstation.1', JSON.stringify(s)), stand);
  await seite.reload();
  await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
  await seite.waitForTimeout(300);
  const vor = await zustand();
  erwarte(vor.status === 'faehrt' && vor.wagenNr === 6, `${name}: nicht im letzten Wagen (${vor.status}, Wagen ${vor.wagenNr + 1})`);
  // Die Aufzeichnung hält ungültige Züge nicht fest: Der Bot hätte ohne sie dieselben Züge gemacht.
  await seite.keyboard.press(TASTE[f.letzte]);
  await seite.waitForTimeout(450);
  await seite.screenshot({ path: join(ordner, `halt-${B}x${H}-${name}-1.png`) });
  const nach = await zustand();
  erwarte(nach.status === 'halt', `${name}: kein Halt, Status ${nach.status}`);
  erwarte(nach.halt && nach.halt.hell === (leer ? 0 : helleLochungen(nach.fahrkarte)), `${name}: Halt ${JSON.stringify(nach.halt)}`);
  await seite.waitForTimeout(1800);
  await seite.screenshot({ path: join(ordner, `halt-${B}x${H}-${name}-2.png`) });
  await seite.waitForTimeout(6000);
  await seite.screenshot({ path: join(ordner, `halt-${B}x${H}-${name}-3.png`) });
  console.log(`${name}: Seed ${f.seed}, ${helleLochungen(nach.fahrkarte)} helle Lochungen, Status ${nach.status}`);
}

console.log(`Engine: ${motor}, ${B}x${H}, Mängel: ${maengel.length}`);
for (const m of [...maengel, ...meldungen]) console.log('  ' + m);
console.log(`Bilder in ${ordner}`);
await browser.close();
