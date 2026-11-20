// Selbstkontrolle im Browser: Tod, Begleiter im Speisewagen, Antwort, „Noch mal", Wiederholung, zurück.
// Vergleicht nach jeder Eingabe den Zustand im Browser mit einer Nachrechnung in Node und macht Bilder.
//
//   node werkzeug/begleiter.mjs 390x844
//   node werkzeug/begleiter.mjs 360x600

import { join } from 'node:path';
import { STARTFELD, entfernungen, naechsterSchritt } from '../src/kern/feld.js';
import { istHindernis } from '../src/kern/lage.js';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { optionenFuerFahrt } from '../src/kern/reise.js';
import { bereinigeStand } from '../src/speicher.js';
import { BOTS } from '../tests/bots.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const SEED = 6; // der Ausgewogene stirbt bei diesem Seed im sechsten Wagen, hinter dem Speisewagen
const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen } = await oeffne(B, H);
await seite.goto(`file://${SPIELDATEI}#seed=${SEED}`);
await seite.waitForFunction(() => typeof window.endstationZustand === 'function');

const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));
const bild = (name) => seite.screenshot({ path: join(ordner, `begleiter-${B}x${H}-${name}.png`) });
let soll = erzeugeSpiel(SEED);
let gleich = 0;
const maengel = [];
async function pruefe(name) {
  await seite.waitForTimeout(30);
  const ist = await zustand();
  if (JSON.stringify(ist) === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`${name}: Browser ${JSON.stringify(ist.spieler)} Wagen ${ist.wagenNr + 1}, Kern ${JSON.stringify(soll.zustand.spieler)} Wagen ${soll.zustand.wagenNr + 1}`);
}
function erwarte(bedingung, text) {
  if (!bedingung) maengel.push(text);
}
async function gib(aktion) {
  const e = soll.act(aktion);
  await seite.keyboard.press(TASTE[aktion], { delay: 0 });
  return e;
}
function richtungZu(ziel) {
  const z = soll.zustand;
  const weit = entfernungen(ziel, (x, y) => !istHindernis(z, x, y));
  const schritt = naechsterSchritt(z.spieler, weit, ziel);
  return schritt ? schritt.richtung : 'warten';
}
async function gehZu(ziel, name) {
  for (let i = 0; i < 30; i++) {
    const s = soll.zustand.spieler;
    if (s.x === ziel.x && s.y === ziel.y) break;
    await gib(richtungZu(ziel));
    await seite.waitForTimeout(90);
  }
  await pruefe(name);
}

// 1. Eine Fahrt bis zum Tod. Gemerkt wird, was im letzten Wagen geschah.
const merk = {};
let letzterWagen = [];
while (soll.zustand.status === 'faehrt') {
  const aktion = BOTS.ausgewogener(soll.zustand, merk);
  let e = await gib(aktion);
  if (e.length === 1 && e[0].typ === 'ungueltig') e = await gib('warten');
  if (e.some((x) => x.typ === 'wagenwechsel')) letzterWagen = [];
  else letzterWagen.push(aktion);
}
await pruefe('Tod');
const tot = soll.zustand;
erwarte(tot.status === 'tot' && tot.wagenNr > 3, `Tod erwartet hinter dem Speisewagen, war ${tot.status} in Wagen ${tot.wagenNr + 1}`);

// 2. Die nächste Fahrt beginnt im Speisewagen, er sitzt dort
await seite.waitForTimeout(800);
await seite.keyboard.press('ArrowUp');
await seite.waitForTimeout(400);
const gemerkt = bereinigeStand(JSON.parse(await seite.evaluate(() => window.localStorage.getItem('endstation.1'))));
soll = erzeugeSpiel(SEED + 1, optionenFuerFahrt(gemerkt, tot));
await pruefe('nächste Fahrt');
const b = soll.zustand.begleiter;
erwarte(b && soll.zustand.wagen.sicher, 'kein Begleiter im Speisewagen');
await bild('1-speisewagen');

// 3. neben ihn: die Frage; auf die Antwort darunter: „Noch mal" liegt neben ihm
const neben = { x: b.x === 4 ? 3 : 1, y: b.y };
await gehZu(neben, 'neben den Begleiter');
await seite.waitForTimeout(300);
await bild('2-frage');
await gib('runter');
await seite.waitForTimeout(400);
await pruefe('Antwort');
erwarte(soll.zustand.begleiter.wiederholen, 'nach der Antwort liegt kein „Noch mal"');
await bild('3-nochmal');

// 4. drauf: die Wiederholung blendet über
await gib('hoch');
await seite.waitForTimeout(150);
await bild('4-ueberblenden');
await seite.waitForTimeout(400);
await pruefe('Wiederholung beginnt');
erwarte(soll.zustand.probe && soll.zustand.wagenNr === tot.wagenNr, 'die Wiederholung zeigt nicht den Wagen des Todes');
await bild('5-wiederholung');

// 5. dieselben Züge wie beim Tod: Treffer sind zu sehen, kein Herz geht
const herzen = soll.zustand.spieler.herzen;
let getroffen = false;
for (const aktion of letzterWagen) {
  const e = await gib(aktion);
  await seite.waitForTimeout(110);
  if (!getroffen && e.some((x) => x.typ === 'treffer')) {
    getroffen = true;
    await seite.waitForTimeout(20);
    await bild('6-treffer');
  }
}
await pruefe('nach den Zügen von damals');
erwarte(getroffen, 'in der Wiederholung kein Treffer gesehen');
erwarte(soll.zustand.spieler.herzen === herzen && soll.zustand.status === 'faehrt', 'in der Wiederholung ging ein Herz verloren');
await seite.waitForTimeout(300);
await bild('7-ende-der-szene');

// 6. hinaus: zum Startfeld und nach unten
if (soll.zustand.probe) {
  await gehZu(STARTFELD, 'zum Startfeld');
  if (soll.zustand.probe) await gib('runter');
}
await seite.waitForTimeout(400);
await pruefe('zurück');
erwarte(!soll.zustand.probe && soll.zustand.wagen.sicher, 'nicht zurück im Speisewagen');
await bild('8-zurueck');

for (const m of meldungen) maengel.push(m);
console.log(`${B}x${H}, ${motor}: ${gleich} Prüfungen gleich, ${maengel.length} Mängel, Tod in Wagen ${tot.wagenNr + 1} durch ${tot.todDurch}, ${letzterWagen.length} Züge wiederholt`);
for (const m of maengel) console.log('  MANGEL: ' + m);
await browser.close();
process.exit(maengel.length === 0 ? 0 : 1);
