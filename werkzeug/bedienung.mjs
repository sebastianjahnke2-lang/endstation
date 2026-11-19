// Selbstkontrolle der Bedienung im Browser: Wischen, Tippen, Tastatur, Endkarte, Speicher.
// Vergleicht nach jeder Eingabe den Zustand im Browser mit einer Nachrechnung in Node.
//
//   node werkzeug/bedienung.mjs 390x844            iPhone 14, ganze Höhe
//   node werkzeug/bedienung.mjs 390x664            iPhone 14, sichtbare Fläche in Safari
//   node werkzeug/bedienung.mjs 390x844 47,34      mit Notch (47) und Home-Balken (34)
//   node werkzeug/bedienung.mjs 360x600

import { join } from 'node:path';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { optionenFuerFahrt } from '../src/kern/reise.js';
import { bereinigeStand } from '../src/speicher.js';
import { berechneLayout, RAND_UNTEN } from '../src/anzeige/layout.js';
import { kartenMasse } from '../src/anzeige/karte.js';
import { BOTS } from '../tests/bots.js';
import { oeffne, bilderOrdner, SPIELDATEI } from './browser.mjs';

const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const [oben, unten] = (process.argv[3] || '0,0').split(',').map(Number);
const SEED = 21;
const TASTE = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' };
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, wische, canvas, sicherGesetzt } = await oeffne(B, H, { sicher: oben || unten ? { top: oben, bottom: unten, left: 0, right: 0 } : null });

const start = Date.now();
await seite.goto(`file://${SPIELDATEI}#seed=${SEED}`);
await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
const ladezeit = Date.now() - start;
await seite.waitForTimeout(150);

const k = await canvas();
const layout = berechneLayout(k.b, k.h);
const punkt = (p) => ({ x: k.x + p.x, y: k.y + p.y });
const mitte = (x, y) => punkt({ x: layout.boden.x + (x + 0.5) * layout.s, y: layout.boden.y + (y + 0.5) * layout.s });
const tippe = (p) => seite.touchscreen.tap(p.x, p.y);
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));

let soll = erzeugeSpiel(SEED);
let gleich = 0;
const maengel = [];
async function pruefe(name) {
  await seite.waitForTimeout(40);
  const ist = await zustand();
  if (JSON.stringify(ist) === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`${name}: Browser ${JSON.stringify(ist.spieler)} Zug ${ist.zug}, Kern ${JSON.stringify(soll.zustand.spieler)} Zug ${soll.zustand.zug}`);
}
function erwarte(bedingung, text) {
  if (!bedingung) maengel.push(text);
}

// 0. Der Canvas füllt die Seite ohne Notch und Home-Balken, nichts scrollt
erwarte(Math.abs(k.y - oben) < 1 && Math.abs(k.h - (H - oben - unten)) < 1 || !sicherGesetzt, `Canvas liegt bei y=${k.y}, Höhe ${k.h}, erwartet ${oben} und ${H - oben - unten}`);
erwarte(H - unten - (k.y + layout.rumpf.y + layout.rumpf.h) >= RAND_UNTEN, 'der Wagen reicht zu nah an den unteren Rand');

// 1. Wischen, überall auf dem Bild, nie am Rand
const wx = k.x + k.b / 2;
const wy = k.y + k.h * 0.55;
await wische(wx, wy, 0, -60); soll.act('hoch'); await pruefe('Wisch hoch');
await wische(wx, wy, 0, -30); soll.act('hoch'); await pruefe('kurzer Wisch hoch');
await wische(wx, wy, -50, 8); soll.act('links'); await pruefe('Wisch links, leicht schräg');
await wische(wx, wy, 45, -10); soll.act('rechts'); await pruefe('Wisch rechts');
await wische(wx, wy, 0, 70); soll.act('runter'); await pruefe('Wisch runter');
await wische(wx, wy, 0, 14, 2); soll.act('runter'); await pruefe('sehr kurzer Wisch (14 Pixel)');
await wische(k.x + 30, k.y + k.h - 8, 3, 2, 1); await pruefe('Tippen ins Leere am unteren Rand tut nichts');

// 2. Tippen: Nachbarfeld, eigenes Feld, Uhr, fernes Feld
let s = soll.zustand.spieler;
await tippe(mitte(s.x - 1, s.y)); soll.act('links'); await pruefe('Tipp aufs linke Nachbarfeld');
s = soll.zustand.spieler;
await tippe(mitte(s.x, s.y - 1)); soll.act('hoch'); await pruefe('Tipp aufs obere Nachbarfeld');
s = soll.zustand.spieler;
await tippe(mitte(s.x, s.y)); soll.act('warten'); await pruefe('Tipp aufs eigene Feld wartet');
await tippe(punkt(layout.uhr)); soll.act('warten'); await pruefe('Tipp auf die Uhr wartet');
await tippe(mitte(4, 0)); await pruefe('Tipp auf ein fernes Feld tut nichts');

// 3. Doppeltipp zoomt nicht, nichts ist markiert, nichts ist gescrollt
await tippe(punkt({ x: 20, y: layout.status.y + 10 }));
await tippe(punkt({ x: 20, y: layout.status.y + 10 }));
await seite.waitForTimeout(350);
const seitenlage = await seite.evaluate(() => ({
  zoom: window.visualViewport ? window.visualViewport.scale : 1,
  markiert: String(window.getSelection ? window.getSelection() : ''),
  gescrollt: window.scrollY !== 0 || window.scrollX !== 0,
  scrollbar: document.documentElement.scrollHeight > window.innerHeight + 1 || document.documentElement.scrollWidth > window.innerWidth + 1,
}));
erwarte(seitenlage.zoom === 1, `Doppeltipp hat gezoomt: ${seitenlage.zoom}`);
erwarte(seitenlage.markiert === '', 'Text wurde markiert');
erwarte(!seitenlage.gescrollt && !seitenlage.scrollbar, 'die Seite scrollt');
await pruefe('Doppeltipp neben den Herzen kostet keinen Zug');

// 4. Lautsprecher: schaltet um, kostet keinen Zug, wird gemerkt
await tippe(punkt(layout.ton));
const gemerkt = await seite.evaluate(() => JSON.parse(localStorage.getItem('endstation.1') || '{}'));
erwarte(gemerkt.ton === false, `Ton nach Tipp auf den Lautsprecher: ${gemerkt.ton}`);
await pruefe('Lautsprecher kostet keinen Zug');

// 5. Speicher mitten in der Fahrt gelöscht: Das Spiel läuft weiter
await seite.evaluate(() => localStorage.clear());
await wische(wx, wy, 40, 0); soll.act('rechts'); await pruefe('Wisch nach gelöschtem Speicher');

// 6. Tastatur
for (const [taste, aktion] of [['ArrowLeft', 'links'], ['KeyD', 'rechts'], ['Space', 'warten'], ['KeyW', 'hoch'], ['ArrowDown', 'runter'], ['KeyS', 'runter'], ['KeyA', 'links'], ['ArrowRight', 'rechts'], ['ArrowUp', 'hoch']]) {
  await seite.keyboard.press(taste); soll.act(aktion); await pruefe('Taste ' + taste);
}

// Die nächste Fahrt so nachrechnen wie das Spiel: mit dem, was der Browser gemerkt hat, und der vorigen Fahrt.
async function naechsteFahrt(seed) {
  const gemerkt = bereinigeStand(JSON.parse(await seite.evaluate(() => window.localStorage.getItem('endstation.1'))));
  return erzeugeSpiel(seed, optionenFuerFahrt(gemerkt, soll.zustand));
}

// 7. Schnelle Folge bis zum Tod: Eingaben mitten in der Bewegung
async function spieleBisEnde(name) {
  const merk = {};
  let zuege = 0;
  while (soll.zustand.status === 'faehrt' && zuege < 600) {
    const aktion = BOTS.kaempfer(soll.zustand, merk);
    soll.act(aktion);
    await seite.keyboard.press(TASTE[aktion], { delay: 0 });
    zuege += 1;
    if (zuege % 10 === 0) await pruefe(`${name}, Zug ${zuege}`);
  }
  await pruefe(`${name}, nach dem Ende`);
}
await spieleBisEnde('schnelle Folge');
erwarte((await zustand()).status === 'tot', 'der Kämpfer sollte hier sterben');

// 8. Endkarte: ein Wisch im selben Augenblick zählt nicht, einer nach unten auch nicht, einer nach oben startet neu
await wische(wx, wy, 0, -80);
erwarte((await zustand()).status === 'tot', 'ein sofortiger Wisch nach dem Tod hat die Karte geschlossen');
await seite.waitForTimeout(700);
await seite.screenshot({ path: join(ordner, `bedienung-${B}x${H}-karte.png`) });
await wische(wx, wy, 0, 60);
erwarte((await zustand()).status === 'tot', 'ein Wisch nach unten hat die Karte geschlossen');
await wische(wx, wy, 0, -80);
await seite.waitForTimeout(60);
soll = await naechsteFahrt(SEED + 1);
await pruefe('Wisch nach oben beginnt die zweite Fahrt');

// 9. Zweite Fahrt, Karte per Tipp auf die Winkel schließen; dritte mit Pfeil nach oben
await spieleBisEnde('zweite Fahrt');
await seite.waitForTimeout(800);
const winkel = kartenMasse(layout, 'tod').weiter;
await tippe(punkt({ x: winkel.x + winkel.b / 2, y: winkel.y + winkel.h / 2 }));
await seite.waitForTimeout(60);
soll = await naechsteFahrt(SEED + 2);
await pruefe('Tipp auf die Winkel beginnt die dritte Fahrt');
await spieleBisEnde('dritte Fahrt');
await seite.waitForTimeout(800);
await seite.keyboard.press('ArrowUp');
await seite.waitForTimeout(60);
soll = await naechsteFahrt(SEED + 3);
await pruefe('Pfeil nach oben beginnt die vierte Fahrt');
await seite.waitForTimeout(400);
await seite.screenshot({ path: join(ordner, `bedienung-${B}x${H}-spiel.png`) });

// 10. Gesperrter Speicher (privater Modus): Das Spiel startet und läuft
const privat = await browser.newContext({ viewport: { width: B, height: H }, hasTouch: true });
await privat.addInitScript(() => {
  const sperre = () => {
    throw new DOMException('gesperrt', 'SecurityError');
  };
  Storage.prototype.getItem = sperre;
  Storage.prototype.setItem = sperre;
});
const zweite = await privat.newPage();
const privatFehler = [];
zweite.on('pageerror', (e) => privatFehler.push(e.message));
await zweite.goto(`file://${SPIELDATEI}#seed=${SEED}`);
await zweite.waitForFunction(() => typeof window.endstationZustand === 'function');
for (const taste of ['ArrowUp', 'ArrowUp', 'ArrowLeft', 'Space']) await zweite.keyboard.press(taste);
await zweite.waitForTimeout(200);
const privatStand = JSON.parse(await zweite.evaluate(() => window.endstationZustand()));
erwarte(privatStand.zug === 4 && privatFehler.length === 0, `gesperrter Speicher: Zug ${privatStand.zug}, Fehler ${JSON.stringify(privatFehler)}`);

for (const m of meldungen) maengel.push(m);
console.log(`${B}x${H}${oben || unten ? ` mit Rand ${oben}/${unten}${sicherGesetzt ? '' : ' (nicht nachstellbar)'}` : ''}, ${motor}: ${gleich} Prüfungen gleich, ${maengel.length} Mängel | Feld ${layout.s} px | Ladezeit ${ladezeit} ms`);
for (const m of maengel) console.log('  MANGEL: ' + m);
await browser.close();
process.exit(maengel.length === 0 ? 0 : 1);
