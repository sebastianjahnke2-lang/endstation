// Selbstkontrolle im Browser: Sprint einführen. Der Drängler steht in der Engstelle des Speisewagens,
// das Feld hinter ihm leuchtet, ein Tipp darauf sprintet vorbei. Zweiter Weg: anstoßen, warten, er macht Platz.
// Vergleicht nach jeder Eingabe den Zustand im Browser mit einer Nachrechnung in Node und macht Bilder.
//
//   node werkzeug/sprint.mjs 390x844

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
const { browser, seite, motor, meldungen, canvas } = await oeffne(B, H);
const maengel = [];
const erwarte = (b, text) => { if (!b) maengel.push(text); };

async function beginne() {
  const optionen = { staerken: { warten: false, sprint: true, rueckhalt: false }, mehrAmTisch: 0, startWagen: SPEISEWAGEN_NR };
  const soll = erzeugeSpiel(SEED, JSON.parse(JSON.stringify(optionen)));
  const stand = bereinigeStand(null);
  stand.staerken.sprint = true;
  stand.gelernt = { wischen: true, ausweichen: true, anrempeln: true };
  stand.fahrt = neueAufzeichnung(SEED, optionen, soll.zustand);
  await seite.goto(`file://${SPIELDATEI}#probe`);
  await seite.evaluate((s) => window.localStorage.setItem('endstation.1', JSON.stringify(s)), stand);
  await seite.reload();
  await seite.waitForFunction(() => typeof window.endstationZustand === 'function');
  await seite.waitForTimeout(300);
  return soll;
}

const k0 = await (async () => { await beginne(); return canvas(); })();
const layout = berechneLayout(k0.b, k0.h);
const mitte = (x, y) => ({ x: k0.x + layout.boden.x + (x + 0.5) * layout.s, y: k0.y + layout.boden.y + (y + 0.5) * layout.s });
const tippe = (x, y) => seite.touchscreen.tap(mitte(x, y).x, mitte(x, y).y);
const zustand = async () => JSON.parse(await seite.evaluate(() => window.endstationZustand()));
const bild = (name) => seite.screenshot({ path: join(ordner, `sprint-${B}x${H}-${name}.png`) });
let gleich = 0;
async function pruefe(soll, name) {
  await seite.waitForTimeout(220);
  const ist = await zustand();
  if (JSON.stringify(ist) === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`${name}: Browser ${JSON.stringify(ist.spieler)}, Kern ${JSON.stringify(soll.zustand.spieler)}`);
}

// Weg 1: hingehen, das Feld hinter ihm leuchtet, Tipp darauf ist der Sprint
let soll = await beginne();
erwarte(soll.zustand.wagen.imWeg, 'kein Drängler in der Engstelle');
await bild('1-eintritt');
await tippe(2, 6); soll.act('hoch'); await pruefe(soll, 'hoch 1');
await tippe(2, 5); soll.act('hoch'); await pruefe(soll, 'hoch 2');
await seite.waitForTimeout(200);
await bild('2-vor-ihm');
await tippe(2, 3); const e = soll.act('sprint-hoch'); await pruefe(soll, 'Sprint');
erwarte(e.some((x) => x.typ === 'platzGemacht' && x.wie === 'sprint'), 'Sprint führte nicht vorbei');
await seite.waitForTimeout(60);
await bild('3-im-sprint');
await seite.waitForTimeout(400);
await bild('4-vorbei');

// Weg 2: anstoßen, warten, er macht Platz
soll = await beginne();
await tippe(2, 6); soll.act('hoch'); await pruefe(soll, 'hoch 1');
await tippe(2, 5); soll.act('hoch'); await pruefe(soll, 'hoch 2');
await tippe(2, 4); soll.act('hoch'); await pruefe(soll, 'anstoßen');
await bild('5-angestossen');
await tippe(2, 5); const e2 = soll.act('warten'); await pruefe(soll, 'warten');
erwarte(e2.some((x) => x.typ === 'platzGemacht' && x.wie === 'geduld'), 'er machte keinen Platz');
await seite.waitForTimeout(100);
await bild('6-macht-platz');
await tippe(2, 4); soll.act('hoch'); await pruefe(soll, 'durch die Engstelle');
await bild('7-durch');

console.log(`Engine: ${motor}, ${B}x${H}, ${gleich} Zustände gleich, Mängel: ${maengel.length}`);
for (const m of [...maengel, ...meldungen]) console.log('  ' + m);
console.log(`Bilder in ${ordner}`);
await browser.close();
