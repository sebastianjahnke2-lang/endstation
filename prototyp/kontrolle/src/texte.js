// Alle Texte, die im Prototyp "Kontrolle" zu lesen sind. Mehr gibt es nicht, kein Tutorial.
// Die zwei Hinweiswörter erscheinen nur im Lernhalt. Die Stationsnamen sind erfunden.

export const KONTROLLTEXTE = {
  warten: 'Warten',
  // nur im Lernhalt, je erst im passenden Moment
  hinweis: {
    wischen: 'Wischen', // am Anfang, bis zum ersten Zug
    antippen: 'Antippen', // wenn man in seiner Reihe steht
  },
  // Stationsnamen setzen sich aus einem Anfang und einem Ende zusammen, höchstens zehn Zeichen
  station: {
    anfang: ['Moos', 'Fern', 'Eulen', 'Nebel', 'Grau', 'Still', 'Laub', 'Kalt', 'Spät', 'Erlen', 'Kies', 'Asch'],
    ende: ['grund', 'bach', 'hain', 'feld', 'brück', 'au', 'heim', 'tal', 'wies', 'dorf'],
  },
};

// Der Name der Station Nummer nr (ab 0). Für jede Schicht dieselbe Reihenfolge: So lässt sich die weiteste
// je erreichte Station wiederfinden. 60 verschiedene Namen, dann beginnt die Linie von vorn.
export function stationsName(nr) {
  const { anfang, ende } = KONTROLLTEXTE.station;
  const i = Math.max(0, nr) % 60;
  return anfang[i % anfang.length] + ende[(i * 7) % ende.length];
}
