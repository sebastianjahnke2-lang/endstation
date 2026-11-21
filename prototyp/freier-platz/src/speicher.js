// Was der Prototyp sich merkt, unter einem eigenen Schlüssel: die letzten 20 Fahrkarten,
// Musik an oder aus und das Testprotokoll der letzten Fahrt. Wie im Hauptspiel darf der
// Speicher jederzeit fehlen, leer sein oder Unsinn enthalten: ladePlatzStand() liefert
// immer einen vollständigen Stand, und Schreiben darf scheitern.

import { leeresProtokoll, bereinigeProtokoll } from './protokoll.js';

const PLATZSCHLUESSEL = 'endstation.freier-platz.1';
export const KARTEN_HOECHSTENS = 20;

export function leererPlatzStand() {
  // Für den Test mit Musik steht der Ton beim Start auf an (Auftrag vom 21.11.). Das frühere Feld "ton"
  // stand beim Start auf aus und wird nicht mehr gelesen, sonst bliebe es bei Wiederkehrern still.
  return { musik: true, karten: [], protokoll: null };
}

function bereinigeKarte(roh) {
  if (!roh || typeof roh !== 'object') return null;
  const zeilen = [];
  if (Array.isArray(roh.zeilen)) {
    for (const zeile of roh.zeilen.slice(0, 4)) if (typeof zeile === 'string') zeilen.push(zeile.slice(0, 40));
  }
  return { lochung: roh.lochung === true, zeilen };
}

// Nimmt nur, was die erwartete Form hat. Alles andere bleibt auf dem Anfangswert.
export function bereinigePlatzStand(roh) {
  const stand = leererPlatzStand();
  if (!roh || typeof roh !== 'object') return stand;
  if (typeof roh.musik === 'boolean') stand.musik = roh.musik;
  if (Array.isArray(roh.karten)) {
    for (const eintrag of roh.karten) {
      const karte = bereinigeKarte(eintrag);
      if (karte && stand.karten.length < KARTEN_HOECHSTENS) stand.karten.push(karte);
    }
  }
  stand.protokoll = bereinigeProtokoll(roh.protokoll);
  return stand;
}

// Die neue Karte kommt nach vorn, mehr als 20 werden nicht aufgehoben.
export function legeKarteAb(stand, karte) {
  stand.karten.unshift({ lochung: karte.lochung === true, zeilen: karte.zeilen.slice(0, 4) });
  stand.karten.length = Math.min(stand.karten.length, KARTEN_HOECHSTENS);
}

export function ladePlatzStand() {
  try {
    return bereinigePlatzStand(JSON.parse(window.localStorage.getItem(PLATZSCHLUESSEL)));
  } catch (fehler) {
    return leererPlatzStand();
  }
}

export function sicherePlatzStand(stand) {
  try {
    window.localStorage.setItem(PLATZSCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch (fehler) {
    return false; // kein Speicher, kein Problem
  }
}

// nur für Tests: ein frisches leeres Protokoll passt in den Stand
export function standMitProtokoll() {
  const stand = leererPlatzStand();
  stand.protokoll = leeresProtokoll();
  return stand;
}
