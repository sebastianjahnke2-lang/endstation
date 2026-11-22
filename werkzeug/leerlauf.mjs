// Selbstkontrolle im Browser: Leerlauf vor der Tür, beide Varianten, im Speisewagen.
//   tuer:   Tipp auf die offene Tür, die Figur läuft hin und hindurch
//   halten: Wisch nach oben, Finger liegen lassen, die Figur geht weiter
// Prüft außerdem: Mit Gegnern im Wagen läuft nichts von selbst.
//
//   node werkzeug/leerlauf.mjs 390x844

import { join } from 'node:path';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { neueAufzeichnung } from '../src/kern/fortsetzen.js';
import { SPEISEWAGEN_NR } from '../src/kern/reise.js';
import { bereinigeStand } from '../src/speicher.js';
import { berechneLayout } from '../src/anzeige/layout.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const SEED = 9;
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, canvas, wische } = await oeffne(B, H);
const maengel = [];
const erwarte = (b, text) => { if (!b) maengel.push(text); };
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));
const bild = (name) => seite.screenshot({ path: join(ordner, `leerlauf-${B}x${H}-${name}.png`) });

async function beginne(variante, startWagen) {
  const optionen = { staerken: {}, mehrAmTisch: 0, startWagen };
  const soll = erzeugeSpiel(SEED, JSON.parse(JSON.stringify(optionen)));
  const stand = bereinigeStand(null);
  stand.gelernt = { wischen: true, ausweichen: true, anrempeln: true };
  stand.fahrt = neueAufzeichnung(SEED, optionen, soll.zustand);
  await seite.goto(`file://${SPIELDATEI}#probe&leerlauf=${variante}`);
  await seite.evaluate((s) => window.localStorage.setItem('endstation.1', JSON.stringify(s)), stand);
  await seite.reload();
  await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
  await seite.waitForTimeout(300);
}

await beginne('tuer', SPEISEWAGEN_NR);
const k = await canvas();
const layout = berechneLayout(k.b, k.h);
const tuer = { x: k.x + layout.boden.x + 2.5 * layout.s, y: k.y + layout.boden.y - layout.wandOben / 2 };
const gemerkt = await seite.evaluate(() => JSON.parse(window.localStorage.getItem('endstation.1')).leerlauf);
erwarte(gemerkt === 'tuer', `Variante nicht gemerkt: ${gemerkt}`);

// 1. Tipp auf die Tür: Die Figur läuft durch den Speisewagen und hinaus
await bild('1-speisewagen');
await seite.touchscreen.tap(tuer.x, tuer.y);
await seite.waitForTimeout(500);
await bild('2-unterwegs');
const mitte = await zustand();
erwarte(mitte.wagenNr === SPEISEWAGEN_NR && mitte.spieler.y < 7, `Tür: nach 0,5 s nicht unterwegs (${JSON.stringify(mitte.spieler)})`);
await seite.waitForTimeout(1600);
let z = await zustand();
erwarte(z.wagenNr === SPEISEWAGEN_NR + 1, `Tür: nicht im nächsten Wagen, sondern Wagen ${z.wagenNr + 1}`);
await bild('3-naechster-wagen');
// Im Kampfwagen bewirkt der Tipp auf die Tür nichts
const vorher = JSON.stringify(z.spieler);
await seite.touchscreen.tap(tuer.x, tuer.y);
await seite.waitForTimeout(600);
z = await zustand();
erwarte(JSON.stringify(z.spieler) === vorher, 'Tür: im Kampfwagen ist die Figur losgelaufen');

// 2. Finger liegen lassen
await beginne('halten', SPEISEWAGEN_NR);
const wx = k.x + k.b / 2;
const wy = k.y + k.h * 0.6;
await wische(wx, wy, 0, -40, 4, 900);
await seite.waitForTimeout(250);
z = await zustand();
erwarte(z.spieler.y <= 3, `Halten: nach 0,9 s nur bis Reihe ${z.spieler.y + 1}`);
await bild('4-gehalten');
// ein Tipp auf die Tür tut in dieser Variante nichts
const stehtBei = JSON.stringify(z.spieler);
await seite.touchscreen.tap(tuer.x, tuer.y);
await seite.waitForTimeout(500);
erwarte(JSON.stringify((await zustand()).spieler) === stehtBei, 'Halten: Tipp auf die Tür ließ die Figur laufen');
// Im Kampfwagen geht der gehaltene Finger nur einen Schritt
await beginne('halten', 0);
await wische(wx, wy, 0, -40, 4, 900);
z = await zustand();
erwarte(z.spieler.y === 6, `Halten im Kampfwagen: Figur in Reihe ${z.spieler.y + 1}, erwartet ein Schritt`);

console.log(`Engine: ${motor}, ${B}x${H}, Mängel: ${maengel.length}`);
for (const m of [...maengel, ...meldungen]) console.log('  ' + m);
console.log(`Bilder in ${ordner}`);
await browser.close();
