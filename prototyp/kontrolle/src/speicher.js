// Was sich der Prototyp "Kontrolle" merkt: nur, ob der Lernhalt auf diesem Gerät schon geschafft ist.
// Eigener Schlüssel. Der Speicher darf fehlen, leer, gesperrt oder kaputt sein: Dann kommt der Lernhalt
// eben noch einmal, und das Spiel läuft ohne Speichern weiter.

const KONTROLLSCHLUESSEL = 'endstation.kontrolle.1';

export function leererKontrollStand() {
  return { gelernt: false };
}

export function bereinigeKontrollStand(roh) {
  const stand = leererKontrollStand();
  if (roh && typeof roh === 'object' && roh.gelernt === true) stand.gelernt = true;
  return stand;
}

export function ladeKontrollStand() {
  try {
    return bereinigeKontrollStand(JSON.parse(window.localStorage.getItem(KONTROLLSCHLUESSEL)));
  } catch (fehler) {
    return leererKontrollStand();
  }
}

export function sichereKontrollStand(stand) {
  try {
    window.localStorage.setItem(KONTROLLSCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch (fehler) {
    return false;
  }
}
