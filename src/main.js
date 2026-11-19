// Einstieg: verbindet Kern, Anzeige, Eingabe, Ton und Speicher.
// Beim Öffnen steht man sofort im ersten Wagen, die erste Eingabe ist schon ein Zug.

import { abstand } from './kern/feld.js';
import { erzeugeSpiel } from './kern/spiel.js';
import { optionenFuerFahrt } from './kern/reise.js';
import { erzeugeAnzeige } from './anzeige/anzeige.js';
import { verbindeEingabe } from './eingabe.js';
import { ladeStand, sichereStand } from './speicher.js';
import { erzeugeTon } from './ton.js';

const leinwand = document.getElementById('bild');
const anzeige = erzeugeAnzeige(leinwand);
const ton = erzeugeTon();

const stand = ladeStand(); // immer vollständig, auch wenn der Speicher leer, gelöscht oder gesperrt ist

const grobesZeigen = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
let mitTasten = !grobesZeigen;
let spiel = null;
let fahrten = 0;

// Zum Nachstellen einer Fahrt: Adresse mit #seed=Zahl
function festerSeed() {
  const fund = /[#&]seed=(\d+)/.exec(window.location.hash);
  return fund ? Number(fund[1]) : null;
}

function zeigeHinweise() {
  const g = stand.gelernt;
  anzeige.setzeHinweis({
    wischen: g.wischen ? null : mitTasten ? 'tasten' : 'wischen',
    ausweichen: !g.ausweichen,
    anrempeln: !g.anrempeln,
  });
}

function starteFahrt(jetzt) {
  const fest = festerSeed();
  const seed = fest !== null ? fest + fahrten : (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  fahrten += 1;
  // Was die neue Fahrt mitnimmt: Stärken, Fahrkarte, nach einem Tod den Begleiter (siehe kern/reise.js)
  const optionen = optionenFuerFahrt(stand, spiel ? spiel.zustand : null);
  if (optionen.fahrkarte !== stand.fahrkarte) {
    stand.fahrkarte = optionen.fahrkarte; // nach dem Halt beginnt eine neue Reise
    sichereStand(stand);
  }
  spiel = erzeugeSpiel(seed, optionen);
  anzeige.neueFahrt(spiel.zustand, jetzt);
  zeigeHinweise();
}

function merke(ereignisse) {
  const g = stand.gelernt;
  const vorher = JSON.stringify([g, stand.staerken, stand.mehrAmTisch, stand.fahrkarte]);
  for (const e of ereignisse) {
    if (e.typ === 'schritt' || e.typ === 'schlag' || e.typ === 'warten') g.wischen = true;
    if (e.typ === 'ausgewichen') g.ausweichen = true;
    if (e.typ === 'schlag') g.anrempeln = true;
    if (e.typ === 'verstanden') stand.staerken[e.staerke] = true; // dauerhaft, auch für die nächsten Fahrten
    if (e.typ === 'gegoennt') stand.mehrAmTisch = e.mehrAmTisch; // zeigt sich erst bei einer späteren Fahrt
    if (e.typ === 'gelocht' || e.typ === 'aufgehellt') stand.fahrkarte = JSON.parse(JSON.stringify(spiel.zustand.fahrkarte));
  }
  if (JSON.stringify([g, stand.staerken, stand.mehrAmTisch, stand.fahrkarte]) !== vorher) {
    sichereStand(stand);
    zeigeHinweise();
  }
}

function gibEin(aktion, quelle) {
  const jetzt = performance.now();
  ton.wecke();
  if (quelle === 'taste' && !mitTasten) {
    mitTasten = true;
    zeigeHinweise();
  }
  if (spiel.zustand.status !== 'faehrt') {
    if (aktion === 'hoch' && anzeige.karteBereit(jetzt)) starteFahrt(jetzt);
    return;
  }
  anzeige.beschleunige(jetzt);
  const ereignisse = spiel.act(aktion);
  if (!ereignisse.length) return;
  anzeige.spiele(ereignisse, jetzt);
  ton.spiele(ereignisse);
  merke(ereignisse);
}

function tippe(x, y) {
  const ziel = anzeige.wasLiegtBei(x, y);
  if (!ziel) return;
  if (ziel.art === 'weiter') {
    gibEin('hoch', 'tipp');
  } else if (ziel.art === 'ueberspringen') {
    anzeige.ueberspringe(); // der Rückblick am Halt lässt sich mit einem Tipp überspringen
  } else if (ziel.art === 'aussteigen') {
    anzeige.steigeAus(); // das Bild bleibt, nichts beginnt von selbst
  } else if (ziel.art === 'ton') {
    stand.ton = !stand.ton;
    ton.setze(stand.ton);
    ton.wecke();
    anzeige.setzeTon(stand.ton);
    sichereStand(stand);
  } else if (ziel.art === 'uhr') {
    gibEin('warten', 'tipp');
  } else if (ziel.art === 'feld') {
    const s = spiel.zustand.spieler;
    const dx = ziel.x - s.x;
    const dy = ziel.y - s.y;
    if (dx === 0 && dy === 0) gibEin('warten', 'tipp');
    else if (abstand(ziel, s) === 1) gibEin(dx === 1 ? 'rechts' : dx === -1 ? 'links' : dy === 1 ? 'runter' : 'hoch', 'tipp');
    // zwei Felder weit in gerader Linie: Sprint, wer den Drängler verstanden hat. Sonst geschieht nichts.
    else if (abstand(ziel, s) === 2 && (dx === 0 || dy === 0)) gibEin(`sprint-${dx > 0 ? 'rechts' : dx < 0 ? 'links' : dy > 0 ? 'runter' : 'hoch'}`, 'tipp');
  }
}

function schleife(jetzt) {
  anzeige.zeichne(jetzt);
  window.requestAnimationFrame(schleife);
}

// Nur beim Nachstellen mit festem Seed: Der Zustand lässt sich von außen ablesen, nicht ändern.
if (festerSeed() !== null) window.endstationZustand = () => JSON.stringify(spiel.zustand);

ton.setze(stand.ton);
anzeige.setzeTon(stand.ton);
anzeige.melder.takt = () => ton.takt();
anzeige.passeAn();
starteFahrt(performance.now());
// Manche Browser geben den Ton erst frei, wenn ein Finger losgelassen wurde, nicht schon beim Wischen.
verbindeEingabe(leinwand, { aktion: gibEin, tipp: tippe, losgelassen: () => ton.wecke(), karteOffen: () => anzeige.zeigtKarte() });
for (const anlass of ['resize', 'orientationchange', 'pageshow']) window.addEventListener(anlass, () => anzeige.passeAn());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => anzeige.passeAn());
window.requestAnimationFrame(schleife);
