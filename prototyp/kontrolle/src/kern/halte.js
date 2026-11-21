// Die drei Sitzordnungen, eine je Halt. Fest, ohne Zufall: Gleiche Eingaben ergeben denselben Verlauf.
// Raster wie im Prototyp "Der freie Platz" (kern/abteil.js): 5 Spalten, 8 Reihen, Gang in Spalte 2,
// Sitze in den Reihen 1 bis 6. Der Kontrolleur beginnt unten im Gang (Reihe 7).
//
// Je Reihe 1 bis 6 eine Zeile mit 5 Zeichen, das mittlere ist der Gang:
//   .  freier Sitz       S  der Fahrgast ohne Fahrkarte
//   Z  ein Schlafender   a bis g  andere Fahrgäste (der Buchstabe wählt nur die Farbe)
// "farbe" ist die Farbe des Fahrgasts ohne Fahrkarte. Sie wechselt je Halt und kommt in anderen Halten
// bei Fahrgästen mit Fahrkarte vor: Man erkennt ihn nur am Verhalten, nie am Aussehen.
//
// Gedanke je Halt (Leitsatz 2 und 3, ein neuer Gedanke, gelernt im Spiel):
//   1. Er sitzt nah und weicht beim ersten Schritt sichtbar aus, eine Reihe weiter.
//   2. Vor ihm ist eine Reihe voll: Er springt weiter, und man holt ihn erst am Ende des Wagens ein.
//   3. Er sitzt schon ganz vorn zwischen anderen und kann nicht weg: Man sieht nur, dass er aufstehen will.
// Diese drei spielt der erste Durchgang. Jeder Neustart lost neue aus (auslosen.js).

export const HALTE = [
  {
    farbe: 'g',
    sitze: [
      '..|.d',
      '.c|..',
      'b.|Z.',
      '..|.e',
      '.f|S.',
      'a.|..',
    ],
  },
  {
    farbe: 'd',
    sitze: [
      '..|e.',
      '..|..',
      'ab|Zc',
      'S.|..',
      '..|.g',
      '.f|..',
    ],
  },
  {
    farbe: 'a',
    sitze: [
      'cg|SZ',
      'b.|..',
      '..|..',
      '.d|..',
      '..|.e',
      'f.|..',
    ],
  },
];

export const ZUEGE_BIS_HALT = 12; // Startwert aus dem Auftrag

// Der Lernhalt: nur bei der allerersten Fahrt auf einem Gerät, vor den drei Halten (Auftrag „Einstieg").
// Drei Fahrgäste, keiner schläft, viel Zeit. Der Kontrolleur beginnt mitten im Gang (Reihe 4). Beim
// ersten Schritt nach vorn steht er in der Reihe neben dem Fahrgast ohne Fahrkarte: Der steht auf und
// setzt sich in die vorderste Reihe, neben einen anderen. Von dort kommt er nicht mehr weg und zuckt,
// sobald der Kontrolleur näher kommt. Dieselben Regeln wie in jedem Halt, nur mehr Zeit.
export const LERNHALT = {
  farbe: 'g',
  zuege: 20,
  start: 4,
  sitze: [
    '..|.d',
    '..|S.',
    '..|..',
    '..|..',
    'b.|..',
    '..|..',
  ],
};
