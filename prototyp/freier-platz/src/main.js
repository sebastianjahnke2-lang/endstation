// Einstieg des Prototyps "Der freie Platz": verbindet Kern, Bühne, Eingabe, Ton und Speicher.
// Beim Öffnen sitzt man sofort im Wagen. Wird die Seite neu geladen, beginnt der Wagen von vorn.

import { erzeugeFahrt } from './kern/fahrt.js';
import { erzeugeBuehne } from './anzeige/buehne.js';
import { verbindeEingabe } from '../../../src/eingabe.js';
import { ladePlatzStand, sicherePlatzStand, legeKarteAb } from './speicher.js';
import { leeresProtokoll, schreibeMit, protokollZeilen } from './protokoll.js';
import { tatsachenZeilen } from './texte.js';
import { erzeugePlatzTon } from './ton.js';

const ANSTOSS_SPERRE = 320; // nach dem Anstoßen wird so lange keine Eingabe angenommen und keine vorgemerkt
const LANGER_DRUCK = 650; // so lange auf die Zuganzeige drücken öffnet das Testprotokoll

const leinwand = document.getElementById('bild');
const buehne = erzeugeBuehne(leinwand);
const klang = erzeugePlatzTon();
const stand = ladePlatzStand(); // immer vollständig, auch wenn der Speicher leer, gelöscht oder gesperrt ist

let fahrt = null;
let gesperrtBis = 0;
let loslassenSchlucken = false; // das Loslassen nach dem langen Druck schließt das Protokoll nicht gleich wieder
let druck = null; // der Finger, der gerade auf der Zuganzeige liegt
let letzteTaste = null; // nur die Eingabetaste beginnt nach der Tür eine neue Fahrt, gehalten nicht
let protokollBeginnt = true; // die erste Eingabe einer Fahrt beginnt ein neues Protokoll

function beginneFahrt() {
  fahrt = erzeugeFahrt();
  protokollBeginnt = true;
  buehne.neueFahrt(fahrt.zustand);
}

function gibEin(handlung, quelle) {
  const jetzt = performance.now();
  klang.wecke();
  if (buehne.zeigtProtokoll()) {
    buehne.zeigeProtokoll(null);
    return;
  }
  if (fahrt.zustand.status !== 'faehrt') {
    // Das Spiel startet nie von selbst die nächste Fahrt. Am Rechner geht es auch mit der Eingabetaste,
    // aber nicht mit Pfeil hoch oder W und nicht mit einer gehaltenen Taste.
    if (quelle === 'taste' && letzteTaste === 'Enter' && buehne.endeBereit(jetzt)) beginneFahrt();
    return;
  }
  if (jetzt < gesperrtBis) return;
  buehne.beschleunige(jetzt);
  const ereignisse = fahrt.act(handlung);
  if (!ereignisse.length) return;
  buehne.spiele(ereignisse, fahrt.zustand, jetzt);
  if (ereignisse[0].typ === 'anstoss') gesperrtBis = jetzt + ANSTOSS_SPERRE;

  // Testprotokoll der Fahrt, nach jeder Eingabe gesichert: So bleibt auch eine abgebrochene Fahrt lesbar.
  if (protokollBeginnt || !stand.protokoll) stand.protokoll = leeresProtokoll();
  protokollBeginnt = false;
  schreibeMit(stand.protokoll, ereignisse, fahrt.zustand);
  if (fahrt.zustand.status === 'ende') {
    legeKarteAb(stand, { lochung: fahrt.zustand.spieler.gelocht, zeilen: tatsachenZeilen(fahrt.zustand.tatsachen) });
  }
  sicherePlatzStand(stand); // scheitert das, läuft das Spiel ohne Speichern weiter
}

function tippe(x, y) {
  const jetzt = performance.now();
  if (loslassenSchlucken) {
    loslassenSchlucken = false;
    return;
  }
  const ziel = buehne.wasLiegtBei(x, y);
  if (!ziel) return;
  if (ziel.art === 'protokoll') {
    buehne.zeigeProtokoll(null);
  } else if (ziel.art === 'neueFahrt') {
    if (!buehne.endeBereit(jetzt)) return;
    buehne.drueckeNeueFahrt(jetzt);
    klang.wecke();
    beginneFahrt();
  } else if (ziel.art === 'ton') {
    stand.ton = !stand.ton;
    klang.setze(stand.ton);
    klang.wecke();
    buehne.setzeTon(stand.ton);
    sicherePlatzStand(stand);
  } else if (ziel.art === 'warten') {
    gibEin('warten', 'tipp');
  } else if (ziel.art === 'karte') {
    buehne.stupseKarte(jetzt);
  } else if (ziel.art === 'lampe') {
    gibEin({ tipp: 'lampe', name: ziel.name }, 'tipp');
  } else if (ziel.art === 'feld') {
    gibEin({ tipp: 'feld', x: ziel.x, y: ziel.y }, 'tipp');
  }
}

// Langes Drücken auf die Zuganzeige zeigt dem Auftraggeber das Protokoll der letzten Fahrt.
function oeffneProtokoll() {
  druck = null;
  loslassenSchlucken = true; // egal wie lange der Finger noch liegt: Erst der nächste Tipp schließt es
  buehne.zeigeProtokoll(protokollZeilen(stand.protokoll, stand.karten, buehne.protokollBreite()));
}

function beendeDruck() {
  if (druck) window.clearTimeout(druck.wecker);
  druck = null;
}

leinwand.addEventListener('pointerdown', (e) => {
  beendeDruck();
  loslassenSchlucken = false; // ein neuer Finger: Das alte Loslassen ist vorbei
  const kasten = leinwand.getBoundingClientRect();
  if (buehne.zeigtProtokoll() || !buehne.aufAnzeige(e.clientX - kasten.left, e.clientY - kasten.top)) return;
  druck = { id: e.pointerId, x: e.clientX, y: e.clientY, wecker: window.setTimeout(oeffneProtokoll, LANGER_DRUCK) };
});
leinwand.addEventListener('pointermove', (e) => {
  if (druck && e.pointerId === druck.id && Math.hypot(e.clientX - druck.x, e.clientY - druck.y) > 9) beendeDruck();
});
leinwand.addEventListener('pointerup', beendeDruck);
leinwand.addEventListener('pointercancel', beendeDruck);

function schleife(jetzt) {
  // erst das nächste Bild bestellen: Ein Fehler beim Zeichnen hält dann nicht das ganze Spiel an
  window.requestAnimationFrame(schleife);
  buehne.zeichne(jetzt);
}

// Nur für die Prüfwerkzeuge: Mit #probe an der Adresse lässt sich der Zustand von außen ablesen, nicht ändern.
if (/[#&]probe\b/.test(window.location.hash)) {
  window.platzZustand = () => JSON.stringify(fahrt.zustand);
  window.platzStand = () => JSON.stringify(stand);
}

klang.setze(stand.ton);
buehne.setzeTon(stand.ton);
buehne.melder.klang = (name) => klang.spiele(name);
buehne.passeAn();
beginneFahrt();
// Vor der Eingabe angemeldet, damit gibEin() weiß, welche Taste es war.
window.addEventListener('keydown', (e) => {
  letzteTaste = e.repeat ? null : e.code;
});
// Manche Browser geben den Ton erst frei, wenn ein Finger losgelassen wurde, nicht schon beim Wischen.
verbindeEingabe(leinwand, { aktion: gibEin, tipp: tippe, losgelassen: () => klang.wecke(), karteOffen: () => buehne.zeigtEnde() });
for (const anlass of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(anlass, () => buehne.passeAn());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => buehne.passeAn());
window.requestAnimationFrame(schleife);
