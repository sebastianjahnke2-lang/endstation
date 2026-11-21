// Fahrt fortsetzen (Leitsatz 10: jederzeit unterbrechbar, nach der Pause weiß man sofort, wo man ist).
// Gesichert werden Seed, Optionen und die Eingaben der laufenden Fahrt. Beim Öffnen spielt der Kern
// sie nach und steht im selben Wagen in derselben Lage. Reine Logik ohne Browser.
//
// Eine Aufzeichnung: { seed, optionen, eingaben, pruefsumme }
//   eingaben: ein Zeichen je Zug, der etwas bewirkt hat
//   pruefsumme: Fingerabdruck des Zustands nach der letzten Eingabe. Passt er nach dem Nachspielen
//   nicht (anderer Stand des Spiels, verfälschter Speicher), gilt die Aufzeichnung als kaputt.
// Jeder Fehler beim Nachspielen ergibt null: Dann beginnt still eine neue Fahrt.

import { erzeugeSpiel } from './spiel.js';

export const EINGABEN_HOECHSTENS = 4000; // längere Fahrten werden nicht mehr aufgezeichnet

const EINGABEZEICHEN = {
  hoch: 'h',
  rechts: 'r',
  runter: 'u',
  links: 'l',
  warten: 'w',
  'sprint-hoch': 'H',
  'sprint-rechts': 'R',
  'sprint-runter': 'U',
  'sprint-links': 'L',
};
const AKTION_FUER_ZEICHEN = {};
for (const name of Object.keys(EINGABEZEICHEN)) AKTION_FUER_ZEICHEN[EINGABEZEICHEN[name]] = name;

// FNV-1a über den Zustand als Text. Kein Schutz gegen Absicht, nur gegen Versehen.
export function pruefsummeVon(zustand) {
  const text = JSON.stringify(zustand);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

// Zu Beginn einer Fahrt, bevor erzeugeSpiel() die Optionen sieht.
export function neueAufzeichnung(seed, optionen, zustand) {
  return { seed: seed >>> 0, optionen: JSON.parse(JSON.stringify(optionen)), eingaben: '', pruefsumme: pruefsummeVon(zustand) };
}

// Nach jedem Zug, der etwas bewirkt hat. Gibt null zurück, wenn nichts mehr aufgezeichnet wird.
export function zeichneAuf(aufzeichnung, aktion, zustand) {
  if (!aufzeichnung) return null;
  const zeichen = EINGABEZEICHEN[aktion];
  if (!zeichen || aufzeichnung.eingaben.length >= EINGABEN_HOECHSTENS) return null;
  aufzeichnung.eingaben += zeichen;
  aufzeichnung.pruefsumme = pruefsummeVon(zustand);
  return aufzeichnung;
}

// Nimmt aus dem Speicher nur, was die erwartete Form hat. Sonst null.
export function bereinigeAufzeichnung(roh) {
  if (!roh || typeof roh !== 'object') return null;
  if (!Number.isInteger(roh.seed) || roh.seed < 0 || roh.seed > 0xffffffff) return null;
  if (!roh.optionen || typeof roh.optionen !== 'object' || Array.isArray(roh.optionen)) return null;
  if (typeof roh.eingaben !== 'string' || roh.eingaben.length > EINGABEN_HOECHSTENS || !/^[hrulwHRUL]*$/.test(roh.eingaben)) return null;
  if (typeof roh.pruefsumme !== 'string' || !/^[0-9a-f]{1,8}$/.test(roh.pruefsumme)) return null;
  return { seed: roh.seed, optionen: roh.optionen, eingaben: roh.eingaben, pruefsumme: roh.pruefsumme };
}

// Spielt eine Aufzeichnung nach. Ergebnis: das Spiel in genau dem gesicherten Zustand, sonst null.
export function spieleNach(roh) {
  const aufzeichnung = bereinigeAufzeichnung(roh);
  if (!aufzeichnung) return null;
  try {
    const spiel = erzeugeSpiel(aufzeichnung.seed, JSON.parse(JSON.stringify(aufzeichnung.optionen)));
    for (const zeichen of aufzeichnung.eingaben) {
      // eine Eingabe, die nichts bewirkt, wurde nie aufgezeichnet: Dann passt etwas nicht
      if (!spiel.act(AKTION_FUER_ZEICHEN[zeichen]).length) return null;
    }
    if (pruefsummeVon(spiel.zustand) !== aufzeichnung.pruefsumme) return null;
    return spiel;
  } catch (fehler) {
    return null;
  }
}
