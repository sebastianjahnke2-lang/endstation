// Prüft einen Halt, bevor er gespielt wird. Reine Logik, auch für die Tests.
// Ein Halt taugt, wenn
//   - alle Fahrgäste ohne Fahrkarte innerhalb der Züge zu erwischen sind (vollständige Suche),
//   - Durchkontrollieren der Reihe nach es nicht schafft (von unten nach oben, jede Reihe von links
//     nach rechts oder von rechts nach links),
//   - wer hinsieht, es schafft: Er folgt nur dem, der sich durch sein Verhalten verrät (aufstehen,
//     zucken, Kopf heben, zur Toilette gehen). So ist jede Masche allein durch Beobachten erkennbar.

import { setzeHalt, haltZug, kopiereKontrolle, TOILETTE } from './kontrolle.js';

export const KUERZESTE_MINDESTENS = 3;
export const VERRAETERISCH = ['wechselt', 'zuckt', 'kopfHoch', 'toilette', 'zurueck'];

export function haltNach(ordnung) {
  const z = { halt: 0, status: 'faehrt', rest: 0, zug: 0, k: null, fahrgaeste: [] };
  setzeHalt(z, ordnung);
  return z;
}

function moeglicheHandlungen(z) {
  const liste = ['hoch', 'runter', 'warten'];
  for (const f of z.fahrgaeste) if (f.y === z.k.y && f.ort === 'sitz' && !f.gefangen) liste.push({ tipp: 'feld', x: f.x, y: f.y });
  return liste;
}

function schluessel(z) {
  let text = `${z.k.y}${z.k.blick[0]}${z.rest}`;
  for (const f of z.fahrgaeste) {
    if (f.schwarz || f.schlaeft) text += `|${f.x}${f.y}${f.ruht}${f.schlaeft ? 1 : 0}${f.gefangen ? 1 : 0}${f.ort[0]}${f.wc}`;
  }
  return text;
}

// Breitensuche: der kürzeste Weg, bis alle erwischt sind, als Liste von Handlungen, oder null
export function kuerzesterFang(start) {
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
// Gibt den Zustand am Ende zurück: status, und in zug, wie viele Züge es gebraucht hat.
export function durchkontrolliert(start, richtung) {
  const z = kopiereKontrolle(start);
  for (let i = 0; i < 100 && z.status === 'faehrt'; i++) {
    const offen = z.fahrgaeste.filter((f) => f.y === z.k.y && f.ort === 'sitz' && !f.gefangen && !f.kontrolliert).sort((a, b) => (richtung === 'links' ? a.x - b.x : b.x - a.x))[0];
    if (!haltZug(z, offen ? { tipp: 'feld', x: offen.x, y: offen.y } : 'hoch').length) break; // vorn, niemand mehr übrig
  }
  return z;
}

export function durchkontrollieren(start, richtung) {
  return durchkontrolliert(start, richtung).status;
}

// Wer hinsieht: geht nach vorn, merkt sich jeden, der sich verrät, und folgt ihm.
// Ist der auf der Toilette, wartet er vor der Tür.
export function hinsehen(start) {
  const z = kopiereKontrolle(start);
  const verdacht = [];
  for (let i = 0; i < 100 && z.status === 'faehrt'; i++) {
    const ziel = verdacht.map((nr) => z.fahrgaeste[nr]).find((f) => !f.gefangen);
    let h = 'hoch';
    if (ziel) {
      const reihe = ziel.ort === 'wc' ? TOILETTE.y + 1 : ziel.y;
      if (ziel.ort === 'sitz' && ziel.y === z.k.y) h = { tipp: 'feld', x: ziel.x, y: ziel.y };
      else if (reihe === z.k.y) h = 'warten';
      else h = reihe < z.k.y ? 'hoch' : 'runter';
    } else if (z.k.y === 1) {
      h = 'warten'; // vorn angekommen, noch niemand hat sich verraten
    }
    for (const e of haltZug(z, h)) if (VERRAETERISCH.includes(e.typ) && !verdacht.includes(e.nr)) verdacht.push(e.nr);
  }
  return z.status;
}

export function pruefeHalt(ordnung) {
  const z = haltNach(ordnung);
  const weg = kuerzesterFang(z);
  return {
    kuerzeste: weg ? weg.length : null,
    blindLinks: durchkontrollieren(z, 'links'),
    blindRechts: durchkontrollieren(z, 'rechts'),
    hinsehen: hinsehen(z),
  };
}

export function haltTaugt(ordnung) {
  const p = pruefeHalt(ordnung);
  return p.kuerzeste !== null && p.kuerzeste >= KUERZESTE_MINDESTENS && p.kuerzeste <= (ordnung.zuege || 12) &&
    p.blindLinks !== 'gefangen' && p.blindRechts !== 'gefangen' && p.hinsehen === 'gefangen';
}

