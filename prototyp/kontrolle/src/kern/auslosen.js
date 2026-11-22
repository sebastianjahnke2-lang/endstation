// Die Halte einer Schicht werden ausgelost, einer nach dem anderen. Innerhalb eines Halts gibt es keinen Zufall.
// Jeder Halt wird geprüft (pruefung.js): Wer nicht taugt, wird verworfen und neu gelost.
// Der Zufall kommt aus dem Zufallsmodul des Hauptspiels, sein Stand liegt im Zustand: gleicher Seed, gleiche Halte.
//
// Steigerung (Auftrag „Die Schicht"):
//   Halt 1 und 2: ein Platzwechsler. Halt 3: ein Scheinschläfer allein. Halt 4: ein Toilettengänger allein.
//   Ab Halt 5 gemischt, ab Halt 6 sitzen manchmal zwei im Wagen.
//   Die Zeit beginnt bei 14 Zügen und wird alle zwei Halte um einen knapper, bis 8 (einer weniger erlaubt). Nie weniger als der
//   kürzeste Weg, den die Suche findet, plus ein Zug. Und immer weniger, als blindes Durchkontrollieren
//   der Reihe nach braucht: Sonst ginge es auch ohne Hinsehen. Passt beides nicht, wird neu gelost.

import { wuerfle } from '../../../../src/kern/zufall.js';
import { haltTaugt, kuerzesterFang, haltNach, durchkontrolliert } from './pruefung.js';

const ALLE_SITZE = [];
for (let y = 1; y <= 6; y++) for (const x of [0, 1, 3, 4]) ALLE_SITZE.push({ x, y });
const FARBEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const ZEICHEN_FUER = { platz: 'P', schein: 'H', wc: 'T' };
const MASCHEN = ['platz', 'schein', 'wc'];
export const FAHRGAESTE_JE_HALT = 8;
export const VERSUCHE_HOECHSTENS = 600;
export const ZEIT_ANFANG = 14;
export const ZEIT_ENDE = 8;

export function zielZeit(halt) {
  return Math.max(ZEIT_ENDE, ZEIT_ANFANG - Math.floor(halt / 2));
}

function mische(z, liste) {
  const kopie = liste.slice();
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = wuerfle(z, i + 1);
    const t = kopie[i];
    kopie[i] = kopie[j];
    kopie[j] = t;
  }
  return kopie;
}

// Welche Maschen in Halt Nummer halt (ab 0) sitzen
export function maschenFuer(z, halt) {
  if (halt <= 1) return ['platz'];
  if (halt === 2) return ['schein'];
  if (halt === 3) return ['wc'];
  const erste = MASCHEN[wuerfle(z, 3)];
  if (halt >= 5 && wuerfle(z, 3) === 0) {
    const andere = MASCHEN.filter((m) => m !== erste);
    return [erste, andere[wuerfle(z, 2)]];
  }
  return [erste];
}

// Ein Halt ohne Prüfung und ohne Zeit
export function roherHalt(z, maschen) {
  const plaetze = mische(z, ALLE_SITZE).slice(0, FAHRGAESTE_JE_HALT);
  const farben = mische(z, FARBEN);
  // Schlafende: einer, ohne Scheinschläfer manchmal zwei. So verrät die Zahl der Schlafenden nichts.
  const schlafende = maschen.includes('schein') ? 1 : 1 + wuerfle(z, 2);
  const zeilen = [];
  for (let y = 1; y <= 6; y++) zeilen.push(['.', '.', '|', '.', '.']);
  const ordnung = { farben: {}, sitze: null };
  let farbe = 0;
  plaetze.forEach((p, i) => {
    let c;
    if (i < maschen.length) {
      c = ZEICHEN_FUER[maschen[i]];
      if (c !== 'H') ordnung.farben[c] = farben[farbe++];
    } else if (i < maschen.length + schlafende) {
      c = 'Z';
    } else {
      c = farben[farbe++];
    }
    zeilen[p.y - 1][p.x] = c;
  });
  ordnung.sitze = zeilen.map((zeile) => zeile.join(''));
  return ordnung;
}

// Lost einen tauglichen Halt aus. z trägt den Zufallsstand.
export function losHaltAus(z, halt) {
  const maschen = maschenFuer(z, halt);
  for (let i = 0; i < VERSUCHE_HOECHSTENS; i++) {
    const ordnung = roherHalt(z, maschen);
    ordnung.zuege = ZEIT_ANFANG + 1; // erst mit reichlich Zeit: Was ist der kürzeste Weg, was braucht man blind?
    const start = haltNach(ordnung);
    const weg = kuerzesterFang(start);
    if (!weg) continue;
    let blind = ZEIT_ANFANG + 1;
    for (const richtung of ['links', 'rechts']) {
      const b = durchkontrolliert(start, richtung);
      if (b.status === 'gefangen') blind = Math.min(blind, b.zug);
    }
    const zeit = Math.min(zielZeit(halt), blind - 1);
    if (zeit < weg.length + 1 || zeit < zielZeit(halt) - 1) continue; // höchstens einen Zug knapper als geplant
    ordnung.zuege = zeit;
    ordnung.maschen = maschen;
    if (haltTaugt(ordnung)) return ordnung;
  }
  return null; // kommt nicht vor (Test)
}
