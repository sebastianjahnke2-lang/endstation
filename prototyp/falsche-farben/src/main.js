// Einstieg des Prototyps "Falsche Farben": verbindet Kern, Bühne, Eingabe und Ton.
// Kein Menü: Beim Öffnen sitzt man sofort im Saal, der erste Gast steht an der Tür.
// Gemerkt wird nichts. Am Ende startet ein Tipp sofort den nächsten Abend, nie das Spiel von selbst.

import { erzeugeAbend } from './kern/abend.js';
import { schlussSatz } from './kern/schluss.js';
import { schlussText } from './texte.js';
import { erzeugeSaalBuehne } from './anzeige/buehne.js';
import { erzeugeSaalTon } from './ton.js';
import { verbindeEingabe } from '../../../src/eingabe.js';

const leinwand = document.getElementById('bild');
const buehne = erzeugeSaalBuehne(leinwand);
const ton = erzeugeSaalTon();
const fest = /[#&]seed=(\d+)/.exec(window.location.hash);
let naechsterSeed = fest ? Number(fest[1]) : zufallsSeed();
let abend = null;
let tonAn = true;
let wartet = null; // ein Tipp, der während einer Pause kam: Er wird danach ausgeführt, nicht verworfen

function zufallsSeed() {
  try {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
  } catch (fehler) {
    return Math.floor(performance.now() * 1000) >>> 0;
  }
}

function neuerAbend() {
  abend = erzeugeAbend(naechsterSeed);
  naechsterSeed = (naechsterSeed + 0x9e3779b9) >>> 0; // der nächste Abend ist ein anderer, mit Seed immer derselbe
  buehne.neu(abend.zustand);
  ton.schicht(0);
}

function tippe(x, y) {
  const jetzt = performance.now();
  ton.wecke();
  if (!buehne.bereit(jetzt)) {
    if (!wartet) window.setTimeout(holeNach, Math.max(0, buehne.pauseBis() - jetzt) + 1);
    wartet = { x, y };
    return;
  }
  const was = buehne.tippe(x, y, jetzt);
  if (!was) return;
  if (was.ton) {
    tonAn = !tonAn;
    ton.setze(tonAn);
    buehne.setzeTon(tonAn);
    return;
  }
  if (was.neu) {
    neuerAbend();
    return;
  }
  const ereignisse = abend.act(was);
  for (const e of ereignisse) if (e.typ === 'ende') e.satz = schlussText(schlussSatz(abend.zustand));
  buehne.spiele(ereignisse, jetzt);
}

function holeNach() {
  const t = wartet;
  wartet = null;
  if (t) tippe(t.x, t.y);
}

function schleife(jetzt) {
  window.requestAnimationFrame(schleife);
  buehne.zeichne(jetzt);
}

// Nur für die Prüfwerkzeuge: Mit #probe lässt sich der Zustand von außen ablesen, nicht ändern.
if (/[#&]probe\b/.test(window.location.hash)) {
  window.saalZustand = () => JSON.stringify(abend.zustand);
  window.saalMasse = () => JSON.stringify(buehne.masse());
  window.saalAuswahl = () => buehne.auswahl();
  window.saalVerhoer = () => buehne.verhoerAn();
  window.saalSatzSteht = () => buehne.schlussSteht(performance.now());
}

buehne.melder.klang = (name) => ton.spiele(name);
buehne.melder.schicht = (n) => ton.schicht(n);
buehne.passeAn();
neuerAbend();
verbindeEingabe(leinwand, {
  aktion: () => {},
  tipp: tippe,
  losgelassen: () => ton.wecke(),
  karteOffen: () => false,
  beruehrt: () => ton.wecke(),
  finger: () => {},
});
for (const anlass of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(anlass, () => buehne.passeAn());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => buehne.passeAn());
window.requestAnimationFrame(schleife);
