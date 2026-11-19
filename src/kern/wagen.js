// Die Wagen einer Fahrt. Zahlen sind Startwerte.
// "art" ist die Kennung des Wagens, sein Name für die Anzeige steht in texte.js.
//
// Plan: . frei, S Sitz, F Fahrrad, K Koffer, W Wand. Alles außer "." ist ein Hindernis.
// Jeder Plan hat 8 Zeilen mit 5 Zeichen. Start unten Mitte, Tür oben Mitte.
// Gegner: "orte" sind mögliche Startfelder, eines wird ausgelost.
// Eine Reisegruppe hat "ketten": mögliche Aufstellungen, der Vorderste zuerst.
// Alle Angaben gelten ungespiegelt, der Wagen wird zufällig gespiegelt.
//
// Bauregel, damit sich jede Ankündigung mit einem Schritt verlassen lässt:
// Jedes freie Feld hat mindestens einen freien Nachbarn links oder rechts
// und mindestens einen freien Nachbarn oben oder unten. Es gibt also keine
// Sackgassen und keine einspurigen Gänge. tests/wagen.test.js prüft das.

import { BREITE } from './feld.js';
import { wuerfle } from './zufall.js';

export const WAGENPLAENE = [
  {
    art: 'sitzwagen',
    plan: [
      '.....',
      '.....',
      'S...S',
      '.....',
      '.....',
      'S...S',
      '.....',
      '.....',
    ],
    gegner: [
      { typ: 'pendler', langsam: true, orte: [[2, 2], [1, 2], [3, 2]] },
    ],
  },
  {
    art: 'fahrradabteil',
    plan: [
      '.....',
      '.....',
      'F....',
      'F...K',
      'F....',
      'FF...',
      '.....',
      '.....',
    ],
    gegner: [
      { typ: 'pendler', orte: [[3, 1], [4, 1], [3, 0]] },
      { typ: 'pendler', orte: [[1, 3], [2, 3], [1, 2]] },
      { typ: 'pendler', orte: [[4, 2], [3, 3], [4, 4]] },
    ],
  },
  // Autoritätswagen, fest in der Mitte der Fahrt. Der Kontrolleur steht neben der Tür,
  // dazu zwei Pendler. Bedingungen, Pause und Vorrang gibt es erst mit der Regie (Etappe 3).
  // Die Tür gehört dem Kontrolleur: Sie geht auf, sobald er fort ist. Verhalten in gegner.js.
  {
    art: 'mittelwagen',
    autoritaet: true,
    plan: [
      '.....',
      '.....',
      'S...S',
      '..K..',
      '.....',
      'S...S',
      '.....',
      '.....',
    ],
    gegner: [
      { typ: 'kontrolleur', orte: [[1, 0]] },
      { typ: 'pendler', orte: [[0, 3], [1, 4]] },
      { typ: 'pendler', orte: [[4, 3], [3, 4]] },
    ],
  },
  {
    art: 'grossraumwagen',
    plan: [
      '.....',
      '.....',
      'SS..S',
      '.....',
      '.....',
      'S..SS',
      '.....',
      '.....',
    ],
    gegner: [
      { typ: 'gruppe', ketten: [[[2, 1], [2, 0], [1, 0]], [[2, 1], [2, 0], [3, 0]]] },
      { typ: 'pendler', orte: [[0, 3], [1, 3]] },
      { typ: 'pendler', orte: [[4, 3], [3, 3]] },
    ],
  },
  {
    art: 'liegewagen',
    plan: [
      '.....',
      '.....',
      '..WWW',
      '.....',
      '.....',
      '..WWW',
      '.....',
      '.....',
    ],
    gegner: [
      { typ: 'draengler', orte: [[0, 0], [1, 0], [0, 1]] },
      { typ: 'pendler', orte: [[4, 0], [3, 0]] },
      { typ: 'pendler', orte: [[4, 3], [3, 3]] },
      { typ: 'pendler', orte: [[4, 4], [3, 4]] },
    ],
  },
  {
    art: 'gepaeckwagen',
    plan: [
      'K...K',
      '.....',
      '..K..',
      'K....',
      '....K',
      '..K..',
      '.....',
      'K...K',
    ],
    gegner: [
      { typ: 'draengler', orte: [[4, 1], [3, 0]] },
      { typ: 'gruppe', ketten: [[[2, 1], [2, 0], [1, 0]], [[1, 1], [1, 0], [2, 0]]] },
      { typ: 'pendler', orte: [[1, 3], [1, 2]] },
      { typ: 'pendler', orte: [[3, 3], [4, 3]] },
    ],
  },
];

export const WAGENZAHL = WAGENPLAENE.length;

// Baut den Wagen mit der Nummer nr (ab 0). Gibt Plan und Gegnervorgaben zurück.
export function baueWagen(nr, z) {
  const vorlage = WAGENPLAENE[nr];
  const gespiegelt = wuerfle(z, 2) === 1;
  const sx = (x) => (gespiegelt ? BREITE - 1 - x : x);
  const plan = vorlage.plan.map((zeile) => (gespiegelt ? [...zeile].reverse().join('') : zeile));
  const gegner = [];
  let gruppe = 0;
  for (const vorgabe of vorlage.gegner) {
    if (vorgabe.typ === 'gruppe') {
      const kette = vorgabe.ketten[wuerfle(z, vorgabe.ketten.length)];
      gruppe += 1;
      kette.forEach(([x, y], rang) => gegner.push({ typ: 'gruppe', x: sx(x), y, gruppe, rang }));
    } else {
      const [x, y] = vorgabe.orte[wuerfle(z, vorgabe.orte.length)];
      gegner.push({ typ: vorgabe.typ, x: sx(x), y, langsam: vorgabe.langsam === true });
    }
  }
  return { nr, art: vorlage.art, plan, gespiegelt, gegner };
}
