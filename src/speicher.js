// Was das Spiel sich merkt. Jeder Zugriff ist abgesichert: Ohne Speicher läuft alles genauso,
// nur eben ohne Gedächtnis.

const SCHLUESSEL = 'endstation.1';

export function ladeStand() {
  try {
    const roh = window.localStorage.getItem(SCHLUESSEL);
    const stand = roh ? JSON.parse(roh) : null;
    return stand && typeof stand === 'object' ? stand : {};
  } catch (fehler) {
    return {};
  }
}

export function sichereStand(stand) {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
  } catch (fehler) {
    // kein Speicher, kein Problem
  }
}
