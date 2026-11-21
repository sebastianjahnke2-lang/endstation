// Selbstkontrolle des Prototyps im Browser: spielt den Hauptweg mit Tippen und Wischen durch,
// vergleicht nach jeder Eingabe den Zustand im Browser mit einer Nachrechnung in Node
// und macht Bildschirmfotos von Start, Satz, Schatten im Gang und Abschluss.
//
//   node prototyp/freier-platz/werkzeug/fotos.mjs 390x844
//   node prototyp/freier-platz/werkzeug/fotos.mjs 360x600
//   node prototyp/freier-platz/werkzeug/fotos.mjs 390x844 47,34     mit Notch und Home-Balken
//
// Die Bilder landen im Ordner aus der Umgebungsvariable BILDER, sonst im Temp-Ordner.

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { erzeugeFahrt } from '../src/kern/fahrt.js';
import { berechneMasse, feldMitte, lampenKopf, endeMasse, FREI_UNTEN } from '../src/anzeige/masse.js';
import { oeffne, bilderOrdner } from '../../../werkzeug/browser.mjs';

const DATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
const [B, H] = (process.argv[2] || '390x844').split('x').map(Number);
const [oben, unten] = (process.argv[3] || '0,0').split(',').map(Number);
const ordner = bilderOrdner();
const marke = `${B}x${H}${oben || unten ? '-notch' : ''}`;
const { browser, seite, motor, meldungen, wische, canvas, sicherGesetzt } = await oeffne(B, H, { sicher: oben || unten ? { top: oben, bottom: unten, left: 0, right: 0 } : null });

// Mithören: Jeder erzeugte Ton wird mit seiner Höhe gezählt, damit sich prüfen lässt, ob und wann Musik entsteht.
await seite.addInitScript(() => {
  window.gehoert = { kontexte: 0, toene: [] };
  const Klasse = window.AudioContext || window.webkitAudioContext;
  if (!Klasse) return;
  const neu = Klasse.prototype.createOscillator;
  Klasse.prototype.createOscillator = function () {
    const o = neu.call(this);
    const start = o.start.bind(o);
    const setze = o.frequency.setValueAtTime.bind(o.frequency);
    let hz = null;
    o.frequency.setValueAtTime = (wert, t) => {
      if (hz === null) hz = wert;
      return setze(wert, t);
    };
    o.start = (t) => {
      window.gehoert.toene.push(Math.round(hz === null ? o.frequency.value : hz));
      start(t);
    };
    return o;
  };
  const Ursprung = Klasse;
  const Zaehler = function () {
    window.gehoert.kontexte += 1;
    return new Ursprung();
  };
  Zaehler.prototype = Ursprung.prototype;
  window.AudioContext = Zaehler;
  window.webkitAudioContext = Zaehler;
});
const gehoert = async () => seite.evaluate(() => window.gehoert);

await seite.goto(`file://${DATEI}#probe`);
await seite.waitForFunction(() => typeof window.platzZustand === 'function');
await seite.waitForTimeout(200);

const k = await canvas();
const m = berechneMasse(k.b, k.h);
const punkt = (p) => ({ x: k.x + p.x, y: k.y + p.y });
const zustand = async () => JSON.parse(await seite.evaluate(() => window.platzZustand()));
const soll = erzeugeFahrt();
const maengel = [];
let gleich = 0;

async function pruefe(name) {
  await seite.waitForTimeout(60);
  const ist = await zustand();
  if (JSON.stringify(ist) === JSON.stringify(soll.zustand)) gleich += 1;
  else maengel.push(`${name}: Browser ${JSON.stringify(ist.spieler)} Runde ${ist.runde}, Kern ${JSON.stringify(soll.zustand.spieler)} Runde ${soll.zustand.runde}`);
}
const erwarte = (bedingung, text) => {
  if (!bedingung) maengel.push(text);
};
async function foto(name, pause) {
  await seite.waitForTimeout(pause === undefined ? 1300 : pause);
  await seite.screenshot({ path: join(ordner, `platz-${marke}-${name}.png`) });
}
async function tippeAuf(p) {
  const q = punkt(p);
  await seite.touchscreen.tap(q.x, q.y);
}
const mitteVon = (kasten) => ({ x: kasten.x + kasten.b / 2, y: kasten.y + kasten.h / 2 });
async function warte(name) {
  await tippeAuf(mitteVon(m.warten));
  soll.act('warten');
  await pruefe(name || 'Warten');
}
async function tippeFeld(x, y, name) {
  await tippeAuf(feldMitte(m, x, y));
  soll.act({ tipp: 'feld', x, y });
  await pruefe(name || `Feld ${x},${y}`);
}
async function tippeLampe(lampe, name) {
  await tippeAuf(lampenKopf(m, lampe, soll.zustand.lampen[lampe]));
  soll.act({ tipp: 'lampe', name: lampe });
  await pruefe(name || `Lampe ${lampe}`);
}
async function wischeNach(richtung, name) {
  const weg = { hoch: [0, -60], runter: [0, 60], links: [-60, 0], rechts: [60, 0] }[richtung];
  await wische(k.x + k.b / 2, k.y + k.h * 0.5, weg[0], weg[1]);
  soll.act(richtung);
  await pruefe(name || `Wisch ${richtung}`);
}

// 0. Aufteilung: der Canvas füllt den sicheren Bereich, unter der Daumenzone bleibt Platz
erwarte(Math.abs(k.y - oben) < 1 && Math.abs(k.h - (H - oben - unten)) < 1 || !sicherGesetzt, `Canvas liegt bei y=${k.y}, Höhe ${k.h}`);
erwarte(k.h - (m.warten.y + m.warten.h) >= FREI_UNTEN, 'die Daumenzone reicht zu nah an den unteren Rand');
erwarte(await seite.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1), 'die Seite ist höher als das Fenster');

// 1. Start
await foto('1-start', 400);
erwarte((await gehoert()).kontexte === 0, 'vor der ersten Eingabe darf kein Ton entstehen');

// 2. nur warten: Der Schaffner kommt, locht den Fahrgast, sagt den Satz
await warte();
await warte();
await warte();
await warte('Warten bis zum Satz');
{
  const g = await gehoert();
  erwarte(g.kontexte === 1, `nach der ersten Eingabe genau ein Tonkontext, nicht ${g.kontexte}`);
  erwarte(g.toene.includes(110), 'der Grundklang (110 Hz) müsste klingen');
  erwarte(g.toene.includes(330), 'der erste Ton des Schaffners (330 Hz) müsste beim Warten klingen');
}
erwarte(soll.zustand.schaffner.tat === 'wartet', 'der Schaffner müsste jetzt warten');
await foto('2-satz');

// 3. eine Eingabe ohne Wirkung kostet keine Runde: gegen die Lehne wischen, die ferne Lampe antippen
await wischeNach('hoch', 'Wisch gegen die Lehne');
await tippeLampe('B', 'ferne Lampe');
erwarte(soll.zustand.runde === 4, 'unmögliche Eingaben dürfen keine Runde kosten');

// 4. Tasche nehmen: Die Zange bleibt oben und wandert zum Schatten
await tippeFeld(0, 5, 'Tasche antippen');
erwarte(soll.zustand.spieler.tasche, 'die Tasche müsste beim Spieler sein');
await foto('3-zange-am-schatten');

// 5. Lampe schwenken: Der Schatten liegt im Gang, der Schaffner locht
await tippeLampe('A', 'Lampe A');
erwarte(soll.zustand.spieler.gelocht, 'die Lochung müsste da sein');
await foto('4-schatten-im-gang', 1500);

// 6. hinterher bis Reihe 3, der Schaffner wartet beim Schlafenden
await warte();
await warte();
await warte();
await warte();
await wischeNach('rechts', 'aufstehen');
await wischeNach('hoch');
await tippeFeld(2, 3, 'Gangfeld antippen');
erwarte(soll.zustand.schaffner.y === 2 && soll.zustand.schaffner.tat === 'wartet', 'der Schaffner müsste in Reihe 2 warten');
await foto('5-reihe-zwei');

// 7. Lampe des Schlafenden schwenken: Er grüßt und geht
await tippeLampe('B', 'Lampe B');
await foto('6-gruss', 1500);
await warte();
await warte();
await warte();
erwarte(soll.zustand.schaffner.weg, 'der Schaffner müsste den Wagen verlassen haben');

// 8. zur Tür mit der Tastatur
for (const taste of ['ArrowUp', 'ArrowUp', 'ArrowUp']) {
  await seite.keyboard.press(taste);
  soll.act('hoch');
  await pruefe(`Taste ${taste}`);
}
erwarte(soll.zustand.status === 'ende', 'der Wagen müsste zu Ende sein');
await foto('7-tuer-stille', 1600);
{
  const vorher = (await gehoert()).toene.length;
  await seite.waitForTimeout(1200);
  erwarte((await gehoert()).toene.length === vorher, 'in der Stille an der Tür darf nichts Neues klingen');
}
await foto('7-abschluss', 1200);

// 9. das Protokoll: lange auf die Zuganzeige drücken
const stand = JSON.parse(await seite.evaluate(() => window.platzStand()));
erwarte(stand.karten.length === 1 && stand.karten[0].lochung === true, `eine Karte mit Lochung müsste aufgehoben sein: ${JSON.stringify(stand.karten)}`);
erwarte(stand.protokoll && stand.protokoll.tuer === soll.zustand.runde, 'das Protokoll müsste die Runde an der Tür kennen');

// 10. Neue Fahrt
const e = endeMasse(m);
await tippeAuf(mitteVon(e.knopf));
await seite.waitForTimeout(200);
const frisch = await zustand();
erwarte(frisch.status === 'faehrt' && frisch.runde === 0 && frisch.spieler.gelocht === false, 'nach "Neue Fahrt" müsste ein frischer Wagen da sein');
const anzeige = punkt(mitteVon(m.tafel));
await seite.evaluate(([x, y]) => {
  const flaeche = document.getElementById('bild');
  flaeche.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
}, [anzeige.x, anzeige.y]);
await seite.waitForTimeout(900);
await seite.evaluate(([x, y]) => {
  const flaeche = document.getElementById('bild');
  flaeche.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
}, [anzeige.x, anzeige.y]);
await foto('8-protokoll', 300);
await tippeAuf({ x: k.b / 2, y: k.h / 2 });
await seite.waitForTimeout(900);

// 11. Neu laden behält die Karten, der Wagen beginnt von vorn
await seite.reload();
await seite.waitForFunction(() => typeof window.platzZustand === 'function');
const nachLaden = JSON.parse(await seite.evaluate(() => window.platzStand()));
erwarte(nachLaden.karten.length === 1 && nachLaden.karten[0].lochung === true, 'nach dem Neuladen müsste die Karte noch da sein');
erwarte((await zustand()).runde === 0, 'nach dem Neuladen beginnt der Wagen von vorn');

// 12. ohne Speicher läuft es auch
await seite.evaluate(() => {
  const kaputt = () => {
    throw new Error('SecurityError');
  };
  Object.defineProperty(window, 'localStorage', { get: kaputt, configurable: true });
});
await tippeAuf(mitteVon(m.warten));
await seite.waitForTimeout(150);
erwarte((await zustand()).runde === 1, 'ohne Speicher müsste das Spiel weiterlaufen');

console.log(`${marke}: Engine ${motor}${oben || unten ? (sicherGesetzt ? ', Notch und Home-Balken nachgestellt' : ', Notch ließ sich nicht nachstellen') : ''}`);
console.log(`  Feldgröße ${m.s} Pixel, ${gleich} Eingaben stimmen mit dem Kern überein`);
console.log(`  Bilder in ${ordner}`);
for (const meldung of meldungen) maengel.push(`Konsole: ${meldung}`);
if (maengel.length) {
  console.log('  MÄNGEL:');
  for (const mangel of maengel) console.log(`   - ${mangel}`);
  process.exitCode = 1;
} else {
  console.log('  keine Mängel');
}
await browser.close();
