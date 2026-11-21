// Feste Sitzordnungen. Raster wie im Prototyp "Der freie Platz" (kern/abteil.js): 5 Spalten, 8 Reihen,
// Gang in Spalte 2, Sitze in den Reihen 1 bis 6. Die Halte der Schicht werden ausgelost (auslosen.js),
// fest ist nur der Lernhalt.
//
// Je Reihe 1 bis 6 eine Zeile mit 5 Zeichen, das mittlere ist der Gang:
//   .  freier Sitz          Z  ein Schlafender        a bis g  Fahrgäste mit Fahrkarte (Farbe)
//   P  Platzwechsler (S im Lernhalt)   H  Scheinschläfer   T  Toilettengänger
// "farben" gibt die Farbe von Platzwechsler und Toilettengänger an. Sie kommt im selben Halt bei keinem
// anderen vor und wechselt von Halt zu Halt: Man erkennt sie nur am Verhalten, nie am Aussehen.

export const ZUEGE_BIS_HALT = 12; // Startwert aus dem Auftrag

// Der Lernhalt: nur bei der allerersten Fahrt auf einem Gerät, vor der Schicht (Auftrag „Einstieg").
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
