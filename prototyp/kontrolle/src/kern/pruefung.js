// Prüft eine Sitzordnung, bevor sie gespielt wird. Reine Logik, auch für die Tests.
// Eine Ordnung taugt, wenn sie
//   - innerhalb der Züge lösbar ist, mit etwas Spielraum (vollständige Suche über alle Zustände),
//   - nicht durch Durchkontrollieren der Reihe nach zu schaffen ist (von unten nach oben, jede Reihe
//     von links nach rechts oder von rechts nach links),
//   - für den zu schaffen ist, der hinsieht: wer aufsteht oder zuckt, dem folgt er,
//   - und nicht alle Fahrgäste in den Zügen kontrolliert werden können.

import { setzeHalt, haltZug, kopiereKontrolle } from './kontrolle.js';
import { ZUEGE_BIS_HALT } from './halte.js';

export const KUERZESTE_HOECHSTENS = ZUEGE_BIS_HALT - 2; // wer einen Fehler macht, kann es noch schaffen
export const KUERZESTE_MINDESTENS = 3;

export function haltNach(ordnung) {
  const z = { halt: 0, ergebnisse: [], status: 'faehrt', rest: 0, zug: 0, k: null, fahrgaeste: [] };
  setzeHalt(z, ordnung);
  return z;
}

function moeglicheHandlungen(z) {
  const liste = ['hoch', 'runter', 'warten'];
  for (const f of z.fahrgaeste) if (f.y === z.k.y) liste.push({ tipp: 'feld', x: f.x, y: f.y });
  return liste;
}

// Breitensuche: der kürzeste Weg zum Fang als Liste von Handlungen, oder null
export function kuerzesterFang(start) {
  const schluessel = (z) => {
    let text = `${z.k.y},${z.rest}`;
    for (const f of z.fahrgaeste) if (f.schwarz || f.schlaeft) text += `|${f.x}${f.y}${f.ruht}${f.schlaeft ? 1 : 0}`;
    return text;
  };
  let schicht = [{ z: start, weg: [] }];
  const gesehen = new Set([schluessel(start)]);
  while (schicht.length) {
    const naechste = [];
    for (const { z, weg } of schicht) {
      for (const h of moeglicheHandlungen(z)) {
        const neu = kopiereKontrolle(z);
        if (!haltZug(neu, h).length) continue;
        if (neu.status === 'gefangen') return weg.concat([h]);
        if (neu.status !== 'faehrt') continue;
        const k = schluessel(neu);
        if (gesehen.has(k)) continue;
        gesehen.add(k);
        naechste.push({ z: neu, weg: weg.concat([h]) });
      }
    }
    schicht = naechste;
  }
  return null;
}

// Blind: von unten nach oben, jeden Fahrgast der Reihe nach kontrollieren. richtung: 'links' oder 'rechts'
export function durchkontrollieren(start, richtung) {
  const z = kopiereKontrolle(start);
  for (let i = 0; i < 100 && z.status === 'faehrt'; i++) {
    const offen = z.fahrgaeste.filter((f) => f.y === z.k.y && !f.kontrolliert).sort((a, b) => (richtung === 'links' ? a.x - b.x : b.x - a.x))[0];
    haltZug(z, offen ? { tipp: 'feld', x: offen.x, y: offen.y } : 'hoch');
  }
  return z.status;
}

// Wer hinsieht: geht nach vorn, merkt sich, wer aufsteht oder zuckt, und folgt ihm.
export function hinsehen(start) {
  const z = kopiereKontrolle(start);
  let verdacht = null;
  for (let i = 0; i < 100 && z.status === 'faehrt'; i++) {
    let h = 'hoch';
    if (verdacht !== null) {
      const f = z.fahrgaeste[verdacht];
      if (f.y === z.k.y) h = { tipp: 'feld', x: f.x, y: f.y };
      else h = f.y < z.k.y ? 'hoch' : 'runter';
    }
    for (const e of haltZug(z, h)) if (e.typ === 'wechselt' || e.typ === 'zuckt') verdacht = e.nr;
  }
  return z.status;
}

// Was es kostet, alle zu kontrollieren: jeder einen Zug, der Schlafende zwei, dazu der Weg nach vorn.
export function alleKontrollierenKostet(start) {
  const vorderste = Math.min(...start.fahrgaeste.map((f) => f.y));
  return start.fahrgaeste.reduce((summe, f) => summe + (f.schlaeft ? 2 : 1), 0) + (start.k.y - vorderste);
}

export function pruefeOrdnung(ordnung) {
  const z = haltNach(ordnung);
  const weg = kuerzesterFang(z);
  return {
    kuerzeste: weg ? weg.length : null,
    blindLinks: durchkontrollieren(z, 'links'),
    blindRechts: durchkontrollieren(z, 'rechts'),
    hinsehen: hinsehen(z),
    alleKosten: alleKontrollierenKostet(z),
  };
}

export function ordnungTaugt(ordnung) {
  const p = pruefeOrdnung(ordnung);
  return p.kuerzeste !== null && p.kuerzeste >= KUERZESTE_MINDESTENS && p.kuerzeste <= KUERZESTE_HOECHSTENS &&
    p.blindLinks !== 'gefangen' && p.blindRechts !== 'gefangen' && p.hinsehen === 'gefangen' && p.alleKosten > ZUEGE_BIS_HALT;
}
