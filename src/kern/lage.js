// Fragen an den Spielzustand: Was steht wo, was ist markiert.

import { imFeld } from './feld.js';

export function istHindernis(z, x, y) {
  return z.wagen.plan[y][x] !== '.';
}

export function gegnerAuf(z, x, y) {
  for (const g of z.gegner) if (g.x === x && g.y === y) return g;
  return null;
}

export function spielerAuf(z, x, y) {
  return z.spieler.x === x && z.spieler.y === y;
}

// frei heißt: im Wagen, kein Hindernis, keine Figur
export function istFrei(z, x, y) {
  return imFeld(x, y) && !istHindernis(z, x, y) && !gegnerAuf(z, x, y) && !spielerAuf(z, x, y);
}

export function istMarkiert(z, x, y) {
  for (const g of z.gegner) {
    if (g.ansage && g.ansage.some((f) => f.x === x && f.y === y)) return true;
  }
  return false;
}

// Der Vorderste einer Reisegruppe ist das lebende Mitglied mit dem kleinsten Rang.
export function istVorderster(z, g) {
  if (g.typ !== 'gruppe') return false;
  for (const anderer of z.gegner) {
    if (anderer.typ === 'gruppe' && anderer.gruppe === g.gruppe && anderer.rang < g.rang) return false;
  }
  return true;
}

// Darf die Tür aufgehen? Wenn kein Gegner mehr steht. Im Wagen des Kontrolleurs gehört
// die Tür ihm: Sie geht auf, sobald er fort ist, auch wenn andere noch dort sind.
export function tuerFrei(z) {
  if (z.gegner.length === 0) return true;
  return z.wagen.mitKontrolleur === true && !z.gegner.some((g) => g.typ === 'kontrolleur');
}
