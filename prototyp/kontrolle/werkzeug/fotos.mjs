// Selbstkontrolle des Prototyps "Kontrolle" im Browser: spielt alle drei Halte mit Wischen und Tippen,
// vergleicht nach jeder Eingabe den Zustand mit einer Nachrechnung in Node und macht Bilder.
//
//   node prototyp/kontrolle/werkzeug/fotos.mjs 390x844
//   node prototyp/kontrolle/werkzeug/fotos.mjs 360x600

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeKontrolle } from '../src/kern/kontrolle.js';
import { berechneMasse, feldMitte } from '../../freier-platz/src/anzeige/masse.js';
import { oeffne, bilderOrdner } from '../../../werkzeug/browser.mjs';

const DATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, wische, canvas } = await oeffne(B, H);
await seite.goto(`file://${DATEI}#probe`);
await seite.waitForFunction(() => typeof window.kontrollZustand === 'function');
await seite.waitForTimeout(200);

const k = await canvas();
const m = berechneMasse(k.b, k.h);
const soll = erzeugeKontrolle();
const maengel = [];
let gleich = 0;
const bild = (name) => seite.screenshot({ path: join(ordner, `kontrolle-${B}x${H}-${name}.png`) });

async function pruefe(name, pause) {
  await seite.waitForTimeout(pause === undefined ? 120 : pause);
  const ist = await seite.evaluate(() => window.kontrollZustand());
  if (ist === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`${name}: Browser und Kern weichen ab`);
}
async function wisch(richtung, pause) {
  const weg = { hoch: [0, -60], runter: [0, 60], links: [-60, 0], rechts: [60, 0] }[richtung];
  await wische(k.x + k.b / 2, k.y + k.h * 0.45, weg[0], weg[1]);
  soll.act(soll.zustand.status === 'faehrt' ? richtung : 'weiter');
  await pruefe(`Wisch ${richtung}`, pause);
}
async function tippFeld(x, y, pause) {
  const p = feldMitte(m, x, y);
  await seite.touchscreen.tap(k.x + p.x, k.y + p.y);
  soll.act(soll.zustand.status === 'faehrt' ? { tipp: 'feld', x, y } : 'weiter');
  await pruefe(`Tipp ${x},${y}`, pause);
}
async function warte(pause) {
  await seite.touchscreen.tap(k.x + m.warten.x + m.warten.b / 2, k.y + m.warten.y + m.warten.h / 2);
  soll.act('warten');
  await pruefe('Warten', pause);
}

// Halt 1: ein Schritt, er steht auf und setzt sich eine Reihe weiter
await bild('1-start');
await wisch('hoch', 60);
await seite.waitForTimeout(170);
await bild('2-er-steht-auf');
await seite.waitForTimeout(600);
await wisch('hoch');
await wisch('hoch', 60);
await seite.waitForTimeout(80);
await bild('3-er-zuckt');
await seite.waitForTimeout(500);
await wisch('rechts', 200);
await bild('4-gefangen');
if (soll.zustand.status !== 'gefangen') maengel.push('Halt 1 müsste gefangen sein');
await seite.waitForTimeout(900);

// Halt 2: warten, bis der Zug hält. Er steigt aus.
await tippFeld(2, 4, 300);
if (soll.zustand.halt !== 1) maengel.push('nach einer Eingabe müsste Halt 2 beginnen');
await bild('5-halt-2');
for (let i = 0; i < 4; i++) await warte();
await bild('6-strecke-kuerzer');
for (let i = 0; i < 8; i++) await warte(i === 7 ? 600 : 120);
await bild('7-er-steigt-aus');
if (soll.zustand.status !== 'entkommen') maengel.push('Halt 2 müsste entkommen sein');
await seite.waitForTimeout(1500);

// Halt 3: nach vorn, er zuckt, Tipp auf ihn am Fenster
await wisch('hoch', 300);
for (let i = 0; i < 6; i++) await wisch("hoch", 200);
await bild('8-halt-3-vorn');
await tippFeld(4, 1, 1400);
if (soll.zustand.status !== 'gefangen') maengel.push('Halt 3 müsste gefangen sein');

// Schluss: eine Zeile, ein Tipp beginnt neu
await tippFeld(2, 4, 600);
await bild('9-schluss');
if (soll.zustand.status !== 'aus') maengel.push('nach drei Halten müsste der Schluss kommen');
await tippFeld(2, 4, 300);
if (soll.zustand.status !== 'faehrt' || soll.zustand.halt !== 0) maengel.push('ein Tipp müsste neu beginnen');

for (const meldung of meldungen) maengel.push(`Konsole: ${meldung}`);
console.log(`${B}x${H}: Engine ${motor}, Feld ${m.s} px, ${gleich} Eingaben stimmen mit dem Kern überein`);
console.log(`  Bilder in ${ordner}`);
if (maengel.length) {
  console.log('  MÄNGEL:');
  for (const x of maengel) console.log(`   - ${x}`);
} else console.log('  keine Mängel');
await browser.close();
process.exit(maengel.length ? 1 : 0);
