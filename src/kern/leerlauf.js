// Leerlauf vor der Tür (Schritt 6 aus docs/auftraege/leitsaetze.md, Leitsatz 1 und „Reibung ist ein Fehler").
// Ist ein Wagen gefahrlos, sind es bis zur Tür oft acht Schritte ohne Entscheidung, im Speisewagen immer.
// Zwei Varianten, der Auftraggeber wählt am Gerät (Adresse mit #leerlauf=halten oder #leerlauf=tuer):
//   'halten'  Finger nach dem Wischen liegen lassen: Der Schritt wiederholt sich.
//   'tuer'    Tipp auf die offene Tür: Die Figur läuft den kürzesten Weg hin und hindurch.
// Beide wirken nur, solange kein Gegner im Wagen ist. Jeder Schritt ist ein gewöhnlicher Zug.
// Reine Logik ohne Browser; den Takt gibt main.js vor.

import { RICHTUNG, TUERFELD, imFeld, entfernungen, naechsterSchritt } from './feld.js';
import { istHindernis } from './lage.js';

export const LEERLAUF_ARTEN = ['tuer', 'halten'];
export const LEERLAUF_ANFANG = 'tuer';
export const LEERLAUF_TAKT = 160; // ms von Schritt zu Schritt
export const HALTEN_AB = 280; // ms, so lange liegt der Finger nach dem Wischen, bevor es weitergeht

// Gefahrlos heißt: Die Fahrt läuft, und kein Gegner ist im Wagen (auch der Speisewagen).
export function istGefahrlos(z) {
  return z.status === 'faehrt' && z.gegner.length === 0;
}

// Felder, auf die der Lauf nicht von selbst tritt: Antworten und „Noch mal" beim Begleiter,
// das Angebot und der Drängler in der Engstelle. Dort entscheidet der Spieler selbst.
function gesperrt(z, x, y, ohneImWeg) {
  const b = z.begleiter;
  if (b && b.antworten && b.antworten.some((a) => a.x === x && a.y === y)) return true;
  if (b && b.wiederholen && b.wiederholen.x === x && b.wiederholen.y === y) return true;
  if (z.angebot && z.angebot.x === x && z.angebot.y === y) return true;
  if (!ohneImWeg && z.wagen.imWeg && z.wagen.imWeg.x === x && z.wagen.imWeg.y === y) return true;
  return false;
}

// Der nächste Schritt zur Tür und durch sie hindurch, oder null, wenn der Weg nicht frei ist.
export function schrittZurTuer(z) {
  if (!istGefahrlos(z) || !z.tuerOffen) return null;
  const s = z.spieler;
  if (s.x === TUERFELD.x && s.y === TUERFELD.y) return 'hoch';
  // Der Drängler in der Engstelle zählt beim Suchen als Weg: Man läuft bis vor ihn und hält dort an.
  const weit = entfernungen(TUERFELD, (x, y) => !istHindernis(z, x, y) && !gesperrt(z, x, y, true));
  const schritt = naechsterSchritt(s, weit, TUERFELD);
  if (!schritt || gesperrt(z, schritt.x, schritt.y)) return null;
  return schritt.richtung;
}

// Darf der gehaltene Finger noch einen Schritt in diese Richtung tun?
export function darfWeiterHalten(z, richtung) {
  if (!istGefahrlos(z) || !RICHTUNG[richtung]) return false;
  const s = z.spieler;
  const x = s.x + RICHTUNG[richtung].x;
  const y = s.y + RICHTUNG[richtung].y;
  if (richtung === 'hoch' && s.x === TUERFELD.x && s.y === TUERFELD.y) return z.tuerOffen;
  return imFeld(x, y) && !istHindernis(z, x, y) && !gesperrt(z, x, y);
}

// Nach jedem Schritt des Laufs: Ging alles glatt, oder ist etwas geschehen, das der Spieler sehen soll?
// Glatt sind nur Schritt, Wagenwechsel und das Heilen beim Hineingehen.
export function istGlatt(ereignisse) {
  return ereignisse.length > 0 && ereignisse.every((e) => e.typ === 'schritt' || e.typ === 'wagenwechsel' || e.typ === 'geheilt');
}
