// Die Schicht: ein Halt nach dem anderen, jeder ausgelost (auslosen.js). Nach jedem Halt folgt sofort
// der nächste. Die Schicht endet, wenn drei Fahrgäste ohne Fahrkarte entkommen sind. Dann steht nur der
// Name der letzten erreichten Station da, und jede Eingabe beginnt sofort die nächste Schicht.
// Bei der allerersten Fahrt auf einem Gerät kommt davor der Lernhalt. Er zählt nicht mit.
//
// erzeugeKontrolle(seed, { lernhalt }) -> { zustand, act(handlung) }, act gibt Ereignisse zurück.
// Station Nummer n ist die, auf die der Zug in Halt n zufährt (ab 0). Erreicht ist sie, wenn der Halt endet.

import { LERNHALT } from './halte.js';
import { setzeHalt, haltZug } from './kontrolle.js';
import { losHaltAus } from './auslosen.js';

export const ENTKOMMEN_HOECHSTENS = 3;

function beginneHalt(z, nr) {
  z.halt = nr;
  setzeHalt(z, losHaltAus(z, nr));
}

function beginneSchicht(z) {
  z.entkommen = 0;
  z.schicht += 1;
  beginneHalt(z, 0);
}

export function neueKontrolle(seed, optionen) {
  const lernhalt = !!(optionen && optionen.lernhalt);
  const z = { halt: 0, schicht: -1, entkommen: 0, status: 'faehrt', rest: 0, zug: 0, k: null, fahrgaeste: [], zufall: (seed || 0) >>> 0, lernhalt };
  if (lernhalt) setzeHalt(z, LERNHALT);
  else beginneSchicht(z);
  return z;
}

export function kontrollZug(z, handlung) {
  if (z.status === 'faehrt') {
    const ereignisse = haltZug(z, handlung);
    if (z.status === 'faehrt' || !ereignisse.length) return ereignisse;
    if (z.lernhalt) {
      if (z.status === 'gefangen') ereignisse.push({ typ: 'gelernt' }); // gleich merken
      return ereignisse; // der Lernhalt wartet auf die nächste Eingabe
    }
    // der Halt ist zu Ende: Station erreicht, sofort der nächste oder das Ende der Schicht
    z.entkommen += z.entkommenImHalt;
    ereignisse.push({ typ: 'station', nr: z.halt, entkommen: z.entkommen });
    if (z.entkommen >= ENTKOMMEN_HOECHSTENS) {
      z.status = 'aus';
      ereignisse.push({ typ: 'aus', station: z.halt });
    } else {
      beginneHalt(z, z.halt + 1);
      ereignisse.push({ typ: 'neuerHalt', halt: z.halt });
    }
    return ereignisse;
  }
  const ereignisse = [];
  if (z.lernhalt) {
    if (z.status === 'gefangen') {
      z.lernhalt = false;
      beginneSchicht(z);
    } else {
      setzeHalt(z, LERNHALT); // die Zeit ist abgelaufen: einfach noch einmal
    }
    ereignisse.push({ typ: 'neuerHalt', halt: z.lernhalt ? -1 : 0 });
    return ereignisse;
  }
  // nach dem Ende der Schicht: jede Eingabe beginnt sofort die nächste
  beginneSchicht(z);
  ereignisse.push({ typ: 'neuerHalt', halt: 0 });
  return ereignisse;
}

export function erzeugeKontrolle(seed, optionen) {
  const zustand = neueKontrolle(seed, optionen);
  return { zustand, act: (handlung) => kontrollZug(zustand, handlung) };
}
