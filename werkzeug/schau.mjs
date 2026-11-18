// Selbstkontrolle im Browser: lässt einen Bot eine Fahrt im echten Spiel spielen und macht Bilder
// an den sehenswerten Stellen (neuer Wagen, Linie, Gruppe, Treffer, volle Ruhe, offene Tür, Endkarte).
//
//   node werkzeug/schau.mjs [bot] [seed] [breite] [hoehe]      Standard: ausgewogener 3 390 844
//
// Nimmt WebKit, wenn es installiert ist, sonst Chromium mit iPhone-Profil (siehe browser.mjs).
// Die Bilder landen in $BILDER oder im Ordner "endstation-bilder" im Temp-Verzeichnis.

import { join } from 'node:path';
import { BOTS } from '../tests/bots.js';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [bot = 'ausgewogener', seed = '3', breite = '390', hoehe = '844'] = process.argv.slice(2);
const ordner = bilderOrdner();
const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };

const { browser, seite, motor, meldungen } = await oeffne(Number(breite), Number(hoehe));
await seite.goto(`file://${SPIELDATEI}#seed=${seed}`);
await seite.waitForTimeout(300);

const soll = erzeugeSpiel(Number(seed));
const z = soll.zustand;
const merk = {};
const gesehen = new Set();
let nr = 0;
async function bild(name, pause = 450) {
  if (gesehen.has(name)) return;
  gesehen.add(name);
  await seite.waitForTimeout(pause);
  await seite.screenshot({ path: join(ordner, `${bot}-${seed}-${breite}-${String(nr++).padStart(2, '0')}-${name}.png`) });
}
await bild('start');
while (z.status === 'faehrt' && z.zug < 600) {
  let aktion = BOTS[bot](z, merk);
  let ereignisse = soll.act(aktion);
  if (ereignisse.length === 1 && ereignisse[0].typ === 'ungueltig') {
    aktion = 'warten';
    ereignisse = soll.act(aktion);
  }
  await seite.keyboard.press(TASTE[aktion]);
  await seite.waitForTimeout(50);
  const w = z.wagenNr + 1;
  if (z.zuegeImWagen === 3) await bild(`wagen${w}`);
  if (z.gegner.some((g) => g.typ === 'draengler' && g.ansage)) await bild(`wagen${w}-linie`);
  if (z.gegner.some((g) => g.typ === 'draengler' && g.erschoepft)) await bild(`wagen${w}-erschoepft`);
  if (z.gegner.some((g) => g.typ === 'gruppe' && g.ansage)) await bild(`wagen${w}-gruppe`);
  if (ereignisse.some((e) => e.typ === 'treffer')) await bild(`wagen${w}-treffer`, 40);
  if (z.spieler.ruhe === 3) await bild('volle-ruhe', 900);
  if (z.tuerOffen) await bild(`wagen${w}-tuer`);
}
await bild('ende', 900);
const browserStand = JSON.parse(await seite.evaluate(() => window.endstationZustand()));
const gleich = JSON.stringify(browserStand) === JSON.stringify(z);
console.log(`${bot}, Seed ${seed}, ${breite}x${hoehe}, ${motor}: ${z.status} in Wagen ${z.wagenNr + 1} nach ${z.zug} Zügen`);
console.log(`Browser und Kern stimmen überein: ${gleich ? 'ja' : 'NEIN'} | Meldungen: ${JSON.stringify(meldungen)}`);
console.log(`${nr} Bilder in ${ordner}`);
await browser.close();
process.exit(gleich && meldungen.length === 0 ? 0 : 1);
