// Drei Halte hintereinander. Der erste Durchgang spielt die drei festen Sitzordnungen aus halte.js,
// die nacheinander je einen Gedanken zeigen. Jeder Neustart lost drei neue aus (auslosen.js).
// erzeugeKontrolle(seed) -> { zustand, act(handlung) }, act gibt Ereignisse zurück.

import { HALTE } from './halte.js';
import { setzeHalt, haltZug } from './kontrolle.js';
import { losOrdnungAus } from './auslosen.js';

export function neueKontrolle(seed) {
  const z = { halt: 0, ergebnisse: [], status: 'faehrt', rest: 0, zug: 0, k: null, fahrgaeste: [], zufall: (seed || 0) >>> 0, durchgang: 0, ordnungen: HALTE.slice() };
  setzeHalt(z, z.ordnungen[0]);
  return z;
}

export function neueOrdnungen(z) {
  return HALTE.map((fest) => losOrdnungAus(z) || fest);
}

export function kontrollZug(z, handlung) {
  if (z.status === 'faehrt') return haltZug(z, handlung);
  // Nach dem Halt: Jede Eingabe führt zum nächsten Halt, nach dem dritten zum Schluss, danach neu.
  const ereignisse = [];
  if (z.status === 'aus') {
    z.ergebnisse = [];
    z.durchgang += 1;
    z.ordnungen = neueOrdnungen(z);
    z.halt = 0;
    setzeHalt(z, z.ordnungen[0]);
    ereignisse.push({ typ: 'neuerHalt', halt: 0 });
  } else if (z.halt < z.ordnungen.length - 1) {
    z.halt += 1;
    setzeHalt(z, z.ordnungen[z.halt]);
    ereignisse.push({ typ: 'neuerHalt', halt: z.halt });
  } else {
    z.status = 'aus';
    ereignisse.push({ typ: 'aus', erwischt: z.ergebnisse.filter(Boolean).length, von: z.ergebnisse.length });
  }
  return ereignisse;
}

export function erzeugeKontrolle(seed) {
  const zustand = neueKontrolle(seed);
  return { zustand, act: (handlung) => kontrollZug(zustand, handlung) };
}
