// Spielt eine beliebige Folge von Eingaben im Browser und macht nach jeder ein Bild.
// Für die Selbstkontrolle einzelner Augenblicke: Schatten im Gleiten, Anstoßen, Wecken.
//
//   node prototyp/freier-platz/werkzeug/szene.mjs 390x844 "W,W,W,W,T,A" [name] [pause in ms] [oben,unten]
//
// Eingaben, durch Komma getrennt:
//   W       Knopf "Warten"
//   h r u l wischen: hoch, rechts, runter, links
//   T       Tasche antippen          S    den Schlafenden antippen
//   A B     Lampe antippen           K    den Schaffner antippen
//   Fx.y    Feld x,y antippen        N    Knopf "Neue Fahrt"
//   P       lange auf die Zuganzeige drücken (Testprotokoll)
//   !ms     nur ein Bild nach ms Millisekunden, ohne Eingabe (für Zwischenbilder)
// Die Pause ist die Zeit bis zum Bild nach jeder Eingabe, sonst 900 ms.

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeFahrt } from '../src/kern/fahrt.js';
import { TASCHENPLATZ, SCHLAEFERPLATZ, GANGSPALTE } from '../src/kern/abteil.js';
import { berechneMasse, feldMitte, lampenKopf, endeMasse } from '../src/anzeige/masse.js';
import { oeffne, bilderOrdner } from '../../../werkzeug/browser.mjs';

const DATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const eingaben = (process.argv[3] || '').split(',').map((e) => e.trim()).filter(Boolean);
const name = process.argv[4] || 'szene';
const pause = Number(process.argv[5] || 900);
const [oben, unten] = (process.argv[6] || '0,0').split(',').map(Number);
const ordner = bilderOrdner();
const { browser, seite, motor, meldungen, wische, canvas } = await oeffne(B, H, { sicher: oben || unten ? { top: oben, bottom: unten, left: 0, right: 0 } : null });

await seite.goto(`file://${DATEI}#probe`);
await seite.waitForFunction(() => typeof window.platzZustand === 'function');
await seite.waitForTimeout(200);
const k = await canvas();
const m = berechneMasse(k.b, k.h);
const soll = erzeugeFahrt();
const tippe = (p) => seite.touchscreen.tap(k.x + p.x, k.y + p.y);
const mitteVon = (kasten) => ({ x: kasten.x + kasten.b / 2, y: kasten.y + kasten.h / 2 });
const WEG = { h: [0, -60, 'hoch'], r: [60, 0, 'rechts'], u: [0, 60, 'runter'], l: [-60, 0, 'links'] };

let nr = 0;
async function bild(marke, nach) {
  await seite.waitForTimeout(nach);
  nr += 1;
  const datei = join(ordner, `platz-${name}-${String(nr).padStart(2, '0')}-${marke}.png`);
  await seite.screenshot({ path: datei });
  return datei;
}

console.log(`Engine ${motor}, ${B}x${H}, Feldgröße ${m.s}`);
await bild('start', 100);
for (const e of eingaben) {
  if (e[0] === '!') {
    console.log(`  ${e}: ${await bild('zwischen', Number(e.slice(1)))}`);
    continue;
  }
  if (e === 'W') {
    await tippe(mitteVon(m.warten));
    soll.act('warten');
  } else if (WEG[e]) {
    await wische(k.x + k.b / 2, k.y + k.h * 0.5, WEG[e][0], WEG[e][1]);
    soll.act(WEG[e][2]);
  } else if (e === 'T') {
    await tippe(feldMitte(m, TASCHENPLATZ.x, TASCHENPLATZ.y));
    soll.act({ tipp: 'feld', x: TASCHENPLATZ.x, y: TASCHENPLATZ.y });
  } else if (e === 'S') {
    await tippe(feldMitte(m, SCHLAEFERPLATZ.x, SCHLAEFERPLATZ.y));
    soll.act({ tipp: 'feld', x: SCHLAEFERPLATZ.x, y: SCHLAEFERPLATZ.y });
  } else if (e === 'K') {
    await tippe(feldMitte(m, GANGSPALTE, soll.zustand.schaffner.y));
    soll.act({ tipp: 'feld', x: GANGSPALTE, y: soll.zustand.schaffner.y });
  } else if (e === 'A' || e === 'B') {
    await tippe(lampenKopf(m, e, soll.zustand.lampen[e]));
    soll.act({ tipp: 'lampe', name: e });
  } else if (e[0] === 'F') {
    const [x, y] = e.slice(1).split('.').map(Number);
    await tippe(feldMitte(m, x, y));
    soll.act({ tipp: 'feld', x, y });
  } else if (e === 'N') {
    await tippe(mitteVon(endeMasse(m).knopf));
  } else if (e === 'P') {
    const p = mitteVon(m.tafel);
    const sende = (typ) => seite.evaluate(([t, x, y]) => {
      document.getElementById('bild').dispatchEvent(new PointerEvent(t, { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
    }, [typ, k.x + p.x, k.y + p.y]);
    await sende('pointerdown');
    await seite.waitForTimeout(800);
    await sende('pointerup');
  } else {
    console.log(`  unbekannte Eingabe: ${e}`);
    continue;
  }
  const datei = await bild(e.replace(/[^A-Za-z0-9.]/g, ''), pause);
  const ist = JSON.parse(await seite.evaluate(() => window.platzZustand()));
  const gleich = e === 'N' || e === 'P' || JSON.stringify(ist) === JSON.stringify(soll.zustand);
  console.log(`  ${e}: Runde ${ist.runde}, Spieler ${ist.spieler.x},${ist.spieler.y}, Schaffner ${ist.schaffner.weg ? 'weg' : `Reihe ${ist.schaffner.y} ${ist.schaffner.tat}`}${gleich ? '' : '  ABWEICHUNG VOM KERN'}  ${datei}`);
}
for (const meldung of meldungen) console.log(`  Konsole: ${meldung}`);
await browser.close();
