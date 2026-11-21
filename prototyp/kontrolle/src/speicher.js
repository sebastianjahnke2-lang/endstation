// Was sich der Prototyp "Kontrolle" merkt: ob der Lernhalt auf diesem Gerät schon geschafft ist, und die
// weiteste je erreichte Station. Eigener Schlüssel. Der Speicher darf fehlen, leer, gesperrt oder kaputt
// sein: Dann kommt der Lernhalt eben noch einmal, keine Station ist markiert, und das Spiel läuft weiter.

const KONTROLLSCHLUESSEL = 'endstation.kontrolle.1';

export function leererKontrollStand() {
  return { gelernt: false, weiteste: -1 };
}

export function bereinigeKontrollStand(roh) {
  const stand = leererKontrollStand();
  if (!roh || typeof roh !== 'object') return stand;
  if (roh.gelernt === true) stand.gelernt = true;
  if (Number.isInteger(roh.weiteste) && roh.weiteste >= 0 && roh.weiteste < 100000) stand.weiteste = roh.weiteste;
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
