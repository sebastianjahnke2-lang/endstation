// Selbstkontrolle der Bedienung im echten Browser: Wischen, Tippen, Tastatur, Endkarte.
// Vergleicht nach jeder Eingabe den Zustand im Browser mit einer Nachrechnung in Node.
//
//   node werkzeug/bedienung.mjs 390x700
//   node werkzeug/bedienung.mjs 360x600
//
// Braucht Playwright. In der Cloud-Umgebung ist es vorinstalliert, ins Repo gehört es nicht.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { berechneLayout } from '../src/anzeige/layout.js';
import { kartenMasse } from '../src/anzeige/karte.js';
import { BOTS } from '../tests/bots.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const ordner = process.env.BILDER || join(tmpdir(), 'endstation-bilder');
mkdirSync(ordner, { recursive: true });
const seiteDatei = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

const [B, H] = (process.argv[2] || '390x700').split('x').map(Number);
const SEED = 21;
const browser = await chromium.launch();
const kontext = await browser.newContext({ viewport: { width: B, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const seite = await kontext.newPage();
const fehler = [];
seite.on('pageerror', (e) => fehler.push(e.message));
seite.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') fehler.push(m.text()); });
const start = Date.now();
await seite.goto(`file://${seiteDatei}#seed=${SEED}`);
await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
const ladezeit = Date.now() - start;
const cdp = await kontext.newCDPSession(seite);
const layout = berechneLayout(B, H);
const mitte = (x, y) => ({ x: layout.boden.x + (x + 0.5) * layout.s, y: layout.boden.y + (y + 0.5) * layout.s });

let soll = erzeugeSpiel(SEED);
let ok = 0, schlecht = 0;
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));
async function pruefe(name) {
  await seite.waitForTimeout(40);
  const ist = await zustand();
  const gleich = JSON.stringify(ist) === JSON.stringify(soll.zustand);
  if (gleich) ok++; else { schlecht++; console.log('ABWEICHUNG bei', name, '\n ist ', JSON.stringify(ist.spieler), ist.zug, '\n soll', JSON.stringify(soll.zustand.spieler), soll.zustand.zug); }
}
async function wische(dx, dy, vonX = B / 2, vonY = H * 0.6, schritte = 4) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vonX, y: vonY }] });
  for (let i = 1; i <= schritte; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vonX + (dx * i) / schritte, y: vonY + (dy * i) / schritte }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const tippe = (p) => seite.touchscreen.tap(p.x, p.y);

// 1. Wischen
await wische(0, -60); soll.act('hoch'); await pruefe('Wisch hoch');
await wische(0, -30); soll.act('hoch'); await pruefe('kurzer Wisch hoch');
await wische(-50, 8); soll.act('links'); await pruefe('Wisch links, leicht schräg');
await wische(45, -10); soll.act('rechts'); await pruefe('Wisch rechts');
await wische(0, 70); soll.act('runter'); await pruefe('Wisch runter');
await wische(0, 14, B / 2, H * 0.6, 2); soll.act('runter'); await pruefe('sehr kurzer Wisch (14 px) zählt als Wisch');
await wische(3, 2, 30, 30, 1); await pruefe('Tippen ins Leere tut nichts');
// 2. Tippen: Nachbarfeld, eigenes Feld, Uhr, fernes Feld, Tür
let s = soll.zustand.spieler;
await tippe(mitte(s.x - 1, s.y)); soll.act('links'); await pruefe('Tipp aufs linke Nachbarfeld');
s = soll.zustand.spieler;
await tippe(mitte(s.x, s.y - 1)); soll.act('hoch'); await pruefe('Tipp aufs obere Nachbarfeld');
s = soll.zustand.spieler;
await tippe(mitte(s.x, s.y)); soll.act('warten'); await pruefe('Tipp aufs eigene Feld wartet');
await tippe(layout.uhr); soll.act('warten'); await pruefe('Tipp auf die Uhr wartet');
await tippe(mitte(4, 0)); await pruefe('Tipp auf ein fernes Feld tut nichts');
// 3. Ton-Knopf
await tippe(layout.ton);
const gemerkt = await seite.evaluate(() => JSON.parse(localStorage.getItem('endstation.1') || '{}'));
console.log('Ton nach Tipp:', gemerkt.ton, '| gelernt:', JSON.stringify(gemerkt.gelernt));
await pruefe('Ton-Knopf kostet keinen Zug');
// 4. Tastatur
for (const [taste, aktion] of [['ArrowLeft', 'links'], ['KeyD', 'rechts'], ['Space', 'warten'], ['KeyW', 'hoch'], ['ArrowDown', 'runter'], ['KeyS', 'runter'], ['KeyA', 'links'], ['ArrowRight', 'rechts'], ['ArrowUp', 'hoch']]) {
  await seite.keyboard.press(taste); soll.act(aktion); await pruefe('Taste ' + taste);
}
// 5. Mit dem Kämpfer bis zum Tod, schnell hintereinander (Eingaben während der Animation)
const merk = {};
let zuege = 0;
while (soll.zustand.status === 'faehrt' && zuege < 400) {
  const a = BOTS.kaempfer(soll.zustand, merk);
  const ev = soll.act(a);
  const taste = { hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' }[a];
  await seite.keyboard.press(taste, { delay: 0 });
  zuege++;
  if (zuege % 10 === 0) await pruefe('schnelle Folge, Zug ' + zuege);
}
await pruefe('nach dem Tod');
console.log('Status im Browser:', (await zustand()).status, 'nach', zuege, 'schnellen Zügen');
// 6. Endkarte: zu frühes Wischen wird nicht angenommen, späteres schon
await wische(0, -80);
let jetzt = await zustand();
console.log('sofortiger Wisch nach dem Tod startet neu?', jetzt.status === 'faehrt' ? 'JA (unerwünscht)' : 'nein');
await seite.waitForTimeout(700);
await seite.screenshot({ path: join(ordner, `bedienung-karte-${B}.png`) });
await wische(0, 60);
jetzt = await zustand();
console.log('Wisch nach unten auf der Karte startet neu?', jetzt.status === 'faehrt' ? 'JA (unerwünscht)' : 'nein');
await wische(0, -80);
await seite.waitForTimeout(60);
jetzt = await zustand();
console.log('Wisch nach oben: Status', jetzt.status, '| Wagen', jetzt.wagenNr + 1, '| Zug', jetzt.zug, '| Herzen', jetzt.spieler.herzen, '| Seed', jetzt.seed);
await seite.screenshot({ path: join(ordner, `bedienung-neu-${B}.png`) });
// 7. Zweite Fahrt bis zum Tod, Karte per Tipp auf die Winkel schließen
soll = erzeugeSpiel(SEED + 1);
await pruefe('zweite Fahrt beginnt mit Seed + 1');
const merk2 = {};
while (soll.zustand.status === 'faehrt') {
  const a = BOTS.kaempfer(soll.zustand, merk2);
  soll.act(a);
  await seite.keyboard.press({ hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' }[a]);
}
await seite.waitForTimeout(800);
const w = kartenMasse(layout, 'tod').weiter;
{
  await tippe({ x: w.x + w.b / 2, y: w.y + w.h / 2 });
  await seite.waitForTimeout(60);
  jetzt = await zustand();
  console.log('Tipp auf die Winkel: Status', jetzt.status, '| Zug', jetzt.zug);
}
// 8. Karte mit Pfeil nach oben
soll = erzeugeSpiel(SEED + 2);
const merk3 = {};
while (soll.zustand.status === 'faehrt') { const a = BOTS.kaempfer(soll.zustand, merk3); soll.act(a); await seite.keyboard.press({ hoch: 'ArrowUp', rechts: 'ArrowRight', runter: 'ArrowDown', links: 'ArrowLeft', warten: 'Space' }[a]); }
await seite.waitForTimeout(800);
await seite.keyboard.press('ArrowUp');
await seite.waitForTimeout(60);
jetzt = await zustand();
console.log('Pfeil nach oben auf der Karte: Status', jetzt.status, '| Zug', jetzt.zug);
const scrollt = await seite.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth || scrollY !== 0);
console.log(`\n${B}x${H}: ${ok} Prüfungen gleich, ${schlecht} abweichend | Ladezeit ${ladezeit} ms | scrollt: ${scrollt} | Fehler: ${JSON.stringify(fehler)}`);
await browser.close();
process.exit(schlecht === 0 && fehler.length === 0 && !scrollt ? 0 : 1);
