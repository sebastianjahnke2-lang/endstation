// Kleine Helfer für die Tests des Prototyps. Kein Test, deshalb ohne ".test" im Namen.

import { neueFahrt, runde } from '../src/kern/fahrt.js';
import { bestimmeSchatten } from '../src/kern/licht.js';

// Spielt eine Folge von Handlungen und gibt Zustand und alle Ereignislisten zurück.
export function spiele(handlungen, start) {
  let z = start || neueFahrt();
  const listen = [];
  for (const h of handlungen) {
    const ergebnis = runde(z, h);
    z = ergebnis.zustand;
    listen.push(ergebnis.ereignisse);
  }
  return { z, listen, letzte: listen[listen.length - 1] || [] };
}

// Ein Zustand zum Zurechtrücken. Die Schatten werden passend dazu neu bestimmt.
export function lage(aenderung) {
  const z = neueFahrt();
  aenderung(z);
  z.schatten = bestimmeSchatten(z);
  return z;
}
