// Neue Sitzordnungen für einen Neustart. Ausgelost wird nur zwischen den Halten, nie während eines Halts.
// Jede Ordnung wird geprüft (pruefung.js): Wer nicht taugt, wird verworfen und neu gelost.
// Neu verteilt werden die Plätze, der Schlafende und die Farben. Der Zufall kommt aus dem Zufallsmodul
// des Hauptspiels, sein Stand liegt im Zustand: Gleicher Seed, gleiche Ordnungen.

import { wuerfle } from '../../../../src/kern/zufall.js';
import { ordnungTaugt } from './pruefung.js';

const ALLE_SITZE = [];
for (let y = 1; y <= 6; y++) for (const x of [0, 1, 3, 4]) ALLE_SITZE.push({ x, y });
const FARBEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
export const FAHRGAESTE_JE_HALT = 8;
export const VERSUCHE_HOECHSTENS = 400;

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

// Eine Ordnung ohne Prüfung: acht Plätze, der erste für ihn, der zweite für den Schlafenden.
export function roheOrdnung(z) {
  const plaetze = mische(z, ALLE_SITZE).slice(0, FAHRGAESTE_JE_HALT);
  const farben = mische(z, FARBEN);
  const zeilen = [];
  for (let y = 1; y <= 6; y++) zeilen.push(['.', '.', '|', '.', '.']);
  plaetze.forEach((p, i) => {
    zeilen[p.y - 1][p.x] = i === 0 ? 'S' : i === 1 ? 'Z' : farben[i - 1];
  });
  return { farbe: farben[0], sitze: zeilen.map((zeile) => zeile.join('')) };
}

// Lost eine taugliche Ordnung aus. z trägt den Zufallsstand.
export function losOrdnungAus(z) {
  for (let i = 0; i < VERSUCHE_HOECHSTENS; i++) {
    const ordnung = roheOrdnung(z);
    if (ordnungTaugt(ordnung)) return ordnung;
  }
  return null; // kommt nicht vor (Test), dann nimmt der Durchgang die festen Ordnungen
}
