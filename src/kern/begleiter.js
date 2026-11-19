// Der Begleiter. Nach einem Tod sitzt er im Speisewagen. Wer neben ihn tritt, spricht mit ihm:
// „Woran lag es?" Drei Antworten liegen vor ihm auf dem Boden, draufgehen heißt antworten.
// Das Spiel kennt den Grund. Die ehrliche Antwort gibt eine helle Lochung, je Todesursache eine.
// Er nennt nicht, was gelungen ist (Entscheidung des Auftraggebers vom 19.11.: kein Lob).
// Kennt weder Bildschirm noch Browser.

import { BREITE } from './feld.js';
import { wuerfle } from './zufall.js';

export const ANTWORTARTEN = ['pendler', 'gruppe', 'draengler', 'kontrolleur', 'tuer', 'pech'];
const URSACHEN = ['pendler', 'gruppe', 'draengler', 'kontrolleur', 'tuer'];

// Beim Einrichten des Speisewagens: Er sitzt dort, wenn die vorige Fahrt mit einem Tod endete.
export function setzeBegleiter(z, platz) {
  z.begleiter = null;
  if (!z.wagen.sicher || !z.begleiterDurch || !platz) return;
  z.begleiter = { durch: z.begleiterDurch, x: platz.x, y: platz.y, antworten: null, gesprochen: false };
  z.begleiterDurch = null; // er sitzt nur beim ersten Besuch dieser Fahrt dort
}

function frei(z, x, y) {
  return x >= 0 && x < BREITE && y >= 0 && y < z.wagen.plan.length && z.wagen.plan[y][x] === '.' && !(z.spieler.x === x && z.spieler.y === y);
}

// Nach jedem Schritt im Speisewagen. Gibt zurück, ob etwas geschah.
export function sprichMitBegleiter(z, ereignisse) {
  const b = z.begleiter;
  if (!b || b.gesprochen) return;
  const s = z.spieler;
  if (b.antworten) {
    const a = b.antworten.find((x) => x.x === s.x && x.y === s.y);
    if (!a) return;
    b.antworten = null;
    b.gesprochen = true;
    const ehrlich = a.id === b.durch;
    ereignisse.push({ typ: 'antwort', phase: 0, id: a.id, ehrlich });
    const karte = z.fahrkarte;
    if (ehrlich && !karte.lochungen.some((l) => l.art === 'ehrlich' && l.durch === b.durch)) {
      karte.lochungen.push({ art: 'ehrlich', durch: b.durch, hell: true });
      ereignisse.push({ typ: 'gelocht', phase: 0, art: 'ehrlich', durch: b.durch, hell: true });
    }
    return;
  }
  if (Math.abs(s.x - b.x) + Math.abs(s.y - b.y) !== 1) return;
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
      return;
    }
  }
}
