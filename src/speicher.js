import { neueFahrkarte, bereinigeFahrkarte } from './kern/fahrkarte.js';
import { bereinigeAufzeichnung } from './kern/fortsetzen.js';
import { LEERLAUF_ARTEN, LEERLAUF_ANFANG } from './kern/leerlauf.js';

// Was das Spiel sich merkt. Safari kann lokale Daten nach einigen Tagen ohne Besuch löschen,
// im privaten Modus fehlt der Speicher ganz. Deshalb liefert ladeStand() immer einen
// vollständigen Stand, auch aus dem Nichts oder aus Unsinn, und Schreiben darf scheitern.

const SCHLUESSEL = 'endstation.1';

// staerken: was der Spieler in früheren Fahrten verstanden hat (Stärken aus Schatten)
export function leererStand() {
  // mehrAmTisch: so viele sitzen nach dem Gönnen später zusätzlich im Speisewagen
  // fahrkarte: die Lochungen der laufenden Reise, bis zum Halt
  // fahrt: Seed und Eingaben der letzten Fahrt, zum Fortsetzen nach dem Öffnen (kern/fortsetzen.js)
  // leerlauf: welche Variante gegen den Leerlauf vor der Tür gilt (kern/leerlauf.js), gewählt mit #leerlauf=
  return { gelernt: { wischen: false, ausweichen: false, anrempeln: false }, ton: true, staerken: { warten: false, sprint: false, rueckhalt: false }, mehrAmTisch: 0, fahrkarte: neueFahrkarte(), fahrt: null, leerlauf: LEERLAUF_ANFANG };
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
  if (Number.isInteger(roh.mehrAmTisch) && roh.mehrAmTisch >= 0) stand.mehrAmTisch = Math.min(5, roh.mehrAmTisch);
  stand.fahrkarte = bereinigeFahrkarte(roh.fahrkarte);
  stand.fahrt = bereinigeAufzeichnung(roh.fahrt);
  if (LEERLAUF_ARTEN.includes(roh.leerlauf)) stand.leerlauf = roh.leerlauf;
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
