// Einstieg des Prototyps "Kontrolle": verbindet Kern, Bühne, Eingabe und Ton.
// Kein Menü, kein Speicher: Beim Öffnen steht man sofort unten im Gang. Neu laden beginnt von vorn.

import { erzeugeKontrolle } from './kern/durchgang.js';
import { erzeugeKontrollBuehne } from './anzeige/buehne.js';
import { verbindeEingabe } from '../../../src/eingabe.js';
import { erzeugeKontrollTon } from './ton.js';

const leinwand = document.getElementById('bild');
const buehne = erzeugeKontrollBuehne(leinwand);
const ton = erzeugeKontrollTon();
// Der Seed bestimmt nur, welche Sitzordnungen ein Neustart auslost. Der erste Durchgang ist immer gleich.
// Mit #seed=Zahl an der Adresse ist auch jeder Neustart gleich (für die Prüfwerkzeuge).
function seedFuerNeustart() {
  const fest = /[#&]seed=(\d+)/.exec(window.location.hash);
  if (fest) return Number(fest[1]);
  try {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
  } catch (fehler) {
    return Math.floor(performance.now() * 1000) >>> 0;
  }
}
const spiel = erzeugeKontrolle(seedFuerNeustart());
let tonAn = true;

function gibEin(handlung) {
  const jetzt = performance.now();
  ton.wecke();
  if (!buehne.beschleunige(jetzt)) return; // das Bild hält gerade an
  // nach dem Halt führt jede Eingabe weiter: zum nächsten Halt, zum Schluss, oder neu
  const ereignisse = spiel.act(spiel.zustand.status === 'faehrt' ? handlung : 'weiter');
  if (ereignisse.length) buehne.spiele(ereignisse, spiel.zustand, jetzt);
}

function tippe(x, y) {
  const ziel = buehne.wasLiegtBei(x, y);
  if (ziel.art === 'ton') {
    tonAn = !tonAn;
    ton.setze(tonAn);
    ton.wecke();
    buehne.setzeTon(tonAn);
  } else if (ziel.art === 'warten') {
    gibEin('warten');
  } else if (ziel.art === 'feld') {
    gibEin({ tipp: 'feld', x: ziel.x, y: ziel.y });
  } else if (spiel.zustand.status !== 'faehrt') {
    gibEin('weiter');
  }
}

function schleife(jetzt) {
  window.requestAnimationFrame(schleife);
  buehne.zeichne(jetzt);
}

// Nur für die Prüfwerkzeuge: Mit #probe lässt sich der Zustand von außen ablesen, nicht ändern.
if (/[#&]probe\b/.test(window.location.hash)) window.kontrollZustand = () => JSON.stringify(spiel.zustand);

buehne.melder.klang = (name) => ton.spiele(name);
buehne.passeAn();
buehne.neu(spiel.zustand);
verbindeEingabe(leinwand, { aktion: (name) => gibEin(name), tipp: tippe, losgelassen: () => ton.wecke(), karteOffen: () => spiel.zustand.status !== 'faehrt' });
for (const anlass of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(anlass, () => buehne.passeAn());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => buehne.passeAn());
window.requestAnimationFrame(schleife);
