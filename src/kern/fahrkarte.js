// Die Fahrkarte: sechs Prüfungen aus dem Bahnalltag und Platz für Sonder-Lochungen.
// Kennt weder Bildschirm noch Browser.
//
// Eine Lochung ist hell oder dunkel:
//   { art: 'pruefung', id, hell: true }            eine erfüllte Prüfung
//   { art: 'tod', durch, hell: false }             ein Tod; wird hell, wenn man es einmal anders macht
//   { art: 'ehrlich', durch, hell: true }          die ehrliche Antwort an den Begleiter, je Ursache eine
//
// Angebot: In jedem Wagen außer dem sicheren leuchtet ein Symbol auf einem Feld. Drauftreten heißt
// annehmen. Die Prüfung gilt bis zum Verlassen des Wagens, dann wird ausgewertet. Vorbeigehen kostet nichts,
// eine nicht erfüllte Prüfung auch nicht.

import { BREITE, HOEHE, STARTFELD, TUERFELD, abstand } from './feld.js';
import { istHindernis, gegnerAuf } from './lage.js';
import { wuerfle } from './zufall.js';
import { WAGENPLAENE } from './wagen.js';

const WAGENARTEN = WAGENPLAENE.map((w) => w.art);
// der Ort einer Lochung, für den Rückblick am Halt
function ort(l, roh) {
  if (roh && WAGENARTEN.includes(roh.wagen)) l.wagen = roh.wagen;
  return l;
}

// Reihenfolge wie auf der Karte. Die Worte stehen in texte.js unter "pruefung".
//   aufregen     Nicht aufregen          kein Schlag
//   aussteigen   Erst aussteigen lassen  drei Züge hintereinander stillstehen
//   rempeln      Ohne Rempeln            kein Treffer
//   draengeln    Nicht drängeln          nie auf ein rotes Feld treten
//   puenktlich   Pünktlich               den Wagen in höchstens zwölf Zügen verlassen
//   ruhe         Ruhe bewahren           volle Ruhe erreichen
export const PRUEFUNGEN = ['aufregen', 'aussteigen', 'rempeln', 'draengeln', 'puenktlich', 'ruhe'];
export const AUSSTEIGEN_ZUEGE = 3;
export const PUENKTLICH_ZUEGE = 12;
export const HALT_VERLANGT = 3; // so viele helle Lochungen verlangt der Schaffner am Halt
const TODESARTEN = ['pendler', 'gruppe', 'draengler', 'kontrolleur', 'tuer'];
const SONDER_HOECHSTENS = 6;
// Einführung: Solange die Fahrkarte keine Prüfung trägt, liegt das erste Angebot in Wagen 1 auf dem Feld
// vor der Tür. Daran kommt niemand vorbei, und dort ist der Wagen schon ruhig. "Erst aussteigen lassen"
// passt an die Tür und verlangt nur dreimal Stehen, das ist dort ohne Gefahr zu schaffen.
export const EINFUEHRUNG = 'aussteigen';

export function neueFahrkarte() {
  return { lochungen: [] };
}

// Nimmt nur, was die erwartete Form hat. Für Optionen des Kerns und für den Speicher.
export function bereinigeFahrkarte(roh) {
  const karte = neueFahrkarte();
  if (!roh || typeof roh !== 'object' || !Array.isArray(roh.lochungen)) return karte;
  for (const l of roh.lochungen) {
    if (!l || typeof l !== 'object') continue;
    if (l.art === 'pruefung' && PRUEFUNGEN.includes(l.id) && !istGelocht(karte, l.id)) {
      karte.lochungen.push(ort({ art: 'pruefung', id: l.id, hell: true }, l));
    } else if (l.art === 'tod' && TODESARTEN.includes(l.durch) && karte.lochungen.filter((x) => x.art === 'tod').length < SONDER_HOECHSTENS) {
      karte.lochungen.push(ort({ art: 'tod', durch: l.durch, hell: l.hell === true }, l));
    } else if (l.art === 'ehrlich' && TODESARTEN.includes(l.durch) && !karte.lochungen.some((x) => x.art === 'ehrlich' && x.durch === l.durch)) {
      karte.lochungen.push(ort({ art: 'ehrlich', durch: l.durch, hell: true }, l));
    }
  }
  return karte;
}

export function istGelocht(karte, id) {
  return karte.lochungen.some((l) => l.art === 'pruefung' && l.id === id);
}

export function helleLochungen(karte) {
  return karte.lochungen.filter((l) => l.hell).length;
}

// Beim Einrichten eines Wagens: eine noch nicht gelochte Prüfung auf ein freies Feld legen.
// Die Angebote würfeln mit eigenem Zufall (z.kartenzufall), damit derselbe Seed dieselben Wagen ergibt
// wie ohne Fahrkarte.
export function stelleAngebot(z) {
  z.angebot = null;
  z.pruefung = null;
  if (z.wagen.sicher) return;
  const offen = PRUEFUNGEN.filter((id) => !istGelocht(z.fahrkarte, id));
  if (!offen.length) return;
  const felder = [];
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      if (istHindernis(z, x, y) || gegnerAuf(z, x, y)) continue;
      if (abstand({ x, y }, STARTFELD) < 2 || (x === TUERFELD.x && y === TUERFELD.y)) continue;
      felder.push({ x, y });
    }
  }
  if (!felder.length) return;
  const id = offen[wuerfle(z.kartenzufall, offen.length)];
  const feld = felder[wuerfle(z.kartenzufall, felder.length)];
  z.angebot = { id, x: feld.x, y: feld.y };
  // gewürfelt wird trotzdem, damit die Angebote der späteren Wagen dieselben bleiben
  if (istEinfuehrung(z)) z.angebot = { id: EINFUEHRUNG, x: TUERFELD.x, y: TUERFELD.y };
}

// Gilt beim Einrichten von Wagen 1, solange noch keine Prüfung gelocht ist.
export function istEinfuehrung(z) {
  return z.wagenNr === 0 && !z.fahrkarte.lochungen.some((l) => l.art === 'pruefung');
}

// Der Spieler ist auf das Feld des Angebots getreten.
export function nimmAn(z, ereignisse) {
  const a = z.angebot;
  if (!a || z.spieler.x !== a.x || z.spieler.y !== a.y) return;
  z.angebot = null;
  z.pruefung = { id: a.id, start: z.zuegeImWagen, still: 0, langesStill: 0, schlag: false, treffer: false, rot: false, ruhe: z.spieler.ruhe >= 3 };
  ereignisse.push({ typ: 'angenommen', phase: 0, id: a.id });
}

// Nach jedem Zug: was für die laufende Prüfung zählt. tat wie im Kern, getroffen: wurde der Spieler getroffen.
export function beobachte(z, tat, getroffen, aufRot) {
  const p = z.pruefung;
  if (!p) return;
  if (tat.art === 'schlag' || tat.sprintTreffer) p.schlag = true;
  if (getroffen) p.treffer = true;
  if (aufRot) p.rot = true;
  p.still = tat.art === 'warten' ? p.still + 1 : 0;
  p.langesStill = Math.max(p.langesStill, p.still);
  if (z.spieler.ruhe >= 3) p.ruhe = true;
}

function erfuellt(z, p) {
  if (p.id === 'aufregen') return !p.schlag;
  if (p.id === 'aussteigen') return p.langesStill >= AUSSTEIGEN_ZUEGE;
  if (p.id === 'rempeln') return !p.treffer;
  if (p.id === 'draengeln') return !p.rot;
  if (p.id === 'puenktlich') return z.zuegeImWagen - p.start <= PUENKTLICH_ZUEGE;
  if (p.id === 'ruhe') return p.ruhe;
  return false;
}

// Beim Verlassen eines Wagens: die laufende Prüfung auswerten und dunkle Lochungen aufhellen,
// wenn man es in diesem Wagen anders gemacht hat.
export function werteWagenAus(z, ereignisse, phase) {
  const p = z.pruefung;
  if (p && erfuellt(z, p) && !istGelocht(z.fahrkarte, p.id)) {
    z.fahrkarte.lochungen.push({ art: 'pruefung', id: p.id, hell: true, wagen: z.wagen.art });
    ereignisse.push({ typ: 'gelocht', phase, art: 'pruefung', id: p.id, hell: true });
  }
  z.pruefung = null;
  for (const l of z.fahrkarte.lochungen) {
    if (l.art !== 'tod' || l.hell) continue;
    const anders = l.durch === 'tuer' ? !z.aufgebrochen : z.wagen.typen.includes(l.durch) && !z.getroffenVon.includes(l.durch);
    if (anders) {
      l.hell = true;
      ereignisse.push({ typ: 'aufgehellt', phase, durch: l.durch });
    }
  }
}

// Ein Tod hinterlässt eine dunkle Lochung, je Ursache höchstens eine, solange sie dunkel ist.
export function lochungFuerTod(z, durch, ereignisse, phase) {
  const karte = z.fahrkarte;
  if (karte.lochungen.some((l) => l.art === 'tod' && l.durch === durch && !l.hell)) return;
  if (karte.lochungen.filter((l) => l.art === 'tod').length >= SONDER_HOECHSTENS) return;
  karte.lochungen.push({ art: 'tod', durch, hell: false, wagen: z.wagen.art });
  ereignisse.push({ typ: 'gelocht', phase, art: 'tod', durch, hell: false });
}
