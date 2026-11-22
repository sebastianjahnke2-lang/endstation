// Selbstkontrolle des Prototyps "Falsche Farben" im Browser: Ein hinsehender Spieler spielt einen ganzen
// Abend nur mit Tippen, dann tippt er auf den Schlusssatz und der nächste Abend beginnt. Vergleicht nach
// jedem Zug den Zustand mit einer Nachrechnung in Node und macht Bilder an den wichtigen Stellen.
//
//   node prototyp/falsche-farben/werkzeug/fotos.mjs 390x844 [seed] [blind]

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeAbend } from '../src/kern/abend.js';
import { berechneSaal } from '../src/anzeige/masse.js';
import { erzeugeWissen, lerne, waehle } from '../tests/bots.js';
import { oeffne, bilderOrdner } from '../../../werkzeug/browser.mjs';

const DATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const SEED = Number(process.argv[3] || 7);
const BLIND = process.argv[4] === 'blind';
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, canvas } = await oeffne(B, H);
await seite.goto(`file://${DATEI}#probe&seed=${SEED}`);
await seite.waitForFunction(() => typeof window.saalZustand === 'function');
await seite.waitForTimeout(200);

const k = await canvas();
const m = berechneSaal(k.b, k.h);
const abend = erzeugeAbend(SEED);
const z = abend.zustand;
const wissen = erzeugeWissen(BLIND);
const merk = {};
const maengel = [];
const gesehen = new Set();
let gleich = 0;
let zuege = 0;
const name = `farben-${B}x${H}${BLIND ? '-blind' : ''}`;
const bild = (was) => seite.screenshot({ path: join(ordner, `${name}-${was}.png`) });
const tippe = (x, y) => seite.touchscreen.tap(k.x + x, k.y + y);

await bild('0-anfang');
while (z.status === 'laeuft' && zuege < 600) {
  const a = waehle(wissen, z, merk);
  // Quelle anheben: die Tür, oder den äußersten Gast der Bank
  if (a.von === 'tuer') await tippe(m.tuer.plaetze[0].cx, m.tuer.plaetze[0].fy - m.s * 0.3);
  else {
    const p = m.baenke[a.von].plaetze[z.baenke[a.von].length - 1];
    await tippe(p.cx, p.fy - m.s * 0.3);
  }
  // Ziel: der erste freie Platz der Bank
  const frei = m.baenke[a.nach].plaetze[z.baenke[a.nach].length];
  const e = abend.act(a);
  merk.letzter = a;
  lerne(wissen, z, e);
  zuege += 1;
  await tippe(frei.cx, frei.fy - m.s * 0.3);
  const halt = e.some((x) => x.typ === 'aufgeflogen' || x.typ === 'geraeumt');
  await seite.waitForTimeout(halt ? 200 : 40);
  const ist = await seite.evaluate(() => window.saalZustand());
  if (ist === JSON.stringify(z)) gleich += 1;
  else {
    maengel.push(`nach Zug ${zuege} ${JSON.stringify(a)}: Browser und Kern weichen ab`);
    break;
  }
  for (const x of e) {
    if (!gesehen.has(x.typ) && ['schimmer', 'aufgeflogen', 'geraeumt'].includes(x.typ)) {
      gesehen.add(x.typ);
      await seite.waitForTimeout(x.typ === 'schimmer' ? 180 : 120);
      await bild(`1-${x.typ}`);
    }
  }
  const verdeckt = z.baenke.flat().filter((g) => g.zeigt !== g.echt);
  if (verdeckt.length >= 1 && z.tuer.length && !gesehen.has('falsch')) {
    gesehen.add('falsch');
    await seite.waitForTimeout(200);
    await bild('1-falscher-sitzt');
    const wo = z.baenke.findIndex((b) => b.some((g) => g.zeigt !== g.echt));
    console.log(`Bild "falscher-sitzt": Falscher auf Bank ${wo + 1}, zeigt ${verdeckt[0].zeigt}, ist ${verdeckt[0].echt}`);
  }
  if (z.geraeumt === 7 && !gesehen.has('halb')) {
    gesehen.add('halb');
    await seite.waitForTimeout(900);
    await bild('2-sieben-fenster');
  }
}
for (const typ of ['schimmer', 'aufgeflogen', 'geraeumt']) if (!gesehen.has(typ)) maengel.push(`nie gesehen: ${typ}`);
if (z.status !== 'ende') maengel.push('der Abend endete nicht');

await seite.waitForFunction(() => window.saalSatzSteht(), null, { timeout: 4000 }).catch(() => maengel.push('der Satz erscheint nicht'));
await seite.waitForTimeout(400);
await bild('3-ende');
await tippe(k.b / 2, m.baenke[2].zeile.y + 10);
await seite.waitForTimeout(150);
const danach = JSON.parse(await seite.evaluate(() => window.saalZustand()));
if (danach.status !== 'laeuft' || danach.zug !== 0) maengel.push('ein Tipp am Ende startet keinen neuen Abend');
await bild('4-neuer-abend');

console.log(`Motor: ${motor}, ${B}x${H}, Seed ${SEED}${BLIND ? ', blind' : ''}`);
console.log(`${zuege} Züge, ${gleich} gleich mit dem Kern, Ende: ${z.ende}, Fenster: ${z.geraeumt}`);
console.log(`Bilder in ${ordner}/${name}-*.png`);
for (const mm of [...maengel, ...meldungen]) console.log('MANGEL: ' + mm);
if (!maengel.length && !meldungen.length) console.log('keine Mängel');
await browser.close();
