// Alle Texte, die im Spiel zu lesen sind. Einzige Quelle, damit der Ton-Test
// (tests/ton.test.js) nichts übersieht. Nur Zeichenketten, keine Funktionen.
// Veränderliche Stellen stehen als Platzhalter in geschweiften Klammern, etwa {n}.
// Ein Schrägstrich mit Leerzeichen davor und danach trennt zwei Zeilen der Anzeige.

export const TEXTE = {
  // Namen der Wagen auf der Zuganzeige, Schlüssel wie in kern/wagen.js
  wagen: {
    sitzwagen: 'Sitzwagen',
    fahrradabteil: 'Fahrradabteil',
    mittelwagen: 'Mittelwagen',
    grossraumwagen: 'Großraumwagen',
    liegewagen: 'Liegewagen',
    gepaeckwagen: 'Gepäckwagen',
  },

  // Höchstens drei Hinweise, jeder erst, wenn die Lage eintritt
  hinweis: {
    wischen: 'Wischen',
    tasten: 'Pfeiltasten',
    ausweichen: 'Ausweichen',
    anrempeln: 'Anrempeln',
  },

  // Was der Kontrolleur sagt, wenn er jemanden anspricht oder prüft
  kontrolleur: {
    satz: 'Fahrkarte, bitte.',
  },

  // Endkarte: eine wahre Zeile, was gefehlt hat
  ende: {
    einWagen: 'Noch ein Wagen / bis zum Halt',
    mehrereWagen: 'Noch {n} Wagen / bis zum Halt',
    halt: 'Halt / Ankunft {zeit} Uhr',
  },

  zahlwort: ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs'],
};

// Setzt Werte in die Platzhalter eines Texts ein.
export function fuelle(text, werte) {
  return text.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] !== undefined ? String(werte[name]) : ganz));
}
