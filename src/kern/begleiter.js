// Der Begleiter. Nach einem Tod sitzt er im Speisewagen. Wer neben ihn tritt, spricht mit ihm:
// „Woran lag es?" Drei Antworten liegen vor ihm auf dem Boden, draufgehen heißt antworten.
// Das Spiel kennt den Grund. Die ehrliche Antwort gibt eine helle Lochung, je Todesursache eine.
// Er nennt nicht, was gelungen ist (Entscheidung des Auftraggebers vom 19.11.: kein Lob).
// Nach der Antwort liegt neben ihm „Noch mal": Wer draufgeht, spielt den Wagen, in dem die letzte
// Fahrt endete, noch einmal, gefahrlos und folgenlos. Die Wiederholung selbst steht in spiel.js.
// Kennt weder Bildschirm noch Browser.

import { BREITE, RICHTUNG, RICHTUNGSNAMEN } from './feld.js';
import { WAGENPLAENE } from './wagen.js';
import { wuerfle } from './zufall.js';

export const ANTWORTARTEN = ['pendler', 'gruppe', 'draengler', 'kontrolleur', 'tuer', 'pech'];
const URSACHEN = ['pendler', 'gruppe', 'draengler', 'kontrolleur', 'tuer'];

// Die Szene, in der die vorige Fahrt endete: Wagennummer und Stand des Zufalls vor ihrem Bau.
// Nimmt nur, was die erwartete Form hat, sonst null. Der sichere Wagen ist nie eine solche Szene.
export function bereinigeSzene(roh) {
  if (!roh || typeof roh !== 'object') return null;
  const { nr, zufall } = roh;
  if (!Number.isInteger(nr) || nr < 0 || nr >= WAGENPLAENE.length || WAGENPLAENE[nr].sicher) return null;
  if (!Number.isInteger(zufall) || zufall < 0 || zufall > 0xffffffff) return null;
  return { nr, zufall };
}

// Beim Einrichten des Speisewagens: Er sitzt dort, wenn die vorige Fahrt mit einem Tod endete.
export function setzeBegleiter(z, platz) {
  z.begleiter = null;
  if (!z.wagen.sicher || !z.begleiterDurch || !platz) return;
  z.begleiter = { durch: z.begleiterDurch, szene: z.begleiterSzene, x: platz.x, y: platz.y, antworten: null, gesprochen: false, wiederholen: null };
  z.begleiterDurch = null; // er sitzt nur beim ersten Besuch dieser Fahrt dort
  z.begleiterSzene = null;
}

function frei(z, x, y) {
  return x >= 0 && x < BREITE && y >= 0 && y < z.wagen.plan.length && z.wagen.plan[y][x] === '.' && !(z.spieler.x === x && z.spieler.y === y);
}

// „Noch mal" liegt auf einem freien Feld neben ihm, auf dem der Spieler gerade nicht steht.
function feldNeben(z, b) {
  for (const name of RICHTUNGSNAMEN) {
    const x = b.x + RICHTUNG[name].x;
    const y = b.y + RICHTUNG[name].y;
    if (frei(z, x, y)) return { x, y };
  }
  return null;
}

// Nach jedem Schritt im Speisewagen. Gibt true zurück, wenn der Spieler auf „Noch mal" getreten ist:
// Dann beginnt spiel.js die Wiederholung.
export function sprichMitBegleiter(z, ereignisse) {
  const b = z.begleiter;
  if (!b) return false;
  const s = z.spieler;
  if (b.wiederholen) {
    if (s.x !== b.wiederholen.x || s.y !== b.wiederholen.y) return false;
    b.wiederholen = null; // einmal je Tod
    return true;
  }
  if (b.gesprochen) return false;
  if (b.antworten) {
    const a = b.antworten.find((x) => x.x === s.x && x.y === s.y);
    if (!a) return false;
    b.antworten = null;
    b.gesprochen = true;
    const ehrlich = a.id === b.durch;
    b.wiederholen = b.szene ? feldNeben(z, b) : null;
    ereignisse.push({ typ: 'antwort', phase: 0, id: a.id, ehrlich, wiederholen: b.wiederholen ? { ...b.wiederholen } : null });
    const karte = z.fahrkarte;
    if (ehrlich && !karte.lochungen.some((l) => l.art === 'ehrlich' && l.durch === b.durch)) {
      karte.lochungen.push({ art: 'ehrlich', durch: b.durch, hell: true, wagen: z.wagen.art });
      ereignisse.push({ typ: 'gelocht', phase: 0, art: 'ehrlich', durch: b.durch, hell: true });
    }
    return false;
  }
  if (Math.abs(s.x - b.x) + Math.abs(s.y - b.y) !== 1) return false;
  // die drei Antworten: die ehrliche, eine andere Ursache und „Pech", in zufälliger Reihenfolge
  const andere = URSACHEN.filter((u) => u !== b.durch);
  const ids = [b.durch, andere[wuerfle(z.kartenzufall, andere.length)], 'pech'];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = wuerfle(z.kartenzufall, i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  // auf drei freie Felder einer Reihe vor ihm, im Gang
  for (const dy of [1, 2, -2, -1]) { // zuerst unter ihm: Über ihm steht die Frage
    const y = b.y + dy;
    const felder = [1, 2, 3].map((x) => ({ x, y }));
    if (felder.every((f) => frei(z, f.x, f.y))) {
      b.antworten = ids.map((id, i) => ({ id, x: felder[i].x, y: felder[i].y }));
      ereignisse.push({ typ: 'gespraech', phase: 0, antworten: b.antworten.map((a) => ({ ...a })) });
      return false;
    }
  }
  return false;
}
