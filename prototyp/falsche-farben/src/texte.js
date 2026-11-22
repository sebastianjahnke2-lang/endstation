// Alle sichtbaren Texte des Prototyps "Falsche Farben". Es gibt nur den einen Satz am Ende des Abends.
// Er beschreibt trocken, wie der Spieler mit einem Gast entschieden hat, und nennt dessen Farben.
// Kein Lob, kein Tadel, keine Zahl.

// je Farbe: wie der Gast im Satz heißt (dem/den Roten) und was er war (rot)
export const FARBNAMEN = [
  { wer: 'Roten', ist: 'rot' },
  { wer: 'Blauen', ist: 'blau' },
  { wer: 'Grünen', ist: 'grün' },
  { wer: 'Violetten', ist: 'violett' },
];

export const SCHLUSSSAETZE = {
  // ein Falscher flog auf, als schon jemand auf ihm saß
  geglaubt: 'Dem {wer} hast du zu schnell geglaubt. Er war {ist}.',
  // ein Falscher flog als Äußerster auf, als vierter zu drei Gleichen
  zuletzt: 'Den {wer} hast du als Letzten dazugesetzt. Er war {ist}.',
  // ein Falscher blieb bis zum Schluss unentdeckt, saß aber nicht bei denen, deren Farbe er zeigte
  ferngehalten: 'Den {wer} hast du von den {wer} getrennt. Er war {ist}.',
  // ein Falscher blieb unentdeckt und saß mitten unter ihnen
  unentdeckt: 'Der {wer} saß bis zuletzt. Er war {ist}.',
  // es kam kein Falscher: welche Farbe am Ende am weitesten verteilt saß
  verteilt: 'Die {wer} saßen am Ende auf {n} Bänken.',
  beisammen: 'Die {wer} saßen am Ende beisammen.',
};

const ZAHLWOERTER = ['', '', 'zwei', 'drei', 'vier', 'fünf'];

export function fuelle(vorlage, werte) {
  return vorlage.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] === undefined ? ganz : String(werte[name])));
}

// der fertige Satz zu einem Ergebnis aus kern/schluss.js
export function schlussText(e) {
  const werte = { wer: FARBNAMEN[e.zeigte].wer, ist: FARBNAMEN[e.echt].ist };
  if (e.art === 'verteilt') {
    if (e.n < 2) return fuelle(SCHLUSSSAETZE.beisammen, werte);
    werte.n = ZAHLWOERTER[e.n];
  }
  return fuelle(SCHLUSSSAETZE[e.art], werte);
}
