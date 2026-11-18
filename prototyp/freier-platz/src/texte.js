// Alle Texte, die im Prototyp zu lesen sind. Einzige Quelle, wie im Hauptspiel.
// Nur Zeichenketten. Veränderliche Stellen stehen in geschweiften Klammern, etwa {n}.
// Ein Schrägstrich mit Leerzeichen davor und danach trennt zwei Zeilen.

export const PLATZTEXTE = {
  // Das Spiel selbst zeigt nur diese Texte.
  spiel: {
    anzeige: 'Wagen 7',
    warten: 'Warten',
    neueFahrt: 'Neue Fahrt',
    satz: 'Bitte den Platz / freimachen.',
    // Nach der Tür: höchstens zwei Tatsachen über den Wagen, sonst nur die Uhrzeit.
    tatsache: {
      wartet: 'Der Schaffner / wartet in Reihe {n}.',
      tasche: 'Auf Platz 51 / liegt eine Tasche.',
      wach: 'Der Fahrgast in / Reihe 2 ist wach.',
    },
  },

  // Das Testprotokoll ist für Spieler unsichtbar. Es erscheint nur, wenn der Auftraggeber
  // lange auf die Zuganzeige drückt.
  protokoll: {
    titel: 'Letzte Fahrt',
    runden: 'Runden',
    tascheWeg: 'Tasche weg',
    lochung: 'Lochung',
    reiheZweiFrei: 'Reihe 2 frei',
    tuer: 'Tür',
    lampe: 'Lampe',
    warten: 'Warten',
    anstossen: 'Anstoßen',
    draengen: 'Vorbeidrängen',
    wecken: 'Wecken',
    folge: 'Folge',
    karten: 'Karten',
    nie: '-',
    keine: 'Noch keine Fahrt',
  },
};

// Setzt Werte in die Platzhalter eines Texts ein.
export function setzeEin(text, werte) {
  return text.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] !== undefined ? String(werte[name]) : ganz));
}

// Die Zeilen einer Tatsache, wie die Anzeige sie nach der Tür zeigt.
export function tatsachenZeilen(tatsachen) {
  const zeilen = [];
  for (const t of tatsachen) {
    const text = setzeEin(PLATZTEXTE.spiel.tatsache[t.art], { n: t.reihe });
    for (const zeile of text.split(' / ')) zeilen.push(zeile);
  }
  return zeilen;
}
