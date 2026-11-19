// Was das Spiel sich merkt. Safari kann lokale Daten nach einigen Tagen ohne Besuch löschen,
// im privaten Modus fehlt der Speicher ganz. Deshalb liefert ladeStand() immer einen
// vollständigen Stand, auch aus dem Nichts oder aus Unsinn, und Schreiben darf scheitern.

const SCHLUESSEL = 'endstation.1';

// staerken: was der Spieler in früheren Fahrten verstanden hat (Stärken aus Schatten)
export function leererStand() {
  return { gelernt: { wischen: false, ausweichen: false, anrempeln: false }, ton: true, staerken: { warten: false, sprint: false, rueckhalt: false } };
}

// Nimmt nur, was die erwartete Form hat. Alles andere bleibt auf dem Anfangswert.
export function bereinigeStand(roh) {
  const stand = leererStand();
  if (!roh || typeof roh !== 'object') return stand;
  if (roh.gelernt && typeof roh.gelernt === 'object') {
    for (const name of Object.keys(stand.gelernt)) stand.gelernt[name] = roh.gelernt[name] === true;
  }
  if (typeof roh.ton === 'boolean') stand.ton = roh.ton;
  if (roh.staerken && typeof roh.staerken === 'object') {
    for (const name of Object.keys(stand.staerken)) stand.staerken[name] = roh.staerken[name] === true;
  }
  return stand;
}

export function ladeStand() {
  try {
    return bereinigeStand(JSON.parse(window.localStorage.getItem(SCHLUESSEL)));
  } catch (fehler) {
    return leererStand();
  }
}

export function sichereStand(stand) {
  try {
    window.localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch (fehler) {
    return false; // kein Speicher, kein Problem
  }
}
