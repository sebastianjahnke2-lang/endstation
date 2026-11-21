// Selbstkontrolle im Browser: Fahrt fortsetzen. Spielt ein paar Züge, lädt die Seite neu und prüft,
// dass man im selben Wagen in derselben Lage steht. Danach kaputter und leerer Speicher.
//
//   node werkzeug/fortsetzen.mjs 390x844
//   node werkzeug/fortsetzen.mjs 360x600

import { join } from 'node:path';
import { BOTS } from '../tests/bots.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };
const SCHLUESSEL = 'endstation.1';
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen } = await oeffne(B, H);
const maengel = [];
const erwarte = (bedingung, text) => {
  if (!bedingung) maengel.push(text);
};

// ohne festen Seed, denn nur dann wird aufgezeichnet. #probe macht den Zustand lesbar.
const ADRESSE = `file://${SPIELDATEI}#probe`;
async function lade() {
  await seite.goto(ADRESSE);
  await seite.reload();
  await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
  await seite.waitForTimeout(150);
}
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));
const bild = (name) => seite.screenshot({ path: join(ordner, `fortsetzen-${B}x${H}-${name}.png`) });

await seite.goto(ADRESSE);
await seite.evaluate(() => window.localStorage.clear());
await lade();

// 1. ein Stück fahren: der ausgewogene Bot steuert über die Tastatur, bis Wagen 2 erreicht ist
const merk = {};
for (let i = 0; i < 80; i++) {
  const z = await zustand();
  if (z.status !== 'faehrt' || (z.wagenNr === 1 && z.zuegeImWagen >= 4)) break;
  const aktion = BOTS.ausgewogener(z, merk);
  await seite.keyboard.press(TASTE[aktion] || 'Space');
  await seite.waitForTimeout(40);
}
await seite.waitForTimeout(400);
const vorher = await zustand();
erwarte(vorher.wagenNr >= 1, `der Bot müsste Wagen 2 erreicht haben, steht in Wagen ${vorher.wagenNr + 1}`);
await bild('1-vor-dem-schliessen');

// 2. neu laden: derselbe Zustand
await lade();
const nachher = await zustand();
erwarte(JSON.stringify(nachher) === JSON.stringify(vorher), `nach dem Neuladen anders: Wagen ${nachher.wagenNr + 1}, Zug ${nachher.zug}, Spieler ${JSON.stringify(nachher.spieler)} statt Wagen ${vorher.wagenNr + 1}, Zug ${vorher.zug}, Spieler ${JSON.stringify(vorher.spieler)}`);
await bild('2-nach-dem-oeffnen');

// 3. es geht gleich weiter: ein Zug wirkt
await seite.keyboard.press('Space');
await seite.waitForTimeout(200);
erwarte((await zustand()).zug === vorher.zug + 1, 'nach dem Öffnen müsste der nächste Zug zählen');

// 4. verfälschter, kaputter und leerer Speicher: still eine neue Fahrt
const faelle = [
  ['verfaelscht', (roh) => {
    const stand = JSON.parse(roh);
    stand.fahrt.eingaben += 'w';
    return JSON.stringify(stand);
  }],
  ['kaputt', () => '{"fahrt": {"seed": "x"'],
  ['unsinn', () => '{"fahrt": 42, "ton": "laut"}'],
  ['leer', () => null],
];
for (const [name, aendere] of faelle) {
  const roh = await seite.evaluate((k) => window.localStorage.getItem(k), SCHLUESSEL);
  const neu = aendere(roh);
  await seite.evaluate(([k, v]) => (v === null ? window.localStorage.removeItem(k) : window.localStorage.setItem(k, v)), [SCHLUESSEL, neu]);
  await lade();
  const z = await zustand();
  erwarte(z.status === 'faehrt' && z.wagenNr === 0 && z.zug === 0, `${name}: müsste eine neue Fahrt im ersten Wagen sein, ist Wagen ${z.wagenNr + 1}, Zug ${z.zug}`);
  if (name === 'verfaelscht') await bild('3-neue-fahrt-nach-fehler');
  // für den nächsten Fall wieder etwas aufzeichnen
  await seite.keyboard.press('Space');
  await seite.waitForTimeout(120);
}

// 5. gesperrter Speicher: Das Spiel läuft trotzdem
await seite.addInitScript(() => {
  Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('SecurityError'); }, configurable: true });
});
await lade();
await seite.keyboard.press('Space');
await seite.waitForTimeout(150);
erwarte((await zustand()).zug === 1, 'ohne Speicher müsste das Spiel laufen');

for (const meldung of meldungen) maengel.push(meldung);
console.log(`${B}x${H}: Engine ${motor}`);
console.log(`  Bilder in ${ordner}`);
if (maengel.length) {
  console.log('  MÄNGEL:');
  for (const m of maengel) console.log(`   - ${m}`);
} else {
  console.log('  keine Mängel');
}
await browser.close();
process.exit(maengel.length ? 1 : 0);
