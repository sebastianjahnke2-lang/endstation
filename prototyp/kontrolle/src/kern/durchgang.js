// Drei Halte hintereinander, bei der allerersten Fahrt auf einem Gerät davor der Lernhalt.
// Der erste Durchgang spielt die drei festen Sitzordnungen aus halte.js,
// die nacheinander je einen Gedanken zeigen. Jeder Neustart lost drei neue aus (auslosen.js).
// erzeugeKontrolle(seed, { lernhalt }) -> { zustand, act(handlung) }, act gibt Ereignisse zurück.
// Der Lernhalt zählt nicht mit. Läuft dort die Zeit ab, beginnt er neu. Wer ihn schafft, bekommt das
// beim Fang das Ereignis "gelernt" (main.js merkt es sich), mit der nächsten Eingabe kommt Halt 1.

import { HALTE, LERNHALT } from './halte.js';
import { setzeHalt, haltZug } from './kontrolle.js';
import { losOrdnungAus } from './auslosen.js';

export function neueKontrolle(seed, optionen) {
  const lernhalt = !!(optionen && optionen.lernhalt);
  const z = { halt: 0, ergebnisse: [], status: 'faehrt', rest: 0, zug: 0, k: null, fahrgaeste: [], zufall: (seed || 0) >>> 0, durchgang: 0, ordnungen: HALTE.slice(), lernhalt };
  setzeHalt(z, lernhalt ? LERNHALT : z.ordnungen[0]);
  return z;
}

export function neueOrdnungen(z) {
  return HALTE.map((fest) => losOrdnungAus(z) || fest);
}

export function kontrollZug(z, handlung) {
  if (z.status === 'faehrt') {
    const ereignisse = haltZug(z, handlung);
    if (z.lernhalt && z.status !== 'faehrt') z.ergebnisse.pop(); // der Lernhalt zählt nicht
    if (z.lernhalt && z.status === 'gefangen') ereignisse.push({ typ: 'gelernt' }); // gleich merken
    return ereignisse;
  }
  // Nach dem Halt: Jede Eingabe führt zum nächsten Halt, nach dem dritten zum Schluss, danach neu.
  const ereignisse = [];
  if (z.lernhalt) {
    if (z.status === 'gefangen') {
      z.lernhalt = false;
      z.halt = 0;
      setzeHalt(z, z.ordnungen[0]);
      ereignisse.push({ typ: 'neuerHalt', halt: 0 });
    } else {
      setzeHalt(z, LERNHALT); // die Zeit ist abgelaufen: einfach noch einmal
      ereignisse.push({ typ: 'neuerHalt', halt: -1 });
    }
  } else if (z.status === 'aus') {
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

export function erzeugeKontrolle(seed, optionen) {
  const zustand = neueKontrolle(seed, optionen);
  return { zustand, act: (handlung) => kontrollZug(zustand, handlung) };
}
