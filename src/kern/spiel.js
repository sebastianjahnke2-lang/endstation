// Der Spielkern. Kennt weder Bildschirm noch Browser.
//
//   const spiel = erzeugeSpiel(seed);
//   const ereignisse = spiel.act('hoch');   // 'hoch' | 'rechts' | 'runter' | 'links' | 'warten'
//
// act() ändert spiel.zustand und gibt zurück, was dabei passiert ist.
// Jedes Ereignis trägt eine Phase: 0 Spieler, 1 Angriffe treffen ein, 2 Gegner bewegen sich.
// Eine ungültige Eingabe ändert nichts und kostet keinen Zug.

import { RICHTUNG, STARTFELD, TUERFELD, imFeld } from './feld.js';
import { istHindernis, gegnerAuf, istMarkiert, tuerFrei } from './lage.js';
import { WAGENZAHL, baueWagen } from './wagen.js';
import { neuerGegner, loeseAnsagenEin, planeGegner, schadenVon } from './gegner.js';

export const HERZEN_VOLL = 5;
export const RUHE_VOLL = 3;
export const SCHADEN_SPIELER = 1;
export const AUFBRECHEN_STOESSE = 3; // so oft gegen die geschlossene Tür laufen, dann gibt sie nach
export const AUFBRECHEN_KOSTET = 1; // Herzen

function richteWagenEin(z) {
  const wagen = baueWagen(z.wagenNr, z);
  z.wagen = { nr: wagen.nr, art: wagen.art, plan: wagen.plan, gespiegelt: wagen.gespiegelt };
  z.gegner = wagen.gegner.map((vorgabe) => neuerGegner(z.naechsteId++, vorgabe));
  z.wagen.mitKontrolleur = z.gegner.some((g) => g.typ === 'kontrolleur');
  z.spieler.x = STARTFELD.x;
  z.spieler.y = STARTFELD.y;
  z.tuerOffen = z.gegner.length === 0;
  z.tuerStoesse = 0;
  z.aufgebrochen = false;
  z.zuegeImWagen = 0;
}

function oeffneTuer(z, ereignisse, phase) {
  if (z.tuerOffen || !tuerFrei(z)) return;
  z.tuerOffen = true;
  ereignisse.push({ typ: 'tuerAuf', phase });
}

function stirb(z, ereignisse, phase, durch) {
  z.status = 'tot';
  ereignisse.push({ typ: 'tod', phase, wagenNr: z.wagenNr, durch, uebrig: z.gegner.length });
}

function wechsleWagen(z) {
  z.zug += 1;
  z.zaehler.schritte += 1;
  z.zaehler.wagen += 1;
  if (z.wagenNr + 1 >= WAGENZAHL) {
    z.status = 'halt';
    return [{ typ: 'halt', phase: 0 }];
  }
  z.wagenNr += 1;
  richteWagenEin(z);
  return [{ typ: 'wagenwechsel', phase: 0, nr: z.wagenNr }];
}

function fuehreAus(z, aktion) {
  if (z.status !== 'faehrt') return [];
  const s = z.spieler;
  const ereignisse = [];
  const startRot = istMarkiert(z, s.x, s.y);
  let zielRot = false;
  let bewegt = false;
  let tat = { art: 'warten' }; // was der Spieler getan hat, für den Kontrolleur

  // Phase 0: der Spieler
  if (aktion === 'warten') {
    ereignisse.push({ typ: 'warten', phase: 0 });
    z.zaehler.gewartet += 1;
  } else {
    const r = RICHTUNG[aktion];
    if (!r) return [];
    const x = s.x + r.x;
    const y = s.y + r.y;
    const anDerTuer = aktion === 'hoch' && s.x === TUERFELD.x && s.y === TUERFELD.y;
    if (anDerTuer && z.tuerOffen) return wechsleWagen(z);
    if (!anDerTuer && (!imFeld(x, y) || istHindernis(z, x, y))) return [{ typ: 'ungueltig', phase: 0, richtung: aktion, tuer: false }];
    const g = anDerTuer ? null : gegnerAuf(z, x, y);
    if (anDerTuer) {
      // Aufbrechen: Jede Tür gibt nach dreimal Dagegenlaufen nach und kostet ein Herz.
      tat = { art: 'stoss' };
      z.tuerStoesse += 1;
      ereignisse.push({ typ: 'tuerStoss', phase: 0, n: z.tuerStoesse });
      if (z.tuerStoesse >= AUFBRECHEN_STOESSE) {
        z.tuerOffen = true;
        z.aufgebrochen = true;
        s.herzen = Math.max(0, s.herzen - AUFBRECHEN_KOSTET);
        z.zaehler.aufgebrochen += 1;
        ereignisse.push({ typ: 'aufgebrochen', phase: 0, herzen: s.herzen });
        ereignisse.push({ typ: 'tuerAuf', phase: 0 });
        if (s.herzen <= 0) {
          z.zug += 1;
          z.zuegeImWagen += 1;
          stirb(z, ereignisse, 0, 'tuer');
          return ereignisse;
        }
      }
    } else if (g) {
      tat = { art: 'schlag', id: g.id };
      g.hp -= SCHADEN_SPIELER;
      const besiegt = g.hp <= 0;
      ereignisse.push({ typ: 'schlag', phase: 0, id: g.id, gegner: g.typ, richtung: aktion, x, y, hp: Math.max(0, g.hp), besiegt });
      z.zaehler.schlaege += 1;
      if (besiegt) {
        z.gegner.splice(z.gegner.indexOf(g), 1); // seine Ansage verfällt mit ihm
        z.zaehler.besiegt += 1;
        oeffneTuer(z, ereignisse, 0);
      }
    } else {
      tat = { art: 'schritt', von: { x: s.x, y: s.y } };
      zielRot = istMarkiert(z, x, y);
      ereignisse.push({ typ: 'schritt', phase: 0, richtung: aktion, von: { x: s.x, y: s.y }, nach: { x, y } });
      s.x = x;
      s.y = y;
      bewegt = true;
      z.zaehler.schritte += 1;
    }
  }
  z.zug += 1;
  z.zuegeImWagen += 1;

  // Phase 1: angekündigte Angriffe treffen ein
  const { treffer, dran } = loeseAnsagenEin(z, ereignisse);
  if (treffer) {
    // höchstens ein Treffer je Zug, egal wie viele treffen. Er kostet ein Herz, beim Kontrolleur zwei.
    const schaden = schadenVon(treffer);
    s.herzen = Math.max(0, s.herzen - schaden);
    s.ruhe = 0;
    z.zaehler.treffer += 1;
    ereignisse.push({ typ: 'treffer', phase: 1, herzen: s.herzen, durch: treffer.typ, schaden });
    if (s.herzen <= 0) {
      stirb(z, ereignisse, 1, treffer.typ);
      return ereignisse;
    }
  } else if (startRot && bewegt && !zielRot) {
    z.zaehler.ausgewichen += 1;
    if (s.ruhe < RUHE_VOLL) s.ruhe += 1;
    ereignisse.push({ typ: 'ausgewichen', phase: 1, ruhe: s.ruhe });
  }

  // Phase 2: Gegner bewegen sich oder kündigen an
  planeGegner(z, dran, ereignisse, tat);
  oeffneTuer(z, ereignisse, 2); // der Kontrolleur kann gegangen sein
  return ereignisse;
}

export function erzeugeSpiel(seed, optionen = {}) {
  const z = {
    seed: seed >>> 0,
    zufall: seed >>> 0,
    status: 'faehrt', // 'faehrt' | 'tot' | 'halt'
    wagenNr: optionen.startWagen || 0,
    wagen: null,
    spieler: { x: STARTFELD.x, y: STARTFELD.y, herzen: HERZEN_VOLL, ruhe: 0 },
    gegner: [],
    tuerOffen: false,
    zug: 0,
    zuegeImWagen: 0,
    naechsteId: 1,
    zaehler: { schritte: 0, schlaege: 0, gewartet: 0, ausgewichen: 0, treffer: 0, besiegt: 0, wagen: 0, aufgebrochen: 0 },
  };
  richteWagenEin(z);
  return { zustand: z, act: (aktion) => fuehreAus(z, aktion) };
}
