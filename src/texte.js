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
    speisewagen: 'Speisewagen',
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

  // Prüfungen auf der Fahrkarte: Alltagsvorsätze, höchstens drei Worte. Schlüssel wie in kern/fahrkarte.js
  pruefung: {
    aufregen: 'Nicht aufregen',
    aussteigen: 'Erst aussteigen lassen',
    rempeln: 'Ohne Rempeln',
    draengeln: 'Nicht drängeln',
    puenktlich: 'Pünktlich',
    ruhe: 'Ruhe bewahren',
  },

  // Der Begleiter im Speisewagen nach einem Tod. Die Antworten sind Figuren auf dem Boden, nur „Pech" ist ein Wort.
  begleiter: {
    frage: 'Woran lag es?',
    pech: 'Pech',
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
    // am Halt, wenn dem Schaffner helle Lochungen fehlen; danach geht es im Speisewagen weiter
    fehltEine: 'Noch eine helle / Lochung',
    fehlt: 'Noch {n} helle / Lochungen',
  },

  // Knöpfe am Halt
  knopf: {
    aussteigen: 'Aussteigen',
    nochEine: 'Noch eine Fahrt',
  },

  // Rückblick am Halt: je Lochung eine Tatsache mit Ort und Handlung, ohne Adjektiv.
  // Erste Zeile die Handlung, zweite der Wagen. Prüfungen stehen mit ihren eigenen Worten.
  rueckblick: {
    tod: 'Ende durch {wer}',
    ehrlich: 'Antwort: {wer}',
  },
  wer: {
    pendler: 'Pendler',
    gruppe: 'Reisegruppe',
    draengler: 'Drängler',
    kontrolleur: 'Kontrolleur',
    tuer: 'die Tür',
  },

  zahlwort: ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs'],
};

// Setzt Werte in die Platzhalter eines Texts ein.
export function fuelle(text, werte) {
  return text.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] !== undefined ? String(werte[name]) : ganz));
}
