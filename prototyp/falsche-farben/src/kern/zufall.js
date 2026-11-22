// Zufall mit Startwert für den Abend. Der Stand liegt im Zustand (z.zufall): Gleicher Startwert und
// gleiche Züge ergeben den gleichen Abend.

export function naechsteFarbzahl(z) {
  z.zufall = (z.zufall + 0x6d2b79f5) >>> 0;
  let t = z.zufall;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// mischt eine Liste an Ort und Stelle
export function wuerfleFarben(z, liste) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(naechsteFarbzahl(z) * (i + 1));
    const t = liste[i];
    liste[i] = liste[j];
    liste[j] = t;
  }
}
