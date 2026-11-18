// Verhalten der Fahrgäste. Jede Figur folgt festen Regeln ohne Zufall,
// damit man sie durchschauen kann.
//
// Ablauf eines Gegnerzugs:
//   1. Alle angekündigten Angriffe treffen ein (loeseAnsagenEin).
//   2. Wer nicht angegriffen hat, bewegt sich oder kündigt an (planeGegner).
// Ein Angriff trifft also immer genau einen Zug nach seiner Ankündigung.

import { BREITE, HOEHE, RICHTUNG, RICHTUNGSNAMEN, imFeld, feldNr, abstand, entfernungen, naechsterSchritt } from './feld.js';
import { istHindernis, gegnerAuf, spielerAuf, istFrei, istVorderster } from './lage.js';

export const GEGNERWERTE = {
  pendler: { hp: 2 },
  gruppe: { hp: 1, schritte: 2 },
  draengler: { hp: 3, erschoepfung: 1 },
};

export function neuerGegner(id, vorgabe) {
  const g = { id, typ: vorgabe.typ, x: vorgabe.x, y: vorgabe.y, hp: GEGNERWERTE[vorgabe.typ].hp, ansage: null };
  if (g.typ === 'pendler') {
    g.langsam = vorgabe.langsam === true;
    g.pause = 0;
  } else if (g.typ === 'gruppe') {
    g.gruppe = vorgabe.gruppe;
    g.rang = vorgabe.rang;
  } else if (g.typ === 'draengler') {
    g.erschoepft = 0;
  }
  return g;
}

function kopie(f) {
  return { x: f.x, y: f.y };
}

// Felder, die für eine Figur begehbar sind: kein Hindernis, keine andere Figur.
function begehbarFuer(z, g) {
  return (x, y) => !istHindernis(z, x, y) && !spielerAuf(z, x, y) && (gegnerAuf(z, x, y) || g) === g;
}

// Die Figur läuft die angekündigten Felder ab, bis jemand im Weg steht.
// Steht der Spieler im Weg, wird er getroffen, und die Figur bleibt davor stehen.
function stosseVor(z, g, ereignisse) {
  const von = kopie(g);
  const weg = [];
  let trifft = false;
  for (const f of g.ansage) {
    if (spielerAuf(z, f.x, f.y)) {
      trifft = true;
      break;
    }
    if (!istFrei(z, f.x, f.y)) break;
    g.x = f.x;
    g.y = f.y;
    weg.push(kopie(f));
  }
  ereignisse.push({ typ: 'vorstoss', phase: 1, id: g.id, gegner: g.typ, von, weg, felder: g.ansage.map(kopie), trifft });
  return trifft;
}

// Mitglieder einer Reisegruppe rücken zu ihrem Vordermann auf, bis zu zwei Schritte.
function rueckeAuf(z, ereignisse) {
  const mitglieder = z.gegner.filter((g) => g.typ === 'gruppe').sort((a, b) => a.gruppe - b.gruppe || a.rang - b.rang);
  let vordermann = null;
  for (const g of mitglieder) {
    if (!vordermann || vordermann.gruppe !== g.gruppe) {
      vordermann = g; // der Vorderste läuft nur über seine Ansage
      continue;
    }
    const von = kopie(g);
    const weg = [];
    for (let i = 0; i < GEGNERWERTE.gruppe.schritte && abstand(g, vordermann) > 1; i++) {
      const weit = entfernungen(vordermann, begehbarFuer(z, g));
      const schritt = naechsterSchritt(g, weit, vordermann);
      if (!schritt || !istFrei(z, schritt.x, schritt.y)) break;
      g.x = schritt.x;
      g.y = schritt.y;
      weg.push(kopie(schritt));
    }
    if (weg.length) ereignisse.push({ typ: 'folgen', phase: 1, id: g.id, von, weg });
    vordermann = g;
  }
}

// Schritt 1: Angekündigte Angriffe treffen ein. Gibt zurück, wer den Spieler getroffen hat.
export function loeseAnsagenEin(z, ereignisse) {
  let treffer = null;
  const dran = new Set();
  for (const g of [...z.gegner]) {
    if (!g.ansage) continue;
    dran.add(g.id);
    let trifft = false;
    if (g.typ === 'pendler') {
      trifft = g.ansage.some((f) => spielerAuf(z, f.x, f.y));
      ereignisse.push({ typ: 'hieb', phase: 1, id: g.id, felder: g.ansage.map(kopie), trifft });
      if (g.langsam) g.pause = 1;
    } else {
      trifft = stosseVor(z, g, ereignisse);
      if (g.typ === 'draengler') g.erschoepft = GEGNERWERTE.draengler.erschoepfung;
    }
    g.ansage = null;
    if (trifft && !treffer) treffer = g;
  }
  rueckeAuf(z, ereignisse);
  return { treffer, dran };
}

function sagAn(g, felder, ereignisse) {
  if (!felder.length) return;
  g.ansage = felder.map(kopie);
  ereignisse.push({ typ: 'ansage', phase: 2, id: g.id, gegner: g.typ, felder: felder.map(kopie) });
}

function geheEinenSchritt(z, g, schritt, ereignisse) {
  if (!schritt || !istFrei(z, schritt.x, schritt.y)) return false;
  const von = kopie(g);
  g.x = schritt.x;
  g.y = schritt.y;
  ereignisse.push({ typ: 'gegnerSchritt', phase: 2, id: g.id, von, nach: kopie(g) });
  return true;
}

// Schritt Richtung Spieler. Erst um andere Figuren herum, sonst hinter ihnen her.
function schrittZumSpieler(z, g) {
  const s = z.spieler;
  let weit = entfernungen(s, begehbarFuer(z, g));
  if (weit[feldNr(g.x, g.y)] < 0) weit = entfernungen(s, (x, y) => !istHindernis(z, x, y));
  return naechsterSchritt(g, weit, s);
}

function planePendler(z, g, ereignisse) {
  if (g.pause > 0) {
    g.pause -= 1;
    return;
  }
  if (abstand(g, z.spieler) === 1) {
    sagAn(g, [z.spieler], ereignisse);
    return;
  }
  if (geheEinenSchritt(z, g, schrittZumSpieler(z, g), ereignisse) && g.langsam) g.pause = 1;
}

// Der Vorderste kündigt die nächsten zwei Felder seines Wegs zum Spieler an.
function planeVordersten(z, g, ereignisse) {
  const s = z.spieler;
  const weit = entfernungen(s, begehbarFuer(z, g));
  const felder = [];
  let hier = kopie(g);
  for (let i = 0; i < GEGNERWERTE.gruppe.schritte; i++) {
    const schritt = naechsterSchritt(hier, weit, s);
    if (!schritt) break;
    felder.push(kopie(schritt));
    hier = schritt;
  }
  sagAn(g, felder, ereignisse);
}

// Freie Sicht in gerader Linie vom Drängler zum Spieler? Gibt die Richtung zurück.
function sichtlinie(z, von, nach) {
  if (von.x !== nach.x && von.y !== nach.y) return null;
  if (von.x === nach.x && von.y === nach.y) return null;
  const name = von.x === nach.x ? (nach.y < von.y ? 'hoch' : 'runter') : (nach.x < von.x ? 'links' : 'rechts');
  const r = RICHTUNG[name];
  for (let x = von.x + r.x, y = von.y + r.y; x !== nach.x || y !== nach.y; x += r.x, y += r.y) {
    if (istHindernis(z, x, y) || gegnerAuf(z, x, y)) return null;
  }
  return name;
}

function planeDraengler(z, g, ereignisse) {
  if (g.erschoepft > 0) {
    g.erschoepft -= 1;
    return;
  }
  const s = z.spieler;
  const richtung = sichtlinie(z, g, s);
  if (richtung) {
    // die ganze Linie bis zur Wand oder zum nächsten Hindernis
    const r = RICHTUNG[richtung];
    const felder = [];
    for (let x = g.x + r.x, y = g.y + r.y; imFeld(x, y) && !istHindernis(z, x, y); x += r.x, y += r.y) {
      felder.push({ x, y });
    }
    sagAn(g, felder, ereignisse);
    return;
  }
  // Sonst zum nächsten Feld gehen, von dem aus die Linie frei ist.
  const vonHier = entfernungen(g, begehbarFuer(z, g));
  let ziel = null;
  let bestes = Infinity;
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      const d = vonHier[feldNr(x, y)];
      if (d <= 0 || !istFrei(z, x, y) || !sichtlinie(z, { x, y }, s)) continue;
      const wertung = d * 100 - abstand({ x, y }, s); // nah zuerst, bei Gleichstand der längere Anlauf
      if (wertung < bestes) {
        bestes = wertung;
        ziel = { x, y };
      }
    }
  }
  if (ziel) {
    geheEinenSchritt(z, g, naechsterSchritt(g, entfernungen(ziel, begehbarFuer(z, g)), ziel), ereignisse);
  } else {
    geheEinenSchritt(z, g, schrittZumSpieler(z, g), ereignisse);
  }
}

// Schritt 2: Bewegen oder ankündigen. Wer in diesem Zug angegriffen hat, setzt aus.
// Ausnahme ist der Vorderste der Reisegruppe: Er läuft und kündigt in jedem Zug an.
export function planeGegner(z, dran, ereignisse) {
  for (const g of z.gegner) {
    if (g.typ === 'gruppe') {
      if (istVorderster(z, g)) planeVordersten(z, g, ereignisse);
    } else if (dran.has(g.id)) {
      continue;
    } else if (g.typ === 'pendler') {
      planePendler(z, g, ereignisse);
    } else if (g.typ === 'draengler') {
      planeDraengler(z, g, ereignisse);
    }
  }
}

// Liste aller Richtungen als Hilfe für Tests und Bots
export function richtungVon(a, b) {
  for (const name of RICHTUNGSNAMEN) {
    if (a.x + RICHTUNG[name].x === b.x && a.y + RICHTUNG[name].y === b.y) return name;
  }
  return null;
}
