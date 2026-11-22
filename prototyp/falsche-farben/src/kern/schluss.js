// Der Satz am Ende des Abends: Welcher Gast wird genannt, und wie hat der Spieler mit ihm entschieden?
// Reine Logik ohne Browser. Gibt { art, werte } zurück; den Wortlaut liefert texte.js.
//
// Reihenfolge:
//   1. Endete der Abend, bevor alle Fenster leuchten, und wurde einem Falschen zu schnell geglaubt: der
//      letzte davon. Er erklärt am ehesten, warum der Saal voll wurde.
//   2. Ein Falscher, der bis zum Schluss unentdeckt blieb, aber umgesetzt wurde und am Ende bei keinem saß,
//      dessen Farbe er zeigte: ferngehalten.
//   3. Der zuletzt aufgeflogene Falsche, geglaubt oder als Letzter dazugesetzt.
//   4. Ein Falscher, der unentdeckt blieb.
//   5. Kam keiner: die Farbe, die am Ende auf den meisten Bänken saß.

import { istFalsch, FARBEN } from './abend.js';

export function schlussSatz(z) {
  const auf = z.verlauf.aufgeflogen;
  const geglaubt = auf.filter((a) => a.wie === 'geglaubt');
  if (z.ende !== 'hell' && geglaubt.length) {
    const g = geglaubt[geglaubt.length - 1];
    return { art: 'geglaubt', zeigte: g.zeigte, echt: g.echt };
  }
  const versteckt = [];
  for (const g of z.tuer) if (istFalsch(g)) versteckt.push({ g, bank: null });
  for (const bank of z.baenke) for (const g of bank) if (istFalsch(g)) versteckt.push({ g, bank });
  const fern = versteckt.filter(
    ({ g, bank }) => z.verlauf.umgesetzt.includes(g.id) && bank && !bank.some((x) => x !== g && x.zeigt === g.zeigt),
  );
  if (fern.length) return { art: 'ferngehalten', zeigte: fern[0].g.zeigt, echt: fern[0].g.echt };
  if (auf.length) {
    const g = auf[auf.length - 1];
    return { art: g.wie, zeigte: g.zeigte, echt: g.echt };
  }
  if (versteckt.length) return { art: 'unentdeckt', zeigte: versteckt[0].g.zeigt, echt: versteckt[0].g.echt };
  let best = { farbe: 0, n: -1 };
  for (let f = 0; f < FARBEN; f++) {
    const n = z.baenke.filter((b) => b.some((g) => g.zeigt === f)).length;
    if (n > best.n) best = { farbe: f, n };
  }
  return { art: 'verteilt', zeigte: best.farbe, echt: best.farbe, n: best.n };
}
