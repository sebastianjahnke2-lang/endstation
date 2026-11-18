// Selbstkontrolle im Browser: lässt einen Bot eine Fahrt im echten Spiel spielen und macht Bilder
// an den sehenswerten Stellen (neuer Wagen, Linie, Gruppe, Treffer, volle Ruhe, offene Tür, Endkarte).
//
//   node werkzeug/schau.mjs [bot] [seed] [breite] [hoehe]
//
// Braucht Playwright. In der Cloud-Umgebung ist es vorinstalliert, ins Repo gehört es nicht.
// Die Bilder landen in $BILDER oder im Ordner "endstation-bilder" im Temp-Verzeichnis.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOTS } from '../tests/bots.js';
import { erzeugeSpiel } from '../src/kern/spiel.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const [bot = 'ausgewogener', seed = '3', breite = '390', hoehe = '700'] = process.argv.slice(2);
const ordner = process.env.BILDER || join(tmpdir(), 'endstation-bilder');
mkdirSync(ordner, { recursive: true });
const seiteDatei = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: Number(breite), height: Number(hoehe) }, deviceScaleFactor: 2, hasTouch: true });
const meldungen = [];
seite.on('console', (m) => meldungen.push(`${m.type()}: ${m.text()}`));
seite.on('pageerror', (e) => meldungen.push(`FEHLER: ${e.message}`));
await seite.goto(`file://${seiteDatei}#seed=${seed}`);
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
console.log(`${bot}, Seed ${seed}, ${breite}x${hoehe}: ${z.status} in Wagen ${z.wagenNr + 1} nach ${z.zug} Zügen`);
console.log(`Browser und Kern stimmen überein: ${gleich ? 'ja' : 'NEIN'} | Meldungen: ${JSON.stringify(meldungen)}`);
console.log(`${nr} Bilder in ${ordner}`);
await browser.close();
process.exit(gleich && meldungen.length === 0 ? 0 : 1);
